package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"github.com/shopen/backend/internal/cache"
	"github.com/shopen/backend/internal/config"
	"github.com/shopen/backend/internal/db"
	"github.com/shopen/backend/internal/logger"
	"github.com/shopen/backend/internal/metrics"
	"github.com/shopen/backend/internal/router"
	"github.com/shopen/backend/internal/tracing"
)

func main() {

	// ── Load .env (optional — env vars take priority) ─────────────────────────
	_ = godotenv.Load()

	// ── Logger (must be first) ────────────────────────────────────────────────
	logger.Init()
	defer logger.Log.Sync()

	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	logger.Log.Info("🚀 Starting Shopen API",
		zap.String("env", env),
		zap.String("version", "2.0.0"),
	)

	// ── Tracing ───────────────────────────────────────────────────────────────
	shutdownTracer := tracing.InitTracer()
	defer shutdownTracer()

	// ── Metrics ───────────────────────────────────────────────────────────────
	metrics.Init()
	logger.Log.Info("✅ Prometheus metrics initialised — scrape at /metrics")

	// ── Config ────────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		logger.Log.Fatal("config error", zap.Error(err))
	}

	// ── Database ──────────────────────────────────────────────────────────────
	database, err := db.Connect(cfg)
	if err != nil {
		logger.Log.Fatal("database connection failed", zap.Error(err))
	}
	defer database.Close()

	if err := db.Migrate(database); err != nil {
		logger.Log.Fatal("migration failed", zap.Error(err))
	}

	if err := db.SeedAdmin(database, cfg.AdminSeedUser, cfg.AdminSeedPass); err != nil {
		logger.Log.Warn("seed admin warning", zap.Error(err))
	}

	// ── Redis ─────────────────────────────────────────────────────────────────
	cache.Init()

	// ── Router ────────────────────────────────────────────────────────────────
	handler := router.New(database, cfg)

	// ── HTTP Server ───────────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Log.Info("✅ HTTP server listening",
			zap.String("addr", "http://0.0.0.0:"+cfg.Port),
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Log.Fatal("server error", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ─────────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Log.Info("🛑 Shutdown signal received — draining connections…")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Error("graceful shutdown failed", zap.Error(err))
	} else {
		logger.Log.Info("✅ Server stopped cleanly")
	}
}

package router

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/shopen/backend/internal/config"
	"github.com/shopen/backend/internal/handlers"
	"github.com/shopen/backend/internal/logger"
	"github.com/shopen/backend/internal/middleware"
)

// New builds the full chi router with all middleware and routes.
func New(db *sql.DB, cfg *config.Config) http.Handler {

	// ── Handlers ──────────────────────────────────────────────────────────────
	authH := handlers.NewAuthHandler(db, cfg.JWTSecret, cfg.JWTExpiryHours)
	shopH := handlers.NewShopHandler(db)
	userH := handlers.NewUserHandler(db, cfg.JWTSecret, cfg.UserJWTExpiryHours)
	skH   := handlers.NewShopkeeperHandler(db, cfg.JWTSecret, cfg.UserJWTExpiryHours)
	favH  := handlers.NewFavoritesHandler(db)
	fbH   := handlers.NewFeedbackHandler(db)
	imgH  := handlers.NewImageRequestHandler(db)

	requireAdmin := middleware.RequireAdmin(cfg.JWTSecret)
	requireAuth  := middleware.RequireAuth(cfg.JWTSecret)

	r := chi.NewRouter()

	// ── Global middleware stack ────────────────────────────────────────────────
	r.Use(middleware.Recovery)
	r.Use(middleware.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.CORS(cfg.AllowedOrigins))
	r.Use(middleware.Timeout(15 * time.Second))
	r.Use(middleware.RateLimit)
	r.Use(logger.LoggingMiddleware)
	r.Use(middleware.PrometheusMetrics)

	// ── Prometheus scrape endpoint ─────────────────────────────────────────────
	r.Method(http.MethodGet, "/metrics", middleware.MetricsHandler())

	// ── Health ────────────────────────────────────────────────────────────────
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": "shopen-api",
			"version": "2.0.0",
		})
	})

	// ── Auth ──────────────────────────────────────────────────────────────────
	r.Post("/api/auth/login", authH.Login)

	// ── Public Users ──────────────────────────────────────────────────────────
	r.Post("/api/users/signup", userH.Signup)
	r.Post("/api/users/login",  userH.Login)
	r.With(requireAuth).Get("/api/users/me", userH.Me)

	// ── Shopkeepers ───────────────────────────────────────────────────────────
	r.Post("/api/shopkeepers/signup",   skH.Signup)
	r.Post("/api/shopkeepers/login",    skH.Login)
	r.Post("/api/shopkeepers/requests", skH.SubmitRequest)
	r.Get("/api/shopkeepers/requests",  skH.ListMyRequests)

	// ── Public Shops ──────────────────────────────────────────────────────────
	r.Get("/api/shops",      shopH.ListShops)
	r.Get("/api/shops/{id}", shopH.GetShop)

	// ── Favorites ─────────────────────────────────────────────────────────────
	r.Get("/api/favorites",         favH.ListFavorites)
	r.Post("/api/favorites/toggle", favH.ToggleFavorite)
	r.Get("/api/favorites/check",   favH.IsFavorite)

	// ── Feedback ──────────────────────────────────────────────────────────────
	r.Post("/api/feedback", fbH.SubmitFeedback)

	// ── Image Requests ────────────────────────────────────────────────────────
	r.Post("/api/image-requests", imgH.SubmitImageRequest)

	// ── Messages ──────────────────────────────────────────────────────────────
	r.Get("/api/sk-requests/{id}/messages", skH.ListMessages)
	r.With(requireAuth).Post("/api/sk-requests/{id}/messages", skH.SendMessage)
	r.With(requireAuth).Patch("/api/sk-requests/{id}/messages/read", skH.MarkMessagesRead)

	// ── Admin routes ──────────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(requireAdmin)

		// Shops
		r.Get("/api/admin/shops",              shopH.AdminListShops)
		r.Post("/api/admin/shops",             shopH.CreateShop)
		r.Put("/api/admin/shops/{id}",         shopH.UpdateShop)
		r.Delete("/api/admin/shops/{id}",      shopH.DeleteShop)
		r.Patch("/api/admin/shops/{id}/toggle", shopH.ToggleStatus)

		// Stats
		r.Get("/api/admin/stats", shopH.GetStats)

		// Feedback
		r.Get("/api/admin/feedback", fbH.AdminListFeedback)

		// Image requests
		r.Get("/api/admin/image-requests",               imgH.AdminListImageRequests)
		r.Patch("/api/admin/image-requests/{id}/review", imgH.AdminReviewImageRequest)

		// Shopkeeper requests
		r.Get("/api/admin/sk-requests",               skH.AdminListSKRequests)
		r.Patch("/api/admin/sk-requests/{id}/review", skH.AdminReviewSKRequest)
		r.Post("/api/admin/sk-requests/{id}/messages", skH.SendMessage)
	})

	// Wrap entire router with OpenTelemetry tracing
	return otelhttp.NewHandler(r, "shopen-http")
}

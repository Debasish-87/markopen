package logger

import (
	"net/http"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Log is the global structured logger — use this everywhere.
var Log *zap.Logger

// Init sets up the global Zap logger.
// In production (ENV=production) it uses JSON output.
// In development it uses a human-readable colored console format.
func Init() {
	env := os.Getenv("ENV")

	var cfg zap.Config

	if env == "production" {
		cfg = zap.NewProductionConfig()
		cfg.EncoderConfig.TimeKey = "timestamp"
		cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	} else {
		cfg = zap.NewDevelopmentConfig()
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	var err error
	Log, err = cfg.Build()
	if err != nil {
		panic("failed to initialise logger: " + err.Error())
	}
}

// ─── HTTP Logging Middleware ──────────────────────────────────────────────────

type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.size += n
	return n, err
}

// LoggingMiddleware logs every HTTP request with method, path, status,
// duration, and response size using structured Zap fields.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rw := &responseWriter{
			ResponseWriter: w,
			status:         http.StatusOK,
		}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)

		// Choose log level based on status
		fields := []zap.Field{
			zap.String("method", r.Method),
			zap.String("path", r.URL.Path),
			zap.Int("status", rw.status),
			zap.Duration("duration", duration),
			zap.Int("bytes", rw.size),
			zap.String("ip", r.RemoteAddr),
			zap.String("request_id", r.Header.Get("X-Request-ID")),
		}

		switch {
		case rw.status >= 500:
			Log.Error("request completed", fields...)
		case rw.status >= 400:
			Log.Warn("request completed", fields...)
		default:
			Log.Info("request completed", fields...)
		}
	})
}

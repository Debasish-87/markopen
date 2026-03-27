package middleware

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"

	"github.com/shopen/backend/internal/cache"
	"github.com/shopen/backend/internal/logger"
	"github.com/shopen/backend/internal/metrics"
	"github.com/shopen/backend/internal/models"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// ─── CORS ─────────────────────────────────────────────────────────────────────

func CORS(allowedOrigins string) func(http.Handler) http.Handler {
	origins := map[string]bool{}
	for _, o := range strings.Split(allowedOrigins, ",") {
		origins[strings.TrimSpace(o)] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origins[origin] || allowedOrigins == "*" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
			w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")
			w.Header().Set("Access-Control-Max-Age", "86400")
			w.Header().Set("Vary", "Origin")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		w.Header().Set("Server", "shopen-api")
		next.ServeHTTP(w, r)
	})
}

// ─── REQUEST ID ───────────────────────────────────────────────────────────────

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = strconv.FormatInt(time.Now().UnixNano(), 36)
		}
		w.Header().Set("X-Request-ID", id)
		r.Header.Set("X-Request-ID", id)
		next.ServeHTTP(w, r)
	})
}

// ─── TIMEOUT ──────────────────────────────────────────────────────────────────

func Timeout(d time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.TimeoutHandler(next, d, `{"success":false,"error":"request timeout"}`)
	}
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const (
	rateLimitRequests = 100
	rateLimitWindow   = time.Minute
)

func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cache.Available() {
			next.ServeHTTP(w, r)
			return
		}
		ip := clientIP(r)
		key := "ratelimit:" + ip
		count, err := cache.Incr(key)
		if err != nil {
			logger.Log.Warn("rate limit redis error", zap.Error(err))
			next.ServeHTTP(w, r)
			return
		}
		if count == 1 {
			_ = cache.Expire(key, rateLimitWindow)
		}
		remaining := int64(rateLimitRequests) - count
		if remaining < 0 {
			remaining = 0
		}
		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(rateLimitRequests))
		w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
		if count > rateLimitRequests {
			w.Header().Set("Retry-After", "60")
			JSON(w, http.StatusTooManyRequests, models.APIResponse[any]{
				Success: false, Error: "too many requests",
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ─── PROMETHEUS METRICS ───────────────────────────────────────────────────────

type metricsRW struct {
	http.ResponseWriter
	status int
}

func (rw *metricsRW) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func PrometheusMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &metricsRW{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		duration := time.Since(start).Seconds()
		metrics.RequestLatency.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
		metrics.RequestCount.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(rw.status)).Inc()
	})
}

func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

// ─── RECOVERY ─────────────────────────────────────────────────────────────────

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				logger.Log.Error("panic recovered",
					zap.Any("panic", rec),
					zap.String("path", r.URL.Path),
				)
				JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
					Success: false, Error: "internal server error",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ─── JWT AUTH ─────────────────────────────────────────────────────────────────

func RequireAdmin(secret string) func(http.Handler) http.Handler {
	return requireRole(secret, "admin")
}

func RequireAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := extractClaims(r, secret)
			if err != nil {
				JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
					Success: false, Error: "unauthorized",
				})
				return
			}
			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func requireRole(secret, role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := extractClaims(r, secret)
			if err != nil {
				JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
					Success: false, Error: "unauthorized",
				})
				return
			}
			if claims.Role != role {
				JSON(w, http.StatusForbidden, models.APIResponse[any]{
					Success: false, Error: "forbidden",
				})
				return
			}
			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func extractClaims(r *http.Request, secret string) (*models.Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, jwt.ErrTokenMalformed
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return nil, jwt.ErrTokenMalformed
	}
	type jwtClaims struct {
		UserID   int    `json:"user_id"`
		Username string `json:"username"`
		Role     string `json:"role"`
		jwt.RegisteredClaims
	}
	token, err := jwt.ParseWithClaims(parts[1], &jwtClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	c := token.Claims.(*jwtClaims)
	return &models.Claims{UserID: c.UserID, Username: c.Username, Role: c.Role}, nil
}

func GetClaims(ctx context.Context) *models.Claims {
	c, _ := ctx.Value(ClaimsKey).(*models.Claims)
	return c
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.TrimSpace(strings.Split(fwd, ",")[0])
	}
	if real := r.Header.Get("X-Real-IP"); real != "" {
		return real
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Chain(h http.Handler, mws ...func(http.Handler) http.Handler) http.Handler {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

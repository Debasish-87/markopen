package cache

import (
	"context"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/shopen/backend/internal/logger"
)

// Client is the global Redis client.
var Client *redis.Client

// Ctx is the default context for Redis operations.
var Ctx = context.Background()

// Init connects to Redis using the REDIS_URL environment variable.
// Falls back to localhost:6379 if not set.
// If Redis is unavailable the server still starts — features requiring
// Redis (rate limiting, caching) will gracefully degrade.
func Init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		logger.Log.Warn("invalid REDIS_URL, using default", zap.Error(err))
		opt = &redis.Options{Addr: "localhost:6379"}
	}

	Client = redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(Ctx, 3*time.Second)
	defer cancel()

	if err := Client.Ping(ctx).Err(); err != nil {
		logger.Log.Warn("⚠️  Redis not reachable — rate limiting & caching disabled",
			zap.String("addr", opt.Addr),
			zap.Error(err),
		)
		Client = nil // signal to callers that Redis is unavailable
		return
	}

	logger.Log.Info("✅ Redis connected", zap.String("addr", opt.Addr))
}

// Available returns true if Redis is connected and usable.
func Available() bool {
	return Client != nil
}

// Set stores a key with a TTL.
func Set(key string, value any, ttl time.Duration) error {
	if !Available() {
		return nil
	}
	return Client.Set(Ctx, key, value, ttl).Err()
}

// Get retrieves a key. Returns redis.Nil if not found.
func Get(key string) (string, error) {
	if !Available() {
		return "", redis.Nil
	}
	return Client.Get(Ctx, key).Result()
}

// Del deletes one or more keys.
func Del(keys ...string) error {
	if !Available() {
		return nil
	}
	return Client.Del(Ctx, keys...).Err()
}

// Incr increments a counter key and returns the new value.
func Incr(key string) (int64, error) {
	if !Available() {
		return 0, nil
	}
	return Client.Incr(Ctx, key).Result()
}

// Expire sets a TTL on an existing key.
func Expire(key string, ttl time.Duration) error {
	if !Available() {
		return nil
	}
	return Client.Expire(Ctx, key, ttl).Err()
}

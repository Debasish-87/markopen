package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	// Server
	Port string

	// Database - either full DATABASE_URL or individual fields
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string

	// JWT
	JWTSecret          string
	JWTExpiryHours     int
	UserJWTExpiryHours int

	// Admin seed credentials (used only on first boot if no admin exists)
	AdminSeedUser string
	AdminSeedPass string

	// CORS
	AllowedOrigins string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() (*Config, error) {
	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "shopen"),
		DBPassword:     getEnv("DB_PASSWORD", "shopen_secret"),
		DBName:         getEnv("DB_NAME", "shopen_db"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", "change_me_in_production_please"),
		AdminSeedUser:  getEnv("ADMIN_SEED_USER", "admin"),
		AdminSeedPass:  getEnv("ADMIN_SEED_PASS", "admin123"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"),
	}

	var err error
	cfg.JWTExpiryHours, err = getEnvInt("JWT_EXPIRY_HOURS", 24)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY_HOURS: %w", err)
	}
	cfg.UserJWTExpiryHours, err = getEnvInt("USER_JWT_EXPIRY_HOURS", 72)
	if err != nil {
		return nil, fmt.Errorf("invalid USER_JWT_EXPIRY_HOURS: %w", err)
	}

	if cfg.JWTSecret == "change_me_in_production_please" {
		fmt.Println("⚠️  WARNING: Using default JWT secret. Set JWT_SECRET env var in production.")
	}

	return cfg, nil
}

// DSN returns a PostgreSQL connection string.
// Prefers DATABASE_URL if set (Supabase / Render style), falls back to individual fields.
func (c *Config) DSN() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) (int, error) {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal, nil
	}
	return strconv.Atoi(v)
}

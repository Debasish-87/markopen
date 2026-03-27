package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"github.com/shopen/backend/internal/config"
)

// Connect opens and verifies a PostgreSQL connection with retries.
func Connect(cfg *config.Config) (*sql.DB, error) {
	var database *sql.DB
	var err error

	for attempt := 1; attempt <= 10; attempt++ {
		database, err = sql.Open("postgres", cfg.DSN())
		if err != nil {
			return nil, fmt.Errorf("sql.Open: %w", err)
		}
		err = database.Ping()
		if err == nil {
			break
		}
		log.Printf("DB not ready (attempt %d/10): %v — retrying in 3s…", attempt, err)
		database.Close()
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		return nil, fmt.Errorf("could not connect to database after 10 attempts: %w", err)
	}

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(5)
	database.SetConnMaxLifetime(5 * time.Minute)

	log.Println("✅ Database connected")
	return database, nil
}

// Migrate runs all schema migrations.
func Migrate(db *sql.DB) error {
	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	// Migration: expand category CHECK constraint to include 'Petrol'
	_, _ = db.Exec(`ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_category_check`)
	_, err = db.Exec(`ALTER TABLE shops ADD CONSTRAINT shops_category_check CHECK (category IN ('Food','Medical','Café','Petrol'))`)
	if err != nil {
		return fmt.Errorf("migrate category constraint: %w", err)
	}

	log.Println("✅ Database schema up to date")
	return nil
}

// SeedAdmin creates the default admin user if none exists.
func SeedAdmin(db *sql.DB, username, password string) error {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM admin_users`).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // already seeded
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = db.Exec(
		`INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)`,
		username, string(hash),
	)
	if err != nil {
		return err
	}

	log.Printf("✅ Seeded admin user: %s", username)
	return nil
}

// schema is the complete DDL for the application.
const schema = `
-- ─── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ADMIN USERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ─── PUBLIC USERS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ─── SHOPKEEPERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopkeepers (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    phone         VARCHAR(20)  UNIQUE NOT NULL,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ─── SHOPS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200)     NOT NULL,
    category     VARCHAR(50)      NOT NULL CHECK (category IN ('Food','Medical','Petrol')),
    subcat       VARCHAR(100)     NOT NULL DEFAULT '',
    address      VARCHAR(300)     NOT NULL DEFAULT '',
    phone        VARCHAR(30)      NOT NULL DEFAULT '',
    show_phone   BOOLEAN          NOT NULL DEFAULT FALSE,
    description  TEXT             NOT NULL DEFAULT '',
    icon         VARCHAR(10)      NOT NULL DEFAULT '',
    photo_url    TEXT             NOT NULL DEFAULT '',
    logo_url     TEXT             NOT NULL DEFAULT '',
    map_query    VARCHAR(300)     NOT NULL DEFAULT '',
    hours        VARCHAR(100)     NOT NULL DEFAULT '',
    is_open      BOOLEAN          NOT NULL DEFAULT TRUE,
    status       VARCHAR(20)      NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    rating       NUMERIC(3,2)     NOT NULL DEFAULT 0,
    review_count INTEGER          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_category  ON shops (category);
CREATE INDEX IF NOT EXISTS idx_shops_status    ON shops (status);
CREATE INDEX IF NOT EXISTS idx_shops_is_open   ON shops (is_open);
CREATE INDEX IF NOT EXISTS idx_shops_name_trgm ON shops USING gin (name gin_trgm_ops) ;

-- ─── FAVORITES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(100) NOT NULL,
    shop_id    INTEGER      NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (username, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites (username);

-- ─── FEEDBACK ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(300) NOT NULL,
    message     TEXT         NOT NULL,
    star_rating SMALLINT     NOT NULL DEFAULT 0 CHECK (star_rating BETWEEN 0 AND 5),
    types       TEXT[]       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── IMAGE REQUESTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS image_requests (
    id                  VARCHAR(60)  PRIMARY KEY,
    shop_id             INTEGER      NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    shop_name           VARCHAR(200) NOT NULL,
    owner_name          VARCHAR(200) NOT NULL,
    phone               VARCHAR(30)  NOT NULL,
    logo_base64         TEXT         NOT NULL DEFAULT '',
    logo_file           VARCHAR(300) NOT NULL DEFAULT '',
    shop_photo_base64   TEXT         NOT NULL DEFAULT '',
    shop_photo_file     VARCHAR(300) NOT NULL DEFAULT '',
    status              VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    note                TEXT         NOT NULL DEFAULT '',
    admin_note          TEXT         NOT NULL DEFAULT '',
    submitted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_image_requests_status  ON image_requests (status);
CREATE INDEX IF NOT EXISTS idx_image_requests_shop_id ON image_requests (shop_id);

-- ─── SHOPKEEPER REQUESTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sk_requests (
    id                VARCHAR(60)  PRIMARY KEY,
    shopkeeper_name   VARCHAR(200) NOT NULL,
    phone             VARCHAR(30)  NOT NULL,
    request_type      VARCHAR(50)  NOT NULL DEFAULT 'other',
    shop_id           INTEGER,
    shop_name         VARCHAR(200) NOT NULL DEFAULT '',
    logo_base64       TEXT         NOT NULL DEFAULT '',
    shop_photo_base64 TEXT         NOT NULL DEFAULT '',
    map_link          VARCHAR(500) NOT NULL DEFAULT '',
    description       TEXT         NOT NULL DEFAULT '',
    show_phone        BOOLEAN      NOT NULL DEFAULT FALSE,
    status            VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    admin_note        TEXT         NOT NULL DEFAULT '',
    submitted_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at       TIMESTAMPTZ,
    reviewed_by       VARCHAR(100) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sk_requests_status ON sk_requests (status);

-- ─── SHOPKEEPER MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sk_messages (
    id          VARCHAR(60)  PRIMARY KEY,
    request_id  VARCHAR(60)  NOT NULL REFERENCES sk_requests (id) ON DELETE CASCADE,
    from_admin  BOOLEAN      NOT NULL DEFAULT FALSE,
    sender      VARCHAR(100) NOT NULL,
    text        TEXT         NOT NULL,
    sent_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    read        BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sk_messages_request_id ON sk_messages (request_id);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shops_updated_at'
    ) THEN
        CREATE TRIGGER trg_shops_updated_at
        BEFORE UPDATE ON shops
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END;
$$;
`

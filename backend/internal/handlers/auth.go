package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	db        *sql.DB
	jwtSecret string
	expiryH   int
}

func NewAuthHandler(db *sql.DB, jwtSecret string, expiryH int) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret, expiryH: expiryH}
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var payload models.LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	if payload.Username == "" || payload.Password == "" {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "username and password are required",
		})
		return
	}

	var id int
	var storedHash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, password_hash FROM admin_users WHERE username = $1`,
		payload.Username,
	).Scan(&id, &storedHash)

	if err == sql.ErrNoRows {
		middleware.JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
			Success: false, Error: "invalid username or password",
		})
		return
	}
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(payload.Password)); err != nil {
		middleware.JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
			Success: false, Error: "invalid username or password",
		})
		return
	}

	token, err := h.issueToken(id, payload.Username, "admin")
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not generate token",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.LoginResponse]{
		Success: true,
		Data: models.LoginResponse{
			Token:    token,
			Username: payload.Username,
			Role:     "admin",
		},
	})
}

// issueToken creates a signed JWT for the given subject.
func (h *AuthHandler) issueToken(userID int, username, role string) (string, error) {
	type customClaims struct {
		UserID   int    `json:"user_id"`
		Username string `json:"username"`
		Role     string `json:"role"`
		jwt.RegisteredClaims
	}

	claims := customClaims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(h.expiryH) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   username,
		},
	}

	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.jwtSecret))
}

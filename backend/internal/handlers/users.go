package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// UserHandler handles public user auth endpoints.
type UserHandler struct {
	db        *sql.DB
	jwtSecret string
	expiryH   int
}

func NewUserHandler(db *sql.DB, jwtSecret string, expiryH int) *UserHandler {
	return &UserHandler{db: db, jwtSecret: jwtSecret, expiryH: expiryH}
}

// Signup handles POST /api/users/signup
func (h *UserHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var p models.SignupPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	p.Username = strings.TrimSpace(p.Username)

	if len(p.Username) < 3 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "username must be at least 3 characters",
		})
		return
	}
	if len(p.Password) < 6 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "password must be at least 6 characters",
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not hash password",
		})
		return
	}

	var user models.User
	err = h.db.QueryRowContext(r.Context(),
		`INSERT INTO users (username, password_hash) VALUES ($1, $2)
		 RETURNING id, username, created_at`,
		p.Username, string(hash),
	).Scan(&user.ID, &user.Username, &user.CreatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			middleware.JSON(w, http.StatusConflict, models.APIResponse[any]{
				Success: false, Error: "username already taken",
			})
			return
		}
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not create user",
		})
		return
	}

	token, err := h.issueToken(user.ID, user.Username, "user")
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not generate token",
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[models.LoginResponse]{
		Success: true,
		Data: models.LoginResponse{
			Token:    token,
			Username: user.Username,
			Role:     "user",
		},
	})
}

// Login handles POST /api/users/login
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var p models.LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	var user models.User
	var hash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, username, password_hash, created_at FROM users WHERE LOWER(username) = LOWER($1)`,
		p.Username,
	).Scan(&user.ID, &user.Username, &hash, &user.CreatedAt)

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

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(p.Password)); err != nil {
		middleware.JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
			Success: false, Error: "invalid username or password",
		})
		return
	}

	token, err := h.issueToken(user.ID, user.Username, "user")
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
			Username: user.Username,
			Role:     "user",
		},
	})
}

// Me handles GET /api/users/me
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		middleware.JSON(w, http.StatusUnauthorized, models.APIResponse[any]{
			Success: false, Error: "unauthorized",
		})
		return
	}

	var user models.User
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, username, created_at FROM users WHERE id = $1`, claims.UserID,
	).Scan(&user.ID, &user.Username, &user.CreatedAt)

	if err != nil {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "user not found",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.User]{
		Success: true, Data: user,
	})
}

func (h *UserHandler) issueToken(userID int, username, role string) (string, error) {
	type jwtClaims struct {
		UserID   int    `json:"user_id"`
		Username string `json:"username"`
		Role     string `json:"role"`
		jwt.RegisteredClaims
	}
	claims := jwtClaims{
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

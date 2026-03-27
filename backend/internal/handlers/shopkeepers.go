package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// ShopkeeperHandler handles shopkeeper auth and request endpoints.
type ShopkeeperHandler struct {
	db        *sql.DB
	jwtSecret string
	expiryH   int
}

func NewShopkeeperHandler(db *sql.DB, jwtSecret string, expiryH int) *ShopkeeperHandler {
	return &ShopkeeperHandler{db: db, jwtSecret: jwtSecret, expiryH: expiryH}
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// Signup handles POST /api/shopkeepers/signup
func (h *ShopkeeperHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var p models.ShopkeeperSignupPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	p.Username = strings.TrimSpace(p.Username)
	phone := normalizePhone(p.Phone)

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
	if len(phone) < 10 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "a valid phone number is required",
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

	var sk models.Shopkeeper
	err = h.db.QueryRowContext(r.Context(),
		`INSERT INTO shopkeepers (username, password_hash, phone)
		 VALUES ($1, $2, $3)
		 RETURNING id, username, phone, created_at`,
		p.Username, string(hash), p.Phone,
	).Scan(&sk.ID, &sk.Username, &sk.Phone, &sk.CreatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			msg := "username already taken"
			if strings.Contains(err.Error(), "phone") {
				msg = "this phone number is already registered"
			}
			middleware.JSON(w, http.StatusConflict, models.APIResponse[any]{
				Success: false, Error: msg,
			})
			return
		}
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not create shopkeeper account",
		})
		return
	}

	token, err := h.issueToken(sk.ID, sk.Username, "shopkeeper")
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
			Username: sk.Username,
			Role:     "shopkeeper",
		},
	})
}

// Login handles POST /api/shopkeepers/login
func (h *ShopkeeperHandler) Login(w http.ResponseWriter, r *http.Request) {
	var p models.LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	var sk models.Shopkeeper
	var hash string
	err := h.db.QueryRowContext(r.Context(),
		`SELECT id, username, phone, password_hash, created_at
		 FROM shopkeepers WHERE LOWER(username) = LOWER($1)`,
		p.Username,
	).Scan(&sk.ID, &sk.Username, &sk.Phone, &hash, &sk.CreatedAt)

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

	token, err := h.issueToken(sk.ID, sk.Username, "shopkeeper")
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
			Username: sk.Username,
			Role:     "shopkeeper",
		},
	})
}

// ─── SHOPKEEPER REQUESTS ──────────────────────────────────────────────────────

// SubmitRequest handles POST /api/shopkeepers/requests
func (h *ShopkeeperHandler) SubmitRequest(w http.ResponseWriter, r *http.Request) {
	var p models.SKRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	if strings.TrimSpace(p.ShopkeeperName) == "" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "shopkeeper name is required",
		})
		return
	}
	if strings.TrimSpace(p.Phone) == "" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "phone number is required",
		})
		return
	}

	id := nowID("sk")

	_, err := h.db.ExecContext(r.Context(), `
		INSERT INTO sk_requests
			(id, shopkeeper_name, phone, request_type, shop_id, shop_name,
			 logo_base64, shop_photo_base64, map_link, description, show_phone)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		id, p.ShopkeeperName, p.Phone, p.RequestType, p.ShopID, p.ShopName,
		p.LogoBase64, p.ShopPhotoBase64, p.MapLink, p.Description, p.ShowPhone,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not save request: " + err.Error(),
		})
		return
	}

	req, err := h.getRequest(r, id)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "request saved but could not fetch it",
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[*models.SKRequest]{
		Success: true, Data: req,
	})
}

// ListMyRequests handles GET /api/shopkeepers/requests?phone=xxx
func (h *ShopkeeperHandler) ListMyRequests(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "phone query param required",
		})
		return
	}

	rows, err := h.db.QueryContext(r.Context(),
		`SELECT `+skReqColumns+` FROM sk_requests WHERE phone=$1 ORDER BY submitted_at DESC`,
		phone,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	defer rows.Close()

	var reqs []models.SKRequest
	for rows.Next() {
		req, err := scanSKRequest(rows)
		if err != nil {
			continue
		}
		reqs = append(reqs, *req)
	}
	if reqs == nil {
		reqs = []models.SKRequest{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.SKRequest]{
		Success: true, Data: reqs,
	})
}

// ─── ADMIN: MANAGE SK REQUESTS ────────────────────────────────────────────────

// AdminListSKRequests handles GET /api/admin/sk-requests
func (h *ShopkeeperHandler) AdminListSKRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	query := `SELECT ` + skReqColumns + ` FROM sk_requests`
	var args []any
	if status != "" {
		query += ` WHERE status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY submitted_at DESC`

	rows, err := h.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	defer rows.Close()

	var reqs []models.SKRequest
	for rows.Next() {
		req, err := scanSKRequest(rows)
		if err != nil {
			continue
		}
		reqs = append(reqs, *req)
	}
	if reqs == nil {
		reqs = []models.SKRequest{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.SKRequest]{
		Success: true, Data: reqs,
	})
}

// AdminReviewSKRequest handles PATCH /api/admin/sk-requests/{id}/review
func (h *ShopkeeperHandler) AdminReviewSKRequest(w http.ResponseWriter, r *http.Request) {
	id := pathStr(r, "id")
	claims := middleware.GetClaims(r.Context())

	var p models.ReviewSKRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	if p.Status != "approved" && p.Status != "rejected" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "status must be 'approved' or 'rejected'",
		})
		return
	}

	now := time.Now()
	reviewer := ""
	if claims != nil {
		reviewer = claims.Username
	}

	res, err := h.db.ExecContext(r.Context(), `
		UPDATE sk_requests
		SET status=$1, admin_note=$2, reviewed_at=$3, reviewed_by=$4
		WHERE id=$5`,
		p.Status, p.AdminNote, now, reviewer, id,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	if affected, _ := res.RowsAffected(); affected == 0 {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "request not found",
		})
		return
	}

	req, _ := h.getRequest(r, id)
	middleware.JSON(w, http.StatusOK, models.APIResponse[*models.SKRequest]{
		Success: true, Data: req,
	})
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

// ListMessages handles GET /api/sk-requests/{id}/messages
func (h *ShopkeeperHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	reqID := pathStr(r, "id")

	rows, err := h.db.QueryContext(r.Context(),
		`SELECT id, request_id, from_admin, sender, text, sent_at, read
		 FROM sk_messages WHERE request_id=$1 ORDER BY sent_at ASC`,
		reqID,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	defer rows.Close()

	var msgs []models.SKMessage
	for rows.Next() {
		var m models.SKMessage
		if err := rows.Scan(&m.ID, &m.RequestID, &m.FromAdmin, &m.Sender, &m.Text, &m.SentAt, &m.Read); err != nil {
			continue
		}
		msgs = append(msgs, m)
	}
	if msgs == nil {
		msgs = []models.SKMessage{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.SKMessage]{
		Success: true, Data: msgs,
	})
}

// SendMessage handles POST /api/sk-requests/{id}/messages
func (h *ShopkeeperHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	reqID := pathStr(r, "id")
	claims := middleware.GetClaims(r.Context())

	var p models.SendMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}
	if strings.TrimSpace(p.Text) == "" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "message text is required",
		})
		return
	}

	isAdmin := false
	sender := p.Sender
	if claims != nil && claims.Role == "admin" {
		isAdmin = true
		sender = claims.Username
	}

	msgID := nowID("msg")
	var msg models.SKMessage
	err := h.db.QueryRowContext(r.Context(), `
		INSERT INTO sk_messages (id, request_id, from_admin, sender, text)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, request_id, from_admin, sender, text, sent_at, read`,
		msgID, reqID, isAdmin, sender, strings.TrimSpace(p.Text),
	).Scan(&msg.ID, &msg.RequestID, &msg.FromAdmin, &msg.Sender, &msg.Text, &msg.SentAt, &msg.Read)

	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not send message: " + err.Error(),
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[models.SKMessage]{
		Success: true, Data: msg,
	})
}

// MarkMessagesRead handles PATCH /api/sk-requests/{id}/messages/read
func (h *ShopkeeperHandler) MarkMessagesRead(w http.ResponseWriter, r *http.Request) {
	reqID := pathStr(r, "id")
	claims := middleware.GetClaims(r.Context())

	// Admin marks shopkeeper messages as read; shopkeeper marks admin messages as read
	fromAdmin := false
	if claims != nil && claims.Role == "admin" {
		fromAdmin = false // mark non-admin (shopkeeper) messages as read
	} else {
		fromAdmin = true // mark admin messages as read from shopkeeper's perspective
	}

	_, err := h.db.ExecContext(r.Context(),
		`UPDATE sk_messages SET read=true WHERE request_id=$1 AND from_admin=$2 AND read=false`,
		reqID, fromAdmin,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[any]{
		Success: true, Message: "messages marked as read",
	})
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const skReqColumns = `id, shopkeeper_name, phone, request_type, shop_id, shop_name,
	logo_base64, shop_photo_base64, map_link, description, show_phone,
	status, admin_note, submitted_at, reviewed_at, reviewed_by`

func scanSKRequest(rows interface {
	Scan(dest ...any) error
}) (*models.SKRequest, error) {
	var req models.SKRequest
	err := rows.Scan(
		&req.ID, &req.ShopkeeperName, &req.Phone, &req.RequestType, &req.ShopID, &req.ShopName,
		&req.LogoBase64, &req.ShopPhotoBase64, &req.MapLink, &req.Description, &req.ShowPhone,
		&req.Status, &req.AdminNote, &req.SubmittedAt, &req.ReviewedAt, &req.ReviewedBy,
	)
	return &req, err
}

func (h *ShopkeeperHandler) getRequest(r *http.Request, id string) (*models.SKRequest, error) {
	row := h.db.QueryRowContext(r.Context(),
		`SELECT `+skReqColumns+` FROM sk_requests WHERE id=$1`, id,
	)
	return scanSKRequest(row)
}

func (h *ShopkeeperHandler) issueToken(userID int, username, role string) (string, error) {
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

func normalizePhone(phone string) string {
	var out strings.Builder
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			out.WriteRune(ch)
		}
	}
	return out.String()
}

// suppress unused warning
var _ = fmt.Sprintf

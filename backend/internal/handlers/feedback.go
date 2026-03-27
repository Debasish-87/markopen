package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/lib/pq"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// FeedbackHandler handles feedback endpoints.
type FeedbackHandler struct {
	db *sql.DB
}

func NewFeedbackHandler(db *sql.DB) *FeedbackHandler {
	return &FeedbackHandler{db: db}
}

// SubmitFeedback handles POST /api/feedback
func (h *FeedbackHandler) SubmitFeedback(w http.ResponseWriter, r *http.Request) {
	var p models.FeedbackPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	p.Name = strings.TrimSpace(p.Name)
	p.Email = strings.TrimSpace(p.Email)
	p.Message = strings.TrimSpace(p.Message)

	// Validate
	if p.Name == "" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "name is required",
		})
		return
	}
	if !isValidEmail(p.Email) {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "a valid email address is required",
		})
		return
	}
	if p.Message == "" {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "message is required",
		})
		return
	}
	if len(p.Message) > 500 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "message must be 500 characters or fewer",
		})
		return
	}
	if p.StarRating < 0 || p.StarRating > 5 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: "star rating must be between 0 and 5",
		})
		return
	}
	if p.Types == nil {
		p.Types = []string{}
	}

	var fb models.Feedback
	err := h.db.QueryRowContext(r.Context(), `
		INSERT INTO feedback (name, email, message, star_rating, types)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, email, message, star_rating, types, created_at`,
		p.Name, p.Email, p.Message, p.StarRating, pq.Array(p.Types),
	).Scan(
		&fb.ID, &fb.Name, &fb.Email, &fb.Message,
		&fb.StarRating, pq.Array(&fb.Types), &fb.CreatedAt,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not save feedback: " + err.Error(),
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[models.Feedback]{
		Success: true, Data: fb, Message: "thank you for your feedback",
	})
}

// AdminListFeedback handles GET /api/admin/feedback
func (h *FeedbackHandler) AdminListFeedback(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT id, name, email, message, star_rating, types, created_at
		 FROM feedback ORDER BY created_at DESC LIMIT 500`,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	defer rows.Close()

	var items []models.Feedback
	for rows.Next() {
		var fb models.Feedback
		if err := rows.Scan(
			&fb.ID, &fb.Name, &fb.Email, &fb.Message,
			&fb.StarRating, pq.Array(&fb.Types), &fb.CreatedAt,
		); err != nil {
			continue
		}
		items = append(items, fb)
	}
	if items == nil {
		items = []models.Feedback{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.Feedback]{
		Success: true, Data: items,
	})
}

func isValidEmail(email string) bool {
	if len(email) < 3 || !strings.Contains(email, "@") {
		return false
	}
	parts := strings.Split(email, "@")
	if len(parts) != 2 || parts[0] == "" || !strings.Contains(parts[1], ".") {
		return false
	}
	return true
}

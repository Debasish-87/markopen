package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// ImageRequestHandler manages shop image upload requests.
type ImageRequestHandler struct {
	db *sql.DB
}

func NewImageRequestHandler(db *sql.DB) *ImageRequestHandler {
	return &ImageRequestHandler{db: db}
}

// SubmitImageRequest handles POST /api/image-requests
func (h *ImageRequestHandler) SubmitImageRequest(w http.ResponseWriter, r *http.Request) {
	var p models.ImageRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	// Validate required fields
	errs := []string{}
	if p.ShopID == 0 {
		errs = append(errs, "shop_id is required")
	}
	if strings.TrimSpace(p.OwnerName) == "" {
		errs = append(errs, "owner name is required")
	}
	if strings.TrimSpace(p.Phone) == "" {
		errs = append(errs, "phone is required")
	}
	if strings.TrimSpace(p.LogoBase64) == "" {
		errs = append(errs, "logo image is required")
	}
	if strings.TrimSpace(p.ShopPhotoBase64) == "" {
		errs = append(errs, "shop photo is required")
	}
	if len(errs) > 0 {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: strings.Join(errs, "; "),
		})
		return
	}

	// Verify shop exists
	var exists bool
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM shops WHERE id=$1)`, p.ShopID,
	).Scan(&exists)
	if !exists {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "shop not found",
		})
		return
	}

	id := nowID("req")

	var req models.ImageRequest
	err := h.db.QueryRowContext(r.Context(), `
		INSERT INTO image_requests
			(id, shop_id, shop_name, owner_name, phone,
			 logo_base64, logo_file, shop_photo_base64, shop_photo_file, note)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING `+imgReqColumns,
		id, p.ShopID, p.ShopName, p.OwnerName, p.Phone,
		p.LogoBase64, p.LogoFile, p.ShopPhotoBase64, p.ShopPhotoFile, p.Note,
	).Scan(imgReqScanFields(&req)...)

	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not save image request: " + err.Error(),
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[models.ImageRequest]{
		Success: true, Data: req,
	})
}

// AdminListImageRequests handles GET /api/admin/image-requests
func (h *ImageRequestHandler) AdminListImageRequests(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	query := `SELECT ` + imgReqColumns + ` FROM image_requests`
	var args []any
	if status != "" {
		query += ` WHERE status=$1`
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

	var items []models.ImageRequest
	for rows.Next() {
		var req models.ImageRequest
		if err := rows.Scan(imgReqScanFields(&req)...); err != nil {
			continue
		}
		items = append(items, req)
	}
	if items == nil {
		items = []models.ImageRequest{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.ImageRequest]{
		Success: true, Data: items,
	})
}

// AdminReviewImageRequest handles PATCH /api/admin/image-requests/{id}/review
func (h *ImageRequestHandler) AdminReviewImageRequest(w http.ResponseWriter, r *http.Request) {
	id := pathStr(r, "id")
	claims := middleware.GetClaims(r.Context())

	var p models.ReviewImageRequestPayload
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

	// If approved, apply images to the shop
	if p.Status == "approved" {
		var shopID int
		var logoB64, photoB64 string
		err := h.db.QueryRowContext(r.Context(),
			`SELECT shop_id, logo_base64, shop_photo_base64 FROM image_requests WHERE id=$1`, id,
		).Scan(&shopID, &logoB64, &photoB64)
		if err == nil && shopID > 0 {
			_, _ = h.db.ExecContext(r.Context(),
				`UPDATE shops SET logo_url=$1, photo_url=$2 WHERE id=$3`,
				logoB64, photoB64, shopID,
			)
		}
	}

	res, err := h.db.ExecContext(r.Context(), `
		UPDATE image_requests
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

	var req models.ImageRequest
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT `+imgReqColumns+` FROM image_requests WHERE id=$1`, id,
	).Scan(imgReqScanFields(&req)...)

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.ImageRequest]{
		Success: true, Data: req,
	})
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const imgReqColumns = `id, shop_id, shop_name, owner_name, phone,
	logo_base64, logo_file, shop_photo_base64, shop_photo_file, status,
	note, admin_note, submitted_at, reviewed_at, reviewed_by`

func imgReqScanFields(r *models.ImageRequest) []any {
	return []any{
		&r.ID, &r.ShopID, &r.ShopName, &r.OwnerName, &r.Phone,
		&r.LogoBase64, &r.LogoFile, &r.ShopPhotoBase64, &r.ShopPhotoFile, &r.Status,
		&r.Note, &r.AdminNote, &r.SubmittedAt, &r.ReviewedAt, &r.ReviewedBy,
	}
}

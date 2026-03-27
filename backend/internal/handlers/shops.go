package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// ShopHandler handles all shop-related endpoints.
type ShopHandler struct {
	db *sql.DB
}

func NewShopHandler(db *sql.DB) *ShopHandler {
	return &ShopHandler{db: db}
}

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// ListShops handles GET /api/shops
func (h *ShopHandler) ListShops(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filters := models.ShopFilters{
		Category: q.Get("category"),
		Subcat:   q.Get("subcat"),
		Status:   q.Get("status"),
		Search:   q.Get("search"),
	}

	shops, err := h.queryShops(r, filters, false)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "failed to fetch shops",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.Shop]{
		Success: true, Data: shops,
	})
}

// GetShop handles GET /api/shops/{id}
func (h *ShopHandler) GetShop(w http.ResponseWriter, r *http.Request) {
	id, err := pathInt(r, "id")
	if err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid shop id",
		})
		return
	}

	shop, err := h.scanShop(r,
		`SELECT `+shopColumns+` FROM shops WHERE id = $1 AND status = 'active'`, id,
	)
	if err == sql.ErrNoRows {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "shop not found",
		})
		return
	}
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[*models.Shop]{
		Success: true, Data: shop,
	})
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// AdminListShops handles GET /api/admin/shops
func (h *ShopHandler) AdminListShops(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filters := models.ShopFilters{
		Category: q.Get("category"),
		Search:   q.Get("search"),
	}

	shops, err := h.queryShops(r, filters, true)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "failed to fetch shops",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.Shop]{
		Success: true, Data: shops,
	})
}

// CreateShop handles POST /api/admin/shops
func (h *ShopHandler) CreateShop(w http.ResponseWriter, r *http.Request) {
	var p models.CreateShopPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON",
		})
		return
	}

	if err := validateShopPayload(p); err != nil {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: err.Error(),
		})
		return
	}

	var shop models.Shop
	err := h.db.QueryRowContext(r.Context(), `
		INSERT INTO shops
			(name, category, subcat, address, phone, show_phone, description,
			 icon, photo_url, logo_url, map_query, hours, is_open)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		RETURNING `+shopColumns,
		p.Name, p.Category, p.Subcat, p.Address, p.Phone, p.ShowPhone, p.Description,
		p.Icon, p.PhotoURL, p.LogoURL, p.MapQuery, p.Hours, p.IsOpen,
	).Scan(shopScanFields(&shop)...)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not create shop: " + err.Error(),
		})
		return
	}

	middleware.JSON(w, http.StatusCreated, models.APIResponse[models.Shop]{
		Success: true, Data: shop,
	})
}

// UpdateShop handles PUT /api/admin/shops/{id}
func (h *ShopHandler) UpdateShop(w http.ResponseWriter, r *http.Request) {
	id, err := pathInt(r, "id")
	if err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid shop id",
		})
		return
	}

	var p models.UpdateShopPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON",
		})
		return
	}

	if err := validateShopPayload(p); err != nil {
		middleware.JSON(w, http.StatusUnprocessableEntity, models.APIResponse[any]{
			Success: false, Error: err.Error(),
		})
		return
	}

	var shop models.Shop
	err = h.db.QueryRowContext(r.Context(), `
		UPDATE shops SET
			name=$1, category=$2, subcat=$3, address=$4, phone=$5, show_phone=$6,
			description=$7, icon=$8, photo_url=$9, logo_url=$10, map_query=$11,
			hours=$12, is_open=$13
		WHERE id=$14
		RETURNING `+shopColumns,
		p.Name, p.Category, p.Subcat, p.Address, p.Phone, p.ShowPhone,
		p.Description, p.Icon, p.PhotoURL, p.LogoURL, p.MapQuery,
		p.Hours, p.IsOpen, id,
	).Scan(shopScanFields(&shop)...)

	if err == sql.ErrNoRows {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "shop not found",
		})
		return
	}
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not update shop: " + err.Error(),
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.Shop]{
		Success: true, Data: shop,
	})
}

// DeleteShop handles DELETE /api/admin/shops/{id}
func (h *ShopHandler) DeleteShop(w http.ResponseWriter, r *http.Request) {
	id, err := pathInt(r, "id")
	if err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid shop id",
		})
		return
	}

	res, err := h.db.ExecContext(r.Context(), `DELETE FROM shops WHERE id=$1`, id)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not delete shop",
		})
		return
	}
	if rows, _ := res.RowsAffected(); rows == 0 {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "shop not found",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[any]{
		Success: true, Message: "shop deleted",
	})
}

// ToggleStatus handles PATCH /api/admin/shops/{id}/toggle
func (h *ShopHandler) ToggleStatus(w http.ResponseWriter, r *http.Request) {
	id, err := pathInt(r, "id")
	if err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid shop id",
		})
		return
	}

	var shop models.Shop
	err = h.db.QueryRowContext(r.Context(), `
		UPDATE shops
		SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END
		WHERE id=$1
		RETURNING `+shopColumns,
		id,
	).Scan(shopScanFields(&shop)...)

	if err == sql.ErrNoRows {
		middleware.JSON(w, http.StatusNotFound, models.APIResponse[any]{
			Success: false, Error: "shop not found",
		})
		return
	}
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not toggle status",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.Shop]{
		Success: true, Data: shop,
	})
}

// ─── QUERY HELPER ─────────────────────────────────────────────────────────────

const shopColumns = `id, name, category, subcat, address, phone, show_phone,
	description, icon, photo_url, logo_url, map_query, hours, is_open, status,
	rating, review_count, created_at, updated_at`

func shopScanFields(s *models.Shop) []any {
	return []any{
		&s.ID, &s.Name, &s.Category, &s.Subcat, &s.Address, &s.Phone, &s.ShowPhone,
		&s.Description, &s.Icon, &s.PhotoURL, &s.LogoURL, &s.MapQuery, &s.Hours,
		&s.IsOpen, &s.Status, &s.Rating, &s.ReviewCount, &s.CreatedAt, &s.UpdatedAt,
	}
}

func (h *ShopHandler) scanShop(r *http.Request, query string, args ...any) (*models.Shop, error) {
	var s models.Shop
	err := h.db.QueryRowContext(r.Context(), query, args...).Scan(shopScanFields(&s)...)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (h *ShopHandler) queryShops(r *http.Request, f models.ShopFilters, adminView bool) ([]models.Shop, error) {
	var conditions []string
	var args []any
	i := 1

	if !adminView {
		conditions = append(conditions, "status = 'active'")
	}

	if f.Category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", i))
		args = append(args, f.Category)
		i++
	}
	if f.Subcat != "" {
		conditions = append(conditions, fmt.Sprintf("subcat = $%d", i))
		args = append(args, f.Subcat)
		i++
	}
	if f.Status != "" && f.Status != "all" && adminView {
		conditions = append(conditions, fmt.Sprintf("status = $%d", i))
		args = append(args, f.Status)
		i++
	}
	if f.Search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(LOWER(name) LIKE $%d OR LOWER(address) LIKE $%d OR LOWER(description) LIKE $%d)",
			i, i, i,
		))
		args = append(args, "%"+strings.ToLower(f.Search)+"%")
		i++
	}

	query := "SELECT " + shopColumns + " FROM shops"
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shops []models.Shop
	for rows.Next() {
		var s models.Shop
		if err := rows.Scan(shopScanFields(&s)...); err != nil {
			return nil, err
		}
		shops = append(shops, s)
	}
	if shops == nil {
		shops = []models.Shop{}
	}
	return shops, rows.Err()
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

var validCategories = map[string]bool{"Food": true, "Medical": true, "Café": true}

func validateShopPayload(p models.CreateShopPayload) error {
	name := strings.TrimSpace(p.Name)
	if len(name) < 2 || len(name) > 100 {
		return fmt.Errorf("shop name must be between 2 and 100 characters")
	}
	if !validCategories[p.Category] {
		return fmt.Errorf("invalid category: must be Food, Medical, or Café")
	}
	if len(p.Description) > 500 {
		return fmt.Errorf("description must be 500 characters or fewer")
	}
	return nil
}

// ─── STATS ────────────────────────────────────────────────────────────────────

// GetStats handles GET /api/admin/stats
func (h *ShopHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	var stats models.StatsResponse

	rows := []struct {
		dest *int
		q    string
	}{
		{&stats.TotalShops, `SELECT COUNT(*) FROM shops`},
		{&stats.ActiveShops, `SELECT COUNT(*) FROM shops WHERE status='active'`},
		{&stats.OpenShops, `SELECT COUNT(*) FROM shops WHERE is_open=true AND status='active'`},
		{&stats.TotalFeedback, `SELECT COUNT(*) FROM feedback`},
		{&stats.PendingImageReqs, `SELECT COUNT(*) FROM image_requests WHERE status='pending'`},
		{&stats.PendingSKRequests, `SELECT COUNT(*) FROM sk_requests WHERE status='pending'`},
		{&stats.TotalUsers, `SELECT COUNT(*) FROM users`},
		{&stats.TotalShopkeepers, `SELECT COUNT(*) FROM shopkeepers`},
	}

	for _, row := range rows {
		if err := h.db.QueryRowContext(r.Context(), row.q).Scan(row.dest); err != nil {
			middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
				Success: false, Error: "failed to fetch stats",
			})
			return
		}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[models.StatsResponse]{
		Success: true, Data: stats,
	})
}

// ─── PATH HELPERS ─────────────────────────────────────────────────────────────

// pathInt extracts a named path segment from Go 1.22 ServeMux patterns like {id}.
func pathInt(r *http.Request, key string) (int, error) {
	val := r.PathValue(key)
	return strconv.Atoi(val)
}

// pathStr extracts a named path segment.
func pathStr(r *http.Request, key string) string {
	return r.PathValue(key)
}

// nowID generates a unique string ID based on nanoseconds.
func nowID(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}

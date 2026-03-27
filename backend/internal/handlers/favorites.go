package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/shopen/backend/internal/middleware"
	"github.com/shopen/backend/internal/models"
)

// FavoritesHandler manages user favorites.
type FavoritesHandler struct {
	db *sql.DB
}

func NewFavoritesHandler(db *sql.DB) *FavoritesHandler {
	return &FavoritesHandler{db: db}
}

// ListFavorites handles GET /api/favorites?username=xxx
func (h *FavoritesHandler) ListFavorites(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		// Fallback to JWT claims
		if c := middleware.GetClaims(r.Context()); c != nil {
			username = c.Username
		}
	}
	if username == "" {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "username is required",
		})
		return
	}

	rows, err := h.db.QueryContext(r.Context(), `
		SELECT s.`+shopColumns+`
		FROM shops s
		JOIN favorites f ON f.shop_id = s.id
		WHERE f.username = $1
		ORDER BY f.created_at DESC`,
		username,
	)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}
	defer rows.Close()

	var shops []models.Shop
	for rows.Next() {
		var s models.Shop
		if err := rows.Scan(shopScanFields(&s)...); err != nil {
			continue
		}
		shops = append(shops, s)
	}
	if shops == nil {
		shops = []models.Shop{}
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[[]models.Shop]{
		Success: true, Data: shops,
	})
}

// ToggleFavorite handles POST /api/favorites/toggle
func (h *FavoritesHandler) ToggleFavorite(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		if c := middleware.GetClaims(r.Context()); c != nil {
			username = c.Username
		}
	}

	var p models.FavoritePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "invalid JSON body",
		})
		return
	}

	if username == "" || p.ShopID == 0 {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "username and shop_id are required",
		})
		return
	}

	// Check if already favorited
	var exists bool
	err := h.db.QueryRowContext(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM favorites WHERE username=$1 AND shop_id=$2)`,
		username, p.ShopID,
	).Scan(&exists)
	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "database error",
		})
		return
	}

	if exists {
		_, err = h.db.ExecContext(r.Context(),
			`DELETE FROM favorites WHERE username=$1 AND shop_id=$2`,
			username, p.ShopID,
		)
	} else {
		_, err = h.db.ExecContext(r.Context(),
			`INSERT INTO favorites (username, shop_id) VALUES ($1, $2)
			 ON CONFLICT DO NOTHING`,
			username, p.ShopID,
		)
	}

	if err != nil {
		middleware.JSON(w, http.StatusInternalServerError, models.APIResponse[any]{
			Success: false, Error: "could not update favorite",
		})
		return
	}

	middleware.JSON(w, http.StatusOK, models.APIResponse[map[string]any]{
		Success: true,
		Data: map[string]any{
			"favorited": !exists,
			"shop_id":   p.ShopID,
			"username":  username,
		},
	})
}

// IsFavorite handles GET /api/favorites/check?username=xxx&shop_id=yyy
func (h *FavoritesHandler) IsFavorite(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	shopIDStr := r.URL.Query().Get("shop_id")

	shopID, err := strconv.Atoi(shopIDStr)
	if err != nil || username == "" {
		middleware.JSON(w, http.StatusBadRequest, models.APIResponse[any]{
			Success: false, Error: "username and shop_id are required",
		})
		return
	}

	var exists bool
	_ = h.db.QueryRowContext(r.Context(),
		`SELECT EXISTS(SELECT 1 FROM favorites WHERE username=$1 AND shop_id=$2)`,
		username, shopID,
	).Scan(&exists)

	middleware.JSON(w, http.StatusOK, models.APIResponse[map[string]any]{
		Success: true,
		Data:    map[string]any{"favorited": exists},
	})
}

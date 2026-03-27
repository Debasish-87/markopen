package models

import "time"

// ─── RESPONSE WRAPPERS ────────────────────────────────────────────────────────

// APIResponse is the standard JSON envelope for all responses.
type APIResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

// PaginatedResponse wraps a list with pagination metadata.
type PaginatedResponse[T any] struct {
	Success bool  `json:"success"`
	Data    []T   `json:"data"`
	Total   int   `json:"total"`
	Page    int   `json:"page"`
	PerPage int   `json:"per_page"`
}

// ─── SHOP ─────────────────────────────────────────────────────────────────────

type Shop struct {
	ID          int        `json:"id"`
	Name        string     `json:"name"`
	Category    string     `json:"category"`
	Subcat      string     `json:"subcat"`
	Address     string     `json:"address"`
	Phone       string     `json:"phone"`
	ShowPhone   bool       `json:"show_phone"`
	Description string     `json:"description"`
	Icon        string     `json:"icon"`
	PhotoURL    string     `json:"photo_url"`
	LogoURL     string     `json:"logo_url"`
	MapQuery    string     `json:"map_query"`
	Hours       string     `json:"hours"`
	IsOpen      bool       `json:"is_open"`
	Status      string     `json:"status"`
	Rating      float64    `json:"rating"`
	ReviewCount int        `json:"review_count"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateShopPayload struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	Subcat      string `json:"subcat"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	ShowPhone   bool   `json:"show_phone"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	PhotoURL    string `json:"photo_url"`
	LogoURL     string `json:"logo_url"`
	MapQuery    string `json:"map_query"`
	Hours       string `json:"hours"`
	IsOpen      bool   `json:"is_open"`
}

type UpdateShopPayload = CreateShopPayload

type ShopFilters struct {
	Category string
	Subcat   string
	Status   string
	Search   string
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

type LoginPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// ─── USER ─────────────────────────────────────────────────────────────────────

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

type SignupPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// ─── SHOPKEEPER ───────────────────────────────────────────────────────────────

type Shopkeeper struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
}

type ShopkeeperSignupPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

// ─── FAVORITES ────────────────────────────────────────────────────────────────

type FavoritePayload struct {
	ShopID int `json:"shop_id"`
}

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────

type Feedback struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Message    string    `json:"message"`
	StarRating int       `json:"starRating"`
	Types      []string  `json:"types"`
	CreatedAt  time.Time `json:"created_at"`
}

type FeedbackPayload struct {
	Name       string   `json:"name"`
	Email      string   `json:"email"`
	Message    string   `json:"message"`
	StarRating int      `json:"starRating"`
	Types      []string `json:"types"`
}

// ─── IMAGE REQUESTS ───────────────────────────────────────────────────────────

type ImageRequest struct {
	ID               string     `json:"id"`
	ShopID           int        `json:"shopId"`
	ShopName         string     `json:"shopName"`
	OwnerName        string     `json:"ownerName"`
	Phone            string     `json:"phone"`
	LogoBase64       string     `json:"logoBase64"`
	LogoFile         string     `json:"logoFile"`
	ShopPhotoBase64  string     `json:"shopPhotoBase64"`
	ShopPhotoFile    string     `json:"shopPhotoFile"`
	Status           string     `json:"status"`
	Note             string     `json:"note"`
	AdminNote        string     `json:"adminNote"`
	SubmittedAt      time.Time  `json:"submittedAt"`
	ReviewedAt       *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy       string     `json:"reviewedBy"`
}

type ImageRequestPayload struct {
	ShopID          int    `json:"shopId"`
	ShopName        string `json:"shopName"`
	OwnerName       string `json:"ownerName"`
	Phone           string `json:"phone"`
	LogoBase64      string `json:"logoBase64"`
	LogoFile        string `json:"logoFile"`
	ShopPhotoBase64 string `json:"shopPhotoBase64"`
	ShopPhotoFile   string `json:"shopPhotoFile"`
	Note            string `json:"note"`
}

type ReviewImageRequestPayload struct {
	Status    string `json:"status"`
	AdminNote string `json:"adminNote"`
}

// ─── SHOPKEEPER REQUESTS ──────────────────────────────────────────────────────

type SKRequest struct {
	ID               string     `json:"id"`
	ShopkeeperName   string     `json:"shopkeeperName"`
	Phone            string     `json:"phone"`
	RequestType      string     `json:"requestType"`
	ShopID           *int       `json:"shopId,omitempty"`
	ShopName         string     `json:"shopName"`
	LogoBase64       string     `json:"logoBase64"`
	ShopPhotoBase64  string     `json:"shopPhotoBase64"`
	MapLink          string     `json:"mapLink"`
	Description      string     `json:"description"`
	ShowPhone        bool       `json:"showPhone"`
	Status           string     `json:"status"`
	AdminNote        string     `json:"adminNote"`
	SubmittedAt      time.Time  `json:"submittedAt"`
	ReviewedAt       *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy       string     `json:"reviewedBy"`
}

type SKRequestPayload struct {
	ShopkeeperName  string `json:"shopkeeperName"`
	Phone           string `json:"phone"`
	RequestType     string `json:"requestType"`
	ShopID          *int   `json:"shopId,omitempty"`
	ShopName        string `json:"shopName"`
	LogoBase64      string `json:"logoBase64"`
	ShopPhotoBase64 string `json:"shopPhotoBase64"`
	MapLink         string `json:"mapLink"`
	Description     string `json:"description"`
	ShowPhone       bool   `json:"showPhone"`
}

type ReviewSKRequestPayload struct {
	Status    string `json:"status"`
	AdminNote string `json:"adminNote"`
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

type SKMessage struct {
	ID        string    `json:"id"`
	RequestID string    `json:"requestId"`
	FromAdmin bool      `json:"fromAdmin"`
	Sender    string    `json:"sender"`
	Text      string    `json:"text"`
	SentAt    time.Time `json:"sentAt"`
	Read      bool      `json:"read"`
}

type SendMessagePayload struct {
	Text   string `json:"text"`
	Sender string `json:"sender"`
}

// ─── STATS ────────────────────────────────────────────────────────────────────

type StatsResponse struct {
	TotalShops        int `json:"totalShops"`
	ActiveShops       int `json:"activeShops"`
	OpenShops         int `json:"openShops"`
	TotalFeedback     int `json:"totalFeedback"`
	PendingImageReqs  int `json:"pendingImageRequests"`
	PendingSKRequests int `json:"pendingSKRequests"`
	TotalUsers        int `json:"totalUsers"`
	TotalShopkeepers  int `json:"totalShopkeepers"`
}

// ─── JWT CLAIMS ───────────────────────────────────────────────────────────────

type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"` // "admin" | "user" | "shopkeeper"
}

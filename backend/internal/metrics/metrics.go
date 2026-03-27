package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// RequestCount tracks total HTTP requests by method, path and status.
	RequestCount = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "shopen",
			Name:      "http_requests_total",
			Help:      "Total number of HTTP requests.",
		},
		[]string{"method", "path", "status"},
	)

	// RequestLatency tracks request duration histograms.
	RequestLatency = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "shopen",
			Name:      "http_request_duration_seconds",
			Help:      "HTTP request latency in seconds.",
			Buckets:   prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	// DBQueryDuration tracks database query durations.
	DBQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: "shopen",
			Name:      "db_query_duration_seconds",
			Help:      "Database query duration in seconds.",
			Buckets:   []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
		},
		[]string{"query"},
	)

	// ActiveConnections tracks current open DB connections.
	ActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "shopen",
		Name:      "db_active_connections",
		Help:      "Number of active database connections.",
	})

	// CacheHits tracks Redis cache hit/miss counts.
	CacheHits = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: "shopen",
			Name:      "cache_operations_total",
			Help:      "Redis cache hits and misses.",
		},
		[]string{"result"}, // "hit" or "miss"
	)

	// ShopsTotal tracks shop counts by category.
	ShopsTotal = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Namespace: "shopen",
			Name:      "shops_total",
			Help:      "Total number of shops by category.",
		},
		[]string{"category", "status"},
	)
)

// Init registers all metrics (promauto registers on import, this is a no-op
// but kept for explicit Init() call in main to make the dependency clear).
func Init() {}

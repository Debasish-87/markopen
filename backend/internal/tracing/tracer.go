package tracing

import (
	"context"
	"os"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.uber.org/zap"

	"github.com/shopen/backend/internal/logger"
)

func InitTracer() func() {
	endpoint := os.Getenv("JAEGER_ENDPOINT")

	// If no Jaeger endpoint configured, skip tracing silently (free hosting)
	if endpoint == "" {
		logger.Log.Info("ℹ️  Jaeger endpoint not configured — tracing disabled (set JAEGER_ENDPOINT to enable)")
		return func() {}
	}

	exp, err := jaeger.New(
		jaeger.WithCollectorEndpoint(
			jaeger.WithEndpoint(endpoint),
		),
	)
	if err != nil {
		logger.Log.Warn("Jaeger unavailable — tracing disabled", zap.Error(err))
		return func() {}
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp,
			sdktrace.WithExportTimeout(2*time.Second),
			sdktrace.WithMaxExportBatchSize(10),
		),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName("shopen-api"),
			semconv.ServiceVersion("2.0.0"),
			semconv.DeploymentEnvironment(os.Getenv("ENV")),
		)),
	)

	otel.SetTracerProvider(tp)
	logger.Log.Info("✅ OpenTelemetry tracing initialised",
		zap.String("jaeger_endpoint", endpoint),
	)

	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = tp.Shutdown(ctx)
	}
}

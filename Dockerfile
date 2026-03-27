FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN echo ">>> FILES IN /app:" && find /app -type f | sort
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /app/server ./cmd/server
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata wget
WORKDIR /app
COPY --from=builder /app/server .
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1
ENTRYPOINT ["/app/server"]

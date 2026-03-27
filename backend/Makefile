.PHONY: run build test docker-up docker-down migrate-reset lint

## run: Start the server locally (requires a running Postgres)
run:
	go run ./cmd/server

## build: Compile production binary
build:
	CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o bin/server ./cmd/server

## test: Run all tests
test:
	go test ./... -v -race -timeout 30s

## tidy: Tidy and verify go modules
tidy:
	go mod tidy
	go mod verify

## docker-up: Start full stack via Docker Compose
docker-up:
	docker compose up --build -d

## docker-down: Stop and remove containers
docker-down:
	docker compose down

## docker-logs: Tail backend logs
docker-logs:
	docker compose logs -f backend

## migrate-reset: Drop and recreate schema (dev only!)
migrate-reset:
	@echo "⚠️  This will destroy all data. Press Ctrl+C to cancel."
	@sleep 3
	PGPASSWORD=shopen_secret psql -h localhost -U shopen -d shopen_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "Schema reset. Restart the server to re-apply migrations."

## db-shell: Open a psql shell
db-shell:
	PGPASSWORD=shopen_secret psql -h localhost -U shopen -d shopen_db

## lint: Run golangci-lint
lint:
	golangci-lint run ./...

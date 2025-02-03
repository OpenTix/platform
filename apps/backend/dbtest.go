package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	_ "github.com/lib/pq"

	"backend/shared"
)

var (
	dbAddress  string
	dbPort     string
	dbUser     string
	dbPassword string
	dbName     string
)

func init() {
	googleAddress := "google.com:80"
    conn, err := net.DialTimeout("tcp", googleAddress, 3*time.Second)
    if err != nil {
        log.Fatalf("error pinging google.com: %w", err)
    }
    log.Printf("Successfully pinged google.com")
    conn.Close()

	dbAddress = os.Getenv("DB_ADDRESS")
	log.Printf("Retrieved DB_ADDRESS: %s", dbAddress)

	dbPort = os.Getenv("DB_PORT")
	log.Printf("Retrieved DB_PORT: %s", dbPort)

	dbName = os.Getenv("DB_NAME")
	log.Printf("Retrieved DB_NAME: %s", dbName)

	dbCredentials := shared.GetDBCredentials()
	log.Printf("Retrieved DB credentials: Username=%s", dbCredentials.Username)

	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password
}

func TestDBConnection(ctx context.Context) error {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbAddress, dbPort, dbName)
	log.Printf("Built connection string: %s", connStr) // Caution: Logging sensitive data is not recommended

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error opening connection: %w", err)
	}
	log.Printf("Database connection opened")
	defer func() {
		db.Close()
		log.Printf("Database connection closed")
	}()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("error pinging database: %w", err)
	}
	log.Printf("Database ping successful")

	var version string
	err = db.QueryRowContext(ctx, "SELECT version();").Scan(&version)
	if err != nil {
		return fmt.Errorf("query error: %w", err)
	}
	log.Printf("Queried database version: %s", version)
	return nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Handler invoked")
	err := TestDBConnection(ctx)
	log.Printf("TestDBConnection completed with error: %v", err)
	status := "OK"
	if err != nil {
		status = fmt.Sprintf("Failed: %v", err)
	}
	response := map[string]interface{}{
		"DBStatus": status,
	}
	log.Printf("Response object built: %v", response)

	responseBody, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshalling response: %v", err)
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}
	log.Printf("Response marshalled to JSON: %s", responseBody)

	resp := events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	log.Printf("Returning final response: %v", resp)
	return resp, nil
}

func main() {
	log.Printf("Starting Lambda")
	lambda.Start(Handler)
}

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"

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
	dbAddress = os.Getenv("DB_ADDRESS")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	dbCredentials := shared.GetDBCredentials()
	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password
}

func TestDBConnection(ctx context.Context) error {
	// Build connection string with proper URL encoding
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(dbUser, dbPassword),
		Host:   fmt.Sprintf("%s:%s", dbAddress, dbPort),
		Path:   dbName,
	}
	q := u.Query()
	q.Set("sslmode", "require")
	u.RawQuery = q.Encode()
	connStr := u.String()

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error opening connection: %w", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("error pinging database: %w", err)
	}

	var version string
	err = db.QueryRowContext(ctx, "SELECT version();").Scan(&version)
	if err != nil {
		return fmt.Errorf("query error: %w", err)
	}
	return nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	err := TestDBConnection(ctx)
	status := "OK"
	if err != nil {
		status = fmt.Sprintf("Failed: %v", err)
	}
	response := map[string]interface{}{
		"DBStatus": status,
	}

	responseBody, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshalling response: %v", err)
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}

	resp := events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	return resp, nil
}

func main() {
	lambda.Start(Handler)
}

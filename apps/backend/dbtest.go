package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
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
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, dbPassword, dbAddress, dbPort, dbName)
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
	log.Printf("Database version: %s", version)
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

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(Handler)
}

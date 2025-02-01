package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"backend/shared"
)


var dbAddress string
var dbPort string
var dbUser string
var dbPassword string

func init() {
	dbAddress = os.Getenv("DB_ADDRESS")
	dbPort = os.Getenv("DB_PORT")
	dbCredentials := shared.GetDBCredentials()
	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	dbPasswordExists := dbPassword != ""

	response := map[string]interface{}{
		"dbAddress": dbAddress,
		"dbPort": dbPort,
		"dbUser": dbUser,
		"dbPassword": dbPasswordExists,
	}
	responseBody, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshalling response: %v", err)
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}
	
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body: string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func main() {
	lambda.Start(Handler)
}

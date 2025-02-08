package main

import (
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/magiclabs/magic-admin-go/client"

	"backend/shared"
)

var magicClient *client.API

// Runs on cold start, global variables are cached between invocations
func init() {
	magicClient = shared.InitializeMagicClient()
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	authHeader := request.Headers["Authorization"]
	authHeader = strings.TrimPrefix(authHeader, "Bearer ")

	info, err := magicClient.User.GetMetadataByToken(authHeader)
	if err != nil {
		log.Fatalf("Error getting metadata from Magic: %v\n", err.Error())
	}

	response := events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       info.Email,
	}

	return response, nil
}

func main() {
	lambda.Start(Handler)
}

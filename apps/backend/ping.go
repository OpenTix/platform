package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	response := events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       "Pong",
		Headers: map[string]string{
			"Content-Type": "text/plain",
		},
	}

	return response, nil
}

func main() {
	lambda.Start(Handler)
}

package main

import (
	"backend/shared"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// Used for all OPTIONS requests. Needed to dynamically handle CORS.
func handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    responseHeaders := shared.GetResponseHeaders(request.Headers)

    return events.APIGatewayProxyResponse{
        StatusCode:      200,
        Headers:         responseHeaders,
        Body:            "",
        IsBase64Encoded: false,
    }, nil
}

func main() {
    lambda.Start(handler)
}
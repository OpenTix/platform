package shared

import (
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func CreateErrorResponse(statusCode int, message string, requestHeaders map[string]string) (events.APIGatewayProxyResponse, error) {
	body, _ := json.Marshal(map[string]string{"message": message})
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       string(body),
		Headers:    GetResponseHeaders(requestHeaders),
	}, nil
}

func CreateErrorResponseAndLogError(statusCode int, message string, requestHeaders map[string]string, err error) (events.APIGatewayProxyResponse, error) {
	log.Printf("Error: %v:  %v\n", message, err)
	return CreateErrorResponse(statusCode, message, requestHeaders)
}

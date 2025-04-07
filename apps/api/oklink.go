package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/opentix/platform/apps/api/shared"
)

type OKLinkSecretsManagerResponse struct {
	API_KEY string `json:"API_KEY"`;
}

var OKLINK_API_KEY string

func init() {
	secretArn := os.Getenv("OKLINK_SECRET_ARN")
	region := "us-east-1"

	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		log.Println("Error loading AWS config:", err)
		panic(err)
	}

	// Create Secrets Manager client
	svc := secretsmanager.NewFromConfig(cfg)

	// Retrieve the secret value
	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(secretArn),
	}
	result, err := svc.GetSecretValue(context.TODO(), input)
	if err != nil {
		log.Println("Error retrieving secret value:", err)
		panic(err)
	}

	secretString := *result.SecretString

	// Unmarshal the secret JSON
	var jsonSecret OKLinkSecretsManagerResponse
	err = json.Unmarshal([]byte(secretString), &jsonSecret)
	if err != nil {
		log.Println("Error unmarshaling secret JSON:", err)
		panic(err)
	}

	OKLINK_API_KEY = jsonSecret.API_KEY
	if OKLINK_API_KEY == "" {
		panic("API_KEY is empty")
	}

}

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	
	wallet, ok := request.QueryStringParameters["wallet"]
	if !ok {
		return shared.CreateErrorResponse(400, "Missing wallet parameter", request.Headers)
	}
	chainShortName, ok := request.QueryStringParameters["chainShortName"]
	if !ok {
		return shared.CreateErrorResponse(400, "Missing chainShortName parameter", request.Headers)
	}
	contractAddress, ok := request.QueryStringParameters["tokenContractAddress"]
	if !ok {
		return shared.CreateErrorResponse(400, "Missing contractAddress parameter", request.Headers)
	}

	var requestURL = fmt.Sprintf("https://www.oklink.com/api/v5/explorer/nft/address-balance-fills?chainShortName=%v&address=%v&tokenContractAddress=%v&limit=100&protocolType=token_1155", chainShortName, wallet, contractAddress)

	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return shared.CreateErrorResponse(500, "Could not create request to "+requestURL, request.Headers)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return shared.CreateErrorResponse(500, "Unable to perform get request to "+requestURL, request.Headers)
	}
	defer res.Body.Close()
	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return shared.CreateErrorResponse(500, "Unable to read response body from "+requestURL, request.Headers)
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(resBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
	} else {
		body, _ := json.Marshal(map[string]string{"message": "Method Not Allowed."})
		return events.APIGatewayProxyResponse{
			StatusCode: 405,
			Body:       string(body),
			Headers:    shared.GetResponseHeaders(request.Headers),
		}, nil
	}
}

func main() {
	lambda.Start(Handler)
}

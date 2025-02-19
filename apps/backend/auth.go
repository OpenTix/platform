package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
)

var jwks *keyfunc.JWKS

// Runs on cold start, global variables are cached between invocations
func init() {
	jwksURL := os.Getenv("JWKS_URL")
	context := context.Background()
	options := keyfunc.Options{
		Ctx: context,
	}
	j, err := keyfunc.Get(jwksURL, options)
	if err != nil {
		log.Printf("Failed to create JWKS from URL: %v\n", err.Error())
	}
	jwks = j

}

func Handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	// We have to wildcard the api resources. The cache applies to every endpoint.
	// Using event.methodArn as the resource will only allow that resource and block
	// all others until the cache expires.
	resourceArn := strings.Split(event.MethodArn, "/")[0] + "/*"
	AllowResponse := events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "user",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: []string{resourceArn},
				},
			},
		},
	}

	DenyResponse := events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "user",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Deny",
					Resource: []string{event.MethodArn},
				},
			},
		},
	}

	tk := event.AuthorizationToken
	tk = strings.TrimPrefix(tk, "Bearer ")

	token, err := jwt.Parse(tk, jwks.Keyfunc)
	if err != nil {
		log.Printf("Failed to parse token: %v\n", err.Error())
		return DenyResponse, nil
	}

	if !token.Valid {
		return DenyResponse, nil
	}

	return AllowResponse, nil
}

func main() {
	lambda.Start(Handler)
}

package main

import (
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

    "github.com/magiclabs/magic-admin-go/client"
	"github.com/magiclabs/magic-admin-go/token"

	"backend/shared"
)

var magicClient *client.API

// Runs on cold start, global variables are cached between invocations
func init() {
	magicClient = shared.InitializeMagicClient()
}

func Handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	var AllowResponse = events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "user",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: []string{event.MethodArn},
				},
			},
		},
	}

	var DenyResponse = events.APIGatewayCustomAuthorizerResponse{
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

	didToken := event.AuthorizationToken
	didToken = strings.TrimPrefix(didToken, "Bearer ")


	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		return DenyResponse, nil
	}

	if err := tk.Validate(magicClient.ClientInfo.ClientId); err != nil {
		log.Printf("Error validating DIDToken: %v\n", err.Error())
		return DenyResponse, nil
	}

	return AllowResponse, nil
}

func main() {
	lambda.Start(Handler)
}

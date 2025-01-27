package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"

	"github.com/magiclabs/magic-admin-go"
	"github.com/magiclabs/magic-admin-go/client"
	"github.com/magiclabs/magic-admin-go/token"
)

// INPUT:
//{
//   "type":"TOKEN",
//   "authorizationToken":"{caller-supplied-token}",
//    "methodArn":"arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]"
//}

// OUTPUT:
// {
// 	"principalId": "yyyyyyyy", // The principal user identification associated with the token sent by the client.
// 	"policyDocument": {
// 	  "Version": "2012-10-17",
// 	  "Statement": [
// 		{
// 		  "Action": "execute-api:Invoke",
// 		  "Effect": "Allow|Deny",
// 		  "Resource": "arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]"
// 		}
// 	  ]
// 	},
// 	"usageIdentifierKey": "{api-key}"
//   }

var magicClient *client.API



// func init() {
// 	secretName := "MagicAuth/SecretKey"
// 	region := "us-east-1"

// 	config, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
// 	if err != nil {
// 		log.Println(err.Error())
// 		panic(err)
// 	}

// 	// Create Secrets Manager client
// 	svc := secretsmanager.NewFromConfig(config)

// 	input := &secretsmanager.GetSecretValueInput{
// 		SecretId:     aws.String(secretName),
// 	}

// 	result, err := svc.GetSecretValue(context.TODO(), input)
// 	if err != nil {
// 		// For a list of exceptions thrown, see
// 		// https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// 		log.Println(err.Error())
// 		panic(err)
// 	}

// 	// Decrypts secret using the associated KMS key.
// 	magicSecretKey = *result.SecretString

// 	c, err := client.New(magicSecretKey, magic.NewDefaultClient())
// 	if err != nil {
// 		log.Printf("Failed to create Magic client: %v\n", err)
// 		panic(err)
// 	}
// 	magicClient = c

// }

type SecretsManagerResponse struct {
    SecretKey string `json:"secret_key"`
}

func Handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	secretArn := "arn:aws:secretsmanager:us-east-1:390403894969:secret:MagicAuth/SecretKey-idvwer"
	region := "us-east-1"

	config, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	if err != nil {
		log.Println(err.Error())
		panic(err)
	}

	// Create Secrets Manager client
	svc := secretsmanager.NewFromConfig(config)

	input := &secretsmanager.GetSecretValueInput{
		SecretId:     aws.String(secretArn),
	}

	result, err := svc.GetSecretValue(context.TODO(), input)
	if err != nil {
		// For a list of exceptions thrown, see
		// https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
		log.Println(err.Error())
		panic(err)
	}

	// Decrypts secret using the associated KMS key.
	var stringFromSecretsManager string = *result.SecretString
	log.Printf("Secrets Manager Response: %v\n", stringFromSecretsManager)

	var jsonSecretKey SecretsManagerResponse
	json.Unmarshal([]byte(stringFromSecretsManager), &jsonSecretKey)
	log.Printf("json unmarshall: %v\n", jsonSecretKey.SecretKey)

	var magicSecretKey string = jsonSecretKey.SecretKey
	log.Printf("Magic Secret Key: %v\n", magicSecretKey)

	c, err := client.New(magicSecretKey, magic.NewDefaultClient())
	if err != nil {
		log.Printf("Failed to create Magic client: %v\n", err)
		panic(err)
	}
	magicClient = c


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

	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Println(err.Error())
		return DenyResponse, err
	}

	if err := tk.Validate(magicClient.ClientInfo.ClientId); err != nil {
		log.Println(err.Error())
		return DenyResponse, err
	}

	return AllowResponse, nil
}	

func main() {
	lambda.Start(Handler)
}

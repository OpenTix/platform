package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
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


func Handler(ctx context.Context, event events.APIGatewayCustomAuthorizerRequest) (events.APIGatewayCustomAuthorizerResponse, error) {
	var AllowResponse = events.APIGatewayCustomAuthorizerResponse{
		PrincipalID: "user",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: event.MethodArn,
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
					Resource: event.MethodArn,
				},
			},
		},
	}

	didToken := event.AuthorizationToken

	tk, err := token.NewToken(didToken)
	if err != nil {
		return DenyResponse, err
	}

	if err := tk.Validate(); err != nil {
		return DenyResponse, err
	}

	return AllowResponse, nil
}	

func main() {
	lambda.Start(Handler)
}

package shared

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

// SecretsManagerResponse represents the structure of the secret stored in AWS Secrets Manager.
type DBSecretsManagerResponse struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type DBCredentialsResponse struct {
	Username string
	Password string
}

// GetDBCredentials retrieves database credentials from AWS Secrets Manager.
func GetDBCredentials() DBCredentialsResponse {
	secretArn := os.Getenv("DB_SECRET_ARN")
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
	var jsonSecret DBSecretsManagerResponse
	err = json.Unmarshal([]byte(secretString), &jsonSecret)
	if err != nil {
		log.Println("Error unmarshaling secret JSON:", err)
		panic(err)
	}

	response := DBCredentialsResponse{
		Username: jsonSecret.Username,
		Password: jsonSecret.Password,
	}
	return response
}

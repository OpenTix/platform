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
    log.Println("Starting GetDBCredentials")
    secretArn := os.Getenv("DB_SECRET_ARN")
    log.Printf("Retrieved DB_SECRET_ARN: %s", secretArn)

    region := "us-east-1"
    log.Printf("Using AWS region: %s", region)

    // Load AWS configuration
    log.Println("Loading AWS configuration")
    cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
    if err != nil {
        log.Println("Error loading AWS config:", err)
        panic(err)
    }
    log.Println("AWS configuration loaded successfully")

    // Create Secrets Manager client
    log.Println("Creating Secrets Manager client")
    svc := secretsmanager.NewFromConfig(cfg)
    log.Println("Secrets Manager client created successfully")

    // Retrieve the secret value
    log.Printf("Retrieving secret value for secretArn: %s", secretArn)
    input := &secretsmanager.GetSecretValueInput{
        SecretId: aws.String(secretArn),
    }
    result, err := svc.GetSecretValue(context.TODO(), input)
    if err != nil {
        log.Println("Error retrieving secret value:", err)
        panic(err)
    }
    log.Println("Secret value retrieved successfully")

    secretString := *result.SecretString
    log.Println("Secret string obtained")

    // Unmarshal the secret JSON
    log.Println("Unmarshaling secret JSON")
    var jsonSecret DBSecretsManagerResponse
    err = json.Unmarshal([]byte(secretString), &jsonSecret)
    if err != nil {
        log.Println("Error unmarshaling secret JSON:", err)
        panic(err)
    }
    log.Println("Successfully unmarshaled secret JSON")

    response := DBCredentialsResponse{
        Username: jsonSecret.Username,
        Password: jsonSecret.Password,
    }
    log.Printf("Returning DBCredentialsResponse: %+v", response)
    return response
}
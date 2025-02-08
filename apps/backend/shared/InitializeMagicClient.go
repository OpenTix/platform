package shared

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"

	magic "github.com/magiclabs/magic-admin-go" // Aliased to 'magic'
	"github.com/magiclabs/magic-admin-go/client"
)

// SecretsManagerResponse represents the structure of the secret stored in AWS Secrets Manager.
type MagicSecretsManagerResponse struct {
	SecretKey string `json:"magic_secret"`
}

// InitializeMagicClient initializes and returns a Magic client instance.
func InitializeMagicClient() *client.API {
	secretArn := os.Getenv("MAGIC_SECRET_ARN")
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
	var jsonSecret MagicSecretsManagerResponse
	err = json.Unmarshal([]byte(secretString), &jsonSecret)
	if err != nil {
		log.Println("Error unmarshaling secret JSON:", err)
		panic(err)
	}

	magicSecretKey := jsonSecret.SecretKey

	magicDefaultClient := magic.NewDefaultClient()

	c, err := client.New(magicSecretKey, magicDefaultClient)
	if err != nil {
		log.Printf("Failed to create Magic client: %v\n", err)
		panic(err)
	}

	return c // Returns *client.API
}

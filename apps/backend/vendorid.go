package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	_ "github.com/lib/pq"

	"github.com/jackc/pgx/v5"

	"github.com/magiclabs/magic-admin-go/client"
	"github.com/magiclabs/magic-admin-go/token"

	"backend/query"
	"backend/shared"
)

var (
	walletRegex *regexp.Regexp
	uuidRegex  *regexp.Regexp
	dbAddress  string
	dbPort     string
	dbUser     string
	dbPassword string
	dbName     string
	connStr    string
	magicClient *client.API
)
type PostPatchVendorIdRequestBody struct {
	Name string `json:"name"`
}

func init() {
	walletRegex = regexp.MustCompile("^[0-9A-Fa-f]{40}$");
	uuidRegex = regexp.MustCompile("^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$");
	dbAddress = os.Getenv("DB_ADDRESS")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	dbCredentials := shared.GetDBCredentials()
	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password
	magicClient = shared.InitializeMagicClient()

	u := &url.URL{
        Scheme: "postgres",
        User:   url.UserPassword(dbUser, dbPassword),
        Host:   fmt.Sprintf("%s:%s", dbAddress, dbPort),
        Path:   dbName,
    }
    q := u.Query()
    q.Set("sslmode", "require")
    u.RawQuery = q.Encode()
    connStr = u.String()
}

// This gets the current vendor's info based off the authorization token
func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       "Token Error",
		}, nil 
	}

	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to connect to the database",
		}, nil
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	vendor, err := queries.GetVendorByWallet(ctx, wallet)

	if err != nil {
		log.Printf("Failed to get vendor: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to get vendor",
		}, nil
	}

	responseBody, err := json.Marshal(vendor)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to marshal response",
		}, nil
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

// This takes in the auth token and the name of the vendor and creates a new vendor if it does not already exist
func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		log.Printf("Failed to unmarshal request body: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid request body",
		}, nil
	}
	if body.Name == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Name is required",
		}, nil
	}

	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       "Token Error",
		}, nil 
	}

	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to connect to the database",
		}, nil
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// ensure vendor does not already exist
	_, err = queries.GetVendorByWallet(ctx, wallet)
	if err == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 409,
			Body:       "Vendor already exists",
		}, nil
	}

	vendor, err := queries.CreateVendor(ctx, query.CreateVendorParams{wallet, body.Name})
	if err != nil {
		log.Printf("Failed to create vendor: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to create vendor",
		}, nil
	}

	responseBody, err := json.Marshal(vendor)

	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

// This updates the Name of the vendor
func handlePatch(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		log.Printf("Failed to unmarshal request body: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid request body",
		}, nil
	}
	if body.Name == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Name is required",
		}, nil
	}

	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       "Token Error",
		}, nil 
	}

	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to connect to the database",
		}, nil
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	_, err = queries.GetVendorByWallet(ctx, wallet)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 409,
			Body:       "Vendor doesn't exist",
		}, nil
	}

	vendor, err := queries.UpdateVendorName(ctx, query.UpdateVendorNameParams{wallet, body.Name})
	if err != nil {
		log.Printf("Failed to update vendor: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       "Failed to update vendor",
		}, nil
	}
	responseBody, err := json.Marshal(vendor)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
	} else if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
	} else if request.HTTPMethod == "PATCH" {
		return handlePatch(ctx, request)
	} else {
		return events.APIGatewayProxyResponse{
			StatusCode: 405,
			Body:       "Method Not Allowed",
		}, nil
	}
}

func main() {
	lambda.Start(Handler)
}

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

	"github.com/jackc/pgx/v5"

	"github.com/magiclabs/magic-admin-go/client"
	"github.com/magiclabs/magic-admin-go/token"

	"backend/query"
	"backend/shared"
)

var (
	walletRegex *regexp.Regexp
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
    // Grab and validate auth token
	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		
		body, _ := json.Marshal(map[string]string{"message": "Token Error"})
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // Grab wallet address from token
	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

    // Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)

		body, _ := json.Marshal(map[string]string{"message": "Failed to connect to the database."})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

    // get vendor
	vendor, err := queries.GetVendorByWallet(ctx, wallet)
	if err != nil {
		body, _ := json.Marshal(map[string]string{"message": "Vendor does not exist"})
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

	responseBody, err := json.Marshal(vendor)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Failed to marshal response"})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
	}, nil
}

// This takes in the auth token and the name of the vendor and creates a new vendor if it does not already exist
func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    // Grab and validate request body
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		log.Printf("Failed to unmarshal request body: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Invalid request body"})
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	if body.Name == "" {
		body, _ := json.Marshal(map[string]string{"message": "Name is required"})
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // Grab and validate auth token
	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		body, _ := json.Marshal(map[string]string{"message": "Token Error"})
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // Grab wallet address from token
	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

    // Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Failed to connect to the database"})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// ensure vendor does not already exist
	_, err = queries.GetVendorByWallet(ctx, wallet)
	if err == nil {
		body, _ := json.Marshal(map[string]string{"message": "Vendor already exists"})
		return events.APIGatewayProxyResponse{
			StatusCode: 409,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // create vendor
	vendor, err := queries.CreateVendor(ctx, query.CreateVendorParams{wallet, body.Name})
	if err != nil {
		log.Printf("Failed to create vendor: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Failed to create vendor"})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

	responseBody, err := json.Marshal(vendor)

	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(responseBody),
		Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
	}, nil
}

// This updates the Name of the vendor
func handlePatch(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    // Grab and validate request body
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		log.Printf("Failed to unmarshal request body: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Invalid request body"})
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	if body.Name == "" {
		body, _ := json.Marshal(map[string]string{"message": "Name is required"})
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // Grab and validate auth token
	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	tk, err := token.NewToken(didToken)
	if err != nil {
		log.Printf("Error creating token object from DIDToken: %v\n", err.Error())
		body, _ := json.Marshal(map[string]string{"message": "Token error"})
		return events.APIGatewayProxyResponse{
			StatusCode: 401,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // Grab wallet address from token
	wallet, err := tk.GetPublicAddress()
	wallet = strings.TrimPrefix(wallet, "0x")

    // Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Printf("Failed to connect to the database: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Failed to connect to the database"})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

    // ensure vendor exists
	_, err = queries.GetVendorByWallet(ctx, wallet)
	if err != nil {
		body, _ := json.Marshal(map[string]string{"message": "Vendor does not exist. Use POST"})
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}

    // update vendor
	vendor, err := queries.UpdateVendorName(ctx, query.UpdateVendorNameParams{wallet, body.Name})
	if err != nil {
		log.Printf("Failed to update vendor: %v", err)
		body, _ := json.Marshal(map[string]string{"message": "Failed to update vendor"})
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil 
	}
	responseBody, err := json.Marshal(vendor)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
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
		body, _ := json.Marshal(map[string]string{"message": "Method Not Allowed."})
		return events.APIGatewayProxyResponse{
			StatusCode: 405,
			Body:       string(body),
			Headers: shared.GetResponseHeaders(request.Headers["Origin"]),
		}, nil
	}
}

func main() {
	lambda.Start(Handler)
}

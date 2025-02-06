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

	"github.com/google/uuid"

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

type GetVendorIdRequestBody struct {
	Uuid string `json:"uuid"`
	Wallet string `json:"wallet"`
}
type PostVendorIdRequestBody struct {
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

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body GetVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		log.Printf("Failed to unmarshal request body: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid request body",
		}, nil
	}

	if body.Uuid == "" && body.Wallet == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Either uuid or wallet must be provided",
		}, nil
	}

	uuidOk := false
	walletOk := false
	var parsedUuid uuid.UUID

	if body.Uuid != "" && uuidRegex.MatchString(body.Uuid) {
		uuidOk = true
		parsedUuid, err = uuid.Parse(body.Uuid)
		if err != nil {
			log.Printf("Failed to parse UUID: %v", err)
			return events.APIGatewayProxyResponse{
				StatusCode: 400,
				Body:       "Invalid UUID format",
			}, nil
		}
	}
	if body.Wallet != "" && walletRegex.MatchString(body.Wallet) {
		walletOk = true
	}

	if !uuidOk && !walletOk {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       "Invalid uuid or wallet",
		}, nil
	}

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

	var vendor query.AppVendor

	if uuidOk {
		vendor, err = queries.GetVendorByUuid(ctx, parsedUuid)
	} else {
		vendor, err = queries.GetVendorByWallet(ctx, body.Wallet)
	}

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

func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body PostVendorIdRequestBody
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

	log.Printf("Wallet: %v", wallet)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       "Not implemented",
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
	} else if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
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

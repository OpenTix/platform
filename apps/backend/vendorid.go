package main

import (
	"context"
	"encoding/json"

	"regexp"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"

	"backend/query"
	"backend/shared"
)

var (
	walletRegex *regexp.Regexp
	connStr     string
)

type PostPatchVendorIdRequestBody struct {
	Name string `json:"name"`
}

func init() {
	walletRegex = regexp.MustCompile("^[0-9A-Fa-f]{40}$")
	connStr = shared.InitLambda()
}

// This gets the current vendor's info based off the authorization token
func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object", request.Headers, err)
	}

	// Grab wallet address from token
	userinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// get vendor
	vendor, err := queries.GetVendorByWallet(ctx, userinfo.Wallet)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
	}

	responseBody, err := json.Marshal(vendor)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

// This takes in the auth token and the name of the vendor and creates a new vendor if it does not already exist
func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab and validate request body
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		return shared.CreateErrorResponse(400, "Invalid request body", request.Headers)
	}
	if body.Name == "" {
		return shared.CreateErrorResponse(400, "Name is required", request.Headers)
	}

	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object", request.Headers, err)
	}

	// Grab wallet address from token
	userinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// ensure vendor does not already exist
	_, err = queries.GetVendorByWallet(ctx, userinfo.Wallet)
	if err == nil {
		return shared.CreateErrorResponse(409, "Vendor already exists", request.Headers)
	}

	// create vendor
	u, err := uuid.Parse(userinfo.UUID)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to parse UUID", request.Headers, err)
	}
	vendor, err := queries.CreateVendorWithUUID(ctx, query.CreateVendorWithUUIDParams{ID: u, Wallet: userinfo.Wallet, Name: body.Name})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to create vendor", request.Headers, err)
	}

	responseBody, err := json.Marshal(vendor)

	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(responseBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

// This updates the Name of the vendor
func handlePatch(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab and validate request body
	var body PostPatchVendorIdRequestBody
	err := json.Unmarshal([]byte(request.Body), &body)
	if err != nil {
		return shared.CreateErrorResponse(400, "Invalid request body", request.Headers)
	}
	if body.Name == "" {
		return shared.CreateErrorResponse(400, "Name is required", request.Headers)
	}

	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object", request.Headers, err)
	}

	// Grab wallet address from token
	userinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// ensure vendor exists
	_, err = queries.GetVendorByWallet(ctx, userinfo.Wallet)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist. Use POST", request.Headers)
	}

	// update vendor
	vendor, err := queries.UpdateVendorName(ctx, query.UpdateVendorNameParams{Wallet: userinfo.Wallet, Name: body.Name})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to update vendor", request.Headers, err)
	}
	responseBody, err := json.Marshal(vendor)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
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
			Headers:    shared.GetResponseHeaders(request.Headers),
		}, nil
	}
}

func main() {
	lambda.Start(Handler)
}

package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5"
)

var connStr string

func init() {
	connStr = shared.InitLambda()
}

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object from DIDToken", request.Headers, err)
	}

	// Grab vendor information from token
	vendorinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	tmp, ok := request.QueryStringParameters["page"]
	var page int32
	if !ok {
		page = 1
	} else {
		p, err := strconv.ParseInt(tmp, 10, 32)
		page = int32(p)
		if err != nil {
			page = 1
		}
	}

	tmp, ok = request.QueryStringParameters["venue"]
	var venue int32
	if !ok {
		venue = -1
	} else {
		p, err := strconv.ParseInt(tmp, 10, 32)
		venue = int32(p)
		if err != nil {
			venue = -1
		}
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	// Get events for current page
	queries := query.New(conn)
	dbResponse, err := queries.VendorGetEventsPaginated(ctx, query.VendorGetEventsPaginatedParams{
		Column1: page,
		Wallet:  vendorinfo.Wallet,
		Column3: venue,
	})

	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Could not retrieve from the database", request.Headers, err)
	}

	responseBody, err := json.Marshal(dbResponse)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
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

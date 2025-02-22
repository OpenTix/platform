package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var connStr string

// Type for POST request to unmarshal body
type VenuePostBodyParams struct {
	Name        string `json:"name"`
	Streetaddr  string `json:"street_address"`
	Zip         string `json:"zip"`
	City        string `json:"city"`
	StateCode   string `json:"state_code"`
	StateName   string `json:"state_name"`
	CountryCode string `json:"country_code"`
	CountryName string `json:"country_name"`
	NumUnique   int32  `json:"num_unique"`
	NumGa       int32  `json:"num_ga"`
	Vendor      int32
}

func init() {
	connStr = shared.InitLambda()
}

func handleGetAll(ctx context.Context, request events.APIGatewayProxyRequest, vendorinfo shared.GetWalletAndUUIDFromTokenResponse) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	// Get all venues for the vendor
	dbResponse, err := queries.VendorGetAllVenues(ctx, vendorinfo.Wallet)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to get response from database or malformed query", request.Headers, err)
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

func handleGetByPk(ctx context.Context, request events.APIGatewayProxyRequest, pk int32, vendorinfo shared.GetWalletAndUUIDFromTokenResponse) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	// Get venue by pk
	dbResponse, err := queries.VendorGetVenueByPk(ctx, query.VendorGetVenueByPkParams{
		Pk:     pk,
		Wallet: vendorinfo.Wallet,
	})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to get response from database or malformed query", request.Headers, err)
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

func handleGetByUuid(ctx context.Context, request events.APIGatewayProxyRequest, id string, vendorinfo shared.GetWalletAndUUIDFromTokenResponse) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	u, err := uuid.Parse(id)
	if err != nil {
		return shared.CreateErrorResponse(400, "Invalid uuid", request.Headers)
	}
	// Get venue by uuid
	dbResponse, err := queries.VendorGetVenueByUuid(ctx, query.VendorGetVenueByUuidParams{
		ID: u,
		Wallet: vendorinfo.Wallet,
	})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to get response from database or malformed query", request.Headers, err)
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


func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object from DIDToken", request.Headers, err)
	}

	// Grab wallet address from token
	vendorinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	/* ---- Breakaway for different queries based on input params ---- */
	tmp, ok := request.QueryStringParameters["all"]
	if ok && tmp == "true" {
		return handleGetAll(ctx, request, vendorinfo)
	}

	tmp, ok = request.QueryStringParameters["pk"]
	if ok {
		pk, err := strconv.ParseInt(tmp, 10, 32)
		if err != nil {
			return shared.CreateErrorResponse(400, "Invalid pk", request.Headers)
		}
		return handleGetByPk(ctx, request, int32(pk), vendorinfo)
	}

	tmp, ok = request.QueryStringParameters["id"]
	if ok {
		return handleGetByUuid(ctx, request, tmp, vendorinfo)
	}
	/* ---- End ---- */

	// Return all venues as paginated response

	// Get query parameters and set defaults if not ok
	tmp, ok = request.QueryStringParameters["page"]
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

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	// Get events for current page
	dbResponse, err := queries.VendorGetVenuesPaginated(ctx, query.VendorGetVenuesPaginatedParams{
		Column1: page,
		Wallet:  vendorinfo.Wallet,
	})

	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to get response from database or malformed query", request.Headers, err)
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

func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object from DIDToken", request.Headers, err)
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

	resp, err := queries.GetVendorByWallet(ctx, userinfo.Wallet)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
	}
	vendor := resp.Pk

	var params VenuePostBodyParams = VenuePostBodyParams{
		Vendor: vendor, // We can set the vendor since we got it from the token
	}

	err = json.Unmarshal([]byte(request.Body), &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to unmarshal body params", request.Headers, fmt.Errorf("err = %v\nparams = %v\n", err, params))
	}

	// Insert the venue into the app.venue table
	dbResp, err := queries.CreateVenue(ctx, query.CreateVenueParams(params))
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to insert into table or malformed query", request.Headers, err)
	}

	responseBody, err := json.Marshal(dbResp)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
	}
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(responseBody),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
	} else if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
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

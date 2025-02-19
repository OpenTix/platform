package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var connStr string

// ISO 8601
const time_layout string = "2006-01-02T15:04:05.999Z"

type CreateEventPostBody struct {
	Vendor      int32
	Venue       int32   `json:"venue"`
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Time        string  `json:"event_datetime"`
	Description string  `json:"description"`
	Disclaimer  string  `json:"disclaimer"`
	Basecost    float64 `json:"basecost"`
	NumUnique   int32   `json:"num_unique"`
	NumGa       int32   `json:"num_ga"`
	Photo       string  `json:"photo"`
}

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

	// Get query parameters and set defaults if not ok
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
		return shared.CreateErrorResponseAndLogError(500, "Unable to get response from database or malformed query", request.Headers, err)
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

	// Grab vendor information from token
	vendorinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	var params CreateEventPostBody = CreateEventPostBody{
		Vendor:      -1,
		Venue:       -1,
		Name:        "",
		Type:        "",
		Time:        "",
		Description: "",
		Disclaimer:  "",
		Basecost:    0,
		NumUnique:   0,
		NumGa:       0,
		Photo:       "",
	}

	tmp, _ := json.Marshal(request.Body)
	err = json.Unmarshal(tmp, &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Could not get Body Params", request.Headers, err)
	}

	if params.Venue == -1 || params.Name == "" || params.Type == "" || params.Time == "" || params.Description == "" || params.Disclaimer == "" || params.Basecost == 0 || params.NumUnique == 0 || params.NumGa == 0 {
		return shared.CreateErrorResponseAndLogError(404, "One of the required fields is empty in body request", request.Headers, fmt.Errorf("params = %v\n", params))
	}

	// Parse the parameters that are not strings
	var tstamp pgtype.Timestamp
	var photo pgtype.Text
	var disclaimer pgtype.Text

	// Set time to a really low value to show all events if not provided
	tmps := strings.Trim(params.Time, "\x0d\x0a")
	t, err := time.Parse(time_layout, tmps)
	tstamp.Scan(t)
	if err != nil || !tstamp.Valid {
		return shared.CreateErrorResponseAndLogError(404, "Unable to parse timestamp for event_datetime", request.Headers, err)
	}

	if photo.Scan(params.Photo) != nil || disclaimer.Scan(params.Disclaimer) != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to parse photo or disclaimer", request.Headers, err)
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	resp, err := queries.GetVendorByWallet(ctx, vendorinfo.Wallet)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
	}
	vendor := resp.Pk

	dbVendor, err := queries.CheckVenueVendorStatus(ctx, vendor)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
	}

	if dbVendor != vendor {
		return shared.CreateErrorResponse(401, "You are not authorized to create an event for that venue", request.Headers)
	}

	// Get events for current page
	dbResponse, err := queries.CreateEvent(ctx, query.CreateEventParams{
		Vendor:        vendor,
		Venue:         params.Venue,
		Name:          params.Name,
		Type:          params.Type,
		EventDatetime: tstamp,
		Description:   params.Description,
		Disclaimer:    disclaimer,
		Basecost:      params.Basecost,
		NumUnique:     params.NumUnique,
		NumGa:         params.NumGa,
		Photo:         photo,
	})

	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Unable to get response from database or malformed query", request.Headers, err)
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

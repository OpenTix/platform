package main

import (
	"api/query"
	"api/shared"
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

var connStr string

// ISO 8601
const time_layout string = "2006-01-02T15:04:05.999Z"

type EventPostBodyParams struct {
	Vendor      int32
	Venue       int32   `json:"Venue"`
	Name        string  `json:"Name"`
	Type        string  `json:"Type"`
	Time        string  `json:"EventDatetime"`
	Description string  `json:"Description"`
	Disclaimer  string  `json:"Disclaimer"`
	Basecost    float64 `json:"Basecost"`
	NumUnique   int32   `json:"NumUnique"`
	NumGa       int32   `json:"NumGa"`
}

type EventPatchBodyParams struct {
	Pk              int32  `json:"Pk"`
	Venue           int32  `json:"Venue"`
	Name            string `json:"Name"`
	Type            string `json:"Type"`
	Time            string `json:"EventDatetime"`
	Description     string `json:"Description"`
	Disclaimer      string `json:"Disclaimer"`
	Photo           string `json:"Photo"`
	TransactionHash string `json:"TransactionHash"`
}

func init() {
	connStr = shared.BuildDatabaseConnectionString()
}

func handleGetByPk(ctx context.Context, request events.APIGatewayProxyRequest, pk int32, vendorinfo shared.GetWalletAndUUIDFromTokenResponse) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := shared.ConnectToDatabase(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	// Get events for current page
	dbResponse, err := queries.VendorGetEventByPk(ctx, query.VendorGetEventByPkParams{
		Pk:     pk,
		Wallet: vendorinfo.Wallet,
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

func handleGetByUuid(ctx context.Context, request events.APIGatewayProxyRequest, id string, vendorinfo shared.GetWalletAndUUIDFromTokenResponse) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := shared.ConnectToDatabase(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	queries := query.New(conn)

	u, err := uuid.Parse(id)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(400, "Invalid UUID", request.Headers, err)
	}

	// Get events for current page
	dbResponse, err := queries.VendorGetEventByUuid(ctx, query.VendorGetEventByUuidParams{
		ID:     u,
		Wallet: vendorinfo.Wallet,
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

	/* ---- Breakaway for different queries based on input params ---- */
	tmp, ok := request.QueryStringParameters["Pk"]
	if ok {
		pk, err := strconv.ParseInt(tmp, 10, 32)
		if err != nil {
			return shared.CreateErrorResponse(400, "Invalid pk", request.Headers)
		}
		return handleGetByPk(ctx, request, int32(pk), vendorinfo)
	}

	tmp, ok = request.QueryStringParameters["ID"]
	if ok {
		return handleGetByUuid(ctx, request, tmp, vendorinfo)
	}

	/* ---- End ---- */

	// Return all events as paginated response

	tmp, ok = request.QueryStringParameters["EventDatetime"]
	var tstamp pgtype.Timestamp
	// Set time to a really low value to show all events if not provided
	if !ok || tmp == "" {
		tstamp.Scan(time.Time{})
	} else {
		tmp_time := strings.Trim(tmp, "\x0d\x0a")
		t, err := time.Parse(time_layout, tmp_time)
		tstamp.Scan(t)
		if err != nil || !tstamp.Valid {
			tstamp.Scan(time.Time{})
		}
	}

	var filter string = ""
	tmp, ok = request.QueryStringParameters["Filter"]
	if ok && tmp != "" {
		filter = tmp
	}

	// Get query parameters and set defaults if not ok
	tmp, ok = request.QueryStringParameters["Page"]
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

	tmp, ok = request.QueryStringParameters["Venue"]
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
	conn, err := shared.ConnectToDatabase(ctx, connStr)
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
		Column4: tstamp,
		Column5: strings.ToLower(filter),
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

	var params EventPostBodyParams = EventPostBodyParams{
		Vendor:      -1,
		Venue:       -1,
		Name:        "",
		Type:        "",
		Time:        "",
		Description: "",
		Disclaimer:  "",
		Basecost:    -1,
		NumUnique:   -1,
		NumGa:       -1,
	}

	err = json.Unmarshal([]byte(request.Body), &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Could not get Body Params", request.Headers, err)
	}

	if params.Venue == -1 || params.Name == "" || params.Type == "" || params.Time == "" || params.Description == "" || params.Disclaimer == "" || params.Basecost == -1 || params.NumUnique == -1 || params.NumGa == -1 {
		return shared.CreateErrorResponseAndLogError(404, "One of the required fields is empty in body request", request.Headers, fmt.Errorf("params = %v\n", params))
	}

	// Parse the parameters that are not strings
	var tstamp pgtype.Timestamp
	var disclaimer pgtype.Text

	// Set time to a really low value to show all events if not provided
	tmps := strings.Trim(params.Time, "\x0d\x0a")
	t, err := time.Parse(time_layout, tmps)
	tstamp.Scan(t)
	if err != nil || !tstamp.Valid {
		return shared.CreateErrorResponseAndLogError(404, "Unable to parse timestamp for event_datetime", request.Headers, err)
	}

	if disclaimer.Scan(params.Disclaimer) != nil {
		return shared.CreateErrorResponseAndLogError(404, "Unable to parse photo or disclaimer", request.Headers, err)
	}

	// Connect to the database
	conn, err := shared.ConnectToDatabase(ctx, connStr)
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

	dbVendor, err := queries.CheckVenueVendorStatus(ctx, params.Venue)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
	}

	if dbVendor != vendor {
		return shared.CreateErrorResponse(401, "You are not authorized to create an event for that venue", request.Headers)
	}

	dbVenue, err := queries.VendorGetVenueByPk(ctx, query.VendorGetVenueByPkParams{
		Pk:     params.Venue,
		Wallet: vendorinfo.Wallet,
	})
	if err != nil {
		return shared.CreateErrorResponse(500, "Error retrieving venue from database.", request.Headers)
	}
	if (dbVenue.NumGa < params.NumGa) || (dbVenue.NumUnique < params.NumUnique) {
		return shared.CreateErrorResponse(400, "Number of tickets exceeds venue capacity.", request.Headers)
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

func handlePatch(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	// Unmarshal body into EventPatchBodyParams
	var params EventPatchBodyParams
	err = json.Unmarshal([]byte(request.Body), &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(400, "Invalid body parameters", request.Headers, err)
	}

	// Connect to the database
	conn, err := shared.ConnectToDatabase(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	// Process timestamp conversion for Column5.
	var eventTime pgtype.Timestamp
	if params.Time != "" {
		tmps := strings.Trim(params.Time, "\x0d\x0a")
		t, err := time.Parse(time_layout, tmps)
		eventTime.Scan(t)
		if err != nil || !eventTime.Valid {
			return shared.CreateErrorResponseAndLogError(404, "Unable to parse timestamp for event_datetime", request.Headers, err)
		}

	}

	// Non-editable: Pk, ID, Vendor, NumUnique, NumGa.
	arg := query.VendorPatchEventParams{
		Pk:      params.Pk,
		Wallet:  vendorinfo.Wallet,
		Column3: params.Name,
		Column4: params.Type,
		Column5: eventTime,
		Column6: params.Description,
		Column7: params.Disclaimer,
		Column8: params.Photo,
		Column9: params.TransactionHash,
	}

	updatedVenue, err := queries.VendorPatchEvent(ctx, arg)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Failed to update venue", request.Headers, err)
	}

	responseBody, err := json.Marshal(updatedVenue)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to marshal updated venue", request.Headers, err)
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
	} else if request.HTTPMethod == "PATCH" {
		return handlePatch(ctx, request)
	} else {
		return shared.CreateErrorResponse(405, "Method Not Allowed", request.Headers)
	}
}

func main() {
	lambda.Start(Handler)
}

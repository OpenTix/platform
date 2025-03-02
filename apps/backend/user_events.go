package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var connStr string

// ISO 8601
const time_layout string = "2006-01-02T15:04:05.999Z"

// Type for unmarshalling query params
type eventGetQueryParams struct {
	PageNum string `json:"Page"`
	ZipCode string `json:"Zip"`
	Name    string `json:"Name"`
	Type    string `json:"Type"`
	Cost    string `json:"Basecost"`
	Time    string `json:"EventDatetime"`
}

func init() {
	connStr = shared.InitLambda()
}

func handleGetByUuid(ctx context.Context, request events.APIGatewayProxyRequest, id string) (events.APIGatewayProxyResponse, error) {
	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
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
	dbResponse, err := queries.UserGetEventByUuid(ctx, u)
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
	tmpid, ok := request.QueryStringParameters["ID"]
	if ok {
		return handleGetByUuid(ctx, request, tmpid)
	}
	// Set default parameters
	var params eventGetQueryParams = eventGetQueryParams{
		PageNum: "",
		ZipCode: "",
		Name:    "",
		Type:    "",
		Cost:    "",
		Time:    "",
	}

	// Easiest way to get query parameters out
	tmp, _ := json.Marshal(request.QueryStringParameters)
	err := json.Unmarshal(tmp, &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(404, "Could not get Query Params", request.Headers, err)
	}

	// Parse the parameters that are not strings
	var tstamp pgtype.Timestamp
	var page int32
	var cost float64

	// Set time to a really low value to show all events if not provided
	if params.Time == "" {
		tstamp.Scan(time.Time{})
	} else {
		tmp := strings.Trim(params.Time, "\x0d\x0a")
		t, err := time.Parse(time_layout, tmp)
		tstamp.Scan(t)
		if err != nil || !tstamp.Valid {
			tstamp.Scan(time.Time{})
		}
	}

	// Default to page 1
	if params.PageNum == "" {
		page = 1
	} else {
		p, err := strconv.ParseInt(params.PageNum, 10, 32)
		page = int32(p)
		if err != nil {
			page = 1
		}
	}

	// Set cost to a large number so that all events will be displayed if not provided
	if params.Cost == "" {
		cost = 10000000000.0
	} else {
		cost, err = strconv.ParseFloat(params.Cost, 64)
		if err != nil {
			cost = 10000000000.0
		}
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	// Get events for specified page
	queries := query.New(conn)
	dbResponse, err := queries.UserGetEventsPaginated(ctx, query.UserGetEventsPaginatedParams{
		Column1: page,
		Column2: params.ZipCode,
		Column3: params.Name,
		Column4: params.Type,
		Column5: cost,
		Column6: tstamp,
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

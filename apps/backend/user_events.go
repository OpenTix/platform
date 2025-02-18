package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"log"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var connStr string

const time_layout string = "2006-01-02T15:04:05.999999999"

type eventGetQueryParams struct {
	PageNum string `json:"page"`
	ZipCode string `json:"zip"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	Cost    string `json:"basecost"`
	Time    string `json:"event_datetime"`
}

func init() {
	connStr = shared.InitLambda()
}

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var params eventGetQueryParams = eventGetQueryParams{
		PageNum: "",
		ZipCode: "",
		Name:    "",
		Type:    "",
		Cost:    "",
		Time:    "",
	}

	tmp, _ := json.Marshal(request.QueryStringParameters)
	log.Printf("tmp = %v\nquerystringparams = %v\n", tmp, request.QueryStringParameters)
	err := json.Unmarshal(tmp, &params)
	if err != nil {
		log.Printf("err = %v\n", err)
		return shared.CreateErrorResponse(404, "Could not get Query Params", request.Headers)
	}

	var tstamp pgtype.Timestamp
	var page int32
	var cost float64

	if params.Time == "" {
		tstamp.Scan(time.Time{})
	} else {
		t, err := time.Parse(time_layout, params.Time)
		if err != nil {
			tstamp.Scan(time.Time{})
		} else {
			err = tstamp.Scan(t.Format(time.RFC3339))
			if err != nil || !tstamp.Valid {
				tstamp.Scan(time.Time{})
			}
		}

	}
	if params.PageNum == "" {
		page = 1
	} else {
		p, err := strconv.ParseInt(params.PageNum, 10, 32)
		page = int32(p)
		if err != nil {
			page = 1
		}
	}
	if params.Cost == "" {
		cost = 10000000000.0
	} else {
		cost, err = strconv.ParseFloat(params.Cost, 64)
		if err != nil {
			cost = 10000000000.0
		}
	}
	// tstamp.Scan(time.Time{})

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	// Get events for current page
	queries := query.New(conn)
	dbResponse, err := queries.UserGetEventsPaginated(ctx, query.UserGetEventsPaginatedParams{
		Column1: page,
		Column2: params.ZipCode,
		Column3: params.Name,
		Column4: params.Type,
		Column5: cost,
		Column6: tstamp,
	})

	log.Printf("page = %d\nzip = %s\nname = %s\ntype = %s\ncost = %f\ntime = %v", page, params.ZipCode, params.Name, params.Type, cost, tstamp)
	log.Printf("err = %v\nresponse = %v\n", err, dbResponse)
	if err != nil {
		return shared.CreateErrorResponse(404, "This is fuck up lol", request.Headers)
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

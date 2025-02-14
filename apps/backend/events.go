package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5"
	"github.com/magiclabs/magic-admin-go/client"
)

var (
	connStr     string
	magicClient *client.API
)

type eventGetQueryParams struct {
	PageNum int32     `json:"page"`
	ZipCode string    `json:"zip"`
	Name    string    `json:"name"`
	Type    string    `json:"type"`
	Cost    float64   `json:"basecost"`
	Time    time.Time `json:"event_datetime"`
}

func init() {
	connStr, magicClient = shared.InitLambda()
}

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Grab auth token
	// tk, err := shared.GetTokenFromRequest(request)
	// if err != nil {
	// 	return shared.CreateErrorResponseAndLogError(401, "Error creating token object from DIDToken", request.Headers, err)
	// }

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)

	var params eventGetQueryParams = eventGetQueryParams{
		PageNum: 1,
		ZipCode: "",
		Name:    "",
		Type:    "",
		Cost:    0.0,
		Time:    time.Time{},
	}
	tmp, _ := json.Marshal(request.QueryStringParameters)
	err = json.Unmarshal(tmp, &params)
	if err != nil {
		log.Printf("err = %v\n", err)
		// return shared.CreateErrorResponse(404, "Could not get Query Params", request.Headers)
	}

	// Get events for current page
	queries := query.New(conn)
	dbResponse, err := queries.GetEventsPaginated(ctx, query.GetEventsPaginatedParams{
		Column1: params.PageNum,
		Column2: params.ZipCode,
		Column3: params.Name,
		Column4: params.Type,
		Column5: params.Cost,
		Column6: params.Time.Format(time.RFC3339),
	})
	log.Printf("err = %v\nresponse = %v\n", err, dbResponse)
	log.Printf("headers = %v\n", request.Headers)
	if err != nil {
		return shared.CreateErrorResponse(404, "Vendor does not exist", request.Headers)
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

package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"

	"github.com/opentix/platform/apps/api/shared"
	"github.com/opentix/platform/packages/gohelpers/packages/database"
	"github.com/opentix/platform/packages/gohelpers/packages/query"
)

var connStr string


type TicketCreatePostBodyParams struct {
	Event string `json:"Event"`
	Contract string `json:"Contract"`
	TicketMin int `json:"TicketMin"`
	TicketMax int `json:"TicketMax"`
}

func init() {
	connStr = database.BuildDatabaseConnectionString()
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

	var params = TicketCreatePostBodyParams{
		Event: "",
		Contract: "",
		TicketMin: -1,
		TicketMax: -1,
	}

	err = json.Unmarshal([]byte(request.Body), &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(400, "Error parsing request body", request.Headers, err)
	}
	if params.Event == "" || params.Contract == "" || params.TicketMin == -1 || params.TicketMax == -1 {
		return shared.CreateErrorResponse(400, "Missing required parameters", request.Headers)
	}

	conn, err := database.ConnectToDatabase(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Error connecting to database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	// Check if the vendor is the owner of the event
	u, err := uuid.Parse(params.Event)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(400, "Error parsing UUID", request.Headers, err)
	}
	event, err := queries.VendorGetEventByUuid(ctx, query.VendorGetEventByUuidParams{Wallet: vendorinfo.Wallet, ID: u})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Error querying database or vendor does not own event.", request.Headers, err)
	}
	if event.ID == uuid.Nil {
		return shared.CreateErrorResponse(403, "Vendor does not own event", request.Headers)
	}

	for i := params.TicketMin; i <= params.TicketMax; i++ {
		// Create ticket
		_, err = queries.AddTicket(ctx, query.AddTicketParams{
			Event: event.Pk,
			TicketID: int32(i),
			Contract: params.Contract,
		})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Error creating ticket", request.Headers, err)
		}
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
	} else {
		return shared.CreateErrorResponse(405, "Method Not Allowed", request.Headers)
	}
}

func main() {
	lambda.Start(Handler)
}

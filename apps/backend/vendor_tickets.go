package main

import (
	"backend/query"
	"backend/shared"
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
)

var connStr string


type TicketCheckBodyParams struct {
	Event string `json:"Event"`
	TicketID int `json:"TicketID"`
}

func init() {
	connStr = shared.BuildDatabaseConnectionString()
}

func handlePatch(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	var params = TicketCheckBodyParams{
		Event: "",
		TicketID: -1,
	}

	err = json.Unmarshal([]byte(request.Body), &params)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(400, "Error parsing request body", request.Headers, err)
	}
	if params.Event == "" || params.TicketID == -1 {
		return shared.CreateErrorResponse(400, "Missing required parameters", request.Headers)
	}

	conn, err := shared.ConnectToDatabase(ctx, connStr)
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
	event, err := queries.VendorGetEventByUuid(ctx, query.VendorGetEventByUuidParams{Wallet: vendorinfo.UUID, ID: u})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Error querying database or vendor does not own event.", request.Headers, err)
	}
	if event.ID == uuid.Nil {
		return shared.CreateErrorResponse(403, "Vendor does not own event", request.Headers)
	}

	ticket, err := queries.GetTicket(ctx, query.GetTicketParams{
		TicketID: int32(params.TicketID),
		Event: event.Pk,
	})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Error querying database or ticket doesn't exist", request.Headers, err)
	}
	if ticket.Pk == 0 {
		return shared.CreateErrorResponse(404, "Ticket does not exist", request.Headers)
	}

	if ticket.CheckedIn {
		return shared.CreateErrorResponse(400, "Ticket already checked in", request.Headers)
	}

	_, err = queries.UpdateCheckin(ctx, query.UpdateCheckinParams{
		Pk: ticket.Pk,
		CheckedIn: true,
	})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Error updating ticket", request.Headers, err)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "PATCH" {
		return handlePatch(ctx, request)
	} else {
		return shared.CreateErrorResponse(405, "Method Not Allowed", request.Headers)
	}
}

func main() {
	lambda.Start(Handler)
}

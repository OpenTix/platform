package main

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/ethereum/go-ethereum/log"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/opentix/platform/packages/gohelpers/packages/database"
	"github.com/opentix/platform/packages/gohelpers/packages/query"
)

type TicketCreateSNSMessageBody struct {
	Event string `json:"Event"`
	Contract string `json:"Contract"`
	TicketMin int `json:"TicketMin"`
	TicketMax int `json:"TicketMax"`
}

var connStr string

func init() {
	connStr = database.BuildDatabaseConnectionString()
}

func HandleSQSEvent(ctx context.Context, sqsEvent events.SQSEvent) error {
	// log the event
	conn, err := database.ConnectToDatabase(ctx, connStr)
	if err != nil {
		log.Error("Error connecting to database: ", err)
		return err
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	for _, record := range sqsEvent.Records {
		var message TicketCreateSNSMessageBody
		err := json.Unmarshal([]byte(record.Body), &message)
		if err != nil {
			log.Error("Error unmarshalling SNS message: ", err)
			continue
		}
		
		// get event from database, make sure it exists
		eventUUID, err := uuid.Parse(message.Event)
		if err != nil {
			log.Error("Error parsing event UUID: ", err)
			continue
		}
		event, err := queries.GetEventByUuid(ctx, eventUUID)
		if err != nil {
			log.Error("Error getting event from database: ", err)
			continue
		}
		if event.ID == uuid.Nil {
			log.Error("Event not found in database: ", message.Event)
			continue
		}

		for i := message.TicketMin; i <= message.TicketMax; i++ {
			// check if ticket is already in the database
			_, err := queries.GetTicket(ctx, query.GetTicketParams{
				Event: event.Pk, 
				TicketID: int32(i),
			})
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					// Ticket does not exist
					_, err = queries.AddTicket(ctx, query.AddTicketParams{
						Event: event.Pk,
						TicketID: int32(i),
						Contract: message.Contract,
					})
					if err != nil {
						log.Error("Error adding ticket to database: ", err)
						continue
					}
					log.Info("Ticket added to database: ", i)
				} else {
					log.Error("Error getting ticket from database: ", err)
					continue
				}
			} else {
				log.Info("Ticket already exists, skipping ticket ID: ", i)
				continue
			}
		}
	}
	return nil
}

func main() {
	lambda.Start(HandleSQSEvent)
}
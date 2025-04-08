package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/opentix/platform/packages/gohelpers/packages/database"
	"github.com/opentix/platform/packages/gohelpers/packages/query"
)

type SNSMessage struct {
	Type      string `json:"Type"`
	MessageId string `json:"MessageId"`
	TopicArn  string `json:"TopicArn"`
	Subject   string `json:"Subject"`
	Message   string `json:"Message"`
	Timestamp string `json:"Timestamp"`
}

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
		log.Fatalf("Error connecting to database: %v", err)
		return err
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	for _, record := range sqsEvent.Records {
		var snsMessage SNSMessage
		err := json.Unmarshal([]byte(record.Body), &snsMessage)
		if err != nil {
			log.Printf("Error unmarshalling SNS event: %v", err)
			continue
		}
		var message TicketCreateSNSMessageBody
		err = json.Unmarshal([]byte(snsMessage.Message), &message)
		if err != nil {
			log.Printf("Error unmarshalling SNS message: %v", err)
			continue
		}
		
		// get event from database, make sure it exists
		eventUUID, err := uuid.Parse(message.Event)
		if err != nil {
			log.Printf("Error parsing event UUID: %v", err)
			continue
		}
		event, err := queries.GetEventByUuid(ctx, eventUUID)
		if err != nil {
			log.Printf("Error getting event from database: %v", err)
			continue
		}
		if event.ID == uuid.Nil {
			log.Printf("Event not found in database:%v ", message.Event)
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
						log.Printf("Error adding ticket to database: %v", err)
						continue
					}
				} else {
					log.Printf("Error getting ticket from database: %v", err)
					continue
				}
			} else {
				log.Printf("Ticket already exists, skipping ticket ID: %v", i)
				continue
			}
		}
	}
	return nil
}

func main() {
	lambda.Start(HandleSQSEvent)
}
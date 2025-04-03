package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/opentix/platform/packages/gohelpers/packages/database"
)

var connStr string

func init() {
	connStr = database.BuildDatabaseConnectionString()
}

func HandleSQSEvent(ctx context.Context, sqsEvent events.SQSEvent) error {
	// log the event
	for _, record := range sqsEvent.Records {
		log.Println("Received message: ", record)
		log.Println("Message body: ", record.Body)
	}

	return nil
}

func main() {
	lambda.Start(HandleSQSEvent)
}
package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func HandleSQSEvent(ctx context.Context, sqsEvent events.SQSEvent) error {
    for _, record := range sqsEvent.Records {
        log.Printf("Received event: %+v", record)
    }
    return nil
}

func main() {
    lambda.Start(HandleSQSEvent)
}
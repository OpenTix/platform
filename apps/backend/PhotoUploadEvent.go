package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5"

	"backend/query"
	"backend/shared"
)

var connStr string

func init() {
	connStr = shared.InitLambda()
}

func HandleSQSEvent(ctx context.Context, sqsEvent events.SQSEvent) error {
	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		panic(err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)


	for _, record := range sqsEvent.Records {
		bs, err := json.Marshal(record)
		if err != nil {
			log.Printf("Error marshalling record: %v", err)
			continue
		}
		log.Printf("Received event: %v", string(bs))
	}
    return nil
}

func main() {
    lambda.Start(HandleSQSEvent)
}
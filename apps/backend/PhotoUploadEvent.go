package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	"backend/query"
	"backend/shared"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var connStr string
var PHOTO_BUCKET string

func init() {
	connStr = shared.InitLambda()
	PHOTO_BUCKET = os.Getenv("PHOTO_BUCKET")
	if PHOTO_BUCKET == "" {
		panic("PHOTO_BUCKET must be set")
	}
}

type SNSMessage struct {
	Type      string `json:"Type"`
	MessageId string `json:"MessageId"`
	TopicArn  string `json:"TopicArn"`
	Subject   string `json:"Subject"`
	Message   string `json:"Message"`
	Timestamp string `json:"Timestamp"`
}

type S3Event struct {
	Records []struct {
		EventVersion string `json:"eventVersion"`
		EventSource  string `json:"eventSource"`
		AwsRegion    string `json:"awsRegion"`
		EventTime    string `json:"eventTime"`
		EventName    string `json:"eventName"`
		S3           struct {
			Bucket struct {
				Name string `json:"name"`
			} `json:"bucket"`
			Object struct {
				Key string `json:"key"`
			} `json:"object"`
		} `json:"s3"`
	} `json:"Records"`
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

		// Unmarshal the SNS notification in record.Body.
		var snsMsg SNSMessage
		if err := json.Unmarshal([]byte(record.Body), &snsMsg); err != nil {
			log.Printf("Error unmarshalling SNS message: %v", err)
			continue
		}

		// Unmarshal the embedded S3 event
		var s3Evt S3Event
		if err := json.Unmarshal([]byte(snsMsg.Message), &s3Evt); err != nil {
			log.Printf("Error unmarshalling S3 event: %v", err)
			continue
		}

		// Loop through S3 records and extract the needed fields.
		for _, r := range s3Evt.Records {
			eventName := r.EventName
			bucketName := r.S3.Bucket.Name
			objectKey := r.S3.Object.Key
			permalink := "https://" + bucketName + ".s3.amazonaws.com/" + objectKey

			if eventName != "ObjectCreated:Put"  || bucketName != PHOTO_BUCKET {
				log.Printf("Skipping event: %s", eventName)
				continue
			}

			var imageType, uuid_string string
			// e.g. filename-venue/event-uuid.png
			parts := strings.SplitN(objectKey, "-", 2)
			if len(parts) == 3 {
				imageType = parts[1]
				uuid_string = parts[2]
			} else {
				log.Printf("Invalid object key: %s", objectKey)
				continue
			}

			if imageType != "event" && imageType != "venue" {
				log.Printf("Invalid image type: %s", imageType)
				continue
			}
			u, err := uuid.Parse(uuid_string)
			if err != nil {
				log.Printf("Invalid UUID: %s", uuid_string)
				continue
			}


			if imageType == "event" {
				_, err = queries.InsecureUpdateEventPhoto(ctx, query.InsecureUpdateEventPhotoParams{
					ID: u,
					Photo: pgtype.Text{
						String: permalink,
						Valid: true,
					},
				})
			} else {
				_, err = queries.InsecureUpdateVenuePhoto(ctx, query.InsecureUpdateVenuePhotoParams{
					ID: u,
					Photo: pgtype.Text{
						String: permalink,
						Valid: true,
					},
				})
			}
		}
	}
	return nil
}

func main() {
	lambda.Start(HandleSQSEvent)
}
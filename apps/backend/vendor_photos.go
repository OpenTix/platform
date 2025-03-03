package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/google/uuid"

	"github.com/jackc/pgx/v5"

	"backend/query"
	"backend/shared"
)

var connStr string
var BUCKET_NAME string

func init() {
	connStr = shared.InitLambda()
	BUCKET_NAME = os.Getenv("BUCKET_NAME")
	if BUCKET_NAME == "" {
		panic("BUCKET_NAME must be set")
	}
}

type PostVendorPhotoRequest struct {
	ImageType string `json:"ImageType"`
	RecordID  string    `json:"RecordID"`
	Filename string    `json:"Filename"`
}

type PostVendorPhotoResponse struct {
	Request v4.PresignedHTTPRequest
	ObjectKey string
}

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       "GET",
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	// Parse the request body.
	var req PostVendorPhotoRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return shared.CreateErrorResponse(400, "Invalid request body", request.Headers)
	}

	// Validate the request body.
	if req.ImageType == "" || req.RecordID == "" || req.Filename == "" {
		return shared.CreateErrorResponse(400, "Missing required fields", request.Headers)
	}

	if req.ImageType != "event" && req.ImageType != "venue" {
		return shared.CreateErrorResponse(400, "Invalid ImageType. event or venue needed.", request.Headers)
	}

	// Grab auth token
	tk, err := shared.GetTokenFromRequest(request)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error creating token object from DIDToken", request.Headers, err)
	}

	// Grab wallet address from token
	vendorinfo, err := shared.GetWalletAndUUIDFromToken(tk)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(401, "Error retrieving wallet from token", request.Headers, err)
	}

	// Connect to the database
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	recordUUID, err := uuid.Parse(req.RecordID)
	if err != nil {
		return shared.CreateErrorResponse(400, "Invalid RecordID", request.Headers)
	}

	// Check if the record exists
	// Check if the vendor is allowed to upload for this record
	// Check if the record does not already have a photo
	if req.ImageType == "event" {
		// Check if the event exists
		event, err := queries.VendorGetEventByUuid(ctx, query.VendorGetEventByUuidParams{Wallet: vendorinfo.Wallet, ID: recordUUID})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to get event. Event not found, or vendor is not allowed to modify this event.", request.Headers, err)
		}

		// Check if the event does not already have a photo
		if event.Photo.Valid == true {
			return shared.CreateErrorResponse(400, "Event already has a photo", request.Headers)
		}
	} else if req.ImageType == "venue" {
		// Check if the venue exists
		venue, err := queries.VendorGetVenueByUuid(ctx, query.VendorGetVenueByUuidParams{Wallet: vendorinfo.Wallet, ID: recordUUID})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to get venue. Venue not found, or vendor is not allowed to upload for this venue.", request.Headers, err)
		}

		// Check if the venue does not already have a photo
		if venue.Photo.Valid == true {
			return shared.CreateErrorResponse(400, "Venue already has a photo", request.Headers)
		}
	}

	// Set default content type.
	fileType := "application/octet-stream"

	// Determine the object key. If a fileName is provided, use it; otherwise, generate a UUID.
	objectKey := req.Filename + "-" + req.RecordID

	// Create an AWS session.
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500}, fmt.Errorf("failed to create session: %v", err)
	}

	// Generate a presigned URL valid for 15 minutes.
	svc := s3.NewFromConfig(cfg)
	input := s3.PutObjectInput{
		Bucket:      aws.String(BUCKET_NAME),
		Key:         aws.String(objectKey),
		ContentType: aws.String(fileType),
	}
	presigner := s3.NewPresignClient(svc)
	presignedURL, err := presigner.PresignPutObject(ctx, &input, s3.WithPresignExpires(15*time.Minute))	
	

	// Build the response.
	responseBody, err := json.Marshal(PostVendorPhotoResponse{
		Request: *presignedURL,
		ObjectKey: objectKey,
	})
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(responseBody),
		Headers: shared.GetResponseHeaders(request.Headers),
	}, nil
}


func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
	} else if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
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

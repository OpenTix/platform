package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/google/uuid"

	"github.com/opentix/platform/apps/api/shared"
	"github.com/opentix/platform/packages/gohelpers/packages/database"
	"github.com/opentix/platform/packages/gohelpers/packages/query"
)

var connStr string
var PHOTO_BUCKET string

func init() {
	connStr = database.BuildDatabaseConnectionString()
	PHOTO_BUCKET = os.Getenv("PHOTO_BUCKET")
	if PHOTO_BUCKET == "" {
		panic("PHOTO_BUCKET must be set")
	}
}

type PostVendorPhotoRequest struct {
	RecordID  string    `json:"ID"`
	Filename string    `json:"Filename"`
}

type PostVendorPhotoResponse struct {
	Request v4.PresignedHTTPRequest
	ObjectKey string
}

type DeleteVendorPhotoRequest struct {
	RecordID  string    `json:"ID"`
}

func handlePost(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	// Parse the request body.
	var req PostVendorPhotoRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return shared.CreateErrorResponse(400, "Invalid request body", request.Headers)
	}

	// Validate the request body.
	if req.RecordID == "" || req.Filename == "" {
		return shared.CreateErrorResponse(400, "Missing required fields", request.Headers)
	}

	var ImageType string
	if strings.Contains(request.Path, "events") {
		ImageType = "event"
	} else if strings.Contains(request.Path, "venues") {
		ImageType = "venue"
	} else {
		return shared.CreateErrorResponse(400, "Invalid path", request.Headers)
	}

	if ImageType != "event" && ImageType != "venue" {
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
	conn, err := database.ConnectToDatabase(ctx, connStr)
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
	if ImageType == "event" {
		// Check if the event exists
		event, err := queries.VendorGetEventByUuid(ctx, query.VendorGetEventByUuidParams{Wallet: vendorinfo.Wallet, ID: recordUUID})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to get event. Event not found, or vendor is not allowed to modify this event.", request.Headers, err)
		}

		// Check if the event does not already have a photo
		if event.Photo.Valid == true {
			return shared.CreateErrorResponse(400, "Event already has a photo", request.Headers)
		}
	} else if ImageType == "venue" {
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

	objectKey := req.Filename + "-" + ImageType + "-" +req.RecordID

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
		Bucket:      aws.String(PHOTO_BUCKET),
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

func handleDelete(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req DeleteVendorPhotoRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return shared.CreateErrorResponse(400, "Invalid request body", request.Headers)
	}

	if req.RecordID == "" {
		return shared.CreateErrorResponse(400, "Missing required fields", request.Headers)
	}

	recordUUID, err := uuid.Parse(req.RecordID)
	if err != nil {
		return shared.CreateErrorResponse(400, "Invalid RecordID", request.Headers)
	}

	var ImageType string
	if strings.Contains(request.Path, "events") {
		ImageType = "event"
	} else if strings.Contains(request.Path, "venues") {
		ImageType = "venue"
	} else {
		return shared.CreateErrorResponse(400, "Invalid path", request.Headers)
	}

	if ImageType != "event" && ImageType != "venue" {
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
	conn, err := database.ConnectToDatabase(ctx, connStr)
	if err != nil {
		return shared.CreateErrorResponseAndLogError(500, "Failed to connect to the database", request.Headers, err)
	}
	defer conn.Close(ctx)
	queries := query.New(conn)

	if ImageType == "event" {
		event, err := queries.VendorRemoveEventPhoto(ctx, query.VendorRemoveEventPhotoParams{Wallet: vendorinfo.Wallet, ID: recordUUID})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to remove event photo. Potentially, record does not exist or vendor is not authorized for this record.", request.Headers, err)
		}
		responseBody, err := json.Marshal(event)
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 202,
			Body:       string(responseBody),
			Headers: shared.GetResponseHeaders(request.Headers),
		}, nil
	} else {
		venue, err := queries.VendorRemoveVenuePhoto(ctx, query.VendorRemoveVenuePhotoParams{Wallet: vendorinfo.Wallet, ID: recordUUID})
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to remove venue photo. Potentially, record does not exist or vendor is not authorized for this record.", request.Headers, err)
		}
		responseBody, err := json.Marshal(venue)
		if err != nil {
			return shared.CreateErrorResponseAndLogError(500, "Failed to marshal response", request.Headers, err)
		}
		return events.APIGatewayProxyResponse{
			StatusCode: 202,
			Body:       string(responseBody),
			Headers: shared.GetResponseHeaders(request.Headers),
		}, nil
	}

}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "POST" {
		return handlePost(ctx, request)
	} else if request.HTTPMethod == "DELETE" {
		return handleDelete(ctx, request)
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

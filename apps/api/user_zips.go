package main

import (
	"api/shared"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handleGet(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var radius int64
	var latitude, longitude float64
	var err error
	tmp, ok := request.QueryStringParameters["Radius"]
	if ok {
		radius, err = strconv.ParseInt(tmp, 10, 64)
		if err != nil {
			radius = 10
		}
	} else {
		radius = 10
	}
	tmp, ok = request.QueryStringParameters["Latitude"]
	if ok {
		latitude, err = strconv.ParseFloat(tmp, 10)
		if err != nil {
			return shared.CreateErrorResponse(400, "Invalid latitude parameter", request.Headers)
		}
	} else {
		return shared.CreateErrorResponse(400, "Invalid latitude parameter", request.Headers)
	}
	tmp, ok = request.QueryStringParameters["Longitude"]
	if ok {
		longitude, err = strconv.ParseFloat(tmp, 10)
		if err != nil {
			return shared.CreateErrorResponse(400, "Invalid longitude parameter", request.Headers)
		}
	} else {
		return shared.CreateErrorResponse(400, "Invalid longitude parameter", request.Headers)
	}

	var requestURL = fmt.Sprintf("https://www.freemaptools.com/ajax/us/get-all-zip-codes-inside-radius.php?radius=%d&lat=%f&lng=%f&rn=2488&showPOboxes=true", radius, latitude, longitude)

	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return shared.CreateErrorResponse(500, "Could not create request to "+requestURL, request.Headers)
	}
	req.Header.Set("Referer", "https://www.freemaptools.com/find-zip-codes-inside-radius.htm")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	req.Header.Set("Authority", "www.freemaptools.com")
	req.Header.Set("Origin", "www.freemaptools.com")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return shared.CreateErrorResponse(500, "Unable to perform get request to "+requestURL, request.Headers)
	}
	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return shared.CreateErrorResponse(500, "Unable to read response body from "+requestURL, request.Headers)
	}

	var postcodes []int64
	for _, val := range strings.Split(strings.ReplaceAll(strings.ReplaceAll(string(resBody), "<postcodes>", ""), "<postcodes/>", ""), "<postcode") {
		if len(val) < 20 {
			continue
		}
		tmp, err := strconv.ParseInt(val[11:16], 10, 64)
		if err != nil {
			fmt.Println(val[11:16])
			continue
		}
		postcodes = append(postcodes, tmp)
	}

	if len(postcodes) > 3 {
		postcodes = postcodes[:3]
	}

	body, _ := json.Marshal(map[string][]int64{"postcodes": postcodes})
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
		Headers:    shared.GetResponseHeaders(request.Headers),
	}, nil
}

func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, request)
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

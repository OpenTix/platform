package shared

import (
	"regexp"
)

var allowedOriginPatterns = []*regexp.Regexp{
	regexp.MustCompile(`^https://opentix\.co/?$`),
	regexp.MustCompile(`^https://.+\.opentix\.co/?$`),
	regexp.MustCompile(`^http://localhost(:[0-9]+)?/?$`),
	regexp.MustCompile(`^http://127\.0\.0\.1(:[0-9]+)?/?$`),
}

var defaultOrigin = "https://opentix.co"

func GetResponseHeaders(headers map[string]string) map[string]string {
	responseHeaders := map[string]string{
		"Content-Type":                     "application/json",
		"Access-Control-Allow-Headers":     "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods":     "OPTIONS,GET,PUT,POST,PATCH",
	}

	origin := headers["Origin"]
	if origin == "" {
		origin = headers["origin"]
	}

	allowed := false
	for _, pattern := range allowedOriginPatterns {
		if pattern.MatchString(origin) {
			allowed = true
			break
		}
	}

	if allowed {
		responseHeaders["Access-Control-Allow-Origin"] = origin
	} else {
		responseHeaders["Access-Control-Allow-Origin"] = defaultOrigin
	}

	return responseHeaders
}

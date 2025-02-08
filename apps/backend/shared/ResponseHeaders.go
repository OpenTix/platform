package shared

import (
	"regexp"
)

var allowedOriginPatterns = []*regexp.Regexp{
    regexp.MustCompile(`^https://opentix\.co$`),
    regexp.MustCompile(`^https://.+\.opentix\.co$`),
    regexp.MustCompile(`^http://localhost:4200$`),
    regexp.MustCompile(`^http://127\.0\.0\.1:4200$`),
}

var defaultOrigin = "https://opentix.co"

func GetResponseHeaders(origin string) map[string]string {
    headers := map[string]string{
        "Content-Type":                    "application/json",
        "Access-Control-Allow-Headers":    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods":    "OPTIONS,GET,PUT,POST,PATCH",
    }

    allowed := false
    for _, pattern := range allowedOriginPatterns {
        if pattern.MatchString(origin) {
            allowed = true
            break
        }
    }

    if allowed {
        headers["Access-Control-Allow-Origin"] = origin
    } else {
        headers["Access-Control-Allow-Origin"] = defaultOrigin
    }

    return headers
}
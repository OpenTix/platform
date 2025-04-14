package times

import (
	"fmt"
	"strings"
	"time"
)

func NormalizeISO8601(input string) (string, error) {
	input = strings.TrimSpace(input)

	layouts := []string{
		time.RFC3339,             // complete ISO8601, e.g. "2020-12-31T23:59:59Z07:00"
		"2006-01-02T15:04:05",     // no timezone provided (assume UTC)
		"2006-01-02T15:04",        // no seconds, assume UTC
		"2006-01-02",             // only date; time defaults to midnight UTC
	}

	var t time.Time
	var err error
	for _, layout := range layouts {
		if layout == time.RFC3339 {
			t, err = time.Parse(layout, input)
		} else {
			t, err = time.ParseInLocation(layout, input, time.UTC)
		}
		if err == nil {
			return t.UTC().Format(time.RFC3339), nil
		}
	}
	return input, fmt.Errorf("Could not parse time string: %s", input)
}


func NormalizeISO8601Time(input time.Time) (string) {
	input = input.In(time.UTC)
	return input.Format(time.RFC3339)
}
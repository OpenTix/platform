package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

const time_layout string = "2006-01-02T15:04:05.999Z"

type CreateEventPostBody struct {
	Vendor      int32
	Venue       int32
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Time        string  `json:"event_datetime"`
	Description string  `json:"description"`
	Disclaimer  string  `json:"disclaimer"`
	Basecost    float64 `json:"basecost"`
	NumUnique   int32   `json:"num_unique"`
	NumGa       int32   `json:"num_ga"`
	Photo       string  `json:"photo"`
}

func main() {

	var tstamp pgtype.Timestamp

	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Enter text: ")
	text, _ := reader.ReadString('\n')
	fmt.Println(text)
	text = strings.Trim(text, "\x0d\x0a")

	if text == "" {
		tstamp.Scan(time.Time{})
	} else {
		t, err := time.Parse(time_layout, text)
		fmt.Println(t)
		fmt.Println(err)
		tstamp.Scan(t)
		fmt.Println(tstamp)
		if err != nil || !tstamp.Valid {
			tstamp.Scan(time.Time{})
		}
	}
	fmt.Printf("%v\n", tstamp)

	var params CreateEventPostBody = CreateEventPostBody{
		Vendor:      -1,
		Venue:       -1,
		Name:        "",
		Type:        "",
		Time:        "",
		Description: "",
		Disclaimer:  "",
		Basecost:    0,
		NumUnique:   0,
		NumGa:       0,
		Photo:       "",
	}

	fmt.Printf("%v\n", params)

	fmt.Print("Enter body:")
	text, _ = reader.ReadString('\n')
	fmt.Println(text)
	tmp, err := json.Marshal(text)
	if err != nil {
		fmt.Println("error occurred")
		os.Exit(1)
	}
	fmt.Println(tmp)
	json.Unmarshal(tmp, &params)
	fmt.Printf("%v\n", params)

}

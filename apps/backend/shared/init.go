package shared

import (
	"fmt"
	"net/url"
	"os"
)

func InitLambda() string {
	var (
		dbAddress  string
		dbPort     string
		dbUser     string
		dbPassword string
		dbName     string
		connStr    string
	)

	dbAddress = os.Getenv("DB_ADDRESS")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	dbCredentials := GetDBCredentials()
	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password

	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(dbUser, dbPassword),
		Host:   fmt.Sprintf("%s:%s", dbAddress, dbPort),
		Path:   dbName,
	}
	q := u.Query()
	q.Set("sslmode", "require")
	u.RawQuery = q.Encode()
	connStr = u.String()

	return connStr
}

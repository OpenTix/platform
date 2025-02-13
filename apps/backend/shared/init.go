package shared

import (
	"fmt"
	"net/url"
	"os"

	"github.com/magiclabs/magic-admin-go/client"
)

func InitLambda() (string, *client.API) {
	var (
		dbAddress   string
		dbPort      string
		dbUser      string
		dbPassword  string
		dbName      string
		connStr     string
		magicClient *client.API
	)

	dbAddress = os.Getenv("DB_ADDRESS")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	dbCredentials := GetDBCredentials()
	dbUser = dbCredentials.Username
	dbPassword = dbCredentials.Password
	magicClient = InitializeMagicClient()

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

	return connStr, magicClient
}

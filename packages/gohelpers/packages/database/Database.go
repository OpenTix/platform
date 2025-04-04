package database

import (
	"context"
	"fmt"
	"net/url"
	"os"

	"github.com/jackc/pgx/v5"
)

func BuildDatabaseConnectionString() string {
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

func ConnectToDatabase(ctx context.Context,connStr string) (*pgx.Conn, error) {
	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		connStr = BuildDatabaseConnectionString()
		conn, err = pgx.Connect(ctx, connStr)
		if err != nil {
			return nil, err
		}
	}
	return conn, nil
}
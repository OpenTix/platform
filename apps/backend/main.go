package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"

	// "github.com/aws/aws-lambda-go/lambda"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

var (
	endpoint = "localhost:8445" // To test, we will just connect it to a local nodde through hardhat for now
	// infuraAPIKey = "API_KEY"
	// endpoint = "https://mainnet.infura.io/v3/" + infuraAPIKey
)

type Order struct {
	OrderID string  `json:"order_id"`
	Amount  float64 `json:"amount"`
	Item    string  `json:"item"`
}

func handleRequest(event json.RawMessage) error {
	var order Order

	err := json.Unmarshal(event, &order)
	if err != nil {
		log.Printf("Failed to unmarshall event: %v", err)
		return err
	}

	log.Printf("The order was: %v", order)

	return nil
}

func generateWallet() error {
	priv, err := crypto.GenerateKey()
	if err != nil {
		return err
	}

	tmp_pub := priv.Public()
	pub, ok := tmp_pub.(*ecdsa.PublicKey)
	if !ok {
		return errors.New("key was not valid")
	}

	addr := crypto.PubkeyToAddress(*pub)

	log.Printf("Private key: %v\nPublic key: %v\nAddress: %v\n", hexutil.Encode(crypto.FromECDSA(priv)), hexutil.Encode(crypto.FromECDSAPub(pub)), addr)

	return nil
}

func Hello(name string) string {
	result := "Hello " + name
	return result
}

func main() {
	fmt.Println(Hello("backend"))

	// lambda.Start(handleRequest)

	err := generateWallet()
	if err != nil {
		os.Exit(1)
	}

	client, err := ethclient.Dial(endpoint)

	if err != nil {
		log.Println("No endpoint connection")
		return
	}

	id, err := client.ChainID(context.Background())

	if err != nil {
		log.Println("Was unable to retrieve chain ID")
	}

	fmt.Println("Chain id: ", id)
}

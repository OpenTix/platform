package shared

import (
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/magiclabs/magic-admin-go/token"
)

func GetTokenFromRequest(request events.APIGatewayProxyRequest) (*token.Token, error) {
	didToken := request.Headers["Authorization"]
	didToken = strings.TrimPrefix(didToken, "Bearer ")
	return token.NewToken(didToken)
}

func GetWalletFromToken(tk *token.Token) (string, error) {
	wallet, err := tk.GetPublicAddress()
	if err != nil {
		return "", err
	}
	return strings.TrimPrefix(wallet, "0x"), nil
}

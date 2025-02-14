package shared

import (
	"errors"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/golang-jwt/jwt/v4"
)

func GetTokenFromRequest(request events.APIGatewayProxyRequest) (*jwt.Token, error) {
	tk := request.Headers["Authorization"]
	tk = strings.TrimPrefix(tk, "Bearer ")
	return jwt.Parse(tk, nil)
}

type GetWalletAndUUIDFromTokenResponse struct {
	Wallet string
	UUID   string
}

func GetWalletAndUUIDFromToken(tk *jwt.Token) (GetWalletAndUUIDFromTokenResponse, error) {
	claims, ok := tk.Claims.(jwt.MapClaims)
	if !ok {
		return GetWalletAndUUIDFromTokenResponse{}, errors.New("failed to parse claims")
	}

	creds, ok := claims["verified_credentials"].([]interface{})
	if !ok {
		return GetWalletAndUUIDFromTokenResponse{}, errors.New("failed to parse verified_credentials from claims")
	}

	for _, cred := range creds {
		credMap, ok := cred.(map[string]interface{})
		if !ok {
			continue
		}

		format, ok := credMap["format"].(string)
		if !ok || format != "blockchain" {
			continue
		}

		wallet, ok := credMap["address"].(string)
		if !ok {
			return GetWalletAndUUIDFromTokenResponse{}, errors.New("failed to parse wallet address from verified_credentials")
		}

		uuid, ok := credMap["id"].(string)
		if !ok {
			return GetWalletAndUUIDFromTokenResponse{}, errors.New("failed to parse uuid from verified_credentials")
		}

		wallet = strings.TrimPrefix(wallet, "0x")
		return GetWalletAndUUIDFromTokenResponse{
			Wallet: wallet,
			UUID:   uuid,
		}, nil
	}
	return GetWalletAndUUIDFromTokenResponse{}, errors.New("blockchain credential not found")
}

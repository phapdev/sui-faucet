package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
    "time"
)

func requestSuiGas(address string) error {
    url := "https://faucet.testnet.sui.io/v1/gas"
    payload := strings.NewReader(fmt.Sprintf(`{"FixedAmountRequest": {"recipient": "%s"}}`, address))

    client := &http.Client{}
    req, err := http.NewRequest("POST", url, payload)
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }
    req.Header.Add("Content-Type", "application/json")

    res, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("failed to execute request: %w", err)
    }
    defer res.Body.Close()

    body, err := io.ReadAll(res.Body)
    if err != nil {
        return fmt.Errorf("failed to read response: %w", err)
    }
    fmt.Printf("[%s] SUI Gas faucet response: %s\n", time.Now().Format("2006-01-02 15:04:05"), string(body))
    return nil
}

func requestUSDC(address string) error {
    url := "https://faucet.circle.com/api/graphql"
    query := fmt.Sprintf(`{
        "operationName": "RequestToken",
        "variables": {
            "input": {
                "destinationAddress": "%s",
                "token": "USDC",
                "blockchain": "SUI"
            }
        },
        "query": "mutation RequestToken($input: RequestTokenInput!) {\n  requestToken(input: $input) {\n    ...RequestTokenResponseInfo\n    __typename\n  }\n}\n\nfragment RequestTokenResponseInfo on RequestTokenResponse {\n  amount\n  blockchain\n  contractAddress\n  currency\n  destinationAddress\n  explorerLink\n  hash\n  status\n  __typename\n}"
    }`, address)

    client := &http.Client{}
    req, err := http.NewRequest("POST", url, strings.NewReader(query))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }
    req.Header.Add("Content-Type", "application/json")

    res, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("failed to execute request: %w", err)
    }
    defer res.Body.Close()

    body, err := io.ReadAll(res.Body)
    if err != nil {
        return fmt.Errorf("failed to read response: %w", err)
    }
    fmt.Printf("[%s] USDC faucet response: %s\n", time.Now().Format("2006-01-02 15:04:05"), string(body))
    return nil
}

func main() {
    address := "0x811da7389fd55b7e843cb1982ac243c9d6b7fcaea9244739dbb19c08dd1e78eb"

    if err := requestSuiGas(address); err != nil {
        fmt.Printf("[%s] Error requesting SUI gas: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
    }

    if err := requestUSDC(address); err != nil {
        fmt.Printf("[%s] Error requesting USDC: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
    }
}
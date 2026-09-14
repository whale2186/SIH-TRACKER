package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type SyncPayload struct {
	Problems []ProblemCount `json:"problems"`
}

type ProblemCount struct {
	PsId  string `json:"psId"`
	Count int    `json:"count"`
}

type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Synced  int    `json:"synced"`
	Updated int    `json:"updated"`
}

func main() {
	// Load .env file if it exists
	godotenv.Load()

	renderAPI := getEnv("RENDER_API_URL", "https://your-app.onrender.com")
	syncInterval := getEnvInt("SYNC_INTERVAL_HOURS", 6)
	apiKey := getEnv("SYNC_API_KEY", "")

	if apiKey == "" {
		fmt.Println("WARNING: SYNC_API_KEY not set. Make sure your Render API endpoint is protected.")
	}

	fmt.Printf("Starting SIH sync job\n")
	fmt.Printf("Target API: %s\n", renderAPI)
	fmt.Printf("Interval: %d hours\n", syncInterval)

	// Run once immediately, then on interval
	runSync(renderAPI, apiKey)
	ticker := time.NewTicker(time.Duration(syncInterval) * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		runSync(renderAPI, apiKey)
	}
}

func runSync(apiURL, apiKey string) {
	fmt.Printf("[%s] Starting sync...\n", time.Now().Format(time.RFC3339))

	// 1. Fetch HTML from SIH website
	html, err := fetchSIHHTML()
	if err != nil {
		fmt.Printf("ERROR fetching SIH: %v\n", err)
		return
	}

	// 2. Parse PS counts from HTML
	counts, err := parsePSCounts(html)
	if err != nil {
		fmt.Printf("ERROR parsing HTML: %v\n", err)
		return
	}

	if len(counts) == 0 {
		fmt.Println("ERROR: No PS counts parsed from HTML")
		return
	}

	fmt.Printf("Parsed %d problem statements\n", len(counts))

	// 3. Send to Render API
	resp, err := sendToAPI(apiURL, apiKey, counts)
	if err != nil {
		fmt.Printf("ERROR sending to API: %v\n", err)
		return
	}

	fmt.Printf("Sync result: %s (synced: %d, updated: %d)\n", resp.Message, resp.Synced, resp.Updated)
}

func fetchSIHHTML() (string, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://www.sih.gov.in/sih2026PS", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("SIH returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func parsePSCounts(html string) ([]ProblemCount, error) {
	// Pattern matches: <td>SIH26047</td>\s*<td>75/500</td>
	re := regexp.MustCompile(`<td>(SIH\d+)</td>\s*<td>(\d+)/500</td>`)
	matches := re.FindAllStringSubmatch(html, -1)

	var counts []ProblemCount
	for _, match := range matches {
		if len(match) >= 3 {
			psId := match[1]
			count, err := strconv.Atoi(match[2])
			if err != nil {
				continue
			}
			counts = append(counts, ProblemCount{PsId: psId, Count: count})
		}
	}

	return counts, nil
}

func sendToAPI(apiURL, apiKey string, counts []ProblemCount) (*APIResponse, error) {
	payload := SyncPayload{Problems: counts}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	endpoint := strings.TrimRight(apiURL, "/") + "/api/sync-ingest"

	client := &http.Client{Timeout: 60 * time.Second}
	req, err := http.NewRequest("POST", endpoint, strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var apiResp APIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		// Try to parse as error response
		return &APIResponse{
			Success: false,
			Message: string(body),
		}, nil
	}

	return &apiResp, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return fallback
}
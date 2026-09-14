# SIH Sync Job (Go)

Standalone Go application that fetches SIH problem statement data from `sih.gov.in` and pushes it to your Render-hosted Next.js API.

## Setup

1. **Build the binary:**
   ```bash
   cd server-job
   go build -o sih-sync
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run:**
   ```bash
   ./sih-sync
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RENDER_API_URL` | Yes | Your Render app URL (e.g., `https://sih-tracker.onrender.com`) |
| `SYNC_API_KEY` | Yes | Secret key that matches `SYNC_API_KEY` in Render's env vars |
| `SYNC_INTERVAL_HOURS` | No | How often to sync (default: 6) |

## How it works

1. Fetches `https://www.sih.gov.in/sih2026PS` (works from your server since it's not a cloud IP)
2. Parses PS IDs and application counts from HTML table
3. POSTs to `RENDER_API_URL/api/sync-ingest` with Bearer token auth
4. Repeats every `SYNC_INTERVAL_HOURS`

## Deploy to your server

```bash
# On your server
scp sih-sync user@your-server:/opt/sih-sync/
scp .env user@your-server:/opt/sih-sync/

# Set up systemd service (see sih-sync.service)
sudo cp sih-sync.service /etc/systemd/system/
sudo systemctl enable sih-sync
sudo systemctl start sih-sync
```

## Logs

```bash
journalctl -u sih-sync -f
```
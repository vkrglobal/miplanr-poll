# miPlanr Poll — Netlify Deployment

Standalone poll page + WhatsApp result parser. Deployable to Netlify in under 5 minutes.

## Files

```
miplanr-poll/
├── index.html                          ← Shareable poll page
├── _headers                            ← Netlify headers (CORS, iframe embed)
├── netlify.toml                        ← Build config
└── netlify/
    └── functions/
        └── parse-poll-result.js        ← Claude parsing function (serverless)
```

---

## Deploy in 5 steps

1. Push this folder to a GitHub repo (e.g. `miplanr-poll`)
2. Go to app.netlify.com → Add new site → Import from GitHub
3. Select the repo — build settings auto-detected via netlify.toml
4. Go to Site settings → Environment variables → Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...your key...
   ```
5. Deploy. Your poll is live at `https://your-site.netlify.app`

---

## Using the poll page

Share the URL with URL params to customise each poll:

```
https://your-site.netlify.app/?
  q=When+works+for+team+lunch&
  creator=Josh+Sim&
  event=Team+Lunch&
  deadline=30+Jun&
  opts=Saturday+5+Jul+2pm|Sunday+6+Jul+12pm|Monday+7+Jul+1pm&
  threshold=5
```

| Param | Purpose | Default |
|-------|---------|---------|
| `q` | Poll question | "When works best?" |
| `creator` | Organiser name | "Josh Sim" |
| `event` | Calendar event title | "Team Lunch" |
| `deadline` | Closing date display | "30 Jun" |
| `opts` | Options separated by `\|` | 3 sample dates |
| `threshold` | Votes needed to auto-confirm | 5 |

---

## WhatsApp Parser API

**Endpoint:** `POST /api/parse-poll-result`

**Request:**
```json
{ "rawText": "Saturday 5 July 2pm — Team lunch — 4 votes" }
```

**Response (200):**
```json
{
  "title": "Team Lunch",
  "date": "2025-07-05",
  "startTime": "14:00",
  "endTime": "15:00",
  "allDay": false,
  "duration": 60,
  "location": null,
  "description": "Scheduled via miPlanr Poll",
  "voteCount": 4,
  "totalVoters": 0,
  "confidence": "high",
  "suggestedPlatforms": ["google", "outlook"],
  "googleCalUrl": "https://calendar.google.com/...",
  "outlookDeeplink": "https://outlook.live.com/...",
  "icsSnippet": "BEGIN:VEVENT...",
  "platformPayloads": {
    "churchSuite": { "endpoint": "...", "body": { ... } },
    "iSAMS": { "endpoint": "...", "body": { ... } },
    "edulink": { "endpoint": "...", "body": { ... } },
    "googleClassroom": { "endpoint": "...", "body": { ... } },
    "salesforce": { "endpoint": "...", "body": { ... } },
    "hubspot": { "endpoint": "...", "body": { ... } },
    "teamo": { "endpoint": "...", "body": { ... } },
    "sportsEngine": { "endpoint": "...", "body": { ... } }
  },
  "raw": "Saturday 5 July 2pm — Team lunch — 4 votes",
  "parsedAt": "2025-06-24T10:00:00.000Z",
  "parsedBy": "miPlanr / Claude claude-sonnet-4-6"
}
```

**Error responses:**
- `400 empty_input` — rawText missing or too short
- `400 input_too_long` — rawText over 2000 chars
- `422 no_date_found` — Claude couldn't extract a date
- `502 parse_failed` — Claude API error

---

## Platform integration notes

Each platform in `platformPayloads` includes:
- `endpoint` — the API URL to POST to
- `method` — always POST
- `notes` — auth requirements
- `body` — ready-to-send JSON payload

You need to supply your own API keys/tokens per platform.
Full auth setup docs linked in the main parse-poll-result.js file.

---

## Embed in Google Sites

In Google Sites, use Embed → URL:
```
https://your-site.netlify.app/?q=Your+question&opts=Option+1|Option+2|Option+3
```
The `_headers` file sets `X-Frame-Options: ALLOWALL` so embedding works.

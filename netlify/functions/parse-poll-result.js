// ─────────────────────────────────────────────────────────────────────────────
// miPlanr — WhatsApp Poll Result Parser
// Netlify Function: netlify/functions/parse-poll-result.js
//
// POST /api/parse-poll-result
// Body: { "rawText": "Saturday 5 July 2pm - Team lunch - 4 votes" }
//
// Returns structured event JSON ready to push to Google Calendar,
// Outlook (Microsoft Graph), ChurchSuite, iSAMS, Edulink, Google Classroom,
// Salesforce, HubSpot, Teamo, or SportsEngine.
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are miPlanr's scheduling intelligence engine.

Your job is to parse messy, informal text — copied from WhatsApp polls, group chats, 
emails, or voice-to-text — and extract a clean, structured calendar event.

RULES:
- Always return valid JSON only. No markdown, no explanation, no preamble.
- If a year is missing, assume the next occurrence of that date in the future.
- If a time is missing, set allDay: true and omit startTime/endTime.
- Duration defaults to 1 hour unless stated.
- If the text contains a winning vote count or tally, include it in voteCount.
- Confidence: "high" if date+time clearly stated, "medium" if inferred, "low" if ambiguous.
- If you cannot extract a date at all, return { "error": "no_date_found" }.

OUTPUT SCHEMA (strict — all fields required unless marked optional):
{
  "title": "string — event title, inferred from context",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM (24h) — optional if allDay",
  "endTime": "HH:MM (24h) — optional if allDay",
  "allDay": false,
  "duration": 60,
  "location": "string — optional, null if not mentioned",
  "description": "string — plain English summary for calendar description",
  "voteCount": 0,
  "totalVoters": 0,
  "confidence": "high | medium | low",
  "suggestedPlatforms": ["google", "outlook"],
  "googleCalUrl": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...",
  "outlookDeeplink": "https://outlook.live.com/calendar/0/deeplink/compose?...",
  "icsSnippet": "BEGIN:VEVENT\\nSUMMARY:...\\nDTSTART:...\\nDTEND:...\\nEND:VEVENT",
  "raw": "the original input text"
}`;

function buildGoogleUrl(title, date, startTime, endTime) {
  const fmt = (d, t) => {
    const dt = new Date(`${d}T${t || '00:00'}:00`);
    return dt.toISOString().replace(/[-:]/g, '').replace('.000', '');
  };
  const start = fmt(date, startTime);
  const end = fmt(date, endTime || (startTime
    ? `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2,'0')}:${startTime.split(':')[1]}`
    : '23:59'));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: 'Scheduled via miPlanr Poll · miplanr.com'
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function buildOutlookUrl(title, date, startTime, endTime) {
  const start = new Date(`${date}T${startTime || '09:00'}:00`).toISOString();
  const end = new Date(`${date}T${endTime || '10:00'}:00`).toISOString();
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start,
    enddt: end,
    body: 'Scheduled via miPlanr Poll · miplanr.com'
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

function buildIcs(title, date, startTime, endTime) {
  const fmt = (d, t) =>
    new Date(`${d}T${t || '00:00'}:00`).toISOString().replace(/[-:]/g,'').replace('.000','') + 'Z';
  return [
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DTSTART:${fmt(date, startTime)}`,
    `DTEND:${fmt(date, endTime)}`,
    `DESCRIPTION:Scheduled via miPlanr Poll`,
    'END:VEVENT'
  ].join('\\n');
}

exports.handler = async function(event, context) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let rawText;
  try {
    const body = JSON.parse(event.body);
    rawText = (body.rawText || '').trim();
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'invalid_json', message: 'Request body must be JSON with a rawText field.' })
    };
  }

  if (!rawText || rawText.length < 3) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'empty_input', message: 'rawText is required and must be at least 3 characters.' })
    };
  }

  if (rawText.length > 2000) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'input_too_long', message: 'rawText must be under 2000 characters.' })
    };
  }

  // Call Claude
  let parsed;
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Parse this WhatsApp poll result and return structured JSON:\n\n"${rawText}"`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data.content[0]?.text || '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(clean);

  } catch (e) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'parse_failed',
        message: 'Claude could not extract a structured event from the text.',
        detail: e.message
      })
    };
  }

  if (parsed.error) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: parsed.error, message: 'No date could be extracted from the text.', raw: rawText })
    };
  }

  // Enrich with calendar URLs if Claude didn't build them (safety net)
  if (!parsed.googleCalUrl && parsed.date) {
    parsed.googleCalUrl = buildGoogleUrl(parsed.title, parsed.date, parsed.startTime, parsed.endTime);
  }
  if (!parsed.outlookDeeplink && parsed.date) {
    parsed.outlookDeeplink = buildOutlookUrl(parsed.title, parsed.date, parsed.startTime, parsed.endTime);
  }
  if (!parsed.icsSnippet && parsed.date) {
    parsed.icsSnippet = buildIcs(parsed.title, parsed.date, parsed.startTime, parsed.endTime);
  }

  // Add platform-specific payloads for downstream sync
  parsed.platformPayloads = {
    churchSuite: {
      endpoint: 'https://api.churchsuite.com/v1/calendar/events',
      method: 'POST',
      notes: 'Requires ChurchSuite API key in X-Auth header. Use calendar module.',
      body: {
        name: parsed.title,
        datetime_start: `${parsed.date}T${parsed.startTime || '09:00'}:00`,
        datetime_end: `${parsed.date}T${parsed.endTime || '10:00'}:00`,
        description: parsed.description
      }
    },
    iSAMS: {
      endpoint: 'https://[school].isams.cloud/api/calendar/events',
      method: 'POST',
      notes: 'Requires iSAMS Bearer token. School subdomain is environment-specific.',
      body: {
        title: parsed.title,
        startDate: parsed.date,
        startTime: parsed.startTime || '09:00',
        endTime: parsed.endTime || '10:00',
        notes: parsed.description
      }
    },
    edulink: {
      endpoint: 'https://api.edulinkone.com/api/?action=school.calendar.addEvent',
      method: 'POST',
      notes: 'Requires Edulink API credentials. JSON-RPC style endpoint.',
      body: {
        jsonrpc: '2.0',
        method: 'school.calendar.addEvent',
        params: {
          title: parsed.title,
          date: parsed.date,
          time: parsed.startTime || '09:00',
          description: parsed.description
        }
      }
    },
    googleClassroom: {
      endpoint: 'https://classroom.googleapis.com/v1/courses/{courseId}/announcements',
      method: 'POST',
      notes: 'Requires Google OAuth2 token with classroom.announcements.create scope.',
      body: {
        text: `${parsed.title} — ${parsed.date} ${parsed.startTime || ''}. ${parsed.description}`
      }
    },
    salesforce: {
      endpoint: 'https://[instance].salesforce.com/services/data/v58.0/sobjects/Event',
      method: 'POST',
      notes: 'Requires Salesforce OAuth2 Bearer token.',
      body: {
        Subject: parsed.title,
        ActivityDateTime: `${parsed.date}T${parsed.startTime || '09:00'}:00.000Z`,
        DurationInMinutes: parsed.duration || 60,
        Description: parsed.description,
        OwnerId: '[salesforce_user_id]'
      }
    },
    hubspot: {
      endpoint: 'https://api.hubapi.com/crm/v3/objects/meetings',
      method: 'POST',
      notes: 'Requires HubSpot Private App token in Authorization: Bearer header.',
      body: {
        properties: {
          hs_meeting_title: parsed.title,
          hs_timestamp: new Date(`${parsed.date}T${parsed.startTime || '09:00'}:00`).getTime(),
          hs_meeting_end_time: new Date(`${parsed.date}T${parsed.endTime || '10:00'}:00`).getTime(),
          hs_internal_meeting_notes: parsed.description
        }
      }
    },
    teamo: {
      endpoint: 'https://app.teamo.io/api/v2/events',
      method: 'POST',
      notes: 'Requires Teamo team API key.',
      body: {
        name: parsed.title,
        start_time: `${parsed.date}T${parsed.startTime || '09:00'}:00`,
        end_time: `${parsed.date}T${parsed.endTime || '10:00'}:00`,
        notes: parsed.description
      }
    },
    sportsEngine: {
      endpoint: 'https://api.sportsengine.com/v2/schedules/events',
      method: 'POST',
      notes: 'Requires SportsEngine OAuth2 Bearer token and team/league ID.',
      body: {
        title: parsed.title,
        start_time: `${parsed.date}T${parsed.startTime || '09:00'}:00Z`,
        end_time: `${parsed.date}T${parsed.endTime || '10:00'}:00Z`,
        description: parsed.description
      }
    }
  };

  parsed.raw = rawText;
  parsed.parsedAt = new Date().toISOString();
  parsed.parsedBy = 'miPlanr / Claude claude-sonnet-4-6';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(parsed, null, 2)
  };
};

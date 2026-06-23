# next-please — frontend

Web client for the **next-please** medical queue simulation. One Next.js app
serves two independent flows:

- **Patient** (anonymous) at `/` — pick a type, wait in a per-type queue, get
  paired with a doctor for a fixed 20-second visit.
- **Doctor** (authenticated) at `/doctor/*` — log in, claim a room, repeatedly
  pick a type to see the next waiting patient, log out to release the room.

The backend owns all timing: it returns `visitEndsAt` and auto-completes visits.
Both screens count down locally from `visitEndsAt` and never run an authoritative
timer.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — the patient kiosk. Doctors go to
<http://localhost:3000/doctor/login>.

The backend must be running and reachable (it already allows CORS from
`http://localhost:3000`).

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL of the backend API. |

Set it in `.env.local` when the backend lives elsewhere, e.g.:

```bash
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8080' > .env.local
```

## Routes

| Route | Who | Purpose |
|-------|-----|---------|
| `/` | Patient | Choose a type (Consultation / Check-up / Urgent). |
| `/wait` | Patient | Live queue position; **Leave** to cancel while waiting. |
| `/visit` | Patient | Assigned room + 20 s countdown. |
| `/done` | Patient | Thank-you; back to start. |
| `/doctor/login` | Doctor | Email + password sign-in. |
| `/doctor/room` | Doctor | Claim a free room. |
| `/doctor/types` | Doctor | Pick a type with waiting patients. |
| `/doctor/visit` | Doctor | Paired ticket + 20 s countdown. |

## Real-time

The patient screens subscribe to `GET /api/queue/subscribe` using
[`@microsoft/fetch-event-source`](https://www.npmjs.com/package/@microsoft/fetch-event-source)
(native `EventSource` cannot send the `Authorization` header). A 3-second status
poll is kept as a fallback if the stream drops. The doctor UI needs no SSE — it
counts down from the `visitEndsAt` returned by `next-patient`.

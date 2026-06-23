# next-please — frontend

Web client for the **next-please** medical queue simulation. One Next.js app
serves three independent flows:

- **Patient** (anonymous) at `/` — pick a type, wait in a per-type queue, get
  paired with a doctor, then wait in consultation until the doctor stops it.
- **Doctor** (authenticated) at `/doctor/*` — request an account (admin must
  approve), log in, claim a room, repeatedly pick a type to see the next waiting
  patient, end each visit with **Stop consultation**, log out to release the room.
- **Admin** (authenticated) at `/admin/*` — approve or deny doctor account
  requests and manage all doctor accounts.

The visit has no timer: it ends only when the doctor clicks **Stop
consultation**, which moves the patient to the done screen via SSE.

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
| `/visit` | Patient | Assigned room; "in consultation — please wait". |
| `/done` | Patient | Thank-you; back to start. |
| `/doctor/login` | Doctor | Email + password sign-in. |
| `/doctor/register` | Public | Request a doctor account (sets own password). |
| `/doctor/room` | Doctor | Claim a free room. |
| `/doctor/types` | Doctor | Pick a type with waiting patients. |
| `/doctor/visit` | Doctor | Paired ticket + **Stop consultation**. |
| `/admin/login` | Admin | Email + password sign-in (rejects non-admins). |
| `/admin` | Admin | Approve/deny pending requests; manage all doctors. |

## Accounts

Doctors **self-register** at `/doctor/register` (choosing their own password)
and start as `PENDING`; logging in before approval returns **403** and shows
"awaiting admin approval". An admin approves them (→ active) or denies the
request (which permanently deletes it). Admins are seeded server-side only.

## Real-time

The patient screens subscribe to `GET /api/queue/subscribe` using
[`@microsoft/fetch-event-source`](https://www.npmjs.com/package/@microsoft/fetch-event-source)
(native `EventSource` cannot send the `Authorization` header). A 3-second status
poll is kept as a fallback if the stream drops. When the doctor clicks **Stop
consultation** (`POST /api/doctors/complete-patient/{ticketId}`), the backend
broadcasts a `COMPLETED` `queue-update` that moves the patient to `/done`.

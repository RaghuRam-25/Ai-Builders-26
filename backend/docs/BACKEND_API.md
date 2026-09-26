# Phase 4 — Backend API (Express + Mongoose)

> All routes are mounted under `/api/v1`. Every response is wrapped by
> `backend/src/utils/response.ts`:
>
> ```json
> { "data": { "...": "..." } }
> ```
>
> Errors use `backend/src/utils/api-error.ts`:
>
> ```json
> { "error": { "code": "NOT_FOUND", "message": "...", "requestId": "..." } }
> ```

Authentication is a `Bearer` access token (15 min) in the `Authorization`
header. A `refresh` token (30 d) is exchanged at `POST /auth/refresh`.
Passing `accessToken` as a cookie is also accepted.

---

## 1. Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | – | Liveness probe. Returns `{ status, service }`. |

## 2. Auth — `backend/src/routes/auth.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | Creates the user **and** the initial `CitizenProfile` in one step, mirroring the original registration form. |
| POST | `/auth/login` | – | Verifies the bcrypt hash, stamps `lastSignedInAt`. |
| POST | `/auth/refresh` | – | Rotates the token pair. |
| GET | `/auth/me` | required | Current user as `PublicUser`. |

`register` accepts exactly what the original sign-up form collected:
`name`, `mobile`, `password`, `age`, `district`, `gender`, `isBangladeshi`.

The mobile number configured as `OWNER_MOBILE` is promoted to `role: "admin"`.

## 3. Government services — `backend/src/routes/government.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/government/services` | – | All services, `?search=&limit=&lang=`. |
| GET | `/government/services/:id` | – | One service with its nested `options` / `programs`. |
| GET | `/government/search` | – | Ranked search, `?query=&limit=&lang=`. |
| GET | `/government/context` | – | Resolves a free-text question to `{ service, optionId, programId }`. |
| GET | `/government/categories` | – | Home-screen topic tiles. |
| GET | `/government/suggestions` | – | Assistant starter prompts. |

`lang=en` applies the English overrides from the original
`shared/service-translations.ts`. Search always runs over the Bengali source
text, exactly as the original did.

## 4. Catalog — `backend/src/routes/catalog.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/catalog/training` | – | The three original training programs. |
| GET | `/catalog/training/:id` | – | One program. |
| GET | `/catalog/jobs` | – | The three original job notices. |
| GET | `/catalog/jobs/:id` | – | One notice. |

## 5. Profile — `backend/src/routes/profile.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/profile` | required | Current `CitizenProfile`, or `null`. |
| PUT | `/profile` | required | Upsert. Also creates notifications for newly matched services and returns `availableServiceIds`, ported from the original `profile.upsert` tRPC mutation. |
| GET | `/profile/matched-services` | required | Matched service ids only. |

## 6. Assistant & chat — `backend/src/routes/chat.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/chat/ask` | required | Stateless ask. Returns `reply`, `sources` and the resolved `context`. |
| GET | `/chat/conversations` | required | Conversation list with message counts. |
| POST | `/chat/conversations` | required | Create a conversation. |
| GET | `/chat/conversations/:id/messages` | required | Ordered messages. |
| POST | `/chat/conversations/:id/messages` | required | Append one message. |

`/chat/ask` body: `{ message, conversationId?, attachmentName?, language?, context? }`.
With no explicit `context`, the service falls back to
`findGovernmentServiceContext` to detect which service is being discussed.

If `LLM_API_BASE_URL` / `LLM_API_KEY` are unset, a deterministic reply is built
from the stored Bengali service record instead of calling a model, so the app
works offline and never invents facts.

## 7. Notifications — `backend/src/routes/notification.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | required | Notifications, newest first. |
| PATCH | `/notifications/:id/read` | required | Mark one read. |
| POST | `/notifications/read-all` | required | Mark all read. |

A compound unique index on `{ user, serviceId }` makes
`ensureServiceNotifications` idempotent, matching the original
`ensureServiceNotifications` in `server/db.ts`.

## 8. Document scans — `backend/src/routes/notification.routes.ts`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/documents/scan?target=training\|job&targetId=` | required | Multipart `document` field. PDF/PNG/JPEG/WEBP/HEIC up to `MAX_UPLOAD_MB`. |
| GET | `/documents/scan` | required | The caller's last 50 scans. |
| DELETE | `/documents/scan/:id` | required | Deletes the record and unlinks the stored file. |

The verdict comes from the shared `isEligibleForTraining` / `isEligibleForJob`
helpers — the same functions the original Home screen used — so the answer is
identical to the pre-migration behaviour.

---

## Collections

| Collection | Model | Notes |
| --- | --- | --- |
| `users` | `User.model.ts` | `passwordHash` is `select: false`. `legacyOpenId` keeps the Manus id for MySQL reconciliation. |
| `citizenprofiles` | `CitizenProfile.model.ts` | Adds `education`, `gender`, `isBangladeshi`, `jobSeeking` — fields the original form edited but MySQL never persisted. |
| `services` | `Service.model.ts` | Six records keyed by their original string `id`. |
| `servicecategories` / `servicesuggestions` | `Service.model.ts` | Home tiles and starter prompts. |
| `trainingprograms` / `jobopportunities` | … | Three records each. |
| `chatconversations` / `chatmessages` | … | Assistant history. |
| `servicenotifications` | `ServiceNotification.model.ts` | Unique per `{ user, serviceId }`. |
| `documentscans` | `DocumentScan.model.ts` | Upload metadata plus the verdict. |

## Seeding

```bash
pnpm db:seed
```

Idempotent upserts keyed on the stable string ids. It never touches
`users`, `citizenprofiles` or `servicenotifications`.

## Verification

```bash
pnpm --filter @janasheba/backend verify           # typecheck + unit + smoke + build
pnpm --filter @janasheba/backend test:integration  # needs a reachable MONGODB_URI
```

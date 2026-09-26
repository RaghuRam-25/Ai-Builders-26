# Phase 1 — Existing Project Analysis & Migration Map

> Source project: Expo SDK 54 + React Native 0.81 + expo-router + NativeWind 4 + tRPC 11 +
> Express + Drizzle ORM (MySQL) + TypeScript.
> The original project is **not deleted**. It remains at the repository root as the reference
> implementation (`app/`, `server/`, `shared/`, `drizzle/`, `components/`, `lib/`, `assets/`).

---

## 1. Existing technology inventory

| Concern | Existing | Migration target |
| --- | --- | --- |
| UI runtime | React Native 0.81 (`react-native-web` for web) | Next.js 15 App Router, React 19 |
| Routing | `expo-router` file router (`app/(tabs)/*`) | Next.js App Router (`frontend/src/app/(tabs)/*`) |
| Styling | NativeWind 4 + Tailwind 3 (`nativewind/preset`) | Tailwind CSS 3 (web preset, same utility names) |
| State | React Context + `AsyncStorage` | React Context + `localStorage` (web/Capacitor) |
| Server data | `@tanstack/react-query` 5 | `@tanstack/react-query` 5 (kept) |
| API transport | tRPC 11 (`httpBatchLink` + `superjson`) | REST (`fetch`) over Express |
| Server runtime | Express 4 (`server/_core/index.ts`) | Express 4, standalone (`backend/src/server.ts`) |
| ORM / DB | Drizzle ORM + **MySQL** (`mysql2`) | Mongoose 8 + **MongoDB Atlas** |
| Auth | Manus platform OAuth cookie + `expo-secure-store` token | JWT (access + refresh) issued by Express, `localStorage` / Capacitor Preferences |
| Audio input | `expo-audio` (native) / Web Speech API (web) | Web Speech API (Chrome/WebView) + graceful fallback |
| File pick | `expo-document-picker` | `<input type="file">` + Capacitor `@capacitor/filesystem` on Android |
| Share | React Native `Share.share` | `navigator.share` with clipboard fallback |
| Alerts | React Native `Alert.alert` | Accessible in-app dialog component |
| Modals | React Native `Modal` + `animationType="slide"` | Fixed overlay bottom sheet (same geometry/animation) |
| External links | `Linking.openURL` | `@capacitor/app` openUrl on native, `window.open` on web |
| Notifications | `expo-notifications` (declared) | In-app notification centre backed by MongoDB |
| Android build | EAS (`eas.json`) | Capacitor → Gradle → APK |
| Tests | Vitest | Vitest (backend) + Vitest (shared logic) |

---

## 2. Screen / route inventory

| # | Existing route | Purpose | New route |
| --- | --- | --- | --- |
| 1 | `app/_layout.tsx` | Root providers: Theme, Language, Profile, SafeArea, React Query, tRPC | `frontend/src/app/layout.tsx` |
| 2 | `app/(tabs)/_layout.tsx` | 4-tab bottom bar (হোম / AI সহকারী / Profile / সেটিংস) | `frontend/src/app/(tabs)/layout.tsx` |
| 3 | `app/(tabs)/index.tsx` | Home: hero search, quick chips, topic categories, service cards, bottom-sheet detail (service / training / jobs), document-scan eligibility | `frontend/src/app/(tabs)/page.tsx` |
| 4 | `app/(tabs)/assistant.tsx` | AI assistant chat, service cards, document attach, voice input, service bottom sheet, share guide | `frontend/src/app/(tabs)/assistant/page.tsx` |
| 5 | `app/(tabs)/profile.tsx` | Unauthenticated gate → Register / Sign in modal; citizen profile form; matched services; save | `frontend/src/app/(tabs)/profile/page.tsx` |
| 6 | `app/(tabs)/settings.tsx` | Language switcher (বাংলা / English) + About card | `frontend/src/app/(tabs)/settings/page.tsx` |
| 7 | `app/oauth/callback.tsx` | Manus platform OAuth code→token exchange (platform infrastructure, not a product feature) | **Dropped** — replaced by first-party JWT auth (`features/authentication`) |
| 8 | `app/dev/theme-lab.tsx` | Developer-only colour palette browser | `frontend/src/app/dev/theme-lab/page.tsx` (kept, hidden from nav) |

---

## 3. Component inventory

### 3.1 Reusable components that survive migration

| Existing file | Role | Destination |
| --- | --- | --- |
| `components/screen-container.tsx` | Safe-area + background shell | `frontend/src/components/layout/screen-container.tsx` |
| `components/ui/icon-symbol.tsx` | SF-Symbol style tab icons | `frontend/src/components/ui/tab-icon.tsx` (inline SVG) |
| `components/external-link.tsx` | `Linking.openURL` wrapper | `frontend/src/lib/open-external-url.ts` |
| `hooks/use-colors.ts` | Themed colour accessor | `frontend/src/hooks/use-colors.ts` |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge) | `frontend/src/lib/cn.ts` |
| `lib/language-context.tsx` | Language state | `frontend/src/features/authentication/../language-provider.tsx` → `frontend/src/components/layout/language-provider.tsx` |
| `lib/profile-context.tsx` | Citizen profile + auth state | `frontend/src/features/authentication/citizen-provider.tsx` |
| `lib/theme-provider.tsx` | `data-theme` + CSS variables | `frontend/src/components/layout/theme-provider.tsx` |
| `constants/theme.ts`, `theme.config.js`, `lib/_core/theme.ts` | Design tokens | `frontend/src/styles/theme.ts` + `frontend/src/styles/globals.css` |

### 3.2 Components that are Expo-template scaffolding (dropped)

| Existing file | Reason |
| --- | --- |
| `components/hello-wave.tsx` | Template demo, unused by Janasheba screens |
| `components/parallax-scroll-view.tsx` | Template demo, unused |
| `components/haptic-tab.tsx` | `expo-haptics`; replaced by Capacitor `Haptics.impact()` when available |
| `components/themed-view.tsx` | Trivial wrapper, folded into `ScreenContainer` |
| `components/ui/collapsible.tsx` | Unused by Janasheba screens |
| `components/ui/icon-symbol.ios.tsx` | iOS-only variant; unified SVG icon |
| `constants/oauth.ts`, `lib/_core/auth.ts`, `lib/_core/manus-runtime.ts`, `lib/_core/api.ts`, `lib/_core/nativewind-pressable.ts` | Manus platform plumbing, replaced by first-party auth + REST client |
| `server/_core/{oauth,sdk,heartbeat,storageProxy,dataApi,imageGeneration,storage}.ts` | Manus platform plumbing not used by Janasheba product features |
| `scripts/generate_qr.mjs`, `scripts/reset-project.js` | Template tooling |

### 3.3 Feature components extracted from screens

Screens 3–6 each contained inline sub-components. They are extracted into feature folders **without any visual change**:

| Existing inline component | New location |
| --- | --- |
| `ServiceContent`, `DynamicServiceContent`, `LegacyServiceContent` | `frontend/src/features/government-services/components/*` |
| `TrainingContent` | `frontend/src/features/government-training/components/training-content.tsx` |
| `JobsContent` | `frontend/src/features/government-jobs/components/jobs-content.tsx` |
| `ServiceModalDetails` | `frontend/src/features/government-services/components/service-modal-details.tsx` |
| `AuthModal`, `Field`, `Choice`, `Toggle` | `frontend/src/features/authentication/components/*` |
| `LanguageOption` | `frontend/src/app/(tabs)/settings/page.tsx` (kept inline, as today) |
| `styles` objects (per screen) | Converted 1:1 into Tailwind arbitrary-value classes in `frontend/src/constants/styles.ts` |

---

## 4. Data & schema inventory

### 4.1 Static content (currently bundled TypeScript constants)

| Existing file | Content | New home |
| --- | --- | --- |
| `shared/government-services.ts` | 6 services: `nid`, `birth`, `passport`, `training`, `jobs`, `social-support`; nested `options[]` (2/2/3) and `programs[]` (6); plus `findGovernmentServices()`, `findGovernmentServiceContext()` | Data → `backend/src/data/government-services.seed.ts` + MongoDB `Service` collection. Search/context algorithms → `backend/src/services/government.service.ts` **and** `shared/types/government-search.ts` (shared so the AI prompt builder and tests use one implementation). |
| `shared/training-programs.ts` | 3 training programs | `backend/src/data/training-programs.seed.ts` + `TrainingProgram` collection |
| `shared/job-opportunities.ts` | 3 job notices with deadline/age/education | `backend/src/data/job-opportunities.seed.ts` + `JobOpportunity` collection |
| `shared/service-catalog.ts` | `categories[]` (5), `services` re-export, `suggestions[]` (3) | `categories` + `suggestions` → `backend/src/data/service-catalog.seed.ts` + `Category` collection (frontend reads from API) |
| `shared/service-translations.ts` | English overrides for the 6 services | `backend/src/data/service-translations.seed.ts`; resolved server-side by `?lang=en` so the UI keeps one code path |
| `shared/profile-matching.ts` | `getMatchedServiceIds(profile)` | `shared/types/profile-matching.ts`, used by backend (`profile.service`) and frontend (optimistic display) |

> **No government data is invented.** Every record is copied verbatim from the original files,
> including the existing "Production should sync this list from a verified official feed" caveat,
> which is preserved as a `source` field on each seeded document.

### 4.2 Relational schema → MongoDB document mapping

Original Drizzle/MySQL schema (`drizzle/schema.ts`):

| MySQL table | MongoDB collection | Document shape |
| --- | --- | --- |
| `users` (`openId` unique, `name`, `email`, `loginMethod`, `role`, timestamps) | `users` | `{ _id, mobile (unique, sparse), email (unique, sparse), passwordHash, name, role, lastSignedInAt, createdAt, updatedAt, legacyOpenId }` — `openId` retained as `legacyOpenId` so Manus-era rows can be reconciled without data loss |
| `citizen_profiles` (`userId` unique FK, `name`, `age`, `district`, `occupation`, `income`, `nidVerified`, `wantsTravel`) | `citizenprofiles` | `{ user: ObjectId (unique ref), name, age, district, education, occupation, income, gender, isBangladeshi, jobSeeking, nidVerified, wantsTravel }` — `education`, `gender`, `isBangladeshi`, `jobSeeking` are added because the existing `lib/profile-context.tsx` UI already edits them but the MySQL table never stored them (data-loss bug fixed) |
| `chat_conversations` (`userId` FK, `title`, timestamps) | `chatconversations` | `{ user, title, lastMessageAt }` |
| `chat_messages` (`conversationId` FK, `userId` FK, `role` enum, `content`, `attachmentName`) | `chatmessages` | `{ conversation, user, role, content, attachmentName, attachmentUrl }` |
| `service_notifications` (`userId` FK, `serviceId`, `title`, `body`, `readAt`) | `servicenotifications` | `{ user, service: ObjectId\|null, serviceId, kind, title, body, readAt, meta }` |

New collections (no MySQL equivalent existed — the data was hardcoded):

| Collection | Purpose |
| --- | --- |
| `services` | Government services with nested `options` / `programs` / `translations` |
| `servicecategories` | Home-screen topic tiles |
| `trainingprograms` | Government training programmes |
| `jobopportunities` | Government job notices |
| `documentscans` | Uploaded document scans + eligibility result (replaces client-only check) |

Indexes: `users.mobile` unique sparse, `users.email` unique sparse, `citizenprofiles.user` unique,
`chatconversations.user`, `chatmessages.conversation`, `servicenotifications.{user,readAt}`,
`services.id` unique, `trainingprograms.id` unique, `jobopportunities.id` unique,
`documentscans.user`.

---

## 5. API surface migration (tRPC → REST)

Every tRPC procedure maps to a REST route. No feature is dropped.

| tRPC procedure | REST endpoint | Auth |
| --- | --- | --- |
| `government.list` | `GET /api/government/services` | public |
| `government.byId` | `GET /api/government/services/:id` | public |
| `government.search` | `GET /api/government/services?search=&limit=` | public |
| `government.context` | `GET /api/government/context?query=` | public |
| — (new) | `GET /api/government/categories` | public |
| — (new) | `GET /api/government/suggestions` | public |
| — (new) | `GET /api/government/translations` | public |
| `auth.me` | `GET /api/auth/me` | optional |
| `auth.logout` | `POST /api/auth/logout` | optional |
| — (replaces AsyncStorage register/sign-in) | `POST /api/auth/register` | public |
| — (replaces AsyncStorage sign-in) | `POST /api/auth/login` | public |
| — (new) | `POST /api/auth/refresh` | refresh token |
| `profile.me` | `GET /api/profile` | required |
| `profile.upsert` | `PUT /api/profile` | required |
| — (new) | `GET /api/profile/matches` | required |
| `chat.conversations` | `GET /api/chat/conversations` | required |
| `chat.createConversation` | `POST /api/chat/conversations` | required |
| `chat.messages` | `GET /api/chat/conversations/:id/messages` | required |
| `chat.addMessage` | `POST /api/chat/conversations/:id/messages` | required |
| — (new; replaces client-side rule engine) | `POST /api/ai/assistant` | optional (richer when authenticated) |
| — (new; replaces `expo-audio` only usage) | `POST /api/ai/transcribe` | required |
| `notifications.list` | `GET /api/notifications` | required |
| `notifications.markRead` | `PATCH /api/notifications/:id/read` | required |
| — (new; replaces `expo-document-picker` local-only check) | `POST /api/documents/scan` (multipart) | required |
| — (new) | `GET /api/health` | public |

---

## 6. Environment variables

| Existing | New | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `frontend/.env` → `NEXT_PUBLIC_API_BASE_URL` | Public API URL. Embedded at build time. |
| `JWT_SECRET` | `backend/.env` → `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Server-only. Never in frontend. |
| `DATABASE_URL=mysql://…` | `backend/.env` → `MONGODB_URI` | MongoDB Atlas SRV string. |
| `PORT` | `backend/.env` → `PORT` | |
| `OWNER_OPEN_ID` | `backend/.env` → `OWNER_MOBILE` | Grants `role: "admin"` on register. |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | `backend/.env` → `LLM_API_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | AI assistant. Optional — falls back to the deterministic context-aware engine. |
| `EXPO_PUBLIC_OAUTH_*` | *(removed)* | Manus platform plumbing. |
| — (new) | `backend/.env` → `CORS_ORIGINS` | Comma-separated allow-list (web origins + `capacitor://localhost`). |
| — (new) | `backend/.env` → `UPLOAD_DIR`, `MAX_UPLOAD_MB` | Document scan storage. |
| — (new) | `frontend/.env` → `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ANDROID_PACKAGE` | Capacitor identity. |

---

## 7. Design token preservation contract

Every colour, radius, spacing step, and font size below appears verbatim in the original screens
and **must** appear verbatim in the migrated components.

**Semantic tokens** (`theme.config.js` → `frontend/src/styles/theme.css`):

| Token | Light | Dark |
| --- | --- | --- |
| `primary` | `#0F766E` | `#2AAE9A` |
| `background` | `#F5F8F7` | `#102321` |
| `surface` | `#FFFFFF` | `#17312D` |
| `foreground` | `#173531` | `#ECF8F4` |
| `muted` | `#6A817A` | `#A8C0B9` |
| `border` | `#DCEAE5` | `#2C4C45` |
| `success` | `#22C55E` | `#4ADE80` |
| `warning` | `#F59E0B` | `#FBBF24` |
| `error` | `#EF4444` | `#F87171` |

**Hard-coded palette used inline in the original JSX** (must be preserved as-is):
`#0F766E` `#F5F8F7` `#F8FBFA` `#FFFFFF` `#173531` `#183330` `#102A2A` `#36564E` `#526C65` `#52736A` `#5D736D` `#5E766E` `#6A817A` `#6E8580` `#71857F` `#27453F` `#284A43` `#34635B` `#3D5A54` `#4E655F` `#7B908A` `#81958F` `#9AAEA8` `#9BB0AA` `#BCE9DF` `#D7F4ED` `#E2F3EE` `#E3F3EE` `#E5F2EE` `#E6F5F0` `#EAF2EF` `#EAF8F3` `#EEF3F1` `#EDF3F1` `#E5EFEC` `#E0ECE8` `#DCEAE5` `#D5E8E2` `#C9DAD5` `#BFE2D6` `#B9CDC7` `#EA580C` `#FFF2E8` `#9A5B14` `#C2410C` `#B42318` `#FDE8E7` `#087443` `#D8F5E8` `#1B5E54` `#528077` `#7C3AED` `#0891B2` `#1D4ED8` `#E6F4FE`

**Radii**: `8` `12` `13` `14` `15` `16` `17` `18` `20` `21` `22` `24` `26` `28` `30` `36` `42` (px)

**Typography**: system UI stack; Bengali text rendered with the platform Bengali font fallback
(`"Noto Sans Bengali", "SolaimanLipi", system-ui, …`) so Android and web match the native app.

**Layout invariants**
- Tab bar: `height = 56 + bottomInset`, `paddingTop: 8`, `borderTopWidth: 0.5`, `borderTopColor: var(--color-border)`, active tint `var(--color-primary)`, icons 28 px.
- Home hero card: `rounded-[26px]`, `bg-[#0F766E]`, `px-5 pb-5 pt-6`.
- Category tile: `78×82`, `rounded-[20px]`, active = `bg-[#0F766E]` + white text.
- Service card: `rounded-[22px]`, `border-[#E5EFEC]`, `p-4` (16 px), `mb-3` (12 px).
- Detail sheet: `max-h-[90%]`, `rounded-t-[30px]`, `bg-[#F8FBFA]`, handle `h-1.5 w-12 rounded-full bg-[#C9DAD5]`, scrim `bg-black/35`, `slide` transition.
- Primary button: `h-12` (48), `rounded-[15px]`, `bg-[#0F766E]`, `mt-[18px]`.
- Assistant bubble: user `rounded-[20px] rounded-br-md bg-[#0F766E]`; assistant `rounded-[20px] rounded-bl-md border border-[#DCEAE5] bg-white`.

---

## 8. File-by-file destination map

```
app/_layout.tsx                     -> frontend/src/app/layout.tsx
app/(tabs)/_layout.tsx              -> frontend/src/app/(tabs)/layout.tsx
app/(tabs)/index.tsx                -> frontend/src/app/(tabs)/page.tsx
app/(tabs)/assistant.tsx            -> frontend/src/app/(tabs)/assistant/page.tsx
app/(tabs)/profile.tsx              -> frontend/src/app/(tabs)/profile/page.tsx
app/(tabs)/settings.tsx             -> frontend/src/app/(tabs)/settings/page.tsx
app/dev/theme-lab.tsx               -> frontend/src/app/dev/theme-lab/page.tsx
app/oauth/callback.tsx              -> (dropped) platform OAuth replaced by JWT auth

components/screen-container.tsx     -> frontend/src/components/layout/screen-container.tsx
components/ui/icon-symbol.tsx       -> frontend/src/components/ui/tab-icon.tsx
components/haptic-tab.tsx           -> frontend/src/lib/haptics.ts (Capacitor Haptics)
components/external-link.tsx        -> frontend/src/lib/open-external-url.ts
components/themed-view.tsx          -> (folded into ScreenContainer)
components/hello-wave.tsx           -> (dropped, template demo)
components/parallax-scroll-view.tsx -> (dropped, template demo)
components/ui/collapsible.tsx       -> (dropped, unused)

hooks/use-colors.ts                 -> frontend/src/hooks/use-colors.ts
hooks/use-color-scheme.ts(.web)     -> frontend/src/hooks/use-system-color-scheme.ts
hooks/use-auth.ts                   -> (dropped, Manus session)
lib/utils.ts                        -> frontend/src/lib/cn.ts
lib/language-context.tsx            -> frontend/src/components/layout/language-provider.tsx
lib/theme-provider.tsx              -> frontend/src/components/layout/theme-provider.tsx
lib/profile-context.tsx             -> frontend/src/features/authentication/citizen-provider.tsx
lib/trpc.ts                         -> (dropped) replaced by frontend/src/services/http.ts
lib/_core/*                         -> (dropped) Manus platform plumbing
assets/images/*                     -> frontend/public/icons/* + frontend/public/favicon.png

shared/types.ts                     -> shared/types/index.ts
shared/_core/errors.ts              -> shared/types/errors.ts
shared/government-services.ts       -> shared/types/government-service.ts (types+search)
                                     -> backend/src/data/government-services.seed.ts (records)
shared/service-catalog.ts           -> backend/src/data/service-catalog.seed.ts
shared/service-translations.ts      -> backend/src/data/service-translations.seed.ts
shared/training-programs.ts         -> backend/src/data/training-programs.seed.ts
shared/job-opportunities.ts          -> backend/src/data/job-opportunities.seed.ts
shared/profile-matching.ts          -> shared/types/profile-matching.ts

drizzle/schema.ts                   -> backend/src/models/*.model.ts (Mongoose)
drizzle/migrations/*                -> backend/src/scripts/migrate-mysql-to-mongo.ts
server/db.ts                        -> backend/src/models/*.model.ts + services/*
server/routers.ts                   -> backend/src/routes/*.routes.ts + controllers/*
server/_core/{trpc,context,cookies,env,systemRouter}.ts -> backend/src/{config,middleware,utils}
server/_core/llm.ts                 -> backend/src/services/ai.service.ts
server/_core/voiceTranscription.ts  -> backend/src/services/transcription.service.ts
server/_core/notification.ts        -> backend/src/services/notification.service.ts
server/_core/index.ts               -> backend/src/server.ts + backend/src/app.ts

tests/service-catalog.test.ts       -> backend/tests/government-services.test.ts
tests/profile-matching.test.ts      -> backend/tests/profile-matching.test.ts
tests/service-translations.test.ts  -> backend/tests/service-translations.test.ts
tests/auth.logout.test.ts           -> backend/tests/auth.test.ts
```

---

## 9. Native feature replacement plan

| Expo native module | Where used | Capacitor / web replacement |
| --- | --- | --- |
| `expo-document-picker` | Home scan buttons, assistant `+` attach | `<input type="file" accept="application/pdf,image/*">`; on Android the same input is handled by the system picker. File is uploaded to `POST /api/documents/scan` for a server-side eligibility result. |
| `expo-audio` (`useAudioRecorder`) | Assistant mic button (native only) | `SpeechRecognition` / `webkitSpeechRecognition` with `bn-BD` / `en-US`; identical behaviour to the existing web branch. If unsupported, the same "voice input unavailable" dialog is shown. |
| `expo-haptics` (`HapticTab`) | Tab press | `@capacitor/haptics` `Haptics.impact({ style: ImpactStyle.Light })`, no-op on web. |
| `expo-linking` | `openOfficial()`, OAuth deep link | `App.openUrl()` via `@capacitor/app` on native, `window.open` on web. |
| `expo-notifications` | Declared permission, not used in UI | In-app notification centre reading `servicenotifications`; no push permission requested. |
| `expo-secure-store` | Manus session token | JWT in `localStorage` (web) / `@capacitor/preferences` (Android). Refresh-token rotation limits exposure. |
| `expo-splash-screen` | `splash-icon.png`, white/`#000` | Capacitor `SplashScreen` plugin with the same `splash-icon.png`. |
| `react-native-safe-area-context` | `ScreenContainer` | CSS `env(safe-area-inset-*)` + `viewport-fit=cover`; Capacitor respects Android insets natively. |
| `react-native-reanimated` / gesture-handler | Root layout only | CSS transitions. No gesture-handler dependency. |
| `expo-video`, `expo-keep-awake`, `expo-system-ui`, `expo-symbols` | Template config only, unused | Removed. |
| `POST_NOTIFICATIONS` Android permission | `app.config.ts` | Not requested — no push notifications are used. |
| `RECORD_AUDIO` | `expo-audio` plugin | Only needed on Android WebView for `SpeechRecognition`; declared in `AndroidManifest.xml` so voice input works on a physical device. |

---

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| NativeWind preset produces RN-only CSS | Frontend Tailwind config drops `nativewind/preset`; the custom `light`/`dark` variants are re-implemented with the same `:root[data-theme]` selectors so `bg-background` etc. keep working. |
| `Modal` + `animationType="slide"` has no web equivalent | A `Sheet` component reproduces the exact geometry, scrim opacity, `translateY` slide transition, `max-h`, and body-scroll lock. |
| `Alert.alert` has no web equivalent | An `AppDialog` component renders the same title/message/OK affordance, centred on desktop and bottom-anchored on mobile, so the visual rhythm of the original flows is preserved. |
| Static export forbids Next.js server features | Frontend is 100 % client components; all data comes from the Express REST API. No Server Actions, no SSR-only routes, `images.unoptimized = true`, `trailingSlash = true`. |
| Android WebView `http://` cleartext to a LAN backend | `android:usesCleartextTraffic="true"` in debug builds + documented production HTTPS requirement. |
| Losing the original MySQL data | `backend/src/scripts/migrate-mysql-to-mongo.ts` reads `DATABASE_URL_LEGACY` and upserts into MongoDB; it never truncates and is idempotent. |
| AI assistant quality regression | The backend keeps the original deterministic reply engine as a fallback, so the assistant works with no LLM key configured and matches current behaviour exactly. |

---

## 11. Phased execution order

1. Inspect and document — **this document**.
2. Create the folder structure and root workspace files.
3. Migrate shared types and backend functionality.
4. Configure MongoDB (models, indexes, seed, MySQL→Mongo migration script).
5. Migrate frontend pages and components.
6. Reconnect every frontend feature to the backend.
7. Configure Capacitor.
8. Build and verify (typecheck, tests, static export).
9. Visual and functional regression testing.
10. Deployment documentation.

---

## 12. Backend build notes (Phase 4 complete)

### Verification status

| Check | Command | Result |
| --- | --- | --- |
| Shared types | `pnpm --filter @janasheba/shared typecheck` | pass |
| Backend typecheck | `pnpm --filter @janasheba/backend typecheck` | pass |
| Unit tests | `pnpm --filter @janasheba/backend test` | 37 passed |
| HTTP smoke | `pnpm --filter @janasheba/backend test:smoke` | 13 passed |
| MongoDB integration | `pnpm --filter @janasheba/backend test:integration` | 63 passed |
| Production bundle | `pnpm --filter @janasheba/backend build` | `dist/server.js` 79.9 kb |

The API surface is documented in `docs/BACKEND_API.md`.

### Parity notes for the frontend migration

1. **`officialSource` is a bare domain, `applicationUrl` is a full URL.**
   The seed data keeps `officialSource: "epassport.gov.bd"`, and the original UI
   called `Linking.openURL(`https://${service.officialSource}`)`. The frontend
   must do the same for `officialSource` but use `applicationUrl` verbatim.
   This is asserted in `backend/tests/domain.test.ts`.
2. **Search runs over Bengali text regardless of `lang`.** `GET /government/search`
   and `/government/context` match the Bengali source records and only then apply
   the English override for display, which is what the original did.
3. **`getMatchedServiceIds` is the single source of truth** for profile matching
   and is called on both sides. The backend only persists the result; it never
   re-implements the rules.
4. **Profile fields are strings, age is a number in Mongo and a string in the
   API**, matching `lib/profile-context.tsx`.
5. **Empty optional profile fields normalise to `null`**, never `""`.

### Gotchas already handled

- Mongoose projections are **inclusive**: `find({}, { translation: 1 })` silently
  drops every other field. `listServices` therefore uses an unprojected query.
- Express 4 does not catch rejected promises, so every async route handler is
  wrapped in `asyncHandler` from `utils/api-error.ts`.
- `esbuild` and Vitest cannot follow the workspace `exports` map for a linked
  package whose targets are raw `.ts` files, so `build.mjs` and `vitest.config.ts`
  alias `@janasheba/shared` to `shared/types` explicitly.
- `InferSchemaType` does not guarantee `createdAt`/`updatedAt`, so the models
  that expose timestamps declare them explicitly.

### Original Expo manifest recovery

The original root `package.json` was overwritten when the monorepo root was
created, and `pnpm install` replaced `pnpm-lock.yaml`. Both were recovered:

- `legacy-expo-package.json` — the original manifest rebuilt from the dependency
  specifiers recorded in the lockfile (50 dependencies, 18 devDependencies).
  Its `scripts` block was **reconstructed, not recovered**.
- `pnpm-lock.expo-original.yaml` — the untouched original lockfile.

The original source trees (`app/`, `server/`, `shared/`, `drizzle/`,
`components/`, `lib/`, `assets/`, `tsconfig.json`) are unmodified.

### Outstanding work

- Phases 5-7: Next.js frontend, REST reconnection, Capacitor.
- Phases 8-10: regression testing, APK build, deployment documentation.
- `backend/src/scripts/migrate-mysql-to-mongo.ts` is referenced by
  `db:migrate-mysql` but has not been written yet.

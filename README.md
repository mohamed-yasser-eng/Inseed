<!-- ════════════════════════════════════════════════════════════════ -->
<!--  HEADER BANNER                                                     -->
<!-- ════════════════════════════════════════════════════════════════ -->

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:1f6feb,100:58a6ff&height=200&section=header&text=Kindred&fontSize=70&fontColor=ffffff&fontAlignY=35&desc=Social-networking%20backend%20%E2%80%94%20REST%20%C2%B7%20GraphQL%20%C2%B7%20WebSocket&descSize=18&descAlignY=58&descColor=c9d1d9&animation=fadeIn" width="100%" />

<!-- ════════════════════════════════════════════════════════════════ -->
<!--  TYPING SVG                                                        -->
<!-- ════════════════════════════════════════════════════════════════ -->

<p align="center">
  <a href="https://github.com/mohamed-sangak/Kindred">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=58A6FF&center=true&vCenter=true&width=620&lines=Three+API+surfaces%2C+one+domain+core.;REST+%2B+GraphQL+%2B+WebSocket+over+TypeScript.;MongoDB+%C2%B7+Redis+%C2%B7+S3+%E2%80%94+layered+%26+strict." alt="Typing SVG" />
  </a>
</p>

<!-- ════════════════════════════════════════════════════════════════ -->
<!--  BADGES                                                            -->
<!-- ════════════════════════════════════════════════════════════════ -->

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.6_strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-58A6FF?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/github/stars/YOUR_USERNAME/YOUR_REPO?style=for-the-badge&color=1f6feb&logo=github&logoColor=white" alt="Stars" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/OpenAPI-3.0-6BA539?style=flat-square&logo=openapiinitiative&logoColor=white" alt="OpenAPI" />
  <img src="https://img.shields.io/badge/Swagger-UI-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/JWT-revocable-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

---

A community networking backend in TypeScript that serves three coordinated API surfaces — **REST**, **GraphQL**, and **WebSocket** — over one shared domain core (MongoDB + Redis + S3).

<!-- ════════════════════════════════════════════════════════════════ -->
<!--  TECH STACK ICONS                                                  -->
<!-- ════════════════════════════════════════════════════════════════ -->

## 🛠 Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,nodejs,express,mongodb,redis,graphql,aws,docker&perline=8" alt="Tech stack" />
</p>

| Area | Choice |
| --- | --- |
| Runtime / language | Node.js, TypeScript 5.6 (`strict`) |
| HTTP | Express 5 |
| Database | MongoDB + Mongoose 7 |
| Read API | GraphQL (`graphql` + `graphql-http`) |
| Realtime | Socket.IO 4 |
| Cache / rate-limit store | Redis (`ioredis`) |
| Object storage | AWS S3 (SDK v3) |
| Auth / crypto | `jsonwebtoken`, `bcrypt`, `node:crypto` (AES-256-CBC) |
| Validation / docs | Zod 4, `swagger-ui-express` |

---

## ✨ Features

- **Auth** — local email/password with email-OTP verification; JWT access/refresh tokens with revocation (sign-out blacklists tokens).
- **Social graph** — friend requests, accept/reject, friends-only groups.
- **Content** — posts with image attachments and friend tagging; arbitrarily deep comment threads; typed reactions (like/love/haha/sad/angry).
- **Real-time chat** — 1:1 and group messaging over Socket.IO, multi-tab presence aware.
- **Aggregated reads** — a GraphQL feed, post detail, profile dashboard, and conversations.
- **Media** — AWS S3-backed uploads with presigned URLs.
- **Self-documenting** — OpenAPI 3.0 spec generated from the request validators, served via Swagger UI.

---

## 🏛 Architecture

Layered architecture with a single direction of dependency. The three transports are siblings that converge on the same services, repositories, and models.

```
            REST  /api/*          GraphQL  /graphql (read-only)        Socket.IO  ws
               │                          │                                 │
               └──────────────┬───────────┴─────────────────┬───────────────┘
                              ▼                              ▼
                    Services (business logic)   ◄──   cross-cutting middleware
                              ▼                        (auth, validation,
                    Repositories (BaseRepository<T>)    rate limit, upload)
                              ▼
                    Mongoose Models
                              ▼
                MongoDB  ·  Redis  ·  S3
```

**REST request flow:** `index.ts` → controller (`express.Router`) → middleware chain → service → repository → model.

---

## 🚀 Getting Started

### Prerequisites
Node.js (Docker image pins Node 24), and access to MongoDB, Redis, an S3 bucket, and an SMTP server.

### Install & run
```bash
cd BE
npm install
cp .env.example .env     # fill in every key (see note below)
npm run dev              # watch mode (nodemon)
```

| Script | Action |
| --- | --- |
| `npm run dev` | Compile + run with nodemon |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run the built server |
| `npm run typecheck` / `npm test` | `tsc --noEmit` |
| `npm run export-spec` | Write the OpenAPI spec to `openapi.json` |

### Configuration
`src/Config/env.config.ts` validates the whole environment with Zod at startup and **exits if any variable is missing or invalid** — the app won't boot half-configured. Key constraints: `ENCRYPTION_SECRET_KEY` must be exactly 32 chars, `JWT_PREFIX` must be `Bearer`.


### Docker
```bash
docker build -t kindred-backend .
docker run --env-file .env -p 5000:5000 kindred-backend
```

---

## 📡 API

Protected requests send `Authorization: Bearer <accessToken>`. Every response uses one envelope: `{ meta: { status, success, message }, data | error }`.

| Surface | Entry point |
| --- | --- |
| Swagger UI | `GET /api-docs` |
| Raw OpenAPI spec | `GET /api-docs.json` |
| Health probe | `GET /health` |
| REST | `/api/auth`, `/api/users`, `/api/posts`, `/api/comments`, `/api/reacts` |
| GraphQL (read-only) | `POST /graphql` — `feed`, `postDetails`, `profileDashboard`, `conversations` |
| Socket.IO | `send-private-message`, `get-chat-history`, `send-group-message`, `get-group-chat` |

Full contract: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) and [`WEBSOCKET.md`](./WEBSOCKET.md).

---

## 📂 Project Structure

```
BE/src/
├── index.ts          # app wiring, middleware order, error sink, server + io bootstrap
├── Config/           # env (Zod-validated), redis, swagger
├── Common/           # shared enums, interfaces, types
├── Db/
│   ├── Models/       # Mongoose schemas, indexes, validate hooks
│   └── Repositories/ # BaseRepository<T> + concrete repos
├── Modules/          # feature modules (controller + service): Users, Posts, Comments, Reacts, Chat
├── Middlewares/      # authentication, validation, rate-limit, multer
├── GraphQl/          # schema, context (own auth path), resolvers, mappers
├── Gateways/         # Socket.IO init, handshake auth, presence
├── Validators/       # Zod schemas — single source for requests, OpenAPI, socket payloads
├── Docs/             # OpenAPI registry, paths, responses
└── Utils/            # crypto, token, hash, S3, email, pagination, responses, errors
```

---

## 🗺 Roadmap

- Behavioral test suite + CI pipeline (current verification is `tsc --strict` + Zod validation; `npm test` runs the type-check).
- Wrap the deletion cascade in a MongoDB transaction (session) to close the partial-orphan window.
- Refresh-token rotation with reuse detection.
- Extend feed-style batching (or DataLoader) to the `postDetails` comment thread.
- Replace the in-process email `EventEmitter` with a durable queue (retries, dead-letter).

<!-- ════════════════════════════════════════════════════════════════ -->
<!--  FOOTER                                                            -->
<!-- ════════════════════════════════════════════════════════════════ -->

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:58a6ff,50:1f6feb,100:0d1117&height=120&section=footer" width="100%" />
# Resignal Backend

Backend service for the Resignal iOS app — an AI-powered interview coaching platform that analyzes interview transcripts and provides structured feedback with interactive follow-up chat.

## Tech Stack

- **Runtime**: Node.js + TypeScript (ESM modules)
- **Framework**: [Fastify](https://fastify.dev/)
- **AI**: Google Gemini (`gemini-3-flash-preview` via `@google/generative-ai`)
- **Database**: [Neon](https://neon.tech/) (serverless PostgreSQL via `@neondatabase/serverless`)
- **Validation**: [Zod](https://zod.dev/)
- **Deployment**: Vercel Serverless (production) / tsx watch (local development)

## Architecture Overview

The system follows a **layered architecture** with clear separation of concerns, protocol-based programming (TypeScript interfaces), and dependency injection.

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Layer                         │
│              routes/api/*.ts                         │
│         (Fastify route plugins)                      │
├──────────────┬──────────────────┬───────────────────┤
│   AI Layer   │  Prompt Layer    │  Utility Layer     │
│   ai/*.ts    │  prompt/*.ts     │  lib/*.ts          │
├──────────────┴──────────────────┴───────────────────┤
│                Data Access Layer                     │
│   db/*Repository.ts  (interfaces + implementations) │
├─────────────────────────────────────────────────────┤
│              Neon Serverless PostgreSQL              │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── index.ts                  # Entry point — loads env, starts Fastify server
├── server.ts                 # Fastify app setup, route registration, Vercel export
├── ai/                       # AI provider layer
│   ├── AIProvider.ts         # Interfaces: AIProvider, AIRequest, AIResponse, etc.
│   ├── Gemini.ts             # GeminiProvider — primary AI implementation
│   ├── DeepSeek.ts           # DeepSeekProvider — placeholder/alternate provider
│   ├── Router.ts             # ModelRouter — selects the active AI provider
│   └── responseValidator.ts  # Zod schema for validating/normalizing AI output
├── db/                       # Data access layer (Repository pattern)
│   ├── types.ts              # Domain models: User, Interview, InterviewContext, etc.
│   ├── UserRepository.ts             # Interface
│   ├── InterviewRepository.ts        # Interface
│   ├── InterviewContextRepository.ts # Interface
│   ├── InterviewMessageRepository.ts # Interface
│   ├── Neon*.ts              # Production implementations (Neon PostgreSQL)
│   └── Mock*.ts              # In-memory implementations (testing)
├── prompt/
│   └── prompt.ts             # Prompt engineering — builds all AI prompts
├── routes/api/
│   ├── interviews.ts         # POST /api/interviews, GET /api/interviews/:id/messages
│   ├── messages.ts           # POST /api/messages
│   └── users.ts              # POST /api/users
├── lib/
│   └── rateLimit.ts          # In-memory sliding-window rate limiter
└── plugins/
    └── neon.ts               # Fastify plugin for DB health checks & manual testing
```

## Design Principles

### 1. Protocol-Based Programming (Repository Pattern)

All data access is defined through TypeScript interfaces, decoupling business logic from storage implementation:

- `UserRepository` — user CRUD
- `InterviewRepository` — interview transcript storage
- `InterviewContextRepository` — AI feedback context storage
- `InterviewMessageRepository` — chat message history

Each interface has two implementations:
- **`Neon*Repository`** — production implementation using Neon serverless PostgreSQL
- **`Mock*Repository`** — in-memory implementation with `clear()` and `seed()` helpers for testing

### 2. Strategy Pattern (AI Providers)

The `AIProvider` interface defines the contract for all AI operations:

| Method       | Purpose                                                  |
|--------------|----------------------------------------------------------|
| `interview`  | Analyze a transcript and produce structured feedback     |
| `chat`       | Answer follow-up questions about a previous interview    |
| `classify`   | Categorize a user question to determine context needs    |

`ModelRouter` selects the active provider based on the `DEFAULT_MODEL` environment variable, making it trivial to swap or add AI backends.

### 3. Dependency Injection

Repositories are injected into providers and route handlers via constructor parameters rather than being hard-coded, enabling testability and flexibility.

### 4. Prompt Separation

All prompt engineering lives in `prompt/prompt.ts`, cleanly separated from the AI provider logic. Three prompt builders exist:

- `buildPrompt` — interview analysis prompt (produces structured JSON feedback)
- `buildClassificationPrompt` — classifies follow-up questions into context tiers
- `buildChatPrompt` — enriches follow-up questions with interview context

## Core Flows

### Interview Analysis

```
Client                     Server                      AI (Gemini)          Database
  │                          │                            │                    │
  │  POST /api/interviews    │                            │                    │
  │  { input, locale,        │                            │                    │
  │    image? }              │                            │                    │
  │─────────────────────────>│                            │                    │
  │                          │── rate limit check ──>     │                    │
  │                          │── validate image ──>       │                    │
  │                          │                            │                    │
  │                          │── createInterview ────────────────────────────>│
  │                          │<─────────────── interviewId ──────────────────│
  │                          │                            │                    │
  │                          │── generateContent ───────>│                    │
  │                          │<── structured JSON ───────│                    │
  │                          │                            │                    │
  │                          │── Zod validate & normalize │                    │
  │                          │── createContext ──────────────────────────────>│
  │                          │                            │                    │
  │<─── { interview_id,     │                            │                    │
  │       reply: feedback }  │                            │                    │
```

1. Client submits an interview transcript (text, optionally with a base64-encoded image).
2. Request is rate-limited by `x-client-id` header (20 requests/min per client).
3. Image is validated (allowed types: PNG/JPEG/GIF/WebP, max 3 MB).
4. An `Interview` record is persisted to the database.
5. The AI generates a structured evaluation (title, summary, strengths, improvements, hiring signal, key observations).
6. The response is validated and normalized through a Zod schema (handles string-vs-array inconsistencies).
7. The AI feedback is stored as `InterviewContext` for future chat.

### Follow-Up Chat (Ask)

```
Client                     Server                      AI (Gemini)          Database
  │                          │                            │                    │
  │  POST /api/messages      │                            │                    │
  │  { interview_id,         │                            │                    │
  │    message, user_id }    │                            │                    │
  │─────────────────────────>│                            │                    │
  │                          │── classify question ─────>│                    │
  │                          │<── category ──────────────│                    │
  │                          │                            │                    │
  │                          │── load context ───────────────────────────────>│
  │                          │── load transcript (if specific) ─────────────>│
  │                          │                            │                    │
  │                          │── buildChatPrompt          │                    │
  │                          │── generateContent ───────>│                    │
  │                          │<── reply ─────────────────│                    │
  │                          │                            │                    │
  │                          │── store user message ────────────────────────>│
  │                          │── store AI reply ────────────────────────────>│
  │                          │                            │                    │
  │<─── { reply, messageId } │                            │                    │
```

The chat flow uses a **three-tier context classification** system to optimize token usage:

| Category     | Context Loaded                    | Use Case                                   |
|--------------|-----------------------------------|---------------------------------------------|
| `global`     | Structured feedback only          | "How did I do?", "What's my hiring signal?" |
| `targeted`   | Structured feedback only          | "Elaborate on my communication skills"      |
| `specific`   | Feedback + full transcript        | "What did I say about database design?"     |

## Data Model

| Entity              | Key Fields                                             |
|---------------------|--------------------------------------------------------|
| **User**            | `id`, `email`, `plan` (free / pro), `createdAt`       |
| **Interview**       | `id`, `userId`, `transcript`, `createdAt`              |
| **InterviewContext** | `interviewId`, `contextJson` (AI feedback), `model`, `createdAt` |
| **InterviewMessage** | `id`, `interviewId`, `role` (user / ai), `content`, `createdAt` |

## API Endpoints

| Method | Path                                  | Description                            |
|--------|---------------------------------------|----------------------------------------|
| GET    | `/health`                             | Server health check                    |
| POST   | `/api/interviews`                     | Submit transcript for AI analysis      |
| GET    | `/api/interviews/:interviewId/messages` | Load chat history for an interview   |
| POST   | `/api/messages`                       | Send a follow-up question              |
| POST   | `/api/users`                          | Create a new user                      |
| GET    | `/db/health`                          | Database health check                  |

## Cross-Cutting Concerns

- **Rate Limiting**: In-memory sliding window — 20 requests per minute per client ID.
- **Retry with Exponential Backoff**: AI calls automatically retry on 503/overloaded errors (up to 3 retries: 1s, 2s, 4s delays).
- **Response Validation**: Zod schema normalizes AI output, gracefully handling cases where the model returns strings instead of arrays.
- **Multimodal Support**: Interview analysis accepts optional base64-encoded images alongside text transcripts.

## Getting Started

```bash
# Install dependencies
npm install

# Local development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

| Variable         | Description                           |
|------------------|---------------------------------------|
| `GEMINI_API_KEY` | Google Gemini API key                 |
| `DATABASE_URL`   | Neon PostgreSQL connection string     |
| `DEFAULT_MODEL`  | AI provider to use (default: `gemini`)|

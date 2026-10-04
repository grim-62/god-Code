# god-code

god-code is a MERN coding-practice platform with problem management, Judge0 execution, asynchronous submissions, user stats, and timed exams.

## Project layout

```text
client/
  src/
    api/                 Axios client
    app/                 Redux store
    components/          Shared UI and route guards
    features/            Auth and problem Redux slices
    pages/               Problem, profile, exam, and admin pages
    routes/              React Router configuration
server/
  src/
    config/              MongoDB and Redis connections
    controllers/         HTTP handlers
    middleware/          Auth, validation, and error handling
    models/              User, Problem, Submission, and Exam
    queues/              BullMQ queues
    routes/              API routes
    services/            Submission judging service
    utils/               Judge0 client and helpers
    workers/             Background submission worker
    seed.js               Repeatable sample-data seed
```

The active applications are `client/` and `server/`. `judge0/` contains the pinned Judge0 source used to build the self-hosted code-execution service, and `scripts/` contains environment and Judge0 configuration helpers.

## Requirements

- Node.js 20 or newer
- MongoDB
- Redis
- A reachable Judge0 API or self-hosted Judge0 instance
- Docker Compose (for the all-in-one container setup below)

## Configure

All local and Docker settings are in the root `.env`. Create it with `npm run docker:init-env`; the helper uses `.env.example`, creates unique secrets, and never overwrites an existing file. Keep `.env` private and do not commit production secrets.

For local development outside Docker, start MongoDB and Redis on localhost, then set `JUDGE0_URL` and `JUDGE0_API_KEY` in the root `.env` to a reachable Judge0 instance (or use the self-hosted Docker stack instead). The server, worker, seed script, and Vite client all read the root environment file; Vite proxies `/api` to the local API.

## Deploy the full stack with Docker

The root `compose.yaml` starts the client, API, submission worker, MongoDB, Redis, and a self-hosted Judge0 instance with its own PostgreSQL and Redis services. This is a single-host deployment; all application settings are loaded from the single root `.env` file. The pinned Judge0 v1.13.1 source is in `judge0/`; Compose builds one `god-code-judge0:1.13.1` image from its upstream production Dockerfile and uses that image for the separate Judge0 API and worker containers. The Nginx, MongoDB, PostgreSQL, and Redis image tags follow maintained release lines; regularly rebuild and deploy updates, and pin image digests if strict reproducibility is required.

Create the root `.env` with fresh, unique secrets and start the stack:

```sh
npm run docker:init-env
npm run docker:up
```

The initializer creates `.env` from `.env.example` and generates four unique 256-bit secrets. It also sets `JUDGE0_API_KEY` to the Judge0 authentication token. It will not overwrite an existing `.env`. Keep this file private and do not commit it. Compose publishes only the client port (`HTTP_PORT`, default `80`); Nginx serves the UI and proxies `/api` to the API. Judge0 and the databases stay on the private Compose network.

Before a public deployment, replace the development `CORS_ORIGIN` with the exact public UI origin (for example, `https://app.example.com`). Keep the root `.env` out of source control and use unique production secrets. The API trusts one proxy hop by default; configure the hop count to match the actual reverse-proxy chain. The bundled Nginx configuration serves HTTP only; terminate HTTPS at a trusted reverse proxy or load balancer in front of the published client port, and do not expose the application publicly over plain HTTP.

For a complete EC2 deployment using Caddy for HTTPS, see [EC2_DEPLOYMENT.md](./EC2_DEPLOYMENT.md). It configures the container listener on localhost and the correct two trusted proxy hops (Caddy and Nginx).

The complete Judge0 image is several gigabytes, so the first build and startup can take a while. Check the deployment with:

```sh
docker compose ps
curl http://localhost/api/health
docker compose logs --tail=100 judge0-server judge0-workers
```

Stop services without deleting database volumes with `npm run docker:down`.

### Publish on an EC2 instance

Follow [EC2_DEPLOYMENT.md](./EC2_DEPLOYMENT.md) for instance sizing, cgroup verification, Docker installation, private port binding, HTTPS with Caddy, deployment, and operations.

HTTP is suitable only for a temporary smoke test. For a public production deployment with real accounts, use a domain and HTTPS before accepting credentials. Back up Docker volumes; `docker compose down -v` permanently deletes the app and Judge0 database data.

## Install and run

Install dependencies in both applications and at the repository root:

```sh
cd server
npm install
cd ../client
npm install
cd ..
npm install
```

Start MongoDB and Redis, then start the API and client together from the repository root:

```sh
npm run docker:init-env
npm run dev
```

The root command runs the server and Vite client concurrently. Vite reads `VITE_API_BASE_URL` from the root `.env` and proxies `/api` requests to the API. To run the submission worker, start it separately:

```sh
cd server
npm run worker
```

Vite serves the client at `http://localhost:5173`; the API defaults to `http://localhost:5000/api`. Keep the API and submission worker running for Run, Submit, and contest judging.

## Sample data

The seed script creates or updates four problems, three exams (live, upcoming, and past), and four example submissions. It does **not** create, update, or delete users. Those records need a user reference, so the script uses an existing account: set `SEED_USER_ID` to that account's MongoDB ObjectId, or it will use the oldest existing account.

Register an account first, then run:

```sh
cd server
npm run seed
```

Optional explicit account selection:

```dotenv
SEED_USER_ID=your-existing-user-object-id
```

The seed records use fixed IDs and are idempotent. Rerunning the script refreshes only those sample problem, exam, and submission records. The live/upcoming/past exam dates are recalculated relative to the seed run time. A past exam includes the selected existing account as a sample participant; no user document is inserted.

Admin pages require an account whose `role` is `admin`. For local development, promote an account you registered yourself in `mongosh`:

```javascript
db.users.updateOne(
  { email: 'your-email@example.com' },
  { $set: { role: 'admin' } },
)
```

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health check |
| `POST` | `/api/auth/register` | Register an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Current account |
| `GET` | `/api/problems` | Search/filter problems; includes per-user solved flags when signed in |
| `GET` | `/api/problems/:slug` | Public problem details and visible samples |
| `POST` | `/api/run` | Run visible sample cases through Judge0 (authenticated) |
| `POST` | `/api/submissions` | Queue a full submission (authenticated) |
| `GET` | `/api/submissions/:id` | Poll submission status (owner/admin) |
| `GET` | `/api/submissions?problemId=...` | Current account's problem history |
| `GET` | `/api/users/me/stats` | Profile stats and 365-day activity (authenticated) |
| `GET` | `/api/exams` | List scheduled exams |
| `POST` | `/api/exams/:id/start` | Start with a server-recorded personal deadline |
| `GET` | `/api/exams/:id/leaderboard` | Contest standings |

Admin problem and exam management routes are protected by the admin role. Exam submissions must include `examId`; the server verifies participation, problem membership, and the stored deadline before queueing them.

## Build

```sh
cd client
npm run build
```

The Express API and BullMQ worker are started separately. The worker requires MongoDB and Redis; code execution is sent to Judge0 and never run in the Express process.
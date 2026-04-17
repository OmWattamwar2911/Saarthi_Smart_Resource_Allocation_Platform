# Saarthi Smart Resource Allocation Platform

Saarthi is a full-stack crisis response platform for managing disaster-relief needs, volunteers, AI-assisted matching, alerts, and reporting in one operational dashboard.

## What The Website Does

The platform is designed for district-level control rooms and relief operators.

- Tracks incoming needs by urgency, category, and zone
- Maintains a live pool of volunteers and their availability
- Generates AI-assisted need-volunteer matches with confidence scores
- Raises and manages system alerts for critical pressure zones
- Provides analytics for summary, zone priority, categories, and timeline trends
- Generates impact and donor-style reports from live operational data

## How The Website Functions End To End

### 1) Data Intake

Operators create needs and volunteers through the UI.

- Needs are stored with fields like title, category, urgency, zone, and status
- Volunteers are stored with role, skills, zone, and availability

### 2) Live Operations Layer

The backend exposes REST APIs under `/api/v1/*` and emits Socket.IO events for near real-time updates.

- Frontend uses React Query to fetch and cache data
- UI sections refresh when mutations succeed and cache is invalidated
- Socket events support live awareness for new/updated entities

### 3) AI Matching

The matching flow ranks suitable volunteers for open needs.

- Match confidence and reasoning are shown in the dashboard and matching views
- Operators can confirm or reject suggested assignments

### 4) Analytics And Monitoring

Analytics endpoints compute operational metrics used by dashboard cards and charts.

- Open needs
- Active volunteers
- Match confidence
- Zone pressure and category distribution
- Timeline trends

### 5) Alerts And Escalation

Critical conditions (including scheduled backend checks) can create alerts.

- Alerts can be reviewed, escalated, and resolved from the UI
- This helps prioritize interventions where load is high

### 6) Reports

Operators can generate report entries from live metrics.

- Impact reporting for operations view
- Donor-style exports for communication and accountability

## Tech Stack

- Frontend: React, Vite, React Router, React Query, Axios, Socket.IO Client
- Backend: Node.js, Express, Socket.IO, Mongoose, JWT auth, node-cron
- Storage: MongoDB (with in-memory-safe behavior when DB is unavailable)

## Project Structure

- `frontend/`: UI application and page components
- `backend/`: API server, business logic, models, and scheduled jobs
- `package.json` (root): convenience scripts to run both apps together

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB (optional but recommended for persistent data)

### Install

```bash
npm run install:all
```

### Configure Backend

1. Copy example environment file:

```bash
cd backend
copy .env.example .env
```

2. Update values in `backend/.env` as needed (PORT, FRONTEND_URL, MONGO_URI, GEMINI_API_KEY).

### Run Frontend And Backend Together

From repository root:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`
- Health: `http://localhost:5000/api/v1/health`

## Main API Areas

- `/api/v1/auth`
- `/api/v1/needs`
- `/api/v1/volunteers`
- `/api/v1/matches`
- `/api/v1/alerts`
- `/api/v1/analytics`
- `/api/v1/reports`
- `/api/v1/settings`
- `/api/v1/activity`
- `/api/v1/ai`

## Show This Repo On Your GitHub Profile

To make this repository visible on your profile page:

1. Open your profile: `https://github.com/OmWattamwar2911`
2. Click **Customize your pins**
3. Select `Saarthi_Smart_Resource_Allocation_Platform`
4. Save

## Make Commits Count As Profile Contributions

For commits to appear in the contribution graph, ensure all of the following:

1. Commits are pushed to the repository default branch (`main`) or `gh-pages`
2. The commit email matches an email verified in your GitHub account settings
3. The repository is not a fork, or the commit is made in the fork default branch
4. Profile contribution visibility settings allow private contributions if repo is private

You can verify commit email in this repo with:

```bash
git config user.name
git config user.email
```

If needed, set them:

```bash
git config user.name "OmWattamwar2911"
git config user.email "your_verified_email@example.com"
```

Then make a new commit and push to `main`.

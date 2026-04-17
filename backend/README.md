# Saarthi Backend

Production-ready Node/Express backend with optional MongoDB and optional Gemini integration.

## 1) Local Run

1. Create env file:

   copy .env.example .env

2. Update values in .env as needed.

3. Install and run:

   npm install
   npm run dev

Health check:

- GET /api/health

## 2) Environment Variables

- PORT: Server port (default 5000)
- NODE_ENV: development | production
- CORS_ORIGIN: Comma-separated origins or *
- MONGO_URI: MongoDB connection string (optional)
- GEMINI_API_KEY: Gemini API key (optional)

If MONGO_URI is empty, backend runs in in-memory mode.
If GEMINI_API_KEY is empty, AI endpoints return deterministic fallback text.

## 3) Deployment Targets

### Render

Use backend/render.yaml (Render Blueprint) or create service manually:

- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Health Check Path: /api/health

Set env vars in Render dashboard:

- NODE_ENV=production
- CORS_ORIGIN=https://your-frontend-domain.com
- MONGO_URI=...
- GEMINI_API_KEY=...

### Railway

railway.json is included.

Set env vars in Railway Variables:

- NODE_ENV=production
- CORS_ORIGIN=https://your-frontend-domain.com
- MONGO_URI=...
- GEMINI_API_KEY=...

### VPS / Docker

Build and run:

- docker build -t saarthi-backend .
- docker run -p 5000:5000 --env-file .env saarthi-backend

## 4) API Endpoints

- GET /api/health
- GET /api/needs
- POST /api/needs
- PATCH /api/needs/:id/resolve
- GET /api/volunteers
- POST /api/volunteers
- POST /api/ai/match
- POST /api/ai/generate
- POST /api/reports/generate

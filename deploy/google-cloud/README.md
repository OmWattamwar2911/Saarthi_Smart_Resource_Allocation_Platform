# Saarthi Hosting on Google Cloud

This guide deploys:
- Backend API to Cloud Run
- Frontend (Vite static build) to Cloud Run

## 1) Prerequisites

Install and login:
- Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- gcloud init
- gcloud auth login
- gcloud auth application-default login

Set these values in PowerShell:

```powershell
$PROJECT_ID = "your-gcp-project-id"
$REGION = "asia-south1"
$BACKEND_SERVICE = "saarthi-backend"
$FRONTEND_SERVICE = "saarthi-frontend"
$MONGO_URI = "your-mongodb-connection-string"
$JWT_SECRET = "your-jwt-secret"
$GEMINI_API_KEY = "your-gemini-api-key"
$GCP_LOCATION = "us-central1"
```

Set project and enable APIs:

```powershell
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create saarthi --repository-format=docker --location $REGION --description "Saarthi deployment images"
```

## 2) Deploy Backend (Cloud Run)

From repo root:

```powershell
gcloud run deploy $BACKEND_SERVICE `
  --source backend `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=*,MONGO_URI=$MONGO_URI,JWT_SECRET=$JWT_SECRET,GEMINI_API_KEY=$GEMINI_API_KEY,GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=$GCP_LOCATION,GEMINI_MODEL=gemini-2.0-flash"
```

Get backend URL:

```powershell
$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)"
$BACKEND_API_URL = "$BACKEND_URL/api/v1"
Write-Host "Backend API URL: $BACKEND_API_URL"
```

## 3) Deploy Frontend (Cloud Run)

Build and deploy frontend container with API URL baked into Vite env:

```powershell
gcloud artifacts repositories describe saarthi --location $REGION

$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/saarthi/$FRONTEND_SERVICE:latest"

gcloud builds submit frontend `
  --config frontend/cloudbuild.yaml `
  --substitutions "_IMAGE=$FRONTEND_IMAGE,_VITE_API_URL=$BACKEND_API_URL"

gcloud run deploy $FRONTEND_SERVICE `
  --image "$FRONTEND_IMAGE" `
  --region $REGION `
  --allow-unauthenticated
```

Get frontend URL:

```powershell
$FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)"
Write-Host "Frontend URL: $FRONTEND_URL"
```

## 4) Lock CORS to Frontend URL (Recommended)

After frontend URL is known, update backend CORS:

```powershell
gcloud run services update $BACKEND_SERVICE `
  --region $REGION `
  --set-env-vars "CORS_ORIGIN=$FRONTEND_URL"
```

## 5) Domain and HTTPS (Optional)

Cloud Run gives HTTPS by default on run.app domain.
For custom domain:

```powershell
gcloud run domain-mappings create --service $FRONTEND_SERVICE --domain yourdomain.com --region $REGION
```

## 6) Notes

- Backend health check: $BACKEND_URL/api/v1/health
- Frontend health check: $FRONTEND_URL/healthz
- If you change backend URL later, rebuild and redeploy frontend with new VITE_API_URL.

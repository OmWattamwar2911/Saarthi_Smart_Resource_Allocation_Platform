#!/bin/bash
# One-command full deployment to Google Cloud for Saarthi.
# This script enables APIs, builds images with commit SHA tags,
# deploys backend/frontend to Cloud Run, and validates health.

set -euo pipefail

PROJECT_ID="your-gcp-project-id"
REGION="asia-south1"
REPOSITORY="saarthi"
GIT_SHA="$(git rev-parse --short HEAD)"
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/saarthi-backend:${GIT_SHA}"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/saarthi-frontend:${GIT_SHA}"

echo "Starting Saarthi deployment to Google Cloud..."

echo "Step 1: Set active GCP project"
gcloud config set project "$PROJECT_ID"

echo "Step 2: Enable required Google Cloud APIs"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  compute.googleapis.com \
  certificatemanager.googleapis.com \
  dns.googleapis.com \
  storage.googleapis.com \
  translate.googleapis.com \
  speech.googleapis.com \
  calendar-json.googleapis.com \
  bigquery.googleapis.com \
  firebase.googleapis.com

echo "Step 3: Create Artifact Registry repository if missing"
if ! gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION"
fi

echo "Step 4: Configure Docker authentication for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "Step 5: Build and push backend image tagged with commit SHA"
docker build -t "$BACKEND_IMAGE" -f backend/Dockerfile backend
docker push "$BACKEND_IMAGE"

echo "Step 6: Deploy backend to Cloud Run"
gcloud run deploy saarthi-backend \
  --image="$BACKEND_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=5000 \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=80 \
  --timeout=300 \
  --min-instances=1 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,GCP_PROJECT_ID=GCP_PROJECT_ID:latest,GCP_LOCATION=GCP_LOCATION:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_TRANSLATE_KEY=GOOGLE_TRANSLATE_KEY:latest,GOOGLE_CLOUD_SPEECH_KEY=GOOGLE_CLOUD_SPEECH_KEY:latest,GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,BIGQUERY_PROJECT_ID=BIGQUERY_PROJECT_ID:latest,BIGQUERY_DATASET=BIGQUERY_DATASET:latest,GOOGLE_CALENDAR_CLIENT_ID=GOOGLE_CALENDAR_CLIENT_ID:latest,GOOGLE_CALENDAR_CLIENT_SECRET=GOOGLE_CALENDAR_CLIENT_SECRET:latest,GOOGLE_CALENDAR_REFRESH_TOKEN=GOOGLE_CALENDAR_REFRESH_TOKEN:latest,FRONTEND_URL=FRONTEND_URL:latest"

BACKEND_URL="$(gcloud run services describe saarthi-backend --region="$REGION" --format="value(status.url)")"
echo "Backend deployed at: ${BACKEND_URL}"

echo "Step 7: Build and push frontend image with build-time VITE variables"
VITE_API_URL="$(gcloud secrets versions access latest --secret=VITE_API_URL 2>/dev/null || true)"
VITE_SOCKET_URL="$(gcloud secrets versions access latest --secret=VITE_SOCKET_URL 2>/dev/null || true)"
VITE_GOOGLE_MAPS_API_KEY="$(gcloud secrets versions access latest --secret=VITE_GOOGLE_MAPS_API_KEY 2>/dev/null || true)"

if [[ -z "${VITE_API_URL}" ]]; then
  VITE_API_URL="${BACKEND_URL}/api/v1"
fi
if [[ -z "${VITE_SOCKET_URL}" ]]; then
  VITE_SOCKET_URL="${BACKEND_URL}"
fi

docker build \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  --build-arg VITE_SOCKET_URL="$VITE_SOCKET_URL" \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY" \
  -t "$FRONTEND_IMAGE" \
  -f frontend/Dockerfile \
  frontend
docker push "$FRONTEND_IMAGE"

echo "Step 8: Deploy frontend to Cloud Run"
gcloud run deploy saarthi-frontend \
  --image="$FRONTEND_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --allow-unauthenticated \
  --port=80 \
  --cpu=1 \
  --memory=512Mi \
  --concurrency=80 \
  --timeout=300 \
  --min-instances=1 \
  --max-instances=10

FRONTEND_URL="$(gcloud run services describe saarthi-frontend --region="$REGION" --format="value(status.url)")"
echo "Frontend deployed at: ${FRONTEND_URL}"

echo "Step 9: Health check backend endpoint"
curl --fail "${BACKEND_URL}/api/v1/health"
echo "Backend health check passed"

echo "Step 10: Optional CDN cache invalidation (if URL map exists)"
if gcloud compute url-maps describe saarthi-url-map --global >/dev/null 2>&1; then
  gcloud compute url-maps invalidate-cdn-cache saarthi-url-map --path "/*"
fi

echo ""
echo "Saarthi deployment completed successfully"
echo "Frontend: ${FRONTEND_URL}"
echo "Backend: ${BACKEND_URL}"
echo "Monitoring: https://console.cloud.google.com/monitoring"

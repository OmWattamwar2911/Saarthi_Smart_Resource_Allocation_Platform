param(
  [Parameter(Mandatory = $true)][string]$ProjectId,
  [string]$Region = "asia-south1",
  [string]$BackendService = "saarthi-backend",
  [string]$FrontendService = "saarthi-frontend",
  [Parameter(Mandatory = $true)][string]$MongoUri,
  [Parameter(Mandatory = $true)][string]$JwtSecret,
  [string]$GeminiApiKey = "",
  [string]$GcpLocation = "us-central1"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting active project..."
gcloud config set project $ProjectId | Out-Null

Write-Host "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com | Out-Null

Write-Host "Ensuring Artifact Registry repository exists..."
$repoCheck = gcloud artifacts repositories describe saarthi --location $Region --format="value(name)" 2>$null
if (-not $repoCheck) {
  gcloud artifacts repositories create saarthi --repository-format=docker --location $Region --description "Saarthi deployment images" | Out-Null
}

Write-Host "Deploying backend to Cloud Run..."
gcloud run deploy $BackendService `
  --source backend `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars "NODE_ENV=production,CORS_ORIGIN=*,MONGO_URI=$MongoUri,JWT_SECRET=$JwtSecret,GEMINI_API_KEY=$GeminiApiKey,GCP_PROJECT_ID=$ProjectId,GCP_LOCATION=$GcpLocation,GEMINI_MODEL=gemini-2.0-flash"

$backendUrl = gcloud run services describe $BackendService --region $Region --format="value(status.url)"
$backendApiUrl = "$backendUrl/api/v1"

$frontendImage = "$Region-docker.pkg.dev/$ProjectId/saarthi/$FrontendService:latest"

Write-Host "Building frontend image in Cloud Build with API URL: $backendApiUrl"
gcloud builds submit frontend `
  --config frontend/cloudbuild.yaml `
  --substitutions "_IMAGE=$frontendImage,_VITE_API_URL=$backendApiUrl"

Write-Host "Deploying frontend to Cloud Run..."
gcloud run deploy $FrontendService `
  --image "$frontendImage" `
  --region $Region `
  --allow-unauthenticated

$frontendUrl = gcloud run services describe $FrontendService --region $Region --format="value(status.url)"

Write-Host "Locking backend CORS to frontend URL..."
gcloud run services update $BackendService `
  --region $Region `
  --set-env-vars "CORS_ORIGIN=$frontendUrl"

Write-Host "Deployment completed"
Write-Host "Frontend: $frontendUrl"
Write-Host "Backend:  $backendUrl"
Write-Host "Health:   $backendUrl/api/v1/health"

#!/bin/bash
# Creates all required secrets in Google Secret Manager for Saarthi.

set -euo pipefail

PROJECT_ID="your-gcp-project-id"

# All deployment secrets requested for Saarthi platform integrations.
secrets=(
  "MONGO_URI"
  "JWT_SECRET"
  "GEMINI_API_KEY"
  "GCP_PROJECT_ID"
  "GCP_LOCATION"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_TRANSLATE_KEY"
  "GOOGLE_CLOUD_SPEECH_KEY"
  "GCS_BUCKET_NAME"
  "FIREBASE_PROJECT_ID"
  "FIREBASE_PRIVATE_KEY"
  "FIREBASE_CLIENT_EMAIL"
  "BIGQUERY_PROJECT_ID"
  "BIGQUERY_DATASET"
  "GOOGLE_CALENDAR_CLIENT_ID"
  "GOOGLE_CALENDAR_CLIENT_SECRET"
  "GOOGLE_CALENDAR_REFRESH_TOKEN"
  "FRONTEND_URL"
  "VITE_API_URL"
  "VITE_SOCKET_URL"
  "VITE_GOOGLE_MAPS_API_KEY"
)

for secret in "${secrets[@]}"; do
  echo "Processing secret: $secret"

  # Create secret if it does not already exist.
  if ! gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud secrets create "$secret" --project="$PROJECT_ID" --replication-policy="automatic"
  fi

  # Prompt for secret value and add a new version.
  echo "Enter value for $secret:"
  read -r -s value
  echo
  printf "%s" "$value" | gcloud secrets versions add "$secret" --project="$PROJECT_ID" --data-file=-
done

echo "All secrets created/updated successfully!"

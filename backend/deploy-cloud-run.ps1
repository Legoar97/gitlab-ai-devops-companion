# deploy-cloud-run.ps1
Write-Host "Deploying to Google Cloud Run..." -ForegroundColor Cyan

$PROJECT_ID = "gitlab-ai-companion-2025"
$REGION = "us-central1"
$SERVICE_NAME = "gitlab-ai-companion"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/${SERVICE_NAME}"

# Deploy to Cloud Run
Write-Host "Deploying service..." -ForegroundColor Yellow

gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 4000 `
  --memory 1Gi `
  --cpu 1 `
  --max-instances 10 `
  --set-env-vars "NODE_ENV=production" `
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID" `
  --set-env-vars "GCP_LOCATION=$REGION" `
  --set-env-vars "VERTEX_AI_MODEL=gemini-2.0-flash-001" `
  --service-account "gitlab-ai-companion@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "Deployment complete!" -ForegroundColor Green

# Get the service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --format "value(status.url)"

Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "GraphQL Endpoint: $SERVICE_URL/graphql" -ForegroundColor Cyan
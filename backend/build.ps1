# build.ps1
Write-Host "Building Docker image for Cloud Run..." -ForegroundColor Cyan

$PROJECT_ID = "gitlab-ai-companion-2025"
$REGION = "us-central1"
$SERVICE_NAME = "gitlab-ai-companion"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Build the image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t $IMAGE_NAME .

# Push to Google Container Registry
Write-Host "Pushing to GCR..." -ForegroundColor Yellow
docker push $IMAGE_NAME

Write-Host "Image built and pushed successfully!" -ForegroundColor Green
Write-Host "Image: $IMAGE_NAME" -ForegroundColor White
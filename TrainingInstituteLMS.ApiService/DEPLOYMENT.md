# API Deployment Guide

## Azure Blob Storage for Production

For production deployments on Azure App Service, using Azure Blob Storage instead of local file storage is recommended because:

- Local storage (`BasePath: "./Storage"`) on Azure App Service is ephemeral and can be lost during scaling or app restarts
- Azure Blob Storage provides persistent, scalable storage suitable for uploads (gallery images, course resources, payment receipts, etc.)

### Configuration

1. **Create an Azure Storage Account** (if you don't have one):
   - In Azure Portal, create a Storage Account
   - Blob containers (e.g., `gallery-images`, `course-images`, `payment-receipts`) are created automatically on first upload

2. **Set App Service configuration** (never commit secrets to source control):
   - In Azure Portal, go to your Web App (e.g., `safety-academy-api`)
   - Open **Configuration** > **Application settings**
   - Add these settings:
     - `FileStorage__UseAzureStorage`: `true`
     - `FileStorage__AzureConnectionString`: Your Storage Account connection string (from Azure Portal > Storage Account > Access keys)

3. **Behavior**:
   - When `UseAzureStorage` is `true` and `AzureConnectionString` is set, the API uses `AzureBlobStorageService`
   - When either is missing, it falls back to `FileStorageService` (local storage)

### Allowed Folders

Ensure `AllowedFolders` in `appsettings.Production.json` includes all upload targets: `gallery-images`, `course-resources`, `profile-photos`, `payment-receipts`, etc. These map to Blob container names when using Azure Storage.

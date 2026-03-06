# Run the API with HTTPS (port 7419) - required for auth/register to work
# Usage: .\scripts\run-api.ps1
Set-Location "$PSScriptRoot\..\TrainingInstituteLMS.ApiService"
dotnet run --launch-profile https

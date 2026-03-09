# Apply migrations to Azure (production) database

If you see: **"Invalid column name 'CompanyMobile'"** when creating a company order, the production database is missing the latest schema.

## Recommended: Deploy the API (migrations run on startup)

The API **applies pending migrations automatically when it starts**. It uses the same connection string as the app (from Azure App Service configuration).

1. **Deploy the latest API** to Azure (including the `TrainingInstituteLMS.Data` project and the migration `20260309100000_AddCompanyOrderCompanyMobile` with its `.Designer.cs` file).
2. **Restart the App Service** in Azure Portal (or let the deployment restart it).
3. On startup, the API will run `Database.Migrate()` and apply any pending migrations (including adding the `CompanyMobile` column). Check **Log stream** or **Application logs** in Azure to see lines like: `Applying 1 pending migration(s): 20260309100000_AddCompanyOrderCompanyMobile` and `Migrations applied successfully.`

No need to run `dotnet ef` or paste the connection string on your machine.

---

## Alternative: Command line (one-time)

1. **Get the Azure SQL connection string** from Azure Portal → your App Service or SQL Database → Connection strings (e.g. `Server=...;Database=...;User Id=...;Password=...`).

2. **From the repo root** (the folder that contains `TrainingInstituteLMS.ApiService` and `TrainingInstituteLMS.Data`), run:

   ```bash
   dotnet ef database update --project TrainingInstituteLMS.Data --startup-project TrainingInstituteLMS.ApiService --connection "YOUR_AZURE_CONNECTION_STRING"
   ```

   Replace `YOUR_AZURE_CONNECTION_STRING` with the actual connection string. On Windows PowerShell, wrap it in single quotes if it contains semicolons.

3. This applies all pending migrations, including **AddCompanyOrderCompanyMobile** (adds the `CompanyMobile` column to `CompanyOrders`).

## Option 3: Use production connection from config

1. Set the production connection string in **appsettings.Production.json** (or via Azure App Service Application settings) as `ConnectionStrings:DefaultConnection`.

2. Run with the Production environment and no override:

   ```bash
   set ASPNETCORE_ENVIRONMENT=Production
   dotnet ef database update --project TrainingInstituteLMS.Data --startup-project TrainingInstituteLMS.ApiService
   ```

   Ensure the app is configured to read the Azure connection string when `ASPNETCORE_ENVIRONMENT=Production`.

## Verify

After running, the `CompanyOrders` table should have a nullable `CompanyMobile` column (nvarchar(50)). Creating a company order from the app should then succeed.

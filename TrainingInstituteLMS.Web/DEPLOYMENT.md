# Deploying the web app and API base URL

## 405 Method Not Allowed on `POST .../api/auth/login`

This happens when the browser uses a **relative** API base (`VITE_API_URL=/api`) but the host that serves the SPA (e.g. `https://safetytrainingacademy.edu.au`) **does not forward** `/api/*` to your App Service. The request hits static hosting or another layer that does not allow `POST` on that path.

**Fix (pick one):**

1. **Direct API (default in `.env.production`)**  
   Set `VITE_API_URL` to your App Service API root, including `/api`, for example:  
   `https://<your-app>.azurewebsites.net/api`  
   Ensure CORS on the API allows your SPA origin and credentials (already configured for `safetytrainingacademy.edu.au`).

2. **Same-origin `/api` (after Azure links backend)**  
   In Azure Portal: **Static Web App → APIs → Link to App Service** (see [Microsoft docs](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-app-service)).  
   Then set `VITE_API_URL=/api` and redeploy. The browser calls `https://<swa-or-custom-domain>/api/...` and Azure proxies to App Service; auth cookies become first-party.

## 404 on `/api/...`

Usually the same root cause: no proxy or wrong hosting. Either use the full App Service URL in `VITE_API_URL` or complete the SWA ↔ App Service link.

## `staticwebapp.config.json`

`navigationFallback` excludes `/api/*` so the SPA router does not rewrite API paths to `index.html`. The actual proxy is configured in Azure when the API is linked.

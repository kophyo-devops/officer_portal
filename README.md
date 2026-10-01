# Officer Portal (Full Stack)

Government cargo hardcopy + QR verification system.

## Structure

```text
officer_portal/   Frontend (React + Vite) — Cognito login, forms, PDF viewer
api/              Backend (AWS SAM) — API Gateway + Lambda + DynamoDB + S3
```

## Frontend setup

```bash
cd officer_portal
cp .env.example .env
# fill Cognito + VITE_API_BASE_URL
npm install
npm run dev
```

## Backend deploy

```bash
cd api
npm install
sam build
sam deploy --guided \
  --parameter-overrides \
  CognitoUserPoolId=YOUR_POOL_ID \
  CognitoClientId=YOUR_CLIENT_ID \
  CorsOrigin=https://your-frontend-domain
```

Put deploy output `ApiBaseUrl` into `officer_portal/.env` as `VITE_API_BASE_URL`.

## Architecture

- Cloudflare: DNS + SSL
- S3: frontend static host
- Cognito: officer auth
- API Gateway + Lambda: APIs
- DynamoDB: metadata
- S3: PDF files (presigned URLs)

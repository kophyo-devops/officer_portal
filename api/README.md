# Officer Portal API

AWS SAM app for:
- DynamoDB document metadata
- S3 PDF storage via **presigned URLs**
- Cognito JWT auth on officer endpoints
- Public GET `/documents/{id}` for checkpoint QR scan

## Deploy

```bash
cd api
npm install

sam build
sam deploy --guided \
  --parameter-overrides \
  CognitoUserPoolId=ap-southeast-1_XXXX \
  CognitoClientId=XXXX \
  CorsOrigin=http://localhost:5173
```

Deploy output `ApiBaseUrl` ကို `officer_portal/.env` မှာ ထည့်:

```env
VITE_API_BASE_URL=https://xxxx.execute-api.ap-southeast-1.amazonaws.com
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/documents` | Cognito | Officer list |
| POST | `/documents` | Cognito | Create + upload URL |
| GET | `/documents/{id}` | Public | Verify + PDF download URL |

## Lambda env (auto from template)

- `DOCUMENTS_TABLE`
- `S3_BUCKET_NAME`
- `CORS_ORIGIN`
- `UPLOAD_URL_TTL_SECONDS=300`
- `DOWNLOAD_URL_TTL_SECONDS=300`

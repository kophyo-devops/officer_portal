# Officer Portal

## Frontend `.env`

```env
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_XXXX
VITE_COGNITO_CLIENT_ID=XXXX
VITE_API_BASE_URL=https://xxxx.execute-api.ap-southeast-1.amazonaws.com
```

S3 Access Key / Secret / Bucket name ကို frontend `.env` မှာ **မထည့်ရ**။

## PDF → S3 (implemented)

1. Officer login (Cognito)
2. `POST /documents` → DynamoDB + S3 **presigned PUT URL**
3. Browser uploads PDF to S3
4. Public `GET /documents/{id}` → metadata + **presigned GET URL**
5. PDF viewer opens URL in-browser

`VITE_API_BASE_URL` မထည့်ရင် local IndexedDB demo mode သုံးသည်။

## Deploy API

```bash
cd api
npm install
sam build
sam deploy --guided \
  --parameter-overrides \
  CognitoUserPoolId=ap-southeast-1_ys5s4FL10 \
  CognitoClientId=1arc6736ervnoh4bqqcc38beg4 \
  CorsOrigin=http://localhost:5173
```

Output `ApiBaseUrl` ကို `officer_portal/.env` ထဲ `VITE_API_BASE_URL` အဖြစ် ထည့်ပြီး `npm run dev` ပြန်ဖွင့်။

## Run portal

```bash
cd officer_portal
npm install
npm run dev
```

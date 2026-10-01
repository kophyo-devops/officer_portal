# Officer Portal

Frontend for government cargo hardcopy + QR verification.

```bash
cd officer_portal
cp .env.example .env
npm install
npm run dev
```

## Stack (frontend)

- React + Vite
- Amazon Cognito (officer login)
- Public QR verify page + in-browser PDF viewer

Backend (API Gateway + Lambda + DynamoDB + S3) belongs in a **separate** repository. The local `api/` folder is gitignored.

## Deploy on Vercel

1. Import this GitHub repo: `kophyo-devops/officer_portal`
2. **Root Directory:** `officer_portal`
3. Framework Preset: Vite (auto)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:

```text
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_ys5s4FL10
VITE_COGNITO_CLIENT_ID=1arc6736ervnoh4bqqcc38beg4
VITE_API_BASE_URL=https://system.royaltaurus.com.mm
```

After changing env vars, Redeploy so Vite picks them up at build time.

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
- Host: S3 + Cloudflare

Backend (API Gateway + Lambda + DynamoDB + S3) belongs in a **separate** repository.

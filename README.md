# Deployment & Environment Guide

Set these environment variables before running locally or deploying.

## Required Variables

| Key Name | Value Source |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase API Keys |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API Keys (legacy anon JWT) |
| `SUPABASE_SECRET_KEY` | Supabase API Keys (secret key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API Keys (service role JWT) |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Supabase Storage bucket name (example: `products`) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin email used for dashboard access |

## Local Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

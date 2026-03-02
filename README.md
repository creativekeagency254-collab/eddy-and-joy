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
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Admin password used for dashboard access |
| `NEXT_PUBLIC_ADMIN_EMAIL_2` | Optional second admin email |
| `NEXT_PUBLIC_ADMIN_PASSWORD_2` | Optional second admin password |

## Local Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`.

Use `.env.example` as your template for local `.env.local` and for Vercel environment keys.

## Vercel Quick Setup

1. Import this GitHub repo in Vercel.
2. Add all environment variables above to Vercel Project Settings.
3. In Supabase SQL Editor, run [`docs/supabase-setup.sql`](docs/supabase-setup.sql).
4. Deploy from the latest `main` branch commit.

## Payment Records

Successful Paystack verification stores orders in Supabase `orders` with customer fields and payment audit fields:
- `paymentReference`
- `paymentStatus`
- `paymentProvider`
- `paidAt`

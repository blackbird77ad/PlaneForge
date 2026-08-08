# PlaneForge

PlaneForge is a MERN learning management and engineering consultation platform. It includes a public marketing website, course catalogue, protected course checkout flow, consultation booking, PWA assets, role-aware dashboards, and an Express/Mongo API scaffold.

## Stack

- MongoDB, Express, React, Node
- Vite React client
- Mongoose models for users, courses, orders, progress, certificates, consultations, content, newsletter subscriptions, and settings
- Resend email integration point
- Cloudinary asset integration point
- Stripe and Paystack payment boundaries with local mock payment mode

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

   If your local registry certificate chain fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, run:

   ```bash
   npm install --strict-ssl=false --no-audit --no-fund
   ```

2. Copy environment values:

   ```bash
   copy .env.example .env
   ```

3. Start MongoDB locally or point `MONGO_URI` at your hosted MongoDB database.

4. Seed demo data:

   ```bash
   npm run seed
   ```

5. Start the full app:

   ```bash
   npm run dev
   ```

   The React dev server starts at `http://localhost:7310/`. If that port is already in use, Vite will print the next available local URL.

## Useful Commands

```bash
npm run build
npm run lint
npm run server
npm run client
npm run seed
```

## API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/courses`
- `GET /api/courses/:slug`
- `GET /api/courses/:slug/learn`
- `POST /api/payments/checkout`
- `GET /api/consultations/consultants`
- `POST /api/consultations/book`
- `GET /api/users/dashboard`
- `GET /api/admin/overview`

## Notes

`MOCK_PAYMENTS=true` keeps local checkout and consultation booking usable without live Stripe or Paystack credentials. Add Resend, Cloudinary, Stripe, and Paystack keys in `.env` when moving from local demo mode to real integrations.

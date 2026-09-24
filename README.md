# PlaneForge

PlaneForge is a Node-based learning, consultation, and commerce platform for PCB design and hardware engineering education. It helps students move from fundamentals to build-ready engineering work through structured courses, protected learning access, progress tracking, certificates, product checkout, and consultation workflows.

Built by [The BrandHelper](https://thebrandhelper.com).

## What It Does

PlaneForge gives learners one place to discover PCB courses, enroll through verified payments, stream course material, track lesson progress, and manage certificates. Students can request guidance, book engineering consultations, save cart items, and review their account activity from a role-aware dashboard.

Admins manage the operating side of the platform through database-backed CRUD tools for courses, lessons, products, articles, users, enrollments, consultations, inquiries, payments, expenses, earnings, and settings. Consultants and partners have their own dashboards for bookings, earnings, and platform activity.

## Stack

- Node.js and Express API
- MongoDB with Mongoose models
- React and Vite frontend
- JWT sessions with device-aware login verification
- Resend email integration
- Cloudinary image uploads
- Stripe payment integration
- Stream provider integration points for course video delivery

## Local Setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Copy environment values.

   ```bash
   copy .env.example .env
   ```

3. Set a local or hosted MongoDB connection in `.env`.

   ```text
   MONGO_URI=mongodb://127.0.0.1:27017/planeforge
   ```

4. Add service keys for the features you want to test locally, such as Resend, Cloudinary, Stripe, and a streaming provider.

5. Bootstrap the admin accounts.

   ```bash
   npm run seed
   ```

6. Start the app.

   ```bash
   npm run dev
   ```

The API runs on the configured `PORT`, and the React app runs through Vite. Local and hosted environments use the same database-backed API behavior.

## Useful Commands

```bash
npm run build
npm run lint
npm run server
npm run client
npm run seed
```

## API Areas

- Authentication and account sessions
- Course catalog, course CRUD, learning playback, comments, and progress
- Product catalog, product CRUD, cart, and checkout
- Consultation booking and consultant dashboards
- Contact inquiries, newsletter subscriptions, articles, and homepage content
- Admin overview, users, enrollments, payments, expenses, earnings, settings, products, and articles

## Environment

Use `.env.example` as the starting point for required environment variables. At minimum, configure MongoDB, JWT secret, client URL, admin setup code, and any third-party service keys needed for the workflows you are testing.

Account verification, password reset, and profile-change codes require `RESEND_API_KEY` and a `RESEND_FROM` sender verified in the Resend dashboard.

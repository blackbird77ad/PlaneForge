# PlaneForge Test Logins

For quick local testing, use the repo-root `.env` with:

```text
DEMO_BACKEND=true
```

This starts the backend with in-memory demo data and does not require MongoDB.

If you switch to Mongo-backed mode, seed the database first:

```bash
npm run seed
```

All test accounts use this password:

```text
Password123!
```

| Area | Email | Notes |
| --- | --- | --- |
| Admin | admin@planeforge.test | Use `/admin` |
| Learner | student@planeforge.test | Use `/login` |
| Consultant | consultant@planeforge.test | Use `/consultant` |
| Partner | partner@planeforge.test | Admin-created access; use `/login` |

Admin URL:

```text
http://localhost:7310/admin
```

Regular learner/customer login URL:

```text
http://localhost:7310/login
```

Consultant URL:

```text
http://localhost:7310/consultant
```

The public login form does not ask visitors to choose a role. After the one-time code is verified, the account role sends the user to the correct dashboard.

When `RESEND_API_KEY` is empty in local development, the API returns the one-time login code in the response and the UI shows it as a development code. If the frontend falls back to its browser-only demo login because the API is unavailable, the code is:

```text
123456
```

Admin sign-up is protected by:

```text
PLANEFORGE-ADMIN-2026
```

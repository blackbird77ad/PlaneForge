# PlaneForge Test Logins

For quick local testing, run:

```bash
npm run dev:demo
```

This starts the backend on `http://127.0.0.1:5001` with in-memory demo data and does not require MongoDB.

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
| User / buyer / learner | student@planeforge.test | Use `/login` |
| Consultant | consultant@planeforge.test | Use `/consultant` |
| Partner | partner@planeforge.test | Use `/partner` |

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

Partner URL:

```text
http://localhost:7310/partner
```

The public login form does not ask visitors to choose a role. After the one-time code is verified, the account role sends the user to the correct dashboard.

Login and password reset codes are emailed through Resend when `RESEND_API_KEY` is configured. Keep the local demo API running while testing auth flows so the browser does not need an offline-only fallback.

Admin sign-up is protected by the current `ADMIN_SETUP_CODE` in `.env`.

```text
PLANEFORGE-ADMIN-2026
```

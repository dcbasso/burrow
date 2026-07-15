# Burrow

*[Leia em português](README_PTBR.md)*

Self-hosted homelab dashboard — Angular + Express + MongoDB, with Google sign-in and in-app editing.

A dashboard for the services you host at home. Unlike a static dashboard, the sections
and services are managed from the interface itself: you add, edit, reorder and pick icons
without touching HTML or redeploying anything.

The interface is available in English, Portuguese and Spanish — it follows your browser's
language and can be switched anytime under Settings → Language.

## Stack

- **Frontend** — Angular (standalone components), served by Nginx.
- **Backend** — Express + Mongoose, with Google token verification.
- **Database** — MongoDB.
- **Deploy** — Docker Compose, built to live behind a reverse proxy (e.g. Nginx Proxy Manager).

## Trying it out

If you just want to see what the dashboard looks like, start with the [demo environment](example/):
it brings up the whole stack already populated with fictional services, and you only adjust your email.

```bash
cd example
cp .env.example .env   # set your email and your Google Client ID
docker compose up -d --build
```

## Running it for real

Prerequisites: Docker and Docker Compose.

```bash
cp .env.example .env
# fill in GOOGLE_CLIENT_ID and ALLOWED_EMAILS
docker compose up -d --build
```

The dashboard comes up at `http://localhost:8090`, empty — you register the sections and
services from the interface itself.

## Configuration

All variables live in `.env`, which is never committed — see `.env.example`:

| Variable | What it's for |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID (Web) from the Google Cloud Console. The *Authorized JavaScript origins* must include the origin the app is served from. |
| `ALLOWED_EMAILS` | Allowlist of emails authorized to log in, comma-separated. |
| `MONGO_URI` | Mongo connection string. The default points to the compose container. |

Access is locked down by allowlist: the backend validates the Google token and rejects any
email that is not in `ALLOWED_EMAILS`.

## Setting up Google OAuth (GCP)

The `GOOGLE_CLIENT_ID` is created in the [Google Cloud Console](https://console.cloud.google.com/).
Do it once and reuse the same Client ID everywhere:

1. **Create/select a project** — top bar → project selector → *New Project* (or pick an existing one).
2. **Configure the OAuth consent screen** — *APIs & Services → OAuth consent screen*. Choose
   **External**, fill in the app name and support email, and under *Test users* add every email
   you plan to log in with (the ones you'll also put in `ALLOWED_EMAILS`).
3. **Create the credential** — *APIs & Services → Credentials → Create Credentials → OAuth client ID*.
   Application type: **Web application**.
4. **Add the Authorized JavaScript origins** — this is where the app is served from. Add every
   origin you'll sign in from, for example:

   | Environment | Origin |
   | --- | --- |
   | Production | `https://dashboard.your-domain.com` |
   | Local (real run) | `http://localhost:8090` |
   | Local (demo/testing) | `http://localhost:4200` |

   Add or remove entries to match your own setup — the origin (scheme + host + port) must match
   exactly, and you can add more later without recreating the credential.
5. **Copy the generated Client ID** (it looks like `xxxxxxxx.apps.googleusercontent.com`) into
   `GOOGLE_CLIENT_ID` in your `.env`.

If sign-in fails with an origin/`redirect_uri` error, it almost always means the origin you're
serving from isn't listed in *Authorized JavaScript origins*.

## License

Apache 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).

# 🌉 SkillSlate (AI Portfolio-as-a-Service)

SkillSlate is an AI-powered Portfolio-as-a-Service. Users create and deploy professional, responsive portfolios from a short prompt or their resume, optionally link GitHub to auto-import projects and derive skills, and publish to a global CDN with one click.

This README is the single source of truth for the SaaS direction. Legacy script-only instructions have been removed.

---

## 🧭 Product Overview

SkillSlate enables users to:

- Create a portfolio from a short **prompt** or upload a **resume (PDF/DOCX)**
- **Link GitHub** to auto-import recent repositories and languages
- **AI‑enhance** content (About, Projects, Experience, Skills, Certifications)
- **Preview** in multiple templates (Modern, Creative, Minimal)
- **Deploy with one click** to a global CDN (Vercel recommended; Netlify supported)
- Use a hosted URL like `https://username.skillslate.app` or connect a custom domain

### Why Vercel (vs Netlify)?

- Vercel provides a simple API/CLI, excellent DX, and a generous free tier for static sites.
- Netlify is also viable. We default to **Vercel** for examples and automation.

---

## 🧩 Architecture

- Frontend (Next.js/React)

  - Auth (email/password, OAuth via GitHub/Google)
  - Dashboard: prompt/resume upload, GitHub connect, live preview, template gallery
  - Deploy button triggers backend build + hosting deployment

- Backend (Flask API)

  - Endpoints: preview, generate, deploy, GitHub fetch
  - Calls Gemini (Google Generative AI) to enhance text
  - Renders Jinja templates to static HTML/CSS/JS in `output/`

- Templates (Jinja)

  - `Modern`, `Creative`, `Minimal` (current), expandable later

- Hosting

  - Vercel (recommended) via API/CLI; Netlify alternative

- Storage/DB (optional for MVP)

  - Users, profiles, site configs, deploy history (Postgres/Supabase suggested)

- Payments (future)
  - Stripe for premium templates, custom domains, analytics

---

## 📁 Repository Structure (current)

```
PathBridge_Portfolio_Generator/
├── Flask-API/
│   ├── app.py                 # Flask server & REST API
│   ├── template_api.py        # Simple template listing API
│   ├── template_selector.py   # CLI template selector (legacy helper)
│   ├── Portfolio/
│   │   ├── enhancer.py        # Gemini-based content enhancement
│   │   ├── generator.py       # High-level generation helpers
│   │   └── templates/
│   │       ├── template_modern.html
│   │       ├── template_creative.html
│   │       └── tamplate_minimal.html
│   ├── static/                # Assets (bg image/video)
│   └── requirements.txt
└── Readme.md
```

Proposed monorepo (future):

```
skillslate/
├── apps/
│   ├── frontend/              # Next.js app (App Router)
│   └── backend/               # Flask API (this folder)
├── packages/templates/        # Shared templates/partials
├── infra/                     # vercel.json, CI/CD workflows
└── README.md
```

---

## ✨ User Flow

1. Sign up / login
2. Enter prompt or upload resume
3. (Optional) Connect GitHub to pull repos/languages
4. Choose template and preview (live)
5. Click “Deploy” → backend renders static site and pushes to Vercel/Netlify
6. Get live URL; redeploy after edits

---

## 🛠 Backend Responsibilities (Flask)

- Ingest prompt/resume, extract structured data
- Fetch GitHub repos and derive skills
- Enhance content with Gemini (About, Projects, Experience, Certifications)
- Render Jinja templates to static HTML/CSS/JS
- Return preview HTML and/or write to `output/` for deployment

## 🎨 Frontend Responsibilities (Next.js)

- Auth, dashboard, forms, file uploads
- Template gallery with live preview (via `/preview`)
- Deployment button that calls backend deploy action

---

## 📡 Backend API (current)

Base URL: `http://localhost:8000`

- `GET /` → API info and available templates
- `GET /templates` → list available templates
- `POST /generate` → render and save to `output/portfolio.html`
- `POST /preview` → return HTML for live preview (no write)
- `GET /download-html` → download last generated HTML

Example payload for `POST /generate`:

```json
{
  "templateName": "Modern",
  "name": "Jane Doe",
  "about": "Full‑stack developer...",
  "githubUrl": "https://github.com/janedoe",
  "projects": [
    {
      "name": "proj-1",
      "description": "...",
      "url": "https://...",
      "language": "Python"
    }
  ],
  "skills": ["Python", "Flask", "React"],
  "experiences": [
    { "role": "SWE", "companyName": "Acme", "duration": "2023-2024" }
  ],
  "certifications": ["AWS CCP"]
}
```

If `githubUrl` is provided and `projects` is empty, the backend attempts to fetch recent repos.

---

## 🔧 Environment & Config

Backend variables:

```env
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=optional_for_higher_rate_limits
FRONTEND_ORIGIN=http://localhost:3000
```

Optional (programmatic deployments):

```env
VERCEL_TOKEN=...
VERCEL_TEAM_ID=optional
NETLIFY_AUTH_TOKEN=...
NETLIFY_SITE_ID=...
```

---

## 🧑‍💻 Local Development

Backend (Flask):

```
cd Flask-API
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
$env:GEMINI_API_KEY="your_key_here"
.\.venv\Scripts\python app.py
```

If you see `ModuleNotFoundError: No module named 'flask_cors'`, ensure you're using the virtual environment (`.venv`) and have installed `requirements.txt` inside it.

Frontend (Next.js — scaffold placeholder):

```
npm create next-app@latest apps/frontend --ts
cd apps/frontend
npm run dev
```

Configure CORS to allow `http://localhost:3000` in Flask.

---

## 🚀 Deployments

Vercel (recommended):

1. Install: `npm i -g vercel`
2. Login: `vercel login`
3. Ensure build artifacts are in `output/` (this app writes `output/portfolio.html`)
4. Deploy: `vercel --prod output/`

Programmatic: use Vercel Deployments API to upload files from `output/`.

Netlify (alternative):

1. Install: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --dir=output --prod`

---

## 🔗 GitHub Integration: Connect, Create Repo, Push, Deploy (GitHub Pages)

This app will let users connect their GitHub, create a repo, push portfolio files, and deploy via GitHub Pages — all from SkillSlate.

### 1) User connects GitHub (OAuth)

- Redirect users to GitHub OAuth authorize URL with your client_id and requested scopes (recommended: `repo`, `workflow`, `pages:write`).
- GitHub redirects back to your backend with a `code` → exchange for access token.
- Store the access token securely server-side per user.

Scopes typically needed:

- `repo`: create and write to repositories
- `workflow`: enable and run GitHub Actions
- `pages:write`: manage GitHub Pages settings

### 2) Create a repository

- Endpoint: `POST https://api.github.com/user/repos`
- Headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`
- Body example:

```json
{
  "name": "portfolio-repo",
  "description": "SkillSlate portfolio",
  "homepage": "https://<username>.github.io/portfolio-repo/",
  "private": false,
  "has_issues": false,
  "has_wiki": false
}
```

### 3) Push portfolio files (Git Data API)

Push static site files (generated by SkillSlate) without using `git` locally by composing Git objects.

Steps and endpoints:

- Create blobs for each file
  - `POST /repos/{owner}/{repo}/git/blobs`
  - Body: `{ "content": "<utf-8 or base64>", "encoding": "utf-8" }`
  - Response: `{ sha: "..." }`
- Create a tree that maps file paths → blob SHAs
  - `POST /repos/{owner}/{repo}/git/trees`
  - Body example:

```json
{
  "base_tree": "<optional_base_tree_sha>",
  "tree": [
    {
      "path": "index.html",
      "mode": "100644",
      "type": "blob",
      "sha": "<blob_sha>"
    },
    {
      "path": "assets/style.css",
      "mode": "100644",
      "type": "blob",
      "sha": "<blob_sha>"
    }
  ]
}
```

- Create a commit for that tree
  - `POST /repos/{owner}/{repo}/git/commits`
  - Body: `{ "message": "Deploy portfolio", "tree": "<tree_sha>", "parents": ["<current_head_sha>"] }`
- Update the branch ref (e.g., `refs/heads/main`) to point to the new commit
  - `PATCH /repos/{owner}/{repo}/git/refs/heads/main`
  - Body: `{ "sha": "<new_commit_sha>", "force": false }`

Tip: Query the current HEAD first to get `current_head_sha`:

- `GET /repos/{owner}/{repo}/git/refs/heads/main`

### 4) Enable and configure GitHub Pages

Options:

1. Deploy Pages from `main` root or `docs/`:
   - API: `PUT /repos/{owner}/{repo}/pages`
   - Body example:

```json
{
  "source": { "branch": "main", "path": "/" }
}
```

2. Or use GitHub Actions to build and deploy to Pages from `gh-pages` branch.

### 5) Automate deployments (GitHub Actions)

Add a workflow file (e.g., `.github/workflows/pages.yml`) to build and deploy on every push.

Minimal example for static content to `gh-pages`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: write
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

### Server-side responsibilities (SkillSlate)

- Store the user’s GitHub OAuth token securely (encrypted at rest).
- Provide endpoints to: create repo, push files, enable Pages, and write the workflow.
- Render portfolio to a static output (e.g., `output/`), then push those files to the user’s repo using the Git Data API described above.

### Client-side UX

- In Dashboard: “Connect GitHub” → OAuth
- “Create Repo” → calls backend to create repo
- “Deploy to GitHub Pages” → backend pushes files and enables Pages
- Show resulting Pages URL (e.g., `https://<username>.github.io/<repo>/`)

### Security notes

- Never expose the GitHub access token to the browser after initial OAuth.
- Use short-lived tokens where possible; rotate on revoke.
- Limit scopes to what’s needed (`repo`, `workflow`, `pages:write`).
- Validate filenames and content before pushing.

---

## 🗂 Suggested Data Model

- `users`: id, email, password_hash, github_connected
- `profiles`: id, user_id, raw_prompt, resume_blob_url, github_username
- `sites`: id, user_id, template, last_deployed_url, platform (vercel|netlify)
- `builds`: id, site_id, status, logs_url, created_at

---

## 🛣 Roadmap

- v0: Prompt/resume → preview → manual deploy (CLI)
- v1: One‑click deploy to Vercel from dashboard (token‑based)
- v2: Custom domains, template marketplace, analytics

---

## 🔐 Security & Privacy

- Don’t log raw resumes or access tokens
- Encrypt OAuth tokens at rest
- Apply CORS allowlist
- Validate/limit AI prompts to reduce prompt‑injection risks

---

## 📄 License

MIT (see `LICENSE`)

### User Flow

1. User signs up/logs in
2. Enters prompt or uploads resume
3. Connects GitHub (optional) to pull recent repos and languages
4. Chooses a template and previews
5. Clicks “Deploy” → we generate static files and push to Vercel (or Netlify)
6. User gets a live URL and can redeploy after edits

### Backend Responsibilities (Flask)

- Ingest prompt/resume, extract structured data
- Fetch GitHub repos and derive skills
- Call Gemini to enhance content (About, Projects, Experience, Certifications)
- Render Jinja templates to static HTML/CSS/JS
- Return preview HTML and/or write to `output/` for deployment

### Frontend Responsibilities (Next.js recommended)

- Auth, dashboard, forms, file uploads
- Template gallery with live previews (via `/preview` endpoint)
- Deployment button that calls backend “deploy-to-vercel/netlify” action

### Deployments

- **Vercel (recommended)**: Push the generated `output/portfolio.html` (and any assets) into a small static build folder and use the Vercel REST API or `vercel` CLI to create/update a deployment.
- **Netlify (alternative)**: Zip and upload the same static folder via Netlify CLI or REST API.

#### Vercel Quick Start (static deploy)

1. Install Vercel CLI locally: `npm i -g vercel`
2. Login: `vercel login`
3. Ensure generated site files are in `output/` (this app creates `output/portfolio.html`)
4. Run: `vercel --prod output/` → returns a live URL

Programmatic: call Vercel Deployments API with a minimal project config and upload files from `output/`.

#### Netlify Quick Start (static deploy)

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --dir=output --prod`

### Environment & Config (SaaS)

Set the following variables for the backend:

```env
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=optional_for_higher_rate_limits
FRONTEND_ORIGIN=https://app.pathbridge.app   # CORS allowlist
```

Optional for deployments from the backend (programmatic):

```env
VERCEL_TOKEN=...
VERCEL_TEAM_ID=optional
NETLIFY_AUTH_TOKEN=...
NETLIFY_SITE_ID=...
```

### Minimal SaaS Data Model (suggested)

- `users`: id, email, password_hash, github_connected
- `profiles`: id, user_id, raw_prompt, resume_blob_url, github_username
- `sites`: id, user_id, template, last_deployed_url, platform (vercel|netlify)
- `builds`: id, site_id, status, logs_url, created_at

### Roadmap

- v0: Prompt/resume → preview → manual deploy (CLI instructions)
- v1: One-click deploy to Vercel from dashboard (token-based)
- v2: Custom domain mapping, template marketplace, analytics

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "feat: add your feature"`)
4. Push (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📞 Support

1. Open an Issue with reproduction steps
2. Include environment and API versions used
3. Do not post secrets in issues

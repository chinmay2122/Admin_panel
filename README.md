# iRAS Studio® — Admin Panel

A minimalist, calm, and responsive admin dashboard for **iRAS Studio®**, an exclusive creative community platform connecting artists, collectors, and cultural institutions.

---

## ✦ Design System & Philosophy

Built with an editorial aesthetic:
- **Background:** Calm off-white (`#FAFAF8`)
- **Typography:** Inter (`#141413` near-black primary text, `#6E6E69` muted captions)
- **Accent:** Single muted terracotta accent (`#B8532F`)
- **Borders & Elevation:** Hairline 1px borders (`#E8E8E3`), subtle micro-shadows, generous whitespace, and `rounded-lg` elements.
- **Iconography:** Lucide React icons.
- **Accessibility:** High-contrast focus rings (`focus-visible:ring-[#B8532F]`), keyboard dialog closures (`Escape`), and full ARIA labeling.

---

## ✦ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla utilities, zero heavy component libraries)
- **Icons:** `lucide-react`
- **Authentication:** `jose` (Signed JWT session cookies with `httpOnly`, `sameSite: "lax"`, and expiration)
- **Image Optimization:** `next/image` with lazy loading and remote Unsplash domain configuration

---

## ✦ Features Overview

1. **Authentication & Session Management**
   - Centered minimal login interface with error banners and button spinner states.
   - Server-side credentials verification against environment variables.
   - Route protection middleware for all `/admin/*` and `/api/admin/*` routes.
   - Built-in IP rate limiting on `POST /api/admin/login` (5 attempts per minute per IP with HTTP 429 response and `Retry-After` header).
   - Server Actions guarded with server-side session checks.

2. **Overview (`/admin/overview`)**
   - 8 statistic summary cards (`stats()` repository integration).
   - "Recent signups" list with quick metadata.
   - "Needs attention" alert modules linking to pre-filtered queues for pending artworks, creators, and applications.
   - Skeleton loading state (`loading.tsx`).

3. **User Management (`/admin/users`)**
   - Filtering tabs (All, Creators, Collectors, Free, Elite, Pro).
   - Real-time search by name or email with sorting and pagination.
   - Interactive profile drawer with membership dossier.
   - Optimistic account actions (Suspend, Reactivate, Delete confirmation modal).
   - Real-time Toast notifications on all actions.

4. **Creator Roster (`/admin/creators`)**
   - Multi-select filter bar (Discipline, Plan tier, Status).
   - Curatorial review drawer with portfolio dossier.
   - Fast approval for pending creators, suspension toggles, and tier changes (Free / Elite / Pro).

5. **Artworks Catalog (`/admin/artworks`)**
   - Switchable Grid view (image cards) and Table view.
   - Multi-filter bar by status, creator, medium, and search.
   - Detailed inspection drawer with large image previews, inline title & price editing, and formal rejection with reason logging.
   - Bulk table selection with batch Approve and Reject actions.

6. **COR — Circle of Renaissance (`/admin/cor`)**
   - Fellowship membership roster with active/expired metrics.
   - "Add Member" modal with user search and enrollment.
   - Instant membership expiry, renewal, and removal actions.

7. **Job Opportunities (`/admin/jobs`)**
   - Open studio residencies, commissions, and curator roles.
   - Create & Edit job modal forms with client-side validation.
   - Status toggle (Close / Reopen) and deletion confirm.
   - One-click applicant count link routing to pre-filtered applications.

8. **Applications (`/admin/applications`)**
   - Application queue filterable by opportunity and status.
   - Applicant detail drawer with reviewer actions (Shortlist, Accept, Reject).

---

## ✦ Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```env
# Admin authentication credentials
ADMIN_USERNAME=admin123
ADMIN_PASSWORD=admin2005

# JWT Secret for signing session cookies (minimum 32 characters)
SESSION_SECRET=iras_studio_super_secret_jwt_key_2026_secure_random_seed_987654321

# Optional: Supabase configuration (when connecting a live database)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security Note:** Never commit `.env.local` or expose `ADMIN_PASSWORD` or `SESSION_SECRET` in client-side code.

---

## ✦ Getting Started Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Admin Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Default Username:** `admin123`
- **Default Password:** `admin2005`

### 3. Build for production
```bash
npm run build
npm run start
```

---

## ✦ Deploying to Vercel

Deploying the iRAS Studio Admin Panel to Vercel takes less than 2 minutes:

### Option A: Using the Vercel Dashboard (Recommended)

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of iRAS Studio admin panel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Import Project into Vercel**:
   - Log in to [vercel.com](https://vercel.com).
   - Click **"Add New..."** > **"Project"**.
   - Select your repository and click **Import**.

3. **Configure Environment Variables**:
   - In the **Environment Variables** section, enter:
     - `ADMIN_USERNAME`: `admin123` (or your chosen production username)
     - `ADMIN_PASSWORD`: `your_secure_password`
     - `SESSION_SECRET`: A secure random string (at least 32 characters)
   - Ensure the variables are enabled for **Production**, **Preview**, and **Development**.

4. **Deploy**:
   - Click **Deploy**. Vercel will automatically build and deploy the Next.js application.

---

### Option B: Using the Vercel CLI

1. **Install Vercel CLI globally**:
   ```bash
   npm i -g vercel
   ```

2. **Link and Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts to connect your Vercel account and set project name.

3. **Set Environment Variables via CLI**:
   ```bash
   vercel env add ADMIN_USERNAME
   vercel env add ADMIN_PASSWORD
   vercel env add SESSION_SECRET
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## ✦ Security & Protection Rules

- **Middleware Protection:** Unauthenticated requests to any `/admin/*` route are redirected to `/admin/login`. Unauthenticated requests to any `/api/admin/*` route return `401 Unauthorized` JSON.
- **Login Route Rate Limiting:** `POST /api/admin/login` enforces a 5 attempts/minute limit per client IP. Exceeded limits return HTTP status `429` with `Retry-After` headers.
- **Server Action Guards:** Mutations in `app/admin/actions.ts` verify the admin session cookie before executing.

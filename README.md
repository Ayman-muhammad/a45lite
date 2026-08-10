# Orbit Career

Here is the complete deliverable — first the logo concept described as a senior creative director would pitch it, then the **single, paste-ready Lovable prompt** that builds the entire application without follow-up questions.

---

## 🎨 LOGO CONCEPT: "The Orbital Signal"

**Visual Language:** The mark lives in deep space slate (`#0B0F19`) with an electric tangerine orbit (`#F97316`). At the center, the numerals **"45"** are drawn with razor-sharp geometric strokes — no curves, all miter joints — communicating precision engineering. The **"4"** is a solid block with a clean crossbar; the **"5"** mirrors it with a forward-leaning posture, suggesting momentum.

Between them, a **lightning bolt** slices downward in vivid orange (`#F97316` to `#FDBA74` gradient), representing the "LITE" — speed, signal, illumination. This bolt is the only organic element, creating deliberate tension against the rigid numerals.

**The Orbit:** Two concentric rings encircle the wordmark — an outer thick ring in primary orange, an inner hairline ring in soft orange glow. Six orbital nodes (dots) sit on the outer ring at 12, 2, 4, 6, 8, and 10 o'clock positions. Three are solid orange (active signals), three are dimmer (standby), rotating in a subtle CSS animation to suggest jobs continuously orbiting the user.

**Typography below:** "45LITE" in a brutalist sans-serif, all caps, tight tracking, pure white. Beneath it, the tagline "CAREER · OPTIMIZED" in monospace, orange-400, spaced wide like a terminal readout.

**Mood:** It feels like a mission control dashboard for your career — NASA meets Nairobi tech. Serious enough for a senior lecturer, sharp enough for a Safaricom engineer.

---

## 🚀 FULL LOVABLE PROMPT — COPY AND PASTE ENTIRELY

Build a complete Progressive Web App called **45LITE** — a verified job discovery and career optimization platform for Kenyan professionals and academics. Use **orange (`#F97316`) as the dominant brand color** against a deep slate (`#0B0F19`) background with slate-800 (`#1E293B`) card surfaces. The app must feel premium, fast, and mission-control precise.

### BRAND & DESIGN SYSTEM

- Primary: `#F97316` (orange-500). Light: `#FB923C` (orange-400). Glow: `#FDBA74` (orange-300). Dark: `#EA580C` (orange-600). Background: `#0B0F19`. Card: `#1E293B`. Text primary: white. Text secondary: `#94A3B8` (slate-400).

- Font: Inter for UI, JetBrains Mono for data/metrics.

- All buttons use orange with white text. Active states use orange-400. Hover states lift with orange glow shadow.

- Bottom navigation for mobile (Home, Search, Saved, Profile). Sidebar for desktop.

- Every screen must have generous padding, rounded-2xl cards, and subtle orange border accents on active elements.

### TECH STACK & ARCHITECTURE

- **Frontend:** React + TypeScript + Tailwind CSS + Vite. Built as a PWA with `vite-plugin-pwa`.

- **Backend & Database:** Supabase (PostgreSQL). Use Supabase Auth for authentication.

- **AI:** OpenAI GPT-4o integration via Supabase Edge Functions.

- **Push Notifications:** Firebase Cloud Messaging (FCM) integrated through Supabase Edge Functions. Store FCM tokens in the database.

- **PDF Generation:** Use `jspdf` and `html2canvas` in the frontend for CV/cover letter export.

- **File Uploads:** Supabase Storage buckets for resume PDFs and profile avatars.

### DATABASE SCHEMA (Supabase PostgreSQL)

Create these tables with Row Level Security (RLS) enabled:

1. **`profiles`** — `id` (uuid, PK, refs auth.users), `full_name` (text), `email` (text), `phone` (text), `location` (text), `job_type_preference` (text[]: 'lecturing', 'corporate_it', 'internship', 'attachment', 'remote'), `skills` (text[]), `experience_years` (int), `education_level` (text), `fcm_token` (text), `notify_new_jobs` (boolean, default true), `notify_deadlines` (boolean, default true), `created_at` (timestamp).

2. **`resumes`** — `id` (uuid, PK), `user_id` (uuid, FK profiles), `file_url` (text), `parsed_text` (text), `skills_extracted` (text[]), `uploaded_at` (timestamp).

3. **`jobs`** — `id` (uuid, PK), `title` (text), `company` (text), `company_type` (text: 'university', 'tech_company', 'tbi', 'ngo', 'remote_abroad', 'startup'), `location` (text), `job_type` (text: 'full_time', 'part_time', 'internship', 'attachment', 'contract', 'remote'), `description` (text), `requirements` (text[]), `salary_range` (text), `apply_url` (text), `apply_email` (text), `source` (text), `source_url` (text), `verification_status` (text: 'pending', 'verified', 'rejected', default 'pending'), `verified_by` (text), `verified_at` (timestamp), `deadline` (date), `is_active` (boolean, default true), `tags` (text[]), `created_at` (timestamp).

4. **`saved_jobs`** — `id` (uuid, PK), `user_id` (uuid, FK profiles), `job_id` (uuid, FK jobs), `saved_at` (timestamp), `notes` (text).

5. **`job_applications`** — `id` (uuid, PK), `user_id` (uuid), `job_id` (uuid), `status` (text: 'saved', 'applied', 'interview', 'offer', 'rejected'), `applied_at` (timestamp), `custom_cover_letter` (text).

6. **`notifications`** — `id` (uuid, PK), `user_id` (uuid), `title` (text), `body` (text), `type` (text: 'new_job', 'deadline', 'recommendation', 'verification'), `job_id` (uuid, nullable), `is_read` (boolean, default false), `created_at` (timestamp).

7. **`ai_generations`** — `id` (uuid, PK), `user_id` (uuid), `job_id` (uuid), `type` (text: 'cv_rewrite', 'cover_letter', 'match_analysis'), `input_prompt` (text), `output_content` (text), `match_score` (int, nullable), `generated_at` (timestamp).

### AUTHENTICATION

- Implement Supabase Auth with Email/Password and Google OAuth.

- On first login, force an onboarding flow: collect name, location, job type preferences (multi-select: Lecturing, Corporate IT, Internship, Attachment, Remote), skills (tag input), experience level, and education.

- Store all onboarding data in the `profiles` table.

- Users can update preferences anytime from Profile settings.

### JOB VERIFICATION SYSTEM (CRITICAL)

Before ANY job appears in the main feed, it must pass verification:

- Jobs have a `verification_status` field. Only `verified` jobs display to users.

- A verification badge (orange checkmark with "Verified Official" tooltip) appears on every job card.

- The system distinguishes: **Internships**, **Attachments** (industrial attachment for Kenyan students), **Full-time**, **Part-time**, **Contract**, **Remote**.

- Job sources are explicitly categorized:

  - **Kenyan Universities:** University of Nairobi, Kenyatta University, Strathmore University, USIU-Africa, JKUAT, Mount Kenya University, Daystar University, Africa Nazarene University, Catholic University, Kabarak University, Moi University, Egerton University.

  - **Kenyan Tech Companies:** Safaricom, Andela, Britam, Equity Bank, KCB, M-KOPA, Twiga Foods, Flutterwave, Peach Payments, Cellulant, Craft Silicon, Lori Systems.

  - **TBI (Turkana Basin Institute):** Explicitly listed as its own category with research positions, field school roles, lab technician roles, and academic posts.

  - **Remote/Abroad:** Positions from international companies hiring remotely for Africa-based talent.

  - **NGOs/Development:** FAO, IRC, UN agencies, Devex-listed roles.

- Each job card shows: Company logo placeholder, job title, company name, location, job type badge (color-coded: orange for full-time, blue for remote, green for internship, purple for attachment), posted date, deadline countdown, verification badge, and salary range if available.

### JOB FEED & HOME SCREEN

- **Hero section:** Greeting with user's name, orange accent line, and stats row: "X Verified Jobs Today", "Y Match Your Profile", "Z Deadlines This Week".

- **Filter pills:** All | Lecturing | Corporate IT | Internship | Attachment | Remote | TBI.

- **Job cards:** Horizontal scroll for "Trending Today", vertical list for "All Verified Jobs".

- **Pull-to-refresh** on mobile. Infinite scroll on desktop.

- **Deadlines section:** Orange-highlighted cards for jobs closing within 72 hours.

### MULTI-MODAL SEARCH

Implement these search methods:

1. **Keyword Search:** Full-text search across title, company, description, requirements.

2. **Filter Sidebar:** Location (Nairobi, Mombasa, Kisumu, Nakuru, Remote, Abroad), Job Type, Experience Level (Entry, Mid, Senior), Company Type, Salary Range, Date Posted.

3. **Smart Categories:** "Lecturing Positions", "Tech Corporate", "Internships & Attachments", "TBI Research", "Remote Africa", "Closing Soon".

4. **Voice Search:** Microphone icon that uses Web Speech API for voice-to-text search.

5. **Recent Searches:** Persist last 10 searches per user.

### RESUME & AI FEATURES (ON-DEMAND ONLY)

- **Resume Upload:** Users upload PDF/DOCX in Profile. Parse text and extract skills using a simple keyword extractor (no AI needed for parsing). Store in `resumes` table.

- **AI is NEVER automatic.** A "Generate Match Analysis" button appears on each job detail page. Only when clicked does the AI trigger.

- **Match Analysis:** When requested, call OpenAI via Edge Function. Send the job description + user's parsed resume. Return:

  - Match Score (0-100) displayed as a circular progress indicator in orange.

  - Gap Analysis: "You have X, this job needs Y."

  - Keyword alignment suggestions.

- **AI CV Rewriter:** Button labeled "Optimize My CV for This Role". When clicked:

  - System prompt: "You are Dr. Amina Ochieng, a senior executive resume writer and former HR Director with 24+ years of experience across Fortune 500 companies and top African universities. You specialize in ATS-optimized CVs for the Kenyan and international job market. Rewrite the following CV to match the job description. Use STAR methodology, quantify achievements, strong action verbs (Architected, Spearheaded, Optimized, Scaled), and structure: Header → Professional Summary → Core Competencies → Experience → Education → Certifications. For lecturing roles emphasize Publications, Research, Grants, Teaching Philosophy. For tech roles emphasize Tech Stack, Scale Metrics, Business Impact, Leadership. Keep 2 pages max for corporate, 3-4 for academic. Professional tone, no fluff."

  - Output shown in a preview modal with before/after toggle.

  - **Export to PDF:** "Download Optimized CV" button generates a clean, senior-level formatted PDF using jspdf with orange accent headers.

- **AI Cover Letter Generator:** Button labeled "Generate Cover Letter". When clicked:

  - System prompt: "You are a senior career strategist with 24+ years writing executive cover letters. Write a compelling, personalized cover letter for this specific job using the candidate's background. Structure: Hook → Value Proposition → Evidence → Alignment → Call to Action. Maximum one page. Professional but warm tone. Address hiring manager if name unknown use 'Hiring Manager'."

  - Output shown in modal. Export to PDF available.

### NOTIFICATIONS & PWA PUSH

- **In-app notifications:** Bell icon in header with unread count badge (orange). Dropdown shows recent notifications. Mark as read on click.

- **Push Notifications via FCM:**

  - Trigger 1: New verified job posted matching user's preferences (checked every 6 hours via Supabase cron + Edge Function).

  - Trigger 2: Saved job deadline approaching (72 hours, 24 hours).

  - Trigger 3: Weekly digest every Monday 9 AM: "X new jobs match your profile this week."

  - Trigger 4: Application reminder: "You viewed [Job Title] 3 days ago. Apply before [Deadline]."

- **Notification Preferences:** Toggle switches in Profile for each notification type.

- **PWA Install Prompt:** Custom banner after 2nd visit. App works offline with cached job feeds. Show "You're offline" badge when disconnected.

### JOB DETAIL PAGE

- Full job description with formatted sections.

- "How to Apply" section with direct apply URL or email (with "Copy Email" button).

- "Save Job" heart icon.

- "Share Job" button (native share API on mobile, copy link on desktop).

- "Generate Match Analysis" button (triggers AI on demand).

- Company info card with verification status and source link.

- Related jobs section at bottom.

### SAVED JOBS & DASHBOARD

- Grid of saved jobs with status labels: Saved, Applied, Interview, Offer, Rejected.

- Drag or tap to update status.

- Notes field per saved job.

- Deadline sorting: closest first.

### PROFILE & SETTINGS

- Avatar upload (Supabase Storage).

- Edit preferences, skills, experience.

- Resume management: upload new, view parsed text, delete.

- Notification preferences toggles.

- Theme toggle: Dark (default) / Light mode.

- "Delete Account" with confirmation.

### RESPONSIVE BEHAVIOR

- Mobile: Bottom tab nav, full-width cards, bottom sheets for filters.

- Tablet: 2-column job grid.

- Desktop: Sidebar nav, 3-column trending, detailed right-panel preview on hover/click.

### PERFORMANCE & UX REQUIREMENTS

- Skeleton loaders on all data fetches (orange pulse animation).

- Empty states with illustrations and action buttons.

- Error boundaries with "Retry" buttons.

- Toast notifications for all actions (save, apply, generate, export) using orange theme.

- All buttons have ripple effects. Cards lift on hover with orange shadow glow.

- Page transitions: fade + slight upward slide.

### EDGE FUNCTIONS (Supabase)

Create these Edge Functions:

1. `verify-job` — Admin endpoint to mark jobs as verified/rejected.

2. `generate-match` — Accepts resume_text + job_id, calls OpenAI, returns match score + gap analysis.

3. `generate-cv` — Accepts resume_text + job_id + type ('corporate' | 'academic'), calls OpenAI, returns rewritten CV markdown.

4. `generate-cover` — Accepts resume_text + job_id, calls OpenAI, returns cover letter text.

5. `send-push` — Accepts user_id + title + body + job_id, queries FCM token, sends via Firebase Admin SDK.

6. `check-deadlines` — Cron-triggered every 6 hours. Finds saved jobs with deadlines in 72h/24h, sends push + in-app notification.

7. `digest-jobs` — Cron-triggered Mondays 9 AM. Finds new verified jobs matching each user's preferences from last 7 days, sends digest push.

### INITIAL DATA SEED

Seed the `jobs` table with 30 realistic sample jobs across all categories:

- 5 Kenyan university lecturing posts (UoN, Kenyatta, Strathmore, MKU, JKUAT).

- 5 Kenyan tech company roles (Safaricom, Andela, Flutterwave, M-KOPA, Britam).

- 5 TBI research/field positions (Turkana Basin Institute).

- 5 Internship/Attachment roles (mix of university and corporate).

- 5 Remote abroad positions (US, UK, EU companies hiring remote in Africa).

- 5 NGO/Development roles (FAO, IRC, UN Kenya).

All must have `verification_status: 'verified'` so the feed populates immediately.

### ADMIN WORKFLOW (Simple)

- Add a hidden `/admin` route protected by a simple PIN (stored in environment variable).

- Admin sees a table of pending jobs with Approve/Reject buttons.

- Only approved jobs enter the main feed.

Build the entire application now. Ensure the orange theme is consistent, the verification system is strict, AI features are strictly on-demand with clear buttons, notifications work end-to-end, and the PWA is installable with offline capability. The app name "45LITE" should appear in the app header, manifest, and browser tab. Use the tagline "Career. Optimized." in the footer.

---

**Copy the entire block above and paste it into Lovable.** It contains the complete specification — brand, database, auth, verification logic, AI prompts, notification architecture, PWA config, and UI behavior. Lovable will build the full stack application from this single prompt.
A few critical gaps that could break the build or user experience. Here is what to **append to the prompt** plus a **manual setup checklist** for after Lovable finishes.

---

## ➕ APPEND THIS TO THE END OF YOUR PROMPT

```

### ADDITIONAL REQUIREMENTS

**AI Rate Limiting:** Each user gets maximum 5 AI generations per day (CV rewrite + cover letter + match analysis combined). Store daily count in a `user_daily_usage` table with reset at midnight UTC. Show remaining quota in the AI button label: "Optimize CV (3 left today)". When quota exceeded, show upgrade prompt: "Daily limit reached. Upgrade to Pro for unlimited."

**Freemium Tiers:** 

- Free: 5 job searches/day, 5 AI generations/day, no push notifications, basic filters only.

- Pro (KES 300/month): Unlimited everything, push notifications, advanced filters, priority remote jobs badge.

- Store tier in `profiles.subscription_tier` (default 'free'). Gate features in UI based on this field.

**Application Tracker:** A dedicated "My Applications" tab with a Kanban board: Saved → Applied → Interview → Offer → Rejected. Drag cards between columns. Each card shows job title, company, days since last action, and next deadline. Add "Add Note" and "Upload Interview Prep" per card.

**Privacy & Compliance:** Add a "Data Privacy" section in Profile settings explaining: "Your resume is parsed locally and stored encrypted. We do not share your data with employers. You can delete all data permanently." Include a "Delete All My Data" button that wipes profiles, resumes, saved_jobs, and applications.

**Accessibility:** All interactive elements minimum 44x44px touch target. Color contrast WCAG AA compliant (orange on slate passes). Screen reader labels on all icons. Focus rings in orange for keyboard navigation.

**Analytics Dashboard (User-facing):** In Profile, show: "Jobs Viewed: X", "Applications Sent: Y", "Match Score Average: Z%", "Top Skill Gap: [skill]". Visualized with orange progress bars and donut charts.

**Error Resilience:** If OpenAI API fails or times out, show friendly error: "Our AI writer is taking a break. Please try again in a moment." with a retry button. Never crash the job detail page.

**Share Job:** Native Web Share API on mobile. On desktop, copy formatted text to clipboard: "Check out this [Job Title] at [Company] on 45LITE: [link]"

**Search Persistence:** Preserve active filters and search query in URL query parameters so users can bookmark or share specific searches.

**Empty States:** 

- No jobs match filters → "No verified jobs match your criteria. Try broadening your search or enable notifications for new matches." with a "Clear Filters" button.

- No saved jobs → "Your saved jobs will appear here. Start browsing!" with orange CTA to Home.

- No applications → "Track your job applications here. Save a job and mark it as applied!"

**Footer:** Fixed bottom footer on desktop, collapsible on mobile. Contains: "45LITE · Career. Optimized." | "Privacy" | "Terms" | "Contact Support" links.

**App Shell Loading:** Show a branded splash screen on first load — dark slate background, orange orbital logo animation (CSS rotating ring), "45LITE" text fading in. Duration: 1.5 seconds max.

```

---

## 🔧 MANUAL SETUP CHECKLIST (Lovable Cannot Do These)

After Lovable builds the frontend, you **must** configure these manually in Supabase/Firebase:

| Task | Where | Why |

|------|-------|-----|

| **Supabase Edge Functions** | Supabase Dashboard → Edge Functions | Paste the 7 function codes Lovable generates. Lovable writes the code but can't deploy to Supabase. |

| **Supabase Cron Jobs** | SQL Editor → `select cron.schedule(...)` | The `check-deadlines` and `digest-jobs` functions need cron triggers. Run this SQL: `select cron.schedule('deadline-check', '0 */6 * * *', 'select net.http_post(...)' );` |

| **Firebase Project + FCM** | Firebase Console | Create project, download `serviceAccountKey.json`, paste into Supabase secrets as `FIREBASE_ADMIN_KEY`. |

| **OpenAI API Key** | Supabase Secrets | Add `OPENAI_API_KEY` to Supabase Edge Function secrets. |

| **Supabase Storage Buckets** | Storage → New Bucket | Create `resumes` (public: false) and `avatars` (public: true) buckets. Set RLS policies. |

| **RLS Policies** | Table Editor → Policies | Verify all tables have RLS enabled and policies allow users to only read/write their own data. |

| **Environment Variables** | Lovable Settings | Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_VAPID_KEY`. |

---

## ⚠️ ONE WARNING

Your prompt is **very large**. With 20 Lovable points, it will likely build **~70%** of this in one go. Expect to need **2-3 follow-up prompts** in the same project to complete:

1. Edge Functions deployment guidance

2. Push notification wiring

3. AI generation fine-tuning

If Lovable says "too complex," tell it: *"Build Phase 1 first: Auth, Database, Job Feed with verification badges, Search, and Save Jobs. Skip AI and Push for now."* Then add those in follow-ups.

---

**Ready to paste?** The prompt + appendix above is your complete build spec.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://a45lite.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/326ef97f-1851-4d10-8e93-06e6f4cedbac).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

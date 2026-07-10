# Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use $superpower-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking via update_plan.

**Goal:** Replace the local Express/SQLite backend with Supabase for auth, user profile, unlocked trail, and journal persistence.

**Architecture:** Vue talks directly to Supabase through `@supabase/supabase-js`. Supabase Auth stores credentials, while public tables with RLS store only each user's profile, unlocked trail ids, and journal cards. The old `backend/` remains ignored for deployment and is no longer used by the frontend.

**Tech Stack:** Vue 3, Pinia, Vite, Supabase Auth, Supabase Postgres with RLS.

---

### Task 1: Supabase Client And Schema

**Files:**
- Create: `src/lib/supabase.js`
- Create: `docs/supabase-schema.sql`
- Modify: `.env.example`

- [ ] Install `@supabase/supabase-js`.
- [ ] Add a Supabase client that reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] Add SQL for `profiles`, `unlocked_trails`, and `journals` with owner-only RLS.

### Task 2: Auth Store Migration

**Files:**
- Modify: `src/stores/authStore.js`
- Modify: `src/views/AuthView.vue`

- [ ] Replace localhost API calls with Supabase Auth.
- [ ] Keep username/password UI by deriving an internal Auth email from the username.
- [ ] Store username, gender, birthday, traveler gender, and traveler identity in `profiles`.
- [ ] Load the profile after login/register.

### Task 3: Memory Store Persistence

**Files:**
- Modify: `src/stores/memoryStore.js`
- Modify: `src/views/JournalEditorView.vue`
- Modify: `src/views/MemoryView.vue`
- Modify: `src/views/TrailDetailView.vue`

- [ ] Load user journals and unlocked trails from Supabase.
- [ ] Insert unlocked trails with upsert to avoid duplicates.
- [ ] Insert/delete journals in Supabase and mirror state in Pinia.
- [ ] Keep local state working when Supabase is not configured.

### Verification

- [ ] Run `npm run build` successfully.
- [ ] Run the SQL in Supabase SQL Editor.
- [ ] Set Vercel environment variables.
- [ ] Register a new user, create a traveler, add a journal, refresh, and confirm data persists.
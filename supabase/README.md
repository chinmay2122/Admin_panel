# Supabase Integration & SQL Management Guide

This project is configured to work with **Supabase PostgreSQL**. It operates in dual-mode:
- **Live Supabase Mode**: When your Supabase credentials are configured in `.env.local`.
- **Local Fallback Mode**: When credentials are not yet set, it seamlessly loads built-in mock data so development and UI testing never break.

---

## 1. Quick Setup (Connect in 3 Steps)

### Step 1: Run the Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** from the left navigation bar.
3. Click **New query**.
4. Copy the entire content of [`supabase/schema.sql`](./schema.sql) and paste it into the editor.
5. Click **Run** (or press `Ctrl + Enter`).
   - This creates all required tables (`profiles`, `artworks`, `inquiries_chats`, `messages`, `jobs`, `applications`, `cor_members`), sets up foreign keys, performance indexes, RLS policies, and user triggers.

*(Optional)* If you want sample artworks and profiles in your database immediately, also run [`supabase/seed.sql`](./seed.sql).

### Step 2: Grab Your API Keys
1. In your Supabase project, go to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (secret key used by the admin backend)

### Step 3: Add to `.env.local`
Open `.env.local` in this project and paste your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```
Restart the dev server (`npm run dev`), and your admin panel will now fetch live data from Supabase!

---

## 2. How to Add New SQL Queries Onwards

Whenever you want to add new queries, tables, or columns, follow these standard patterns:

### Scenario A: Adding a New Column to an Existing Table
1. Run the SQL migration in Supabase SQL Editor:
   ```sql
   ALTER TABLE public.artworks 
   ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
   ```
2. Update the TypeScript interface in `lib/supabase/types.ts`:
   ```typescript
   artworks: {
     Row: {
       ...
       featured: boolean;
     };
     Insert: {
       ...
       featured?: boolean;
     };
   }
   ```
3. Use it in your repository (`lib/data/artworks.ts`):
   ```typescript
   // Filter by featured
   const { data } = await supabase.from('artworks').select('*').eq('featured', true);
   ```

---

### Scenario B: Adding a Completely New Table
1. Write the SQL in Supabase SQL Editor:
   ```sql
   CREATE TABLE IF NOT EXISTS public.exhibitions (
     id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
     title text NOT NULL,
     curator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
     location text NOT NULL,
     start_date timestamptz NOT NULL,
     end_date timestamptz NOT NULL,
     created_at timestamptz DEFAULT now()
   );

   -- Enable RLS
   ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Exhibitions viewable by everyone" ON public.exhibitions FOR SELECT USING (true);
   ```
2. Add the table definition to `lib/supabase/types.ts`.
3. Create a repository file in `lib/data/exhibitions.ts` using `getSupabaseAdmin()`:
   ```typescript
   import { getSupabaseAdmin } from "@/lib/supabase/server";

   export const exhibitionsRepo = {
     async list() {
       const supabase = getSupabaseAdmin();
       if (!supabase) return [];
       const { data, error } = await supabase
         .from('exhibitions')
         .select('*, profiles(full_name)')
         .order('start_date', { ascending: true });
       if (error) throw error;
       return data;
     },
   };
   ```

---

### Scenario C: Querying with Joins, Filters, and Pagination
All queries can be performed directly via the typed Supabase client in `lib/supabase/queries.ts` or directly in Server Actions:

```typescript
import { getSupabaseAdmin } from "@/lib/supabase/server";

const supabase = getSupabaseAdmin();

// 1. Join Artworks with Profiles (Artist details)
const { data: artworks } = await supabase
  .from('artworks')
  .select(`
    id,
    title,
    price,
    image_url,
    creator:creator_id (
      id,
      full_name,
      email,
      primary_medium
    )
  `)
  .eq('status', 'published')
  .order('created_at', { ascending: false });

// 2. Pagination (Page 2, 20 items per page)
const page = 2;
const pageSize = 20;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, count } = await supabase
  .from('artworks')
  .select('*', { count: 'exact' })
  .range(from, to);
```

---

### Scenario D: Complex SQL / Aggregations (Postgres RPC Functions)
If you have a complex calculation (e.g., custom analytics, monthly revenue breakdown):
1. Create a function in Supabase SQL Editor:
   ```sql
   CREATE OR REPLACE FUNCTION get_creator_artwork_stats(creator_uuid uuid)
   RETURNS TABLE (
     total_artworks bigint,
     total_value numeric,
     avg_price numeric
   ) LANGUAGE sql AS $$
     SELECT 
       count(id) as total_artworks,
       coalesce(sum(price), 0) as total_value,
       coalesce(avg(price), 0) as avg_price
     FROM public.artworks
     WHERE creator_id = creator_uuid;
   $$;
   ```
2. Call it from your Next.js TypeScript code:
   ```typescript
   const { data, error } = await supabase.rpc('get_creator_artwork_stats', {
     creator_uuid: 'YOUR_CREATOR_UUID'
   });
   ```

---

## 3. Directory Structure
```
admin_panel/
├── supabase/
│   ├── schema.sql         <- Master SQL to run in Supabase SQL Editor
│   ├── seed.sql           <- Optional test data for Supabase
│   └── README.md          <- This guide
├── lib/
│   ├── supabase/
│   │   ├── client.ts      <- Browser Supabase client
│   │   ├── server.ts      <- Server Supabase client with admin credentials
│   │   ├── types.ts       <- TypeScript database types
│   │   └── queries.ts     <- Query examples & reusable query helpers
│   └── data/
│       ├── artworks.ts    <- Artworks repository (Supabase + fallback)
│       ├── users.ts       <- Users/Profiles repository (Supabase + fallback)
│       ├── creators.ts    <- Creators repository (Supabase + fallback)
│       ├── inquiries.ts   <- Chats & Messages repository
│       └── ...
└── sql.txt                <- Original friend's SQL (corrected & validated)
```

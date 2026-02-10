-- 1. Tables (Idempotent)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished'))
);

CREATE TABLE IF NOT EXISTS public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies (Drop if exists then create for idempotency)
DO $$ 
BEGIN
    -- Rooms Policies
    DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
    CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public rooms are insertable by everyone" ON public.rooms;
    CREATE POLICY "Public rooms are insertable by everyone" ON public.rooms FOR INSERT WITH CHECK (true);

    -- Participants Policies
    DROP POLICY IF EXISTS "Public participants are viewable by everyone" ON public.participants;
    CREATE POLICY "Public participants are viewable by everyone" ON public.participants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public participants are insertable by everyone" ON public.participants;
    CREATE POLICY "Public participants are insertable by everyone" ON public.participants FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public participants are updatable by everyone" ON public.participants;
    CREATE POLICY "Public participants are updatable by everyone" ON public.participants FOR UPDATE USING (true);

    -- Chat Messages Policies
    DROP POLICY IF EXISTS "Public chat messages are viewable by everyone" ON public.chat_messages;
    CREATE POLICY "Public chat messages are viewable by everyone" ON public.chat_messages FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public chat messages are insertable by everyone" ON public.chat_messages;
    CREATE POLICY "Public chat messages are insertable by everyone" ON public.chat_messages FOR INSERT WITH CHECK (true);
END $$;

-- 4. Enable Realtime (Idempotent check)
-- Note: In Supabase, you can manage this via the UI, 
-- but if using SQL, we should check if they are already in the publication.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;
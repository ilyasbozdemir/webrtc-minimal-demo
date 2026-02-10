-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'finished')
    )
);

-- Create chat_messages table for persistent chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    room_id TEXT REFERENCES public.rooms (room_id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for this minimal demo)
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms FOR
SELECT USING (true);

CREATE POLICY "Public rooms are insertable by everyone" ON public.rooms FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY "Public chat messages are viewable by everyone" ON public.chat_messages FOR
SELECT USING (true);

CREATE POLICY "Public chat messages are insertable by everyone" ON public.chat_messages FOR
INSERT
WITH
    CHECK (true);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
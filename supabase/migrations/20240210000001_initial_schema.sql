-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished'))
);

-- Create participants table to track who is in the room
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT REFERENCES public.rooms(room_id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public rooms are insertable by everyone" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public participants are viewable by everyone" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Public participants are insertable by everyone" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public participants are updatable by everyone" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Public chat messages are viewable by everyone" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public chat messages are insertable by everyone" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
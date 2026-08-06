-- Drop existing tables to ensure a clean slate and avoid schema conflicts
DROP TABLE IF EXISTS public.engine_history CASCADE;
DROP TABLE IF EXISTS public.current_state CASCADE;

-- Create the engine_history table (append-only log of ticks)
CREATE TABLE public.engine_history (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    engine_source_unit INTEGER NOT NULL,
    cycle INTEGER NOT NULL,
    engine_total_lifespan INTEGER NOT NULL,
    sensors JSONB NOT NULL,
    maintenance_flag INTEGER NOT NULL,
    maintenance_probability REAL NOT NULL,
    explanation JSONB NOT NULL
);

-- Create the current_state table (always holds a single row representing the live tick)
CREATE TABLE public.current_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    state_data JSONB NOT NULL
);

-- Insert the initial empty row for current_state if it doesn't exist
INSERT INTO public.current_state (id, state_data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
-- Allow anonymous read access so the frontend can fetch the data
ALTER TABLE public.engine_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on engine_history" ON public.engine_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access on current_state" ON public.current_state FOR SELECT USING (true);

-- Note: The backend will use the service_role key, which bypasses RLS, to insert/update data.

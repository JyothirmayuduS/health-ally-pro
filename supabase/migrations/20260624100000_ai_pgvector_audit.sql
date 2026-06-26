-- Medora AI: pgvector knowledge store + HIPAA audit log

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_knowledge_chunks (
  id TEXT PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  link_to TEXT,
  embedding vector(768),
  content_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_embedding_idx
  ON public.ai_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS ai_knowledge_chunks_category_idx
  ON public.ai_knowledge_chunks (category);

CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  phi_redacted BOOLEAN NOT NULL DEFAULT true,
  phi_items_redacted INT NOT NULL DEFAULT 0,
  cloud_allowed BOOLEAN NOT NULL DEFAULT true,
  baa_compliant BOOLEAN NOT NULL DEFAULT false,
  prompt_hash TEXT,
  latency_ms INT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_audit_log_created_at_idx ON public.ai_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_audit_log_task_idx ON public.ai_audit_log (task);

ALTER TABLE public.ai_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Staff read knowledge; service role manages embeddings
CREATE POLICY ai_knowledge_read ON public.ai_knowledge_chunks
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY ai_audit_hospital_admin ON public.ai_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hospital_memberships hm
      WHERE hm.profile_id = auth.uid()
        AND hm.role IN ('super_admin', 'hospital_admin')
        AND (hm.hospital_id = ai_audit_log.hospital_id OR ai_audit_log.hospital_id IS NULL)
    )
  );

CREATE OR REPLACE FUNCTION public.match_ai_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 8,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  category TEXT,
  title TEXT,
  body TEXT,
  keywords TEXT[],
  link_to TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    k.id,
    k.category,
    k.title,
    k.body,
    k.keywords,
    k.link_to,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge_chunks k
  WHERE k.embedding IS NOT NULL
    AND (filter_category IS NULL OR k.category = filter_category)
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
$$;

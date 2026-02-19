CREATE TABLE transcription_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transcript TEXT,
  segments JSONB,
  duration FLOAT,
  total_chunks INTEGER NOT NULL DEFAULT 1,
  completed_chunks INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transcription_chunks (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  blob_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transcript TEXT,
  segments JSONB,
  duration FLOAT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcription_jobs_user_id ON transcription_jobs(user_id);
CREATE INDEX idx_transcription_chunks_job_id ON transcription_chunks(job_id);
CREATE UNIQUE INDEX idx_transcription_chunks_job_chunk ON transcription_chunks(job_id, chunk_index);

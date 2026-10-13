-- ==============================================================================
-- NovaPilot AI: Self-Learning Patterns & Media Attachments Migration
-- ==============================================================================

ALTER TABLE inbound_messages ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT '';
ALTER TABLE inbound_messages ADD COLUMN IF NOT EXISTS ocr_text TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS learned_patterns (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(255) NOT NULL,
    example_phrase TEXT NOT NULL,
    regex_pattern TEXT NOT NULL,
    target_intent VARCHAR(100) DEFAULT 'UPDATE_CUSTOMER_NAME',
    classification VARCHAR(50) DEFAULT 'NEEDS_REVIEW',
    confidence NUMERIC(5, 2) DEFAULT 0.95,
    times_matched INT DEFAULT 0,
    learned_by VARCHAR(100) DEFAULT 'ONCALL_ENGINEER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO learned_patterns (pattern_name, example_phrase, regex_pattern, target_intent, classification, confidence, times_matched, learned_by)
VALUES (
    'Informal Indonesian Mutation (Ubah gambar ini dari X ke Y)',
    'Bisa diubah kak gambar ini dari PT wokwpwkw ke PT hahahaha?',
    '(?:bisa\s+diubah|tolong\s+ubah|ganti|revisi).*?(?:dari)\s+[''"]?([A-Za-z0-9\s]{3,35})[''"]?\s+(?:ke|menjadi)\s+[''"]?([A-Za-z0-9\s]{3,35})[''"]?',
    'UPDATE_CUSTOMER_NAME',
    'NEEDS_REVIEW',
    0.98,
    1,
    'rifky (Supervisor)'
) ON CONFLICT DO NOTHING;

INSERT INTO learned_patterns (pattern_name, example_phrase, regex_pattern, target_intent, classification, confidence, times_matched, learned_by)
VALUES (
    'Direct Target Replacement (Ganti jadi PT X)',
    'Tolong ganti nama di faktur ini jadi PT Makmur Sejahtera Abadi ya pak',
    '(?:ganti\s+jadi|ubah\s+menjadi|ubah\s+ke)\s+[''"]?([A-Za-z0-9\s]{3,35})[''"]?',
    'UPDATE_CUSTOMER_NAME',
    'NEEDS_REVIEW',
    0.96,
    0,
    'SYSTEM_AI'
) ON CONFLICT DO NOTHING;

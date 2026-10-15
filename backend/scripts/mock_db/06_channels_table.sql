-- ==============================================================================
-- NovaPilot AI: Channels & Contacts Whitelist Directory Table
-- Target Database: novapilot_db
-- Purpose: Ingress whitelist management for WhatsApp groups, PIC hotlines, and Multi-bot channels
-- ==============================================================================

CREATE TABLE IF NOT EXISTS channels (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'GROUP', -- 'GROUP' or 'INDIVIDUAL'
    name VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'telegram', 'discord', 'slack'
    jid_or_chat_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'STANDBY', 'MUTED', 'RATE_LIMITED'
    is_whitelisted BOOLEAN NOT NULL DEFAULT TRUE,
    contact_person VARCHAR(255) DEFAULT '',
    contact_phone VARCHAR(100) DEFAULT '',
    total_messages INT DEFAULT 0,
    actionable_tickets INT DEFAULT 0,
    latency_ms INT DEFAULT 75,
    last_activity VARCHAR(100) DEFAULT 'Baru saja',
    members_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channels_platform ON channels(platform);
CREATE INDEX IF NOT EXISTS idx_channels_jid ON channels(jid_or_chat_id);
CREATE INDEX IF NOT EXISTS idx_channels_whitelist ON channels(is_whitelisted);

-- Seed Channels Directory
INSERT INTO channels (
    id, type, name, branch, platform, jid_or_chat_id, status, is_whitelisted,
    contact_person, contact_phone, total_messages, actionable_tickets, latency_ms, last_activity, members_json
) VALUES
(
    'ch_wa_grp_1', 'GROUP', 'Ops Cabang Surabaya & Gudang Timur', 'Jawa Timur (Surabaya Hub)', 'whatsapp',
    '120363028192837492@g.us', 'ACTIVE', TRUE, 'Bambang Santoso (Kepala Gudang)', '+62 812-3456-7890',
    284, 32, 78, '4 menit yang lalu',
    '[
        {"id": "mem_sby_1", "name": "Bambang Santoso", "phone": "+62 812-3456-7890", "role": "ADMIN", "isWhitelisted": true, "lastActive": "4 mnt yang lalu"},
        {"id": "mem_sby_2", "name": "Rifky Firdaus (Regional Tech Lead)", "phone": "+62 812-9876-1122", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "12 mnt yang lalu"},
        {"id": "mem_sby_3", "name": "Siti Aminah (Logistik Hub)", "phone": "+62 813-9876-5432", "role": "MEMBER", "isWhitelisted": true, "lastActive": "35 mnt yang lalu"},
        {"id": "mem_sby_4", "name": "Dedi Kurniawan (Admin Gudang)", "phone": "+62 856-4321-8765", "role": "MEMBER", "isWhitelisted": true, "lastActive": "2 jam yang lalu"},
        {"id": "mem_sby_5", "name": "Eko Prasetyo (Driver Armada)", "phone": "+62 878-1122-3344", "role": "MEMBER", "isWhitelisted": false, "lastActive": "1 hari yang lalu"},
        {"id": "mem_sby_6", "name": "Maya Indah (Staff Timbangan)", "phone": "+62 821-5566-7788", "role": "MEMBER", "isWhitelisted": true, "lastActive": "5 jam yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_ind_1', 'INDIVIDUAL', 'Rifky Firdaus (On-Call Regional Lead)', 'Jawa Timur (Surabaya)', 'whatsapp',
    '6281234567890@s.whatsapp.net', 'ACTIVE', TRUE, 'Rifky Firdaus', '+62 812-3456-7890',
    142, 18, 65, '12 menit yang lalu', '[]'::jsonb
),
(
    'ch_wa_grp_2', 'GROUP', 'Logistik Medan Priority & Distribusi', 'Sumatera Utara (Medan)', 'whatsapp',
    '120363098172635412@g.us', 'ACTIVE', TRUE, 'Hendra Wijaya (Supervisor Logistik)', '+62 813-8821-4910',
    198, 24, 112, '25 menit yang lalu',
    '[
        {"id": "mem_mdn_1", "name": "Hendra Wijaya", "phone": "+62 813-8821-4910", "role": "ADMIN", "isWhitelisted": true, "lastActive": "25 mnt yang lalu"},
        {"id": "mem_mdn_2", "name": "Surya Dharma (Dispatch On-Call)", "phone": "+62 812-7766-5544", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "1 jam yang lalu"},
        {"id": "mem_mdn_3", "name": "Rudi Tabuti (Checker Belawan)", "phone": "+62 852-3344-5566", "role": "MEMBER", "isWhitelisted": true, "lastActive": "4 jam yang lalu"},
        {"id": "mem_mdn_4", "name": "Linda Siregar (Admin Surat Jalan)", "phone": "+62 821-9988-7711", "role": "MEMBER", "isWhitelisted": false, "lastActive": "1 hari yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_ind_2', 'INDIVIDUAL', 'Dewi Lestari (Lead AR/AP Finance)', 'DKI Jakarta (Head Office)', 'whatsapp',
    '6281192837411@s.whatsapp.net', 'ACTIVE', TRUE, 'Dewi Lestari', '+62 811-9283-7411',
    412, 56, 72, '2 menit yang lalu', '[]'::jsonb
),
(
    'ch_wa_grp_3', 'GROUP', 'Finansial Kantor Pusat Jakarta', 'DKI Jakarta (Head Office)', 'whatsapp',
    '120363012938475610@g.us', 'ACTIVE', TRUE, 'Siti Rahmawati (Manajer Keuangan)', '+62 812-9900-1122',
    540, 72, 82, '8 menit yang lalu',
    '[
        {"id": "mem_jkt_1", "name": "Siti Rahmawati", "phone": "+62 812-9900-1122", "role": "SUPERADMIN", "isWhitelisted": true, "lastActive": "8 mnt yang lalu"},
        {"id": "mem_jkt_2", "name": "Dewi Lestari (AR/AP Lead)", "phone": "+62 811-9283-7411", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "2 mnt yang lalu"},
        {"id": "mem_jkt_3", "name": "Kevin Gunawan (Tax Compliance)", "phone": "+62 812-4433-2211", "role": "ADMIN", "isWhitelisted": true, "lastActive": "15 mnt yang lalu"},
        {"id": "mem_jkt_4", "name": "Anisa Tri (Kasir Utama)", "phone": "+62 813-7766-1122", "role": "MEMBER", "isWhitelisted": true, "lastActive": "1 jam yang lalu"},
        {"id": "mem_jkt_5", "name": "Farhan Malik (Auditor Internal)", "phone": "+62 857-8899-0011", "role": "MEMBER", "isWhitelisted": true, "lastActive": "3 jam yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_grp_4', 'GROUP', 'Plant Operations Cikarang II', 'Jawa Barat (Cikarang Industrial)', 'whatsapp',
    '120363077889900112@g.us', 'STANDBY', TRUE, 'Agus Pratama (Plant Manager)', '+62 821-7788-9900',
    96, 11, 95, '1 jam yang lalu',
    '[
        {"id": "mem_ckr_1", "name": "Agus Pratama", "phone": "+62 821-7788-9900", "role": "ADMIN", "isWhitelisted": true, "lastActive": "1 jam yang lalu"},
        {"id": "mem_ckr_2", "name": "Wahyu Hidayat (Maintenance On-Call)", "phone": "+62 812-3344-9988", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "2 jam yang lalu"},
        {"id": "mem_ckr_3", "name": "Dani Ramadhan (QC Line 1)", "phone": "+62 856-1122-3344", "role": "MEMBER", "isWhitelisted": true, "lastActive": "5 jam yang lalu"},
        {"id": "mem_ckr_4", "name": "Slamet Riyadi (Shift Supervisor)", "phone": "+62 878-9900-1122", "role": "MEMBER", "isWhitelisted": false, "lastActive": "2 hari yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_ind_3', 'INDIVIDUAL', 'Joko Anwar (Warehouse Dispatcher Semarang)', 'Jawa Tengah (Semarang)', 'whatsapp',
    '6285671239870@s.whatsapp.net', 'ACTIVE', TRUE, 'Joko Anwar', '+62 856-7123-9870',
    88, 9, 90, '35 menit yang lalu', '[]'::jsonb
),
(
    'ch_tg_grp_1', 'GROUP', 'Telegram On-Call Incident Alerts', 'Nasional (IT Infrastructure)', 'telegram',
    '-100192837482', 'ACTIVE', TRUE, 'Rudi Hartono (SRE Lead)', '@rudi_oncall',
    165, 21, 145, '18 menit yang lalu',
    '[
        {"id": "mem_tg_1", "name": "Rudi Hartono (SRE Lead)", "phone": "@rudi_oncall", "role": "ADMIN", "isWhitelisted": true, "lastActive": "18 mnt yang lalu"},
        {"id": "mem_tg_2", "name": "NovaBot Incident Forwarder", "phone": "@novapilot_bot", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "Aktif terus"},
        {"id": "mem_tg_3", "name": "Ari Wibowo (DevOps)", "phone": "@ari_wibowo", "role": "MEMBER", "isWhitelisted": true, "lastActive": "4 jam yang lalu"}
    ]'::jsonb
),
(
    'ch_dc_grp_1', 'GROUP', 'Discord #warehouse-ops Guild', 'Regional Plant IT Automation', 'discord',
    'channel_119283749281920195', 'ACTIVE', TRUE, 'DevOps Ops Bot', 'ops-bot#1049',
    130, 14, 120, '40 menit yang lalu',
    '[
        {"id": "mem_dc_1", "name": "DevOps Ops Bot", "phone": "ops-bot#1049", "role": "ADMIN", "isWhitelisted": true, "lastActive": "40 mnt yang lalu"},
        {"id": "mem_dc_2", "name": "Rifky Firdaus (Lead)", "phone": "rifky#0001", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "12 mnt yang lalu"},
        {"id": "mem_dc_3", "name": "Warehouse Webhook Pipe", "phone": "pipe-bot#9999", "role": "MEMBER", "isWhitelisted": true, "lastActive": "1 jam yang lalu"}
    ]'::jsonb
),
(
    'ch_sl_grp_1', 'GROUP', 'Slack #it-helpdesk Enterprise', 'Kantor Pusat Jakarta', 'slack',
    'C0819283ABC', 'ACTIVE', TRUE, 'IT Support Escalation Bot', 'U06ABC1234',
    220, 29, 110, '15 menit yang lalu',
    '[
        {"id": "mem_sl_1", "name": "IT Support Escalation Bot", "phone": "U06ABC1234", "role": "ADMIN", "isWhitelisted": true, "lastActive": "15 mnt yang lalu"},
        {"id": "mem_sl_2", "name": "Dewi Lestari (Finance)", "phone": "U07XYZ5678", "role": "ON_CALL", "isWhitelisted": true, "lastActive": "2 mnt yang lalu"},
        {"id": "mem_sl_3", "name": "Budi Santoso (Helpdesk)", "phone": "U08QWE9012", "role": "MEMBER", "isWhitelisted": true, "lastActive": "3 jam yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_grp_5', 'GROUP', 'Ekspedisi Cargo Makassar Hub', 'Sulawesi Selatan (Makassar)', 'whatsapp',
    '120363066554433221@g.us', 'MUTED', FALSE, 'Andi Mallarangeng', '+62 813-4455-6677',
    45, 2, 230, '4 jam yang lalu',
    '[
        {"id": "mem_mks_1", "name": "Andi Mallarangeng", "phone": "+62 813-4455-6677", "role": "ADMIN", "isWhitelisted": false, "lastActive": "4 jam yang lalu"},
        {"id": "mem_mks_2", "name": "Daeng Rusli (Gudang Pelabuhan)", "phone": "+62 812-9988-1122", "role": "MEMBER", "isWhitelisted": false, "lastActive": "1 hari yang lalu"},
        {"id": "mem_mks_3", "name": "Nur Hasanah (Admin Manifest)", "phone": "+62 852-7788-9900", "role": "MEMBER", "isWhitelisted": false, "lastActive": "3 hari yang lalu"}
    ]'::jsonb
),
(
    'ch_wa_ind_4', 'INDIVIDUAL', 'Vendor Support Oracle Database', 'Third-Party SLA', 'whatsapp',
    '6289988776655@s.whatsapp.net', 'STANDBY', TRUE, 'Senior DBA Support', '+62 899-8877-6655',
    19, 4, 160, '2 hari yang lalu', '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

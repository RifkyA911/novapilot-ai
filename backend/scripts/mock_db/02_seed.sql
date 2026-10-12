-- ==============================================================================
-- NovaPilot AI: Monolingual English Seed Data for Local Prototyping
-- ==============================================================================

-- Clear existing data
TRUNCATE TABLE audit_logs, documents, tickets, invoices, branches, users RESTART IDENTITY CASCADE;

-- 1. Seed Users
INSERT INTO users (name, email, role, avatar_url) VALUES
('John Doe', 'johndoe@factory.internal', 'ONCALL_ENGINEER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDoe'),
('Alex Standard', 'alex@factory.internal', 'ADMIN', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'),
('Sarah Connor', 'sarah@factory.internal', 'OPERATOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah');

-- 2. Seed Branches (Regional Distribution Hubs)
INSERT INTO branches (code, name, wa_group_id, city, contact_person, is_active) VALUES
('SBY-01', 'Surabaya Regional Hub', '120363001@g.us', 'Surabaya', 'Hendra (Operations)', TRUE),
('MDN-01', 'Medan Logistics Hub', '120363002@g.us', 'Medan', 'Melati (Logistics Coordinator)', TRUE),
('SMG-01', 'Semarang Distribution Center', '120363003@g.us', 'Semarang', 'Wahyu (Warehouse Manager)', TRUE),
('MKS-01', 'Makassar Central Hub', '120363004@g.us', 'Makassar', 'Andi (Branch Admin)', TRUE),
('BDG-01', 'Bandung Distribution Hub', '120363005@g.us', 'Bandung', 'Rina (Finance)', TRUE);

-- 3. Seed Invoices
INSERT INTO invoices (invoice_no, branch_id, customer_name, amount, status, is_posted) VALUES
('INV/2026/001', 1, 'PT Sumber Makmur', 45000000.00, 'OPEN', FALSE),
('INV/2026/002', 1, 'PT Karya Abadi Perkasa', 82500000.00, 'OPEN', FALSE),
('INV/2026/003', 2, 'CV Bintang Timur', 19800000.00, 'OPEN', FALSE),
('INV/2026/004', 3, 'PT Sentosa Raya', 124000000.00, 'POSTED', TRUE),
('INV/2026/005', 4, 'UD Jaya Baru Sejahtera', 31200000.00, 'CLOSED', TRUE),
('INV/2026/006', 5, 'CV Mandiri Prima', 67000000.00, 'OPEN', FALSE),
('INV/2026/007', 1, 'PT Megah Utama Indo', 155000000.00, 'OPEN', FALSE),
('INV/2026/008', 2, 'Toko Bangunan Anugerah', 14500000.00, 'OPEN', FALSE);

-- 4. Seed Tickets (Monolingual English)
INSERT INTO tickets (ticket_no, branch_id, raw_message, extracted_intent, document_no, field_target, current_value, proposed_value, confidence_score, status, approved_by, rejection_reason, created_at) VALUES
('TK-2026-001', 1, 'Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch corporate tax amendment. Thanks!', 'UPDATE_CUSTOMER_NAME', 'INV/2026/001', 'customer_name', 'PT Sumber Makmur', 'PT Sumber Makmur Abadi', 0.98, 'PENDING_APPROVAL', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('TK-2026-002', 2, 'Good afternoon John, please revise invoice INV/2026/003 customer name from Medan Hub to CV Bintang Timur Sejahtera due to administrative typographical error.', 'UPDATE_CUSTOMER_NAME', 'INV/2026/003', 'customer_name', 'CV Bintang Timur', 'CV Bintang Timur Sejahtera', 0.96, 'PENDING_APPROVAL', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
('TK-2026-003', 1, 'Please update customer name on invoice INV/2026/002 to PT Karya Abadi Perkasa.', 'UPDATE_CUSTOMER_NAME', 'INV/2026/002', 'customer_name', 'PT Karya Abadi', 'PT Karya Abadi Perkasa', 0.99, 'EXECUTED', 'John Doe', NULL, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('TK-2026-004', 4, 'Please change customer name on invoice INV/2026/005 to UD Berkah Makassar.', 'UPDATE_CUSTOMER_NAME', 'INV/2026/005', 'customer_name', 'UD Jaya Baru Sejahtera', 'UD Berkah Makassar', 0.91, 'REJECTED', 'John Doe', 'Invoice has been closed for the current fiscal accounting period. Requires Supervisor override.', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- 5. Seed Documents (File upload mock attachments)
INSERT INTO documents (ticket_id, file_name, file_path, mime_type, file_size, uploaded_by) VALUES
(1, 'tax_amendment_proof_sumber_makmur.pdf', '/uploads/tax_amendment_proof.pdf', 'application/pdf', 245100, 'MCP_AGENT'),
(2, 'delivery_order_medan_003.jpg', '/uploads/delivery_order_003.jpg', 'image/jpeg', 182300, 'MCP_AGENT');

-- 6. Seed Audit Logs
INSERT INTO audit_logs (ticket_id, action, performed_by, old_state, new_state, ip_address, created_at) VALUES
(3, 'PRECHECKED', 'SYSTEM_AI', '{"status": "OPEN"}'::jsonb, '{"verified": true}'::jsonb, '127.0.0.1', CURRENT_TIMESTAMP - INTERVAL '2 hours 1 minute'),
(3, 'APPROVED', 'John Doe', '{"status": "PENDING_APPROVAL"}'::jsonb, '{"status": "APPROVED"}'::jsonb, '192.168.1.104', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 'MUTATED', 'SYSTEM_GATEWAY', '{"customer_name": "PT Karya Abadi"}'::jsonb, '{"customer_name": "PT Karya Abadi Perkasa"}'::jsonb, '127.0.0.1', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(4, 'REJECTED', 'John Doe', '{"status": "PENDING_APPROVAL"}'::jsonb, '{"status": "REJECTED", "reason": "Closed invoice period"}'::jsonb, '192.168.1.104', CURRENT_TIMESTAMP - INTERVAL '4 hours');

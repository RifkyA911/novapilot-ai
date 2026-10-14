-- ==============================================================================
-- NovaPilot AI: MCP External Reference Database (ERP Simulation)
-- Database Name: novapilot_mcp_ref
-- Purpose: Enterprise Data Source queried and mutated via Model Context Protocol (MCP)
-- ==============================================================================

DROP TABLE IF EXISTS erp_invoices CASCADE;
DROP TABLE IF EXISTS customer_master CASCADE;
DROP TABLE IF EXISTS tax_validations CASCADE;
DROP TABLE IF EXISTS item_inventory CASCADE;

-- 1. Master Customer Legal Entity Registry
CREATE TABLE customer_master (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(30) NOT NULL,
    credit_limit NUMERIC(15,2) DEFAULT 100000000.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    contact_email VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enterprise ERP Commercial Invoices
CREATE TABLE erp_invoices (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_code VARCHAR(50) REFERENCES customer_master(customer_code),
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    is_locked BOOLEAN DEFAULT FALSE,
    erp_sync_status VARCHAR(50) DEFAULT 'SYNCED',
    last_mcp_mutation TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tax / DJP Validation Registry
CREATE TABLE tax_validations (
    id SERIAL PRIMARY KEY,
    tax_id VARCHAR(30) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    djp_status VARCHAR(50) DEFAULT 'VALID',
    tax_office_code VARCHAR(20) DEFAULT 'KPP-PRATAMA-01',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Warehouse Item Inventory
CREATE TABLE item_inventory (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    warehouse_location VARCHAR(100) NOT NULL,
    stock_available INT DEFAULT 0
);

-- ==========================================
-- SEED DATA (Dummy Enterprise ERP Project)
-- ==========================================

INSERT INTO customer_master (customer_code, legal_name, tax_id, credit_limit, status, contact_email, city) VALUES
('CUST-SBY-001', 'PT Sumber Makmur Abadi', '01.234.567.8-011.000', 250000000.00, 'ACTIVE', 'finance@sumbermakmur.co.id', 'Surabaya'),
('CUST-MDN-002', 'CV Bintang Timur Sejahtera', '02.345.678.9-022.000', 120000000.00, 'ACTIVE', 'admin@bintangtimur.co.id', 'Medan'),
('CUST-SBY-003', 'PT Karya Abadi Perkasa', '03.456.789.0-033.000', 500000000.00, 'ACTIVE', 'accounting@karyaabadi.co.id', 'Surabaya'),
('CUST-SMG-004', 'PT Sentosa Raya Prima', '04.567.890.1-044.000', 350000000.00, 'ACTIVE', 'tax@sentosaraya.co.id', 'Semarang'),
('CUST-MKS-005', 'UD Jaya Baru Sejahtera', '05.678.901.2-055.000', 80000000.00, 'ACTIVE', 'billing@jayabaru.co.id', 'Makassar');

INSERT INTO erp_invoices (invoice_no, customer_code, customer_name, amount, tax_amount, is_locked, erp_sync_status) VALUES
('INV/2026/001', 'CUST-SBY-001', 'PT Sumber Makmur', 45000000.00, 4950000.00, FALSE, 'SYNCED'),
('INV/2026/002', 'CUST-SBY-003', 'PT Karya Abadi Perkasa', 82500000.00, 9075000.00, FALSE, 'SYNCED'),
('INV/2026/003', 'CUST-MDN-002', 'CV Bintang Timur', 19800000.00, 2178000.00, FALSE, 'SYNCED'),
('INV/2026/004', 'CUST-SMG-004', 'PT Sentosa Raya', 124000000.00, 13640000.00, TRUE, 'SYNCED'),
('INV/2026/005', 'CUST-MKS-005', 'UD Jaya Baru Sejahtera', 31200000.00, 3432000.00, TRUE, 'CLOSED');

INSERT INTO tax_validations (tax_id, company_name, djp_status, tax_office_code) VALUES
('01.234.567.8-011.000', 'PT Sumber Makmur Abadi', 'VALID', 'KPP-SBY-TEGALSARI'),
('02.345.678.9-022.000', 'CV Bintang Timur Sejahtera', 'VALID', 'KPP-MDN-BARAT'),
('03.456.789.0-033.000', 'PT Karya Abadi Perkasa', 'VALID', 'KPP-SBY-GUBENG'),
('04.567.890.1-044.000', 'PT Sentosa Raya Prima', 'VALID', 'KPP-SMG-TENGAH'),
('05.678.901.2-055.000', 'UD Jaya Baru Sejahtera', 'VALID', 'KPP-MKS-PANAKKUKANG');

INSERT INTO item_inventory (item_code, item_name, warehouse_location, stock_available) VALUES
('SKU-CEMENT-50KG', 'Semen PortLand Tiga Roda 50kg', 'Surabaya Central Warehouse A1', 1250),
('SKU-STEEL-12MM', 'Besi Beton Ulir 12mm x 12m', 'Surabaya Yard B3', 840),
('SKU-PAINT-20L', 'Cat Tembok Weathercoat Putih 20L', 'Medan Logistics Hub Rack 4', 320),
('SKU-CERAMIC-60X60', 'Granit Tile Polished 60x60cm', 'Semarang DC Pallet 12', 450);

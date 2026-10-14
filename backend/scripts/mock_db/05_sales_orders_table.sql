-- ==============================================================================
-- NovaPilot AI: Enterprise Sales Order & Product Pricing / Discount Table
-- Target Database: novapilot_mcp_ref (and novapilot_db)
-- Purpose: Queryable via MCP Tools (query_sales_records, check_product_pricing_discount)
--          and tested directly via WhatsApp ChatOps
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_no VARCHAR(50),
    customer_code VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    customer_tax_id VARCHAR(30),
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(30) NOT NULL DEFAULT 'Unit',
    subtotal NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    tax_percent NUMERIC(5,2) DEFAULT 11.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    total_price NUMERIC(15,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    order_status VARCHAR(50) DEFAULT 'PROCESSING',
    sales_rep VARCHAR(100),
    branch_code VARCHAR(30),
    order_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Rich Sales & Pricing Data
INSERT INTO sales_orders (
    order_no, invoice_no, customer_code, customer_name, customer_tax_id,
    product_code, product_name, product_category,
    unit_price, quantity, unit, subtotal,
    discount_percent, discount_amount, tax_percent, tax_amount, total_price,
    payment_status, order_status, sales_rep, branch_code, notes
) VALUES
(
    'SO/2026/001', 'INV/2026/001', 'CUST-001', 'PT Sumber Makmur Sentosa', '01.234.567.8-012.000',
    'PRD-STEEL-01', 'Baja Ringan Galvalum C75 x 0.75mm', 'MATERIAL_KONSTRUKSI',
    125000.00, 100, 'Batang', 12500000.00,
    10.00, 1250000.00, 11.00, 1237500.00, 12487500.00,
    'PAID', 'DELIVERED', 'Andi Wijaya', 'SBY-01', 'Diskon promo proyek pabrik cabang Surabaya batch 1'
),
(
    'SO/2026/002', 'INV/2026/002', 'CUST-002', 'CV Bintang Timur Perkasa', '02.345.678.9-023.000',
    'PRD-PIPE-02', 'Pipa Seamless Carbon Steel Sch40 4 Inch', 'PERPIPAAN_VALVE',
    850000.00, 40, 'Batang', 34000000.00,
    5.00, 1700000.00, 11.00, 3553000.00, 35853000.00,
    'PENDING', 'PROCESSING', 'Siti Rahma', 'JKT-01', 'Menunggu konfirmasi pelunasan termin 1 dari accounting'
),
(
    'SO/2026/003', 'INV/2026/003', 'CUST-003', 'PT Karya Abadi Logam', '03.456.789.0-034.000',
    'PRD-VALVE-03', 'Industrial Gate Valve Cast Iron 2 Inch JIS 10K', 'PERPIPAAN_VALVE',
    1450000.00, 25, 'Unit', 36250000.00,
    15.00, 5437500.00, 11.00, 3389375.00, 34201875.00,
    'PARTIAL_50', 'SHIPPED', 'Budi Santoso', 'MDN-01', 'Diskon khusus volume order di atas 20 unit'
),
(
    'SO/2026/004', 'INV/2026/004', 'CUST-004', 'Toko Berkah Maju Jaya', '04.567.890.1-045.000',
    'PRD-CEMENT-04', 'Semen Portland Komposit (PCC) 50kg', 'SEMEN_BETON',
    68000.00, 200, 'Sak', 13600000.00,
    0.00, 0.00, 11.00, 1496000.00, 15096000.00,
    'PAID', 'DELIVERED', 'Andi Wijaya', 'SBY-01', 'Harga nett toko retail tanpa diskon tambahan'
),
(
    'SO/2026/005', 'INV/2026/005', 'CUST-005', 'UD Sinar Logam Lestari', '05.678.901.2-056.000',
    'PRD-PLATE-05', 'Plat Baja Hitam SPCC 2.0mm x 4x8 ft', 'MATERIAL_KONSTRUKSI',
    420000.00, 50, 'Lembar', 21000000.00,
    8.00, 1680000.00, 11.00, 2125200.00, 21445200.00,
    'OVERDUE', 'SHIPPED', 'Siti Rahma', 'JKT-01', 'Jatuh tempo lewat 3 hari, notifikasi dunning otomatis dikirim'
),
(
    'SO/2026/006', 'INV/2026/006', 'CUST-001', 'PT Sumber Makmur Sentosa', '01.234.567.8-012.000',
    'PRD-WELD-06', 'Kawat Las Listrik E6013 3.2mm (5kg/box)', 'SPAREPART_MESIN',
    165000.00, 80, 'Box', 13200000.00,
    12.00, 1584000.00, 11.00, 1277760.00, 12893760.00,
    'PAID', 'APPROVED', 'Andi Wijaya', 'SBY-01', 'Repeat order proyek fabrikasi tangki'
)
ON CONFLICT (order_no) DO NOTHING;

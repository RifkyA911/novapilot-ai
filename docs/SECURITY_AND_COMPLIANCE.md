# 🛡️ Security, Compliance & Portfolio Sanitization Guidelines

---

## 1. WhatsApp Terms of Service (ToS) & Anti-Banning Strategy

Automating WhatsApp integrations carries strict platform policies from Meta. NovaPilot AI applies robust anti-ban mitigation strategies:

### 1.1 Core Ban Triggers on WhatsApp
- Outbound cold messaging and bulk spam campaigns to numbers that have not saved your contact.
- High-velocity automated outbound bursts within short timeframes.
- Aggressive background scraping of group member profiles or phone numbers.

### 1.2 NovaPilot Anti-Ban Architecture
1. **Passive Ingestion Model:**
   - The system **NEVER** initiates cold conversations (*Zero Outbound Cold Messaging*).
   - The listener only monitors authorized branch groups registered in an internal whitelist.
2. **Reactive Single-Reply Pattern:**
   - The system sends exactly **one** targeted message response per ticket in the originating chat thread, exclusively after human approval has been granted.
3. **Natural Human Approval Intervals:**
   - Because each action is gated by human review in the WebUI, outbound replies occur at natural, randomized human intervals rather than machine-speed bursts.
4. **Provider-Agnostic Adapter:**
   - In internal factory environments: Operates via local WhatsApp Web session (`Baileys` / `whatsapp-web.js`).
   - In public showcase/enterprise deployments: Implements an interface adapter supporting the **Official WhatsApp Business Cloud API**.

---

## 2. Public GitHub Portfolio Sanitization (NDA & Data Protection)

To showcase NovaPilot AI as a top-tier open-source portfolio on GitHub without violating corporate Non-Disclosure Agreements (NDA):

### 2.1 Strictly Prohibited in the Repository:
- ❌ **Real Production Credentials:** Factory database IPs, ports, passwords, SSH keys, or API tokens.
- ❌ **Internal Network Artifacts:** Real `tnsnames.ora` files, private intranet subnets (e.g. `10.14.x.x`), or internal DNS domains.
- ❌ **Actual Corporate Identity:** Factory names, registered trademarks, or internal ERP proprietary designations.
- ❌ **Real Customer & Contact Data:** Branch manager personal phone numbers, client tax IDs (NPWP), or private transaction histories.
- ❌ **Session Tokens:** Active WhatsApp authentication folders (`auth_info/`, `.wwebjs_auth/`).

### 2.2 Portfolio Cleanliness Best Practices:
1. **Generic Enterprise Schemas:**
   - Use standard industry table names in public code:
     - `invoices`, `customers`, `tickets`, `audit_logs`
2. **Realistic Mock Datasets:**
   - Provide realistic dummy seeds in `scripts/mock_db/02_seed.sql` using fictional company names (*PT Sumber Makmur*, *CV Bintang Timur*, *PT Megah Utama*).
3. **Rigorous `.env.example` Templates:**
   - Provide clear placeholder configurations for local PostgreSQL and enterprise Oracle 11g adapters.
4. **Enforced `.gitignore` Protections:**
   - Ensure `.env`, `*.ora`, session stores, SQLite databases, and build artifacts are strictly excluded from version control.

---

## 3. Database Security & Credential Isolation

### 3.1 Zero Credential Exposure to AI
- AI models (LLMs) **never** access database connections, hostnames, or credentials directly.
- The AI only processes sanitized incoming chat text and returns structured JSON schemas.
- The Golang backend acts as the sole authorized executor, shielding the database layer.

### 3.2 Prepared Statements & Transactional Integrity
- Dynamic SQL string concatenation is strictly forbidden.
- All database modifications are executed via parameterized prepared statements:
  ```go
  query := `UPDATE invoices 
            SET customer_name = $1, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE invoice_no = $2 
              AND status = 'OPEN'`
  _, err := db.ExecContext(ctx, query, newCustomerName, invoiceNo)
  ```
- **Principle of Least Privilege:** Database accounts used by the backend should be granted permissions only on designated tables with no permissions for DDL operations (`DROP`, `ALTER`).

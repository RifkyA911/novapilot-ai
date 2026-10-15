package postgres

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"novapilot-ai/backend/internal/domain"
	"sync"
	"time"

	"github.com/lib/pq"
)

type Repository struct {
	db       *sql.DB
	tickets  []domain.Ticket
	invoices []domain.Invoice
	logs     []domain.AuditLog
	docs     []domain.Document
	messages []domain.InboundMessage
	patterns []domain.LearnedPattern
	channels []domain.ContactChannel
	mu       sync.RWMutex
}

func NewRepository(db *sql.DB) *Repository {
	branchId1 := 1
	branchId2 := 2
	branchId4 := 4

	initialMessages := []domain.InboundMessage{
		{
			ID: 1, Platform: "whatsapp", SenderID: "97590263705836@lid", SenderName: "Branch Staff (Surabaya)",
			RawMessage: "Pye pak?", MediaType: "text", Classification: domain.ClassCasualBanter,
			CreatedAt: time.Now().Add(-10 * time.Minute),
		},
		{
			ID: 2, Platform: "whatsapp", SenderID: "97590263705836@lid", SenderName: "Branch Staff (Surabaya)",
			RawMessage: "Bisa diubah kak gambar ini dari PT wokwpwkw ke PT hahahaha?", MediaType: "image",
			Classification: domain.ClassNeedsReview, ExtractedIntent: "UPDATE_CUSTOMER_NAME", ExtractedTarget: "PT hahahaha",
			CreatedAt: time.Now().Add(-8 * time.Minute),
		},
		{
			ID: 3, Platform: "whatsapp", SenderID: "6281234567890@s.whatsapp.net", SenderName: "Surabaya Logistics Admin",
			RawMessage: "Halo Tim IT On-Call Surabaya, tolong ubah nama nota INV/2026/001 customer PT Sumber Makmur menjadi PT Sumber Makmur Abadi. Bukti terlampir.",
			MediaType: "text", Classification: domain.ClassActionable, ExtractedDoc: "INV/2026/001",
			ExtractedIntent: "UPDATE_CUSTOMER_NAME", ExtractedTarget: "PT Sumber Makmur Abadi",
			TicketNo: "TK-2026-001", CreatedAt: time.Now().Add(-15 * time.Minute),
		},
		{
			ID: 4, Platform: "telegram", SenderID: "@medan_warehouse_lead", SenderName: "Hendra Wijaya (Telegram)",
			RawMessage: "Selamat siang tim IT, tolong koreksi nama customer invoice INV/2026/003 menjadi CV Bintang Timur Sejahtera ya pak.",
			MediaType: "text", Classification: domain.ClassActionable, ExtractedDoc: "INV/2026/003",
			ExtractedIntent: "UPDATE_CUSTOMER_NAME", ExtractedTarget: "CV Bintang Timur Sejahtera",
			TicketNo: "TK-2026-002", CreatedAt: time.Now().Add(-5 * time.Minute),
		},
		{
			ID: 5, Platform: "discord", SenderID: "ops-bot#1049", SenderName: "Discord #warehouse-ops",
			RawMessage: "Perlu perubahan alamat NPWP dan nama faktur PT Sentosa Raya ke PT Sentosa Raya Prima untuk nota INV/2026/004",
			MediaType: "text", Classification: domain.ClassActionable, ExtractedDoc: "INV/2026/004",
			ExtractedIntent: "UPDATE_CUSTOMER_NAME", ExtractedTarget: "PT Sentosa Raya Prima",
			CreatedAt: time.Now().Add(-30 * time.Minute),
		},
		{
			ID: 6, Platform: "slack", SenderID: "U06ABC1234", SenderName: "Rudi Hartono (Slack #it-helpdesk)",
			RawMessage: "Ada yang lagi on-call nggak ya? Mau tanya terkait sinkronisasi SAP cabang Makassar.",
			MediaType: "text", Classification: domain.ClassCasualBanter,
			CreatedAt: time.Now().Add(-45 * time.Minute),
		},
	}


	repo := &Repository{
		db: db,
		invoices: []domain.Invoice{
			{ID: 1, InvoiceNo: "INV/2026/001", BranchID: &branchId1, CustomerName: "PT Sumber Makmur", Amount: 45000000, Status: domain.InvoiceOpen, IsPosted: false, CreatedAt: time.Now().Add(-24 * time.Hour), UpdatedAt: time.Now().Add(-24 * time.Hour)},
			{ID: 2, InvoiceNo: "INV/2026/002", BranchID: &branchId1, CustomerName: "PT Karya Abadi Perkasa", Amount: 82500000, Status: domain.InvoiceOpen, IsPosted: false, CreatedAt: time.Now().Add(-20 * time.Hour), UpdatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: 3, InvoiceNo: "INV/2026/003", BranchID: &branchId2, CustomerName: "CV Bintang Timur", Amount: 19800000, Status: domain.InvoiceOpen, IsPosted: false, CreatedAt: time.Now().Add(-18 * time.Hour), UpdatedAt: time.Now().Add(-18 * time.Hour)},
			{ID: 4, InvoiceNo: "INV/2026/004", BranchID: &branchId1, CustomerName: "PT Sentosa Raya", Amount: 124000000, Status: domain.InvoicePosted, IsPosted: true, CreatedAt: time.Now().Add(-15 * time.Hour), UpdatedAt: time.Now().Add(-15 * time.Hour)},
			{ID: 5, InvoiceNo: "INV/2026/005", BranchID: &branchId4, CustomerName: "UD Jaya Baru Sejahtera", Amount: 31200000, Status: domain.InvoiceClosed, IsPosted: true, CreatedAt: time.Now().Add(-12 * time.Hour), UpdatedAt: time.Now().Add(-12 * time.Hour)},
		},
		tickets: []domain.Ticket{
			{
				ID: 1, TicketNo: "TK-2026-001", BranchID: &branchId1, BranchName: "Surabaya Regional Hub",
				RawMessage:      "Hello IT Support, please update invoice INV/2026/001 customer name from PT Sumber Makmur to PT Sumber Makmur Abadi due to branch corporate tax amendment. Thanks!",
				ExtractedIntent: "UPDATE_CUSTOMER_NAME", DocumentNo: "INV/2026/001", FieldTarget: "customer_name",
				CurrentValue: "PT Sumber Makmur", ProposedValue: "PT Sumber Makmur Abadi",
				ConfidenceScore: 0.98, Status: domain.StatusPendingApproval,
				CreatedAt: time.Now().Add(-15 * time.Minute), UpdatedAt: time.Now().Add(-15 * time.Minute),
				Documents: []domain.Document{
					{ID: 1, FileName: "tax_amendment_proof_sumber_makmur.pdf", FilePath: "/uploads/sample_proof.pdf", MimeType: "application/pdf", FileSize: 245100, UploadedBy: "MCP_AGENT"},
				},
			},
			{
				ID: 2, TicketNo: "TK-2026-002", BranchID: &branchId2, BranchName: "Medan Logistics Hub",
				RawMessage:      "Good afternoon John, please revise invoice INV/2026/003 customer name from Medan Hub to CV Bintang Timur Sejahtera due to administrative typographical error.",
				ExtractedIntent: "UPDATE_CUSTOMER_NAME", DocumentNo: "INV/2026/003", FieldTarget: "customer_name",
				CurrentValue: "CV Bintang Timur", ProposedValue: "CV Bintang Timur Sejahtera",
				ConfidenceScore: 0.96, Status: domain.StatusPendingApproval,
				CreatedAt: time.Now().Add(-5 * time.Minute), UpdatedAt: time.Now().Add(-5 * time.Minute),
				Documents: []domain.Document{
					{ID: 2, FileName: "delivery_order_medan_003.jpg", FilePath: "/uploads/delivery_order.jpg", MimeType: "image/jpeg", FileSize: 182300, UploadedBy: "MCP_AGENT"},
				},
			},
			{
				ID: 3, TicketNo: "TK-2026-003", BranchID: &branchId1, BranchName: "Surabaya Regional Hub",
				RawMessage:      "Please update customer name on invoice INV/2026/002 to PT Karya Abadi Perkasa.",
				ExtractedIntent: "UPDATE_CUSTOMER_NAME", DocumentNo: "INV/2026/002", FieldTarget: "customer_name",
				CurrentValue: "PT Karya Abadi", ProposedValue: "PT Karya Abadi Perkasa",
				ConfidenceScore: 0.99, Status: domain.StatusExecuted,
				CreatedAt: time.Now().Add(-2 * time.Hour), UpdatedAt: time.Now().Add(-2 * time.Hour),
			},
		},
		logs: []domain.AuditLog{
			{ID: 1, TicketID: 3, Action: "PRECHECKED", PerformedBy: "SYSTEM_AI", OldState: `{"status": "OPEN"}`, NewState: `{"verified": true}`, IPAddress: "127.0.0.1", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: 2, TicketID: 3, Action: "APPROVED", PerformedBy: "John Doe", OldState: `{"status": "PENDING_APPROVAL"}`, NewState: `{"status": "APPROVED"}`, IPAddress: "192.168.1.104", CreatedAt: time.Now().Add(-2 * time.Hour)},
		},
		messages: initialMessages,
		channels: []domain.ContactChannel{
			{
				ID: "ch_wa_grp_1", Type: "GROUP", Name: "Ops Cabang Surabaya & Gudang Timur",
				Branch: "Jawa Timur (Surabaya Hub)", Platform: "whatsapp", JidOrChatId: "120363028192837492@g.us",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Bambang Santoso (Kepala Gudang)",
				ContactPhone: "+62 812-3456-7890", TotalMessages: 284, ActionableTickets: 32, LatencyMs: 78,
				LastActivity: "4 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_sby_1", Name: "Bambang Santoso", Phone: "+62 812-3456-7890", Role: "ADMIN", IsWhitelisted: true, LastActive: "4 mnt yang lalu"},
					{ID: "mem_sby_2", Name: "Rifky Firdaus (Regional Tech Lead)", Phone: "+62 812-9876-1122", Role: "ON_CALL", IsWhitelisted: true, LastActive: "12 mnt yang lalu"},
					{ID: "mem_sby_3", Name: "Siti Aminah (Logistik Hub)", Phone: "+62 813-9876-5432", Role: "MEMBER", IsWhitelisted: true, LastActive: "35 mnt yang lalu"},
					{ID: "mem_sby_4", Name: "Dedi Kurniawan (Admin Gudang)", Phone: "+62 856-4321-8765", Role: "MEMBER", IsWhitelisted: true, LastActive: "2 jam yang lalu"},
					{ID: "mem_sby_5", Name: "Eko Prasetyo (Driver Armada)", Phone: "+62 878-1122-3344", Role: "MEMBER", IsWhitelisted: false, LastActive: "1 hari yang lalu"},
					{ID: "mem_sby_6", Name: "Maya Indah (Staff Timbangan)", Phone: "+62 821-5566-7788", Role: "MEMBER", IsWhitelisted: true, LastActive: "5 jam yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_ind_1", Type: "INDIVIDUAL", Name: "Rifky Firdaus (On-Call Regional Lead)",
				Branch: "Jawa Timur (Surabaya)", Platform: "whatsapp", JidOrChatId: "6281234567890@s.whatsapp.net",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Rifky Firdaus", ContactPhone: "+62 812-3456-7890",
				TotalMessages: 142, ActionableTickets: 18, LatencyMs: 65, LastActivity: "12 menit yang lalu",
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_grp_2", Type: "GROUP", Name: "Logistik Medan Priority & Distribusi",
				Branch: "Sumatera Utara (Medan)", Platform: "whatsapp", JidOrChatId: "120363098172635412@g.us",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Hendra Wijaya (Supervisor Logistik)",
				ContactPhone: "+62 813-8821-4910", TotalMessages: 198, ActionableTickets: 24, LatencyMs: 112,
				LastActivity: "25 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_mdn_1", Name: "Hendra Wijaya", Phone: "+62 813-8821-4910", Role: "ADMIN", IsWhitelisted: true, LastActive: "25 mnt yang lalu"},
					{ID: "mem_mdn_2", Name: "Surya Dharma (Dispatch On-Call)", Phone: "+62 812-7766-5544", Role: "ON_CALL", IsWhitelisted: true, LastActive: "1 jam yang lalu"},
					{ID: "mem_mdn_3", Name: "Rudi Tabuti (Checker Belawan)", Phone: "+62 852-3344-5566", Role: "MEMBER", IsWhitelisted: true, LastActive: "4 jam yang lalu"},
					{ID: "mem_mdn_4", Name: "Linda Siregar (Admin Surat Jalan)", Phone: "+62 821-9988-7711", Role: "MEMBER", IsWhitelisted: false, LastActive: "1 hari yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_ind_2", Type: "INDIVIDUAL", Name: "Dewi Lestari (Lead AR/AP Finance)",
				Branch: "DKI Jakarta (Head Office)", Platform: "whatsapp", JidOrChatId: "6281192837411@s.whatsapp.net",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Dewi Lestari", ContactPhone: "+62 811-9283-7411",
				TotalMessages: 412, ActionableTickets: 56, LatencyMs: 72, LastActivity: "2 menit yang lalu",
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_grp_3", Type: "GROUP", Name: "Finansial Kantor Pusat Jakarta",
				Branch: "DKI Jakarta (Head Office)", Platform: "whatsapp", JidOrChatId: "120363012938475610@g.us",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Siti Rahmawati (Manajer Keuangan)",
				ContactPhone: "+62 812-9900-1122", TotalMessages: 540, ActionableTickets: 72, LatencyMs: 82,
				LastActivity: "8 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_jkt_1", Name: "Siti Rahmawati", Phone: "+62 812-9900-1122", Role: "SUPERADMIN", IsWhitelisted: true, LastActive: "8 mnt yang lalu"},
					{ID: "mem_jkt_2", Name: "Dewi Lestari (AR/AP Lead)", Phone: "+62 811-9283-7411", Role: "ON_CALL", IsWhitelisted: true, LastActive: "2 mnt yang lalu"},
					{ID: "mem_jkt_3", Name: "Kevin Gunawan (Tax Compliance)", Phone: "+62 812-4433-2211", Role: "ADMIN", IsWhitelisted: true, LastActive: "15 mnt yang lalu"},
					{ID: "mem_jkt_4", Name: "Anisa Tri (Kasir Utama)", Phone: "+62 813-7766-1122", Role: "MEMBER", IsWhitelisted: true, LastActive: "1 jam yang lalu"},
					{ID: "mem_jkt_5", Name: "Farhan Malik (Auditor Internal)", Phone: "+62 857-8899-0011", Role: "MEMBER", IsWhitelisted: true, LastActive: "3 jam yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_grp_4", Type: "GROUP", Name: "Plant Operations Cikarang II",
				Branch: "Jawa Barat (Cikarang Industrial)", Platform: "whatsapp", JidOrChatId: "120363077889900112@g.us",
				Status: "STANDBY", IsWhitelisted: true, ContactPerson: "Agus Pratama (Plant Manager)",
				ContactPhone: "+62 821-7788-9900", TotalMessages: 96, ActionableTickets: 11, LatencyMs: 95,
				LastActivity: "1 jam yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_ckr_1", Name: "Agus Pratama", Phone: "+62 821-7788-9900", Role: "ADMIN", IsWhitelisted: true, LastActive: "1 jam yang lalu"},
					{ID: "mem_ckr_2", Name: "Wahyu Hidayat (Maintenance On-Call)", Phone: "+62 812-3344-9988", Role: "ON_CALL", IsWhitelisted: true, LastActive: "2 jam yang lalu"},
					{ID: "mem_ckr_3", Name: "Dani Ramadhan (QC Line 1)", Phone: "+62 856-1122-3344", Role: "MEMBER", IsWhitelisted: true, LastActive: "5 jam yang lalu"},
					{ID: "mem_ckr_4", Name: "Slamet Riyadi (Shift Supervisor)", Phone: "+62 878-9900-1122", Role: "MEMBER", IsWhitelisted: false, LastActive: "2 hari yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_ind_3", Type: "INDIVIDUAL", Name: "Joko Anwar (Warehouse Dispatcher Semarang)",
				Branch: "Jawa Tengah (Semarang)", Platform: "whatsapp", JidOrChatId: "6285671239870@s.whatsapp.net",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Joko Anwar", ContactPhone: "+62 856-7123-9870",
				TotalMessages: 88, ActionableTickets: 9, LatencyMs: 90, LastActivity: "35 menit yang lalu",
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_tg_grp_1", Type: "GROUP", Name: "Telegram On-Call Incident Alerts",
				Branch: "Nasional (IT Infrastructure)", Platform: "telegram", JidOrChatId: "-100192837482",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "Rudi Hartono (SRE Lead)",
				ContactPhone: "@rudi_oncall", TotalMessages: 165, ActionableTickets: 21, LatencyMs: 145,
				LastActivity: "18 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_tg_1", Name: "Rudi Hartono (SRE Lead)", Phone: "@rudi_oncall", Role: "ADMIN", IsWhitelisted: true, LastActive: "18 mnt yang lalu"},
					{ID: "mem_tg_2", Name: "NovaBot Incident Forwarder", Phone: "@novapilot_bot", Role: "ON_CALL", IsWhitelisted: true, LastActive: "Aktif terus"},
					{ID: "mem_tg_3", Name: "Ari Wibowo (DevOps)", Phone: "@ari_wibowo", Role: "MEMBER", IsWhitelisted: true, LastActive: "4 jam yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_dc_grp_1", Type: "GROUP", Name: "Discord #warehouse-ops Guild",
				Branch: "Regional Plant IT Automation", Platform: "discord", JidOrChatId: "channel_119283749281920195",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "DevOps Ops Bot",
				ContactPhone: "ops-bot#1049", TotalMessages: 130, ActionableTickets: 14, LatencyMs: 120,
				LastActivity: "40 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_dc_1", Name: "DevOps Ops Bot", Phone: "ops-bot#1049", Role: "ADMIN", IsWhitelisted: true, LastActive: "40 mnt yang lalu"},
					{ID: "mem_dc_2", Name: "Rifky Firdaus (Lead)", Phone: "rifky#0001", Role: "ON_CALL", IsWhitelisted: true, LastActive: "12 mnt yang lalu"},
					{ID: "mem_dc_3", Name: "Warehouse Webhook Pipe", Phone: "pipe-bot#9999", Role: "MEMBER", IsWhitelisted: true, LastActive: "1 jam yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_sl_grp_1", Type: "GROUP", Name: "Slack #it-helpdesk Enterprise",
				Branch: "Kantor Pusat Jakarta", Platform: "slack", JidOrChatId: "C0819283ABC",
				Status: "ACTIVE", IsWhitelisted: true, ContactPerson: "IT Support Escalation Bot",
				ContactPhone: "U06ABC1234", TotalMessages: 220, ActionableTickets: 29, LatencyMs: 110,
				LastActivity: "15 menit yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_sl_1", Name: "IT Support Escalation Bot", Phone: "U06ABC1234", Role: "ADMIN", IsWhitelisted: true, LastActive: "15 mnt yang lalu"},
					{ID: "mem_sl_2", Name: "Dewi Lestari (Finance)", Phone: "U07XYZ5678", Role: "ON_CALL", IsWhitelisted: true, LastActive: "2 mnt yang lalu"},
					{ID: "mem_sl_3", Name: "Budi Santoso (Helpdesk)", Phone: "U08QWE9012", Role: "MEMBER", IsWhitelisted: true, LastActive: "3 jam yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_grp_5", Type: "GROUP", Name: "Ekspedisi Cargo Makassar Hub",
				Branch: "Sulawesi Selatan (Makassar)", Platform: "whatsapp", JidOrChatId: "120363066554433221@g.us",
				Status: "MUTED", IsWhitelisted: false, ContactPerson: "Andi Mallarangeng",
				ContactPhone: "+62 813-4455-6677", TotalMessages: 45, ActionableTickets: 2, LatencyMs: 230,
				LastActivity: "4 jam yang lalu",
				Members: []domain.GroupMember{
					{ID: "mem_mks_1", Name: "Andi Mallarangeng", Phone: "+62 813-4455-6677", Role: "ADMIN", IsWhitelisted: false, LastActive: "4 jam yang lalu"},
					{ID: "mem_mks_2", Name: "Daeng Rusli (Gudang Pelabuhan)", Phone: "+62 812-9988-1122", Role: "MEMBER", IsWhitelisted: false, LastActive: "1 hari yang lalu"},
					{ID: "mem_mks_3", Name: "Nur Hasanah (Admin Manifest)", Phone: "+62 852-7788-9900", Role: "MEMBER", IsWhitelisted: false, LastActive: "3 hari yang lalu"},
				},
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
			{
				ID: "ch_wa_ind_4", Type: "INDIVIDUAL", Name: "Vendor Support Oracle Database",
				Branch: "Third-Party SLA", Platform: "whatsapp", JidOrChatId: "6289988776655@s.whatsapp.net",
				Status: "STANDBY", IsWhitelisted: true, ContactPerson: "Senior DBA Support",
				ContactPhone: "+62 899-8877-6655", TotalMessages: 19, ActionableTickets: 4, LatencyMs: 160,
				LastActivity: "2 hari yang lalu",
				CreatedAt: time.Now().Add(-72 * time.Hour), UpdatedAt: time.Now(),
			},
		},
	}

	if db != nil {
		var count int
		_ = db.QueryRow("SELECT COUNT(*) FROM inbound_messages").Scan(&count)
		if count == 0 {
			query := `
				INSERT INTO inbound_messages (platform, sender_id, sender_name, raw_message, media_type, classification, extracted_doc, extracted_intent, extracted_target, ticket_no, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			`
			for _, m := range initialMessages {
				_, _ = db.Exec(query, m.Platform, m.SenderID, m.SenderName, m.RawMessage, m.MediaType, m.Classification, m.ExtractedDoc, m.ExtractedIntent, m.ExtractedTarget, m.TicketNo, m.CreatedAt)
			}
		}

		// Ensure channels table exists and seed if empty
		_, _ = db.Exec(`
			CREATE TABLE IF NOT EXISTS channels (
				id VARCHAR(100) PRIMARY KEY,
				type VARCHAR(50) NOT NULL DEFAULT 'GROUP',
				name VARCHAR(255) NOT NULL,
				branch VARCHAR(255) NOT NULL,
				platform VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
				jid_or_chat_id VARCHAR(255) NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
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
			)
		`)
		var chCount int
		_ = db.QueryRow("SELECT COUNT(*) FROM channels").Scan(&chCount)
		if chCount == 0 {
			for _, ch := range repo.channels {
				_ = repo.SaveChannel(&ch)
			}
		}
	}

	return repo
}


// ==========================================
// TICKET REPOSITORY
// ==========================================

func (r *Repository) GetAll(statusFilter string) ([]domain.Ticket, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if statusFilter == "" {
			return r.tickets, nil
		}
		var filtered []domain.Ticket
		for _, t := range r.tickets {
			if string(t.Status) == statusFilter {
				filtered = append(filtered, t)
			}
		}
		return filtered, nil
	}

	query := `
		SELECT t.id, t.ticket_no, t.branch_id, COALESCE(b.name, 'Regional Hub') as branch_name,
		       t.raw_message, t.extracted_intent, t.document_no, t.field_target,
		       COALESCE(t.current_value, '') as current_value, t.proposed_value,
		       t.confidence_score, t.status, t.approved_by, t.rejection_reason,
		       t.created_at, t.updated_at
		FROM tickets t
		LEFT JOIN branches b ON t.branch_id = b.id
	`
	var rows *sql.Rows
	var err error

	if statusFilter != "" {
		query += " WHERE t.status = $1 ORDER BY t.created_at DESC"
		rows, err = r.db.Query(query, statusFilter)
	} else {
		query += " ORDER BY t.created_at DESC"
		rows, err = r.db.Query(query)
	}

	if err != nil {
		// Fallback to in-memory store on DB error
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.tickets, nil
	}
	defer rows.Close()

	var tickets []domain.Ticket
	var ticketIDs []int
	ticketMap := make(map[int]int)

	for rows.Next() {
		var t domain.Ticket
		var approvedBy, rejectionReason sql.NullString
		err := rows.Scan(
			&t.ID, &t.TicketNo, &t.BranchID, &t.BranchName,
			&t.RawMessage, &t.ExtractedIntent, &t.DocumentNo, &t.FieldTarget,
			&t.CurrentValue, &t.ProposedValue, &t.ConfidenceScore, &t.Status,
			&approvedBy, &rejectionReason, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan ticket: %w", err)
		}
		if approvedBy.Valid {
			t.ApprovedBy = &approvedBy.String
		}
		if rejectionReason.Valid {
			t.RejectionReason = &rejectionReason.String
		}

		ticketMap[t.ID] = len(tickets)
		ticketIDs = append(ticketIDs, t.ID)
		tickets = append(tickets, t)
	}

	// Batch load all documents in a single SQL query instead of N individual queries (eliminates N+1 query bottleneck)
	if len(ticketIDs) > 0 {
		docQuery := `
			SELECT id, ticket_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at
			FROM documents
			WHERE ticket_id = ANY($1)
		`
		if docRows, err := r.db.Query(docQuery, pq.Array(ticketIDs)); err == nil {
			defer docRows.Close()
			for docRows.Next() {
				var doc domain.Document
				if err := docRows.Scan(
					&doc.ID, &doc.TicketID, &doc.FileName, &doc.FilePath,
				); err == nil {
					if doc.TicketID != nil {
						if idx, ok := ticketMap[*doc.TicketID]; ok {
							tickets[idx].Documents = append(tickets[idx].Documents, doc)
						}
					}
				}
			}
		}
	}

	return tickets, nil
}

func (r *Repository) GetByID(id int) (*domain.Ticket, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, t := range r.tickets {
			if t.ID == id {
				return &t, nil
			}
		}
		return nil, fmt.Errorf("ticket #%d not found", id)
	}

	query := `
		SELECT t.id, t.ticket_no, t.branch_id, COALESCE(b.name, 'Regional Hub') as branch_name,
		       t.raw_message, t.extracted_intent, t.document_no, t.field_target,
		       COALESCE(t.current_value, '') as current_value, t.proposed_value,
		       t.confidence_score, t.status, t.approved_by, t.rejection_reason,
		       t.created_at, t.updated_at
		FROM tickets t
		LEFT JOIN branches b ON t.branch_id = b.id
		WHERE t.id = $1
	`
	var t domain.Ticket
	var approvedBy, rejectionReason sql.NullString
	err := r.db.QueryRow(query, id).Scan(
		&t.ID, &t.TicketNo, &t.BranchID, &t.BranchName,
		&t.RawMessage, &t.ExtractedIntent, &t.DocumentNo, &t.FieldTarget,
		&t.CurrentValue, &t.ProposedValue, &t.ConfidenceScore, &t.Status,
		&approvedBy, &rejectionReason, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, memTicket := range r.tickets {
			if memTicket.ID == id {
				return &memTicket, nil
			}
		}
		return nil, fmt.Errorf("ticket not found: %w", err)
	}
	if approvedBy.Valid {
		t.ApprovedBy = &approvedBy.String
	}
	if rejectionReason.Valid {
		t.RejectionReason = &rejectionReason.String
	}

	docs, _ := r.GetDocumentsByTicketID(t.ID)
	t.Documents = docs

	return &t, nil
}

func (r *Repository) Create(ticket *domain.Ticket) error {
	r.mu.Lock()
	ticket.ID = len(r.tickets) + 1
	ticket.CreatedAt = time.Now()
	ticket.UpdatedAt = time.Now()
	r.tickets = append([]domain.Ticket{*ticket}, r.tickets...)
	r.mu.Unlock()

	if r.db != nil {
		query := `
			INSERT INTO tickets (ticket_no, branch_id, raw_message, extracted_intent, document_no, field_target, current_value, proposed_value, confidence_score, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id, created_at, updated_at
		`
		_ = r.db.QueryRow(
			query,
			ticket.TicketNo, ticket.BranchID, ticket.RawMessage, ticket.ExtractedIntent,
			ticket.DocumentNo, ticket.FieldTarget, ticket.CurrentValue, ticket.ProposedValue,
			ticket.ConfidenceScore, ticket.Status,
		).Scan(&ticket.ID, &ticket.CreatedAt, &ticket.UpdatedAt)
	}
	return nil
}

func (r *Repository) UpdateStatus(id int, status domain.TicketStatus, approver *string, reason *string) error {
	r.mu.Lock()
	for i, t := range r.tickets {
		if t.ID == id {
			r.tickets[i].Status = status
			r.tickets[i].ApprovedBy = approver
			r.tickets[i].RejectionReason = reason
			r.tickets[i].UpdatedAt = time.Now()
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		query := `
			UPDATE tickets 
			SET status = $1, approved_by = $2, rejection_reason = $3, updated_at = $4
			WHERE id = $5
		`
		_, _ = r.db.Exec(query, status, approver, reason, time.Now(), id)
	}
	return nil
}

// ==========================================
// INVOICE REPOSITORY
// ==========================================

func (r *Repository) GetByInvoiceNo(invoiceNo string) (*domain.Invoice, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, inv := range r.invoices {
			if inv.InvoiceNo == invoiceNo {
				return &inv, nil
			}
		}
		return nil, fmt.Errorf("invoice %s not found", invoiceNo)
	}

	query := `
		SELECT id, invoice_no, branch_id, customer_name, amount, status, is_posted, created_at, updated_at
		FROM invoices
		WHERE invoice_no = $1
	`
	var inv domain.Invoice
	err := r.db.QueryRow(query, invoiceNo).Scan(
		&inv.ID, &inv.InvoiceNo, &inv.BranchID, &inv.CustomerName, &inv.Amount,
		&inv.Status, &inv.IsPosted, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, memInv := range r.invoices {
			if memInv.InvoiceNo == invoiceNo {
				return &memInv, nil
			}
		}
		return nil, fmt.Errorf("invoice not found: %w", err)
	}
	return &inv, nil
}

func (r *Repository) ListAll(limit int) ([]domain.Invoice, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.invoices, nil
	}

	if limit <= 0 {
		limit = 20
	}
	query := `
		SELECT id, invoice_no, branch_id, customer_name, amount, status, is_posted, created_at, updated_at
		FROM invoices
		ORDER BY id ASC LIMIT $1
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.invoices, nil
	}
	defer rows.Close()

	var invoices []domain.Invoice
	for rows.Next() {
		var inv domain.Invoice
		if err := rows.Scan(
			&inv.ID, &inv.InvoiceNo, &inv.BranchID, &inv.CustomerName, &inv.Amount,
			&inv.Status, &inv.IsPosted, &inv.CreatedAt, &inv.UpdatedAt,
		); err != nil {
			return nil, err
		}
		invoices = append(invoices, inv)
	}
	return invoices, nil
}

func (r *Repository) UpdateCustomerName(invoiceNo string, newCustomerName string, approver string) error {
	r.mu.Lock()
	for i, inv := range r.invoices {
		if inv.InvoiceNo == invoiceNo {
			r.invoices[i].CustomerName = newCustomerName
			r.invoices[i].UpdatedAt = time.Now()
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		query := `
			UPDATE invoices
			SET customer_name = $1, updated_at = $2
			WHERE invoice_no = $3
		`
		_, _ = r.db.Exec(query, newCustomerName, time.Now(), invoiceNo)
	}
	return nil
}

// ==========================================
// DOCUMENT REPOSITORY
// ==========================================

func (r *Repository) Save(doc *domain.Document) error {
	r.mu.Lock()
	doc.ID = len(r.docs) + 1
	doc.CreatedAt = time.Now()
	r.docs = append(r.docs, *doc)
	r.mu.Unlock()
	return nil
}

func (r *Repository) GetDocumentsByTicketID(ticketID int) ([]domain.Document, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var docs []domain.Document
	for _, d := range r.docs {
		if d.TicketID != nil && *d.TicketID == ticketID {
			docs = append(docs, d)
		}
	}
	return docs, nil
}

// ==========================================
// AUDIT REPOSITORY
// ==========================================

func (r *Repository) Record(log *domain.AuditLog) error {
	r.mu.Lock()
	log.ID = len(r.logs) + 1
	log.CreatedAt = time.Now()
	r.logs = append([]domain.AuditLog{*log}, r.logs...)
	r.mu.Unlock()
	return nil
}

func (r *Repository) GetAuditLogsByTicketID(ticketID int) ([]domain.AuditLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var logs []domain.AuditLog
	for _, l := range r.logs {
		if l.TicketID == ticketID {
			logs = append(logs, l)
		}
	}
	return logs, nil
}

func (r *Repository) GetRecent(limit int) ([]domain.AuditLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if limit <= 0 || limit > len(r.logs) {
		limit = len(r.logs)
	}
	return r.logs[:limit], nil
}

// ==========================================
// INBOUND MESSAGE REPOSITORY
// ==========================================

func (r *Repository) SaveMessage(msg *domain.InboundMessage) error {
	r.mu.Lock()
	msg.ID = len(r.messages) + 1
	if msg.CreatedAt.IsZero() {
		msg.CreatedAt = time.Now()
	}
	r.messages = append([]domain.InboundMessage{*msg}, r.messages...)
	r.mu.Unlock()

	if r.db != nil {
		query := `
			INSERT INTO inbound_messages (platform, sender_id, sender_name, raw_message, media_type, media_url, ocr_text, classification, extracted_doc, extracted_intent, extracted_target, ticket_id, ticket_no, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			RETURNING id, created_at
		`
		_ = r.db.QueryRow(
			query,
			msg.Platform, msg.SenderID, msg.SenderName, msg.RawMessage,
			msg.MediaType, msg.MediaURL, msg.OCRText, msg.Classification, msg.ExtractedDoc, msg.ExtractedIntent,
			msg.ExtractedTarget, msg.TicketID, msg.TicketNo, msg.CreatedAt,
		).Scan(&msg.ID, &msg.CreatedAt)
	}
	return nil
}

func (r *Repository) ListMessages(limit int, platform string, classification string) ([]domain.InboundMessage, error) {
	if limit <= 0 {
		limit = 100
	}

	if r.db != nil {
		query := `
			SELECT id, platform, sender_id, sender_name, raw_message, media_type,
			       COALESCE(media_url, ''), COALESCE(ocr_text, ''),
			       classification, COALESCE(extracted_doc, ''), COALESCE(extracted_intent, ''),
			       COALESCE(extracted_target, ''), ticket_id, COALESCE(ticket_no, ''), created_at
			FROM inbound_messages
			WHERE 1=1
		`
		var args []interface{}
		argIdx := 1

		if platform != "" && platform != "all" {
			query += fmt.Sprintf(" AND platform = $%d", argIdx)
			args = append(args, platform)
			argIdx++
		}
		if classification != "" && classification != "all" {
			query += fmt.Sprintf(" AND classification = $%d", argIdx)
			args = append(args, classification)
			argIdx++
		}

		query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d", argIdx)
		args = append(args, limit)

		rows, err := r.db.Query(query, args...)
		if err == nil {
			defer rows.Close()
			var msgs []domain.InboundMessage
			for rows.Next() {
				var m domain.InboundMessage
				var ticketID sql.NullInt64
				if err := rows.Scan(
					&m.ID, &m.Platform, &m.SenderID, &m.SenderName, &m.RawMessage, &m.MediaType,
					&m.MediaURL, &m.OCRText,
					&m.Classification, &m.ExtractedDoc, &m.ExtractedIntent, &m.ExtractedTarget,
					&ticketID, &m.TicketNo, &m.CreatedAt,
				); err == nil {
					if ticketID.Valid {
						tid := int(ticketID.Int64)
						m.TicketID = &tid
					}
					msgs = append(msgs, m)
				}
			}
			return msgs, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var filtered []domain.InboundMessage
	for _, m := range r.messages {
		if (platform == "" || platform == "all" || m.Platform == platform) &&
			(classification == "" || classification == "all" || string(m.Classification) == classification) {
			filtered = append(filtered, m)
			if len(filtered) >= limit {
				break
			}
		}
	}
	return filtered, nil
}

func (r *Repository) GetMessageByID(id int) (*domain.InboundMessage, error) {
	if r.db != nil {
		query := `
			SELECT id, platform, sender_id, sender_name, raw_message, media_type,
			       COALESCE(media_url, ''), COALESCE(ocr_text, ''),
			       classification, COALESCE(extracted_doc, ''), COALESCE(extracted_intent, ''),
			       COALESCE(extracted_target, ''), ticket_id, COALESCE(ticket_no, ''), created_at
			FROM inbound_messages
			WHERE id = $1
		`
		var m domain.InboundMessage
		var ticketID sql.NullInt64
		err := r.db.QueryRow(query, id).Scan(
			&m.ID, &m.Platform, &m.SenderID, &m.SenderName, &m.RawMessage, &m.MediaType,
			&m.MediaURL, &m.OCRText,
			&m.Classification, &m.ExtractedDoc, &m.ExtractedIntent, &m.ExtractedTarget,
			&ticketID, &m.TicketNo, &m.CreatedAt,
		)
		if err == nil {
			if ticketID.Valid {
				tid := int(ticketID.Int64)
				m.TicketID = &tid
			}
			return &m, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, m := range r.messages {
		if m.ID == id {
			return &m, nil
		}
	}
	return nil, fmt.Errorf("inbound message #%d not found", id)
}

func (r *Repository) LinkTicket(messageID int, ticketID int, ticketNo string) error {
	r.mu.Lock()
	for i, m := range r.messages {
		if m.ID == messageID {
			r.messages[i].TicketID = &ticketID
			r.messages[i].TicketNo = ticketNo
			r.messages[i].Classification = domain.ClassActionable
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		query := `
			UPDATE inbound_messages
			SET ticket_id = $1, ticket_no = $2, classification = 'ACTIONABLE'
			WHERE id = $3
		`
		_, _ = r.db.Exec(query, ticketID, ticketNo, messageID)
	}
	return nil
}

// ==========================================
// LEARNED PATTERNS REPOSITORY
// ==========================================

func (r *Repository) ListPatterns() ([]domain.LearnedPattern, error) {
	if r.db != nil {
		query := `
			SELECT id, pattern_name, example_phrase, regex_pattern, target_intent, classification,
			       confidence, times_matched, learned_by, is_active, created_at, updated_at
			FROM learned_patterns
			WHERE is_active = true
			ORDER BY times_matched DESC, created_at DESC
		`
		rows, err := r.db.Query(query)
		if err == nil {
			defer rows.Close()
			var pats []domain.LearnedPattern
			for rows.Next() {
				var p domain.LearnedPattern
				if err := rows.Scan(
					&p.ID, &p.PatternName, &p.ExamplePhrase, &p.RegexPattern, &p.TargetIntent,
					&p.Classification, &p.Confidence, &p.TimesMatched, &p.LearnedBy,
					&p.IsActive, &p.CreatedAt, &p.UpdatedAt,
				); err == nil {
					pats = append(pats, p)
				}
			}
			return pats, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.patterns, nil
}

func (r *Repository) CreatePattern(p *domain.LearnedPattern) error {
	r.mu.Lock()
	p.ID = len(r.patterns) + 1
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	p.IsActive = true
	r.patterns = append([]domain.LearnedPattern{*p}, r.patterns...)
	r.mu.Unlock()

	if r.db != nil {
		query := `
			INSERT INTO learned_patterns (pattern_name, example_phrase, regex_pattern, target_intent, classification, confidence, times_matched, learned_by, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			RETURNING id, created_at, updated_at
		`
		_ = r.db.QueryRow(
			query,
			p.PatternName, p.ExamplePhrase, p.RegexPattern, p.TargetIntent,
			p.Classification, p.Confidence, p.TimesMatched, p.LearnedBy,
			p.IsActive, p.CreatedAt, p.UpdatedAt,
		).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	}
	return nil
}

func (r *Repository) DeletePattern(id int) error {
	r.mu.Lock()
	for i, p := range r.patterns {
		if p.ID == id {
			r.patterns = append(r.patterns[:i], r.patterns[i+1:]...)
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		_, _ = r.db.Exec("DELETE FROM learned_patterns WHERE id = $1", id)
	}
	return nil
}

func (r *Repository) IncrementMatched(id int) error {
	r.mu.Lock()
	for i, p := range r.patterns {
		if p.ID == id {
			r.patterns[i].TimesMatched++
			r.patterns[i].UpdatedAt = time.Now()
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		_, _ = r.db.Exec("UPDATE learned_patterns SET times_matched = times_matched + 1, updated_at = NOW() WHERE id = $1", id)
	}
	return nil
}

// ==========================================
// CHANNELS DIRECTORY REPOSITORY
// ==========================================

func (r *Repository) ListChannels() ([]domain.ContactChannel, error) {
	if r.db != nil {
		query := `
			SELECT id, type, name, branch, platform, jid_or_chat_id, status, is_whitelisted,
			       contact_person, contact_phone, total_messages, actionable_tickets, latency_ms,
			       last_activity, members_json, created_at, updated_at
			FROM channels
			ORDER BY created_at DESC
		`
		rows, err := r.db.Query(query)
		if err == nil {
			defer rows.Close()
			var chs []domain.ContactChannel
			for rows.Next() {
				var ch domain.ContactChannel
				var membersJSON []byte
				if err := rows.Scan(
					&ch.ID, &ch.Type, &ch.Name, &ch.Branch, &ch.Platform, &ch.JidOrChatId,
					&ch.Status, &ch.IsWhitelisted, &ch.ContactPerson, &ch.ContactPhone,
					&ch.TotalMessages, &ch.ActionableTickets, &ch.LatencyMs, &ch.LastActivity,
					&membersJSON, &ch.CreatedAt, &ch.UpdatedAt,
				); err == nil {
					if len(membersJSON) > 0 {
						_ = json.Unmarshal(membersJSON, &ch.Members)
					}
					chs = append(chs, ch)
				}
			}
			return chs, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.channels, nil
}

func (r *Repository) GetChannelByID(id string) (*domain.ContactChannel, error) {
	if r.db != nil {
		query := `
			SELECT id, type, name, branch, platform, jid_or_chat_id, status, is_whitelisted,
			       contact_person, contact_phone, total_messages, actionable_tickets, latency_ms,
			       last_activity, members_json, created_at, updated_at
			FROM channels
			WHERE id = $1
		`
		var ch domain.ContactChannel
		var membersJSON []byte
		err := r.db.QueryRow(query, id).Scan(
			&ch.ID, &ch.Type, &ch.Name, &ch.Branch, &ch.Platform, &ch.JidOrChatId,
			&ch.Status, &ch.IsWhitelisted, &ch.ContactPerson, &ch.ContactPhone,
			&ch.TotalMessages, &ch.ActionableTickets, &ch.LatencyMs, &ch.LastActivity,
			&membersJSON, &ch.CreatedAt, &ch.UpdatedAt,
		)
		if err == nil {
			if len(membersJSON) > 0 {
				_ = json.Unmarshal(membersJSON, &ch.Members)
			}
			return &ch, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, ch := range r.channels {
		if ch.ID == id {
			return &ch, nil
		}
	}
	return nil, fmt.Errorf("channel not found: %s", id)
}

func (r *Repository) SaveChannel(channel *domain.ContactChannel) error {
	r.mu.Lock()
	found := false
	for i, c := range r.channels {
		if c.ID == channel.ID {
			r.channels[i] = *channel
			found = true
			break
		}
	}
	if !found {
		r.channels = append([]domain.ContactChannel{*channel}, r.channels...)
	}
	r.mu.Unlock()

	if r.db != nil {
		membersJSON, _ := json.Marshal(channel.Members)
		if len(membersJSON) == 0 {
			membersJSON = []byte("[]")
		}

		query := `
			INSERT INTO channels (
				id, type, name, branch, platform, jid_or_chat_id, status, is_whitelisted,
				contact_person, contact_phone, total_messages, actionable_tickets, latency_ms,
				last_activity, members_json, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8,
				$9, $10, $11, $12, $13,
				$14, $15, $16, $17
			)
			ON CONFLICT (id) DO UPDATE SET
				type = EXCLUDED.type,
				name = EXCLUDED.name,
				branch = EXCLUDED.branch,
				platform = EXCLUDED.platform,
				jid_or_chat_id = EXCLUDED.jid_or_chat_id,
				status = EXCLUDED.status,
				is_whitelisted = EXCLUDED.is_whitelisted,
				contact_person = EXCLUDED.contact_person,
				contact_phone = EXCLUDED.contact_phone,
				total_messages = EXCLUDED.total_messages,
				actionable_tickets = EXCLUDED.actionable_tickets,
				latency_ms = EXCLUDED.latency_ms,
				last_activity = EXCLUDED.last_activity,
				members_json = EXCLUDED.members_json,
				updated_at = NOW()
		`
		now := time.Now()
		if channel.CreatedAt.IsZero() {
			channel.CreatedAt = now
		}
		channel.UpdatedAt = now

		_, err := r.db.Exec(
			query,
			channel.ID, channel.Type, channel.Name, channel.Branch, channel.Platform, channel.JidOrChatId,
			channel.Status, channel.IsWhitelisted, channel.ContactPerson, channel.ContactPhone,
			channel.TotalMessages, channel.ActionableTickets, channel.LatencyMs,
			channel.LastActivity, membersJSON, channel.CreatedAt, channel.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("saving channel to db: %w", err)
		}
	}
	return nil
}

func (r *Repository) DeleteChannel(id string) error {
	r.mu.Lock()
	for i, c := range r.channels {
		if c.ID == id {
			r.channels = append(r.channels[:i], r.channels[i+1:]...)
			break
		}
	}
	r.mu.Unlock()

	if r.db != nil {
		_, err := r.db.Exec("DELETE FROM channels WHERE id = $1", id)
		if err != nil {
			return fmt.Errorf("deleting channel from db: %w", err)
		}
	}
	return nil
}

func (r *Repository) ToggleChannelWhitelist(id string) (*domain.ContactChannel, error) {
	ch, err := r.GetChannelByID(id)
	if err != nil {
		return nil, err
	}

	ch.IsWhitelisted = !ch.IsWhitelisted
	if ch.IsWhitelisted {
		ch.Status = "ACTIVE"
	} else {
		ch.Status = "MUTED"
	}
	ch.UpdatedAt = time.Now()

	if err := r.SaveChannel(ch); err != nil {
		return nil, err
	}
	return ch, nil
}




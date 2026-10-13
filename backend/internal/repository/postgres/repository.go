package postgres

import (
	"database/sql"
	"fmt"
	"novapilot-ai/backend/internal/domain"
	"sync"
	"time"
)

type Repository struct {
	db       *sql.DB
	tickets  []domain.Ticket
	invoices []domain.Invoice
	logs     []domain.AuditLog
	docs     []domain.Document
	messages []domain.InboundMessage
	patterns []domain.LearnedPattern
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

		docs, _ := r.GetDocumentsByTicketID(t.ID)
		t.Documents = docs
		tickets = append(tickets, t)
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



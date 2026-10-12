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
	mu       sync.RWMutex
}

func NewRepository(db *sql.DB) *Repository {
	branchId1 := 1
	branchId2 := 2
	branchId4 := 4

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

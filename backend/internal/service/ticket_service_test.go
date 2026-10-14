package service_test

import (
	"errors"
	"testing"
	"time"

	"novapilot-ai/backend/internal/domain"
	"novapilot-ai/backend/internal/service"
)

// Mock TicketRepository
type mockTicketRepo struct {
	tickets map[int]*domain.Ticket
	lastID  int
}

func newMockTicketRepo() *mockTicketRepo {
	return &mockTicketRepo{
		tickets: make(map[int]*domain.Ticket),
	}
}

func (m *mockTicketRepo) GetAll(statusFilter string) ([]domain.Ticket, error) {
	var res []domain.Ticket
	for _, t := range m.tickets {
		if statusFilter == "" || string(t.Status) == statusFilter {
			res = append(res, *t)
		}
	}
	return res, nil
}

func (m *mockTicketRepo) GetByID(id int) (*domain.Ticket, error) {
	t, ok := m.tickets[id]
	if !ok {
		return nil, errors.New("ticket not found")
	}
	return t, nil
}

func (m *mockTicketRepo) Create(ticket *domain.Ticket) error {
	m.lastID++
	ticket.ID = m.lastID
	ticket.CreatedAt = time.Now()
	ticket.UpdatedAt = time.Now()
	copyTicket := *ticket
	m.tickets[ticket.ID] = &copyTicket
	return nil
}

func (m *mockTicketRepo) UpdateStatus(id int, status domain.TicketStatus, approver *string, reason *string) error {
	t, ok := m.tickets[id]
	if !ok {
		return errors.New("ticket not found")
	}
	t.Status = status
	t.ApprovedBy = approver
	t.RejectionReason = reason
	t.UpdatedAt = time.Now()
	return nil
}

// Mock InvoiceRepository
type mockInvoiceRepo struct {
	invoices map[string]*domain.Invoice
}

func newMockInvoiceRepo() *mockInvoiceRepo {
	return &mockInvoiceRepo{
		invoices: make(map[string]*domain.Invoice),
	}
}

func (m *mockInvoiceRepo) ListAll(limit int) ([]domain.Invoice, error) {
	var res []domain.Invoice
	for _, inv := range m.invoices {
		res = append(res, *inv)
		if limit > 0 && len(res) >= limit {
			break
		}
	}
	return res, nil
}

func (m *mockInvoiceRepo) GetByInvoiceNo(invNo string) (*domain.Invoice, error) {
	inv, ok := m.invoices[invNo]
	if !ok {
		return nil, errors.New("invoice not found")
	}
	return inv, nil
}

func (m *mockInvoiceRepo) UpdateCustomerName(invNo, newName, updatedBy string) error {
	inv, ok := m.invoices[invNo]
	if !ok {
		return errors.New("invoice not found")
	}
	inv.CustomerName = newName
	inv.UpdatedAt = time.Now()
	return nil
}

// Mock DocumentRepository
type mockDocRepo struct{}

func (m *mockDocRepo) Save(doc *domain.Document) error {
	return nil
}

func (m *mockDocRepo) GetDocumentsByTicketID(ticketID int) ([]domain.Document, error) {
	return nil, nil
}

// Mock AuditRepository
type mockAuditRepo struct {
	logs []domain.AuditLog
}

func (m *mockAuditRepo) Record(log *domain.AuditLog) error {
	m.logs = append(m.logs, *log)
	return nil
}

func (m *mockAuditRepo) GetAuditLogsByTicketID(ticketID int) ([]domain.AuditLog, error) {
	var res []domain.AuditLog
	for _, l := range m.logs {
		if l.TicketID == ticketID {
			res = append(res, l)
		}
	}
	return res, nil
}

func (m *mockAuditRepo) GetRecent(limit int) ([]domain.AuditLog, error) {
	return m.logs, nil
}

// Mock SSEBroadcaster
type mockBroadcaster struct {
	broadcasts []string
}

func (m *mockBroadcaster) Broadcast(event string, data interface{}) {
	m.broadcasts = append(m.broadcasts, event)
}

// --- UNIT TESTS ---

func TestCreateTicketFromChat_Success(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	docRepo := &mockDocRepo{}
	auditRepo := &mockAuditRepo{}
	broadcaster := &mockBroadcaster{}

	// Seed open invoice
	invoiceRepo.invoices["INV/2026/001"] = &domain.Invoice{
		ID:           1,
		InvoiceNo:    "INV/2026/001",
		CustomerName: "PT Sumber Makmur",
		Status:       domain.InvoiceOpen,
	}

	svc := service.NewTicketService(ticketRepo, invoiceRepo, docRepo, auditRepo, broadcaster)

	input := domain.CreateTicketInput{
		RawMessage:      "Tolong ganti nama nota INV/2026/001 ke PT Sumber Makmur Abadi",
		ExtractedIntent: "UPDATE_CUSTOMER_NAME",
		DocumentNo:      "INV/2026/001",
		FieldTarget:     "customer_name",
		ProposedValue:   "PT Sumber Makmur Abadi",
		ConfidenceScore: 0.95,
	}

	ticket, err := svc.CreateTicketFromChat(input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if ticket.DocumentNo != "INV/2026/001" {
		t.Errorf("expected docNo INV/2026/001, got %s", ticket.DocumentNo)
	}
	if ticket.CurrentValue != "PT Sumber Makmur" {
		t.Errorf("expected currentValue PT Sumber Makmur, got %s", ticket.CurrentValue)
	}
	if ticket.ProposedValue != "PT Sumber Makmur Abadi" {
		t.Errorf("expected proposedValue PT Sumber Makmur Abadi, got %s", ticket.ProposedValue)
	}
	if ticket.Status != domain.StatusPendingApproval {
		t.Errorf("expected status PENDING_APPROVAL, got %s", ticket.Status)
	}
	if len(auditRepo.logs) == 0 {
		t.Errorf("expected audit log to be recorded")
	}
	if len(broadcaster.broadcasts) == 0 || broadcaster.broadcasts[0] != "ticket_created" {
		t.Errorf("expected broadcast event ticket_created")
	}
}

func TestCreateTicketFromChat_InvoiceNotFound(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	svc := service.NewTicketService(ticketRepo, invoiceRepo, &mockDocRepo{}, &mockAuditRepo{}, &mockBroadcaster{})

	input := domain.CreateTicketInput{
		DocumentNo:    "INV/9999/NONEXISTENT",
		ProposedValue: "PT Test",
	}

	_, err := svc.CreateTicketFromChat(input)
	if err == nil {
		t.Fatal("expected error for non-existent invoice, got nil")
	}
}

func TestCreateTicketFromChat_ClosedInvoice_PolicyViolation(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	svc := service.NewTicketService(ticketRepo, invoiceRepo, &mockDocRepo{}, &mockAuditRepo{}, &mockBroadcaster{})

	// Seed closed invoice
	invoiceRepo.invoices["INV/2026/CLOSED"] = &domain.Invoice{
		ID:           2,
		InvoiceNo:    "INV/2026/CLOSED",
		CustomerName: "PT Closed Store",
		Status:       domain.InvoiceClosed,
	}

	input := domain.CreateTicketInput{
		DocumentNo:    "INV/2026/CLOSED",
		ProposedValue: "PT Malicious Mutation",
	}

	_, err := svc.CreateTicketFromChat(input)
	if err == nil {
		t.Fatal("expected policy violation error on closed invoice, got nil")
	}
}

func TestApproveTicket_Success(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	auditRepo := &mockAuditRepo{}
	broadcaster := &mockBroadcaster{}

	invoiceRepo.invoices["INV/2026/001"] = &domain.Invoice{
		ID:           1,
		InvoiceNo:    "INV/2026/001",
		CustomerName: "Original PT",
		Status:       domain.InvoiceOpen,
	}

	svc := service.NewTicketService(ticketRepo, invoiceRepo, &mockDocRepo{}, auditRepo, broadcaster)

	// Create ticket directly in repo
	ticket := &domain.Ticket{
		TicketNo:      "TK-2026-TEST",
		DocumentNo:    "INV/2026/001",
		CurrentValue:  "Original PT",
		ProposedValue: "Mutated PT Baru",
		Status:        domain.StatusPendingApproval,
	}
	_ = ticketRepo.Create(ticket)

	approved, err := svc.ApproveTicket(ticket.ID, "Supervisor Andi")
	if err != nil {
		t.Fatalf("expected approve to succeed, got: %v", err)
	}

	if approved.Status != domain.StatusExecuted {
		t.Errorf("expected status EXECUTED, got %s", approved.Status)
	}
	if approved.ApprovedBy == nil || *approved.ApprovedBy != "Supervisor Andi" {
		t.Errorf("expected approver Supervisor Andi, got %v", approved.ApprovedBy)
	}

	// Verify invoice mutation in repo
	updatedInv, _ := invoiceRepo.GetByInvoiceNo("INV/2026/001")
	if updatedInv.CustomerName != "Mutated PT Baru" {
		t.Errorf("expected customer name to be updated in DB, got: %s", updatedInv.CustomerName)
	}

	// Verify broadcast
	if len(broadcaster.broadcasts) == 0 || broadcaster.broadcasts[len(broadcaster.broadcasts)-1] != "ticket_approved" {
		t.Errorf("expected ticket_approved broadcast")
	}
}

func TestApproveTicket_NotPendingApproval(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	svc := service.NewTicketService(ticketRepo, invoiceRepo, &mockDocRepo{}, &mockAuditRepo{}, &mockBroadcaster{})

	ticket := &domain.Ticket{
		TicketNo:   "TK-ALREADY-APPROVED",
		DocumentNo: "INV/2026/001",
		Status:     domain.StatusExecuted,
	}
	_ = ticketRepo.Create(ticket)

	_, err := svc.ApproveTicket(ticket.ID, "Admin")
	if err == nil {
		t.Fatal("expected error when approving already executed ticket, got nil")
	}
}

func TestRejectTicket_Success(t *testing.T) {
	ticketRepo := newMockTicketRepo()
	invoiceRepo := newMockInvoiceRepo()
	auditRepo := &mockAuditRepo{}
	broadcaster := &mockBroadcaster{}

	svc := service.NewTicketService(ticketRepo, invoiceRepo, &mockDocRepo{}, auditRepo, broadcaster)

	ticket := &domain.Ticket{
		TicketNo:   "TK-REJECT-TEST",
		DocumentNo: "INV/2026/001",
		Status:     domain.StatusPendingApproval,
	}
	_ = ticketRepo.Create(ticket)

	rejected, err := svc.RejectTicket(ticket.ID, "Supervisor Budi", "Nomor rekening tidak valid")
	if err != nil {
		t.Fatalf("expected reject to succeed, got %v", err)
	}

	if rejected.Status != domain.StatusRejected {
		t.Errorf("expected status REJECTED, got %s", rejected.Status)
	}
	if rejected.RejectionReason == nil || *rejected.RejectionReason != "Nomor rekening tidak valid" {
		t.Errorf("expected rejection reason to match, got %v", rejected.RejectionReason)
	}
}

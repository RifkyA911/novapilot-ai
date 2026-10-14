package postgres_test

import (
	"testing"
	"time"

	"novapilot-ai/backend/internal/domain"
	"novapilot-ai/backend/internal/repository/postgres"
)

func TestMockRepository_Tickets(t *testing.T) {
	repo := postgres.NewRepository(nil)

	// List initial seeded tickets
	tickets, err := repo.GetAll("")
	if err != nil {
		t.Fatalf("unexpected error getting tickets: %v", err)
	}
	if len(tickets) == 0 {
		t.Errorf("expected initial tickets to be populated")
	}

	// Filter by status
	pendingTickets, err := repo.GetAll(string(domain.StatusPendingApproval))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	for _, ticket := range pendingTickets {
		if ticket.Status != domain.StatusPendingApproval {
			t.Errorf("expected status %s, got %s", domain.StatusPendingApproval, ticket.Status)
		}
	}

	// Create new ticket
	newTicket := &domain.Ticket{
		TicketNo:        "TK-UNIT-001",
		RawMessage:      "Ubah invoice test",
		DocumentNo:      "INV/2026/001",
		ProposedValue:   "PT Test Baru",
		ConfidenceScore: 0.9,
		Status:          domain.StatusPendingApproval,
	}
	if err := repo.Create(newTicket); err != nil {
		t.Fatalf("failed to create ticket: %v", err)
	}
	if newTicket.ID == 0 {
		t.Errorf("expected newTicket.ID to be assigned")
	}

	// Get by ID
	fetched, err := repo.GetByID(newTicket.ID)
	if err != nil {
		t.Fatalf("failed to get ticket by ID: %v", err)
	}
	if fetched.TicketNo != "TK-UNIT-001" {
		t.Errorf("expected ticket_no TK-UNIT-001, got %s", fetched.TicketNo)
	}

	// Update status
	approver := "Manager Joko"
	if err := repo.UpdateStatus(fetched.ID, domain.StatusExecuted, &approver, nil); err != nil {
		t.Fatalf("failed to update ticket status: %v", err)
	}

	updated, _ := repo.GetByID(fetched.ID)
	if updated.Status != domain.StatusExecuted {
		t.Errorf("expected status EXECUTED, got %s", updated.Status)
	}
}

func TestMockRepository_Invoices(t *testing.T) {
	repo := postgres.NewRepository(nil)

	invoices, err := repo.ListAll(10)
	if err != nil {
		t.Fatalf("failed to list invoices: %v", err)
	}
	if len(invoices) == 0 {
		t.Errorf("expected seeded invoices")
	}

	// Get by invoice no
	inv, err := repo.GetByInvoiceNo("INV/2026/001")
	if err != nil {
		t.Fatalf("failed to get invoice: %v", err)
	}
	if inv.CustomerName == "" {
		t.Errorf("expected non-empty customer name")
	}

	// Update customer name
	if err := repo.UpdateCustomerName("INV/2026/001", "PT Sumber Makmur Berkah", "Admin Test"); err != nil {
		t.Fatalf("failed to update customer name: %v", err)
	}

	updatedInv, _ := repo.GetByInvoiceNo("INV/2026/001")
	if updatedInv.CustomerName != "PT Sumber Makmur Berkah" {
		t.Errorf("expected customer name updated, got %s", updatedInv.CustomerName)
	}
}

func TestMockRepository_InboundMessages(t *testing.T) {
	repo := postgres.NewRepository(nil)

	// List initial messages
	msgs, err := repo.ListMessages(10, "", "")
	if err != nil {
		t.Fatalf("failed to list messages: %v", err)
	}
	if len(msgs) == 0 {
		t.Errorf("expected seeded inbound messages")
	}

	// Filter by platform
	waMsgs, err := repo.ListMessages(10, "whatsapp", "")
	if err != nil {
		t.Fatalf("failed to list wa messages: %v", err)
	}
	for _, m := range waMsgs {
		if m.Platform != "whatsapp" {
			t.Errorf("expected platform whatsapp, got %s", m.Platform)
		}
	}

	// Save new message
	msg := &domain.InboundMessage{
		Platform:       "whatsapp",
		SenderID:       "6289999999@s.whatsapp.net",
		SenderName:     "Test Sender",
		RawMessage:     "Halo tolong cek INV/2026/002",
		MediaType:      "text",
		Classification: domain.ClassActionable,
		ExtractedDoc:   "INV/2026/002",
		CreatedAt:      time.Now(),
	}
	if err := repo.SaveMessage(msg); err != nil {
		t.Fatalf("failed to save message: %v", err)
	}
	if msg.ID == 0 {
		t.Errorf("expected message ID to be assigned")
	}

	// Link Ticket
	if err := repo.LinkTicket(msg.ID, 999, "TK-LINKED-999"); err != nil {
		t.Fatalf("failed to link ticket: %v", err)
	}
	linked, err := repo.GetMessageByID(msg.ID)
	if err != nil {
		t.Fatalf("failed to get linked message: %v", err)
	}
	if linked.TicketNo != "TK-LINKED-999" {
		t.Errorf("expected ticket_no TK-LINKED-999, got %s", linked.TicketNo)
	}
}

func TestMockRepository_LearnedPatterns(t *testing.T) {
	repo := postgres.NewRepository(nil)

	patterns, err := repo.ListPatterns()
	if err != nil {
		t.Fatalf("failed to list patterns: %v", err)
	}

	newPattern := &domain.LearnedPattern{
		PatternName:    "Ganti Nama Nota Regex",
		ExamplePhrase:  "Ganti nama nota INV/123 ke PT Baru",
		RegexPattern:   `(?i)ganti nama nota (?P<doc>[A-Z0-9/]+) ke (?P<target>.+)`,
		TargetIntent:   "UPDATE_CUSTOMER_NAME",
		Classification: string(domain.ClassActionable),
		Confidence:     0.98,
		IsActive:       true,
		LearnedBy:      "SuperAdmin",
	}

	if err := repo.CreatePattern(newPattern); err != nil {
		t.Fatalf("failed to create pattern: %v", err)
	}

	updatedPatterns, _ := repo.ListPatterns()
	if len(updatedPatterns) <= len(patterns) {
		t.Errorf("expected patterns count to increase")
	}

	// Increment matched
	if err := repo.IncrementMatched(newPattern.ID); err != nil {
		t.Fatalf("failed to increment match: %v", err)
	}

	// Delete pattern
	if err := repo.DeletePattern(newPattern.ID); err != nil {
		t.Fatalf("failed to delete pattern: %v", err)
	}
}

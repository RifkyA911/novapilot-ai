package service

import (
	"encoding/json"
	"fmt"
	"log"
	"novapilot-ai/backend/internal/domain"
	"time"
)

const HighValueThreshold = 100000000.00 // Rp 100,000,000 (Secondary sign-off required)

type SSEBroadcaster interface {
	Broadcast(event string, data interface{})
}

type TicketService struct {
	ticketRepo  domain.TicketRepository
	invoiceRepo domain.InvoiceRepository
	docRepo     domain.DocumentRepository
	auditRepo   domain.AuditRepository
	broadcaster SSEBroadcaster
}

func NewTicketService(
	ticketRepo domain.TicketRepository,
	invoiceRepo domain.InvoiceRepository,
	docRepo domain.DocumentRepository,
	auditRepo domain.AuditRepository,
	broadcaster SSEBroadcaster,
) *TicketService {
	return &TicketService{
		ticketRepo:  ticketRepo,
		invoiceRepo: invoiceRepo,
		docRepo:     docRepo,
		auditRepo:   auditRepo,
		broadcaster: broadcaster,
	}
}

func (s *TicketService) ListTickets(statusFilter string) ([]domain.Ticket, error) {
	return s.ticketRepo.GetAll(statusFilter)
}

func (s *TicketService) GetTicket(id int) (*domain.Ticket, error) {
	return s.ticketRepo.GetByID(id)
}

func (s *TicketService) CreateTicketFromChat(input domain.CreateTicketInput) (*domain.Ticket, error) {
	// 1. Pre-check: Does invoice exist in DB?
	inv, err := s.invoiceRepo.GetByInvoiceNo(input.DocumentNo)
	if err != nil {
		return nil, fmt.Errorf("invoice verification failed: %s not found in database", input.DocumentNo)
	}

	// 2. Pre-check: Check if invoice is already closed
	if inv.Status == domain.InvoiceClosed {
		return nil, fmt.Errorf("policy violation: invoice %s is CLOSED and cannot be modified", input.DocumentNo)
	}

	// 3. Create Ticket
	ticketNo := fmt.Sprintf("TK-%d-%03d", time.Now().Year(), time.Now().Unix()%1000)
	ticket := &domain.Ticket{
		TicketNo:        ticketNo,
		BranchID:        input.BranchID,
		RawMessage:      input.RawMessage,
		ExtractedIntent: input.ExtractedIntent,
		DocumentNo:      input.DocumentNo,
		FieldTarget:     input.FieldTarget,
		CurrentValue:    inv.CustomerName, // Captured directly from DB
		ProposedValue:   input.ProposedValue,
		ConfidenceScore: input.ConfidenceScore,
		Status:          domain.StatusPendingApproval,
	}

	if err := s.ticketRepo.Create(ticket); err != nil {
		return nil, fmt.Errorf("failed to create ticket: %w", err)
	}

	// 4. Record Audit Log
	action := "CREATED_PENDING_APPROVAL"
	if inv.Amount >= HighValueThreshold {
		action = "CREATED_HIGH_VALUE_PENDING"
		log.Printf("[POLICY] High-value ticket created: %s for %s (Amount: Rp %.2f >= Threshold Rp %.2f)", ticket.TicketNo, inv.InvoiceNo, inv.Amount, HighValueThreshold)
	}
	oldState, _ := json.Marshal(map[string]interface{}{"customer_name": inv.CustomerName, "amount": inv.Amount})
	newState, _ := json.Marshal(map[string]interface{}{"proposed_name": input.ProposedValue, "high_value": inv.Amount >= HighValueThreshold})
	_ = s.auditRepo.Record(&domain.AuditLog{
		TicketID:    ticket.ID,
		Action:      action,
		PerformedBy: "AI_INGEST_GATEWAY",
		OldState:    string(oldState),
		NewState:    string(newState),
		IPAddress:   "127.0.0.1",
	})

	// 5. Notify Real-time SSE Clients
	if s.broadcaster != nil {
		s.broadcaster.Broadcast("ticket_created", ticket)
		if inv.Amount >= HighValueThreshold {
			s.broadcaster.Broadcast("high_value_alert", map[string]interface{}{
				"ticket_no": ticket.TicketNo,
				"amount":    inv.Amount,
				"warning":   "High-value threshold exceeded. Secondary sign-off required.",
			})
		}
	}

	log.Printf("[SERVICE] Created ticket %s for document %s", ticket.TicketNo, ticket.DocumentNo)
	return ticket, nil
}

func (s *TicketService) ApproveTicket(id int, approver string) (*domain.Ticket, error) {
	ticket, err := s.ticketRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if ticket.Status != domain.StatusPendingApproval {
		return nil, fmt.Errorf("ticket cannot be approved from current state: %s", ticket.Status)
	}

	// Execute Safe Database Mutation
	err = s.invoiceRepo.UpdateCustomerName(ticket.DocumentNo, ticket.ProposedValue, approver)
	if err != nil {
		_ = s.ticketRepo.UpdateStatus(id, domain.StatusFailed, &approver, nil)
		return nil, fmt.Errorf("database mutation failed: %w", err)
	}

	// Update Ticket Status to EXECUTED
	if err := s.ticketRepo.UpdateStatus(id, domain.StatusExecuted, &approver, nil); err != nil {
		return nil, err
	}

	// Record Audit
	approveAction := "APPROVED_AND_MUTATED"
	if inv, err := s.invoiceRepo.GetByInvoiceNo(ticket.DocumentNo); err == nil && inv != nil && inv.Amount >= HighValueThreshold {
		approveAction = "APPROVED_HIGH_VALUE_MUTATED"
		log.Printf("[POLICY] High-value invoice mutation approved: %s (Rp %.2f) by %s", ticket.DocumentNo, inv.Amount, approver)
	}

	oldState, _ := json.Marshal(map[string]string{"customer_name": ticket.CurrentValue})
	newState, _ := json.Marshal(map[string]string{"customer_name": ticket.ProposedValue})
	_ = s.auditRepo.Record(&domain.AuditLog{
		TicketID:    ticket.ID,
		Action:      approveAction,
		PerformedBy: approver,
		OldState:    string(oldState),
		NewState:    string(newState),
		IPAddress:   "127.0.0.1",
	})

	updatedTicket, _ := s.ticketRepo.GetByID(id)
	if s.broadcaster != nil {
		s.broadcaster.Broadcast("ticket_approved", updatedTicket)
	}

	log.Printf("[SERVICE] Ticket %s APPROVED by %s. Database mutation committed.", ticket.TicketNo, approver)
	return updatedTicket, nil
}

func (s *TicketService) RejectTicket(id int, approver string, reason string) (*domain.Ticket, error) {
	ticket, err := s.ticketRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if ticket.Status != domain.StatusPendingApproval {
		return nil, fmt.Errorf("ticket cannot be rejected from current state: %s", ticket.Status)
	}

	if err := s.ticketRepo.UpdateStatus(id, domain.StatusRejected, &approver, &reason); err != nil {
		return nil, err
	}

	// Record Audit
	oldState, _ := json.Marshal(map[string]string{"status": string(ticket.Status)})
	newState, _ := json.Marshal(map[string]string{"status": "REJECTED", "reason": reason})
	_ = s.auditRepo.Record(&domain.AuditLog{
		TicketID:    ticket.ID,
		Action:      "REJECTED",
		PerformedBy: approver,
		OldState:    string(oldState),
		NewState:    string(newState),
		IPAddress:   "127.0.0.1",
	})

	updatedTicket, _ := s.ticketRepo.GetByID(id)
	if s.broadcaster != nil {
		s.broadcaster.Broadcast("ticket_rejected", updatedTicket)
	}

	log.Printf("[SERVICE] Ticket %s REJECTED by %s with reason: %s", ticket.TicketNo, approver, reason)
	return updatedTicket, nil
}

func (s *TicketService) AttachDocument(doc *domain.Document) error {
	return s.docRepo.Save(doc)
}

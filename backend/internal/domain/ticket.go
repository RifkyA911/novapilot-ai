package domain

import "time"

type TicketStatus string

const (
	StatusPendingApproval TicketStatus = "PENDING_APPROVAL"
	StatusApproved        TicketStatus = "APPROVED"
	StatusRejected        TicketStatus = "REJECTED"
	StatusExecuted        TicketStatus = "EXECUTED"
	StatusFailed          TicketStatus = "FAILED"
)

type Ticket struct {
	ID              int          `json:"id"`
	TicketNo        string       `json:"ticket_no"`
	BranchID        *int         `json:"branch_id"`
	BranchName      string       `json:"branch_name,omitempty"`
	RawMessage      string       `json:"raw_message"`
	ExtractedIntent string       `json:"extracted_intent"`
	DocumentNo      string       `json:"document_no"`
	FieldTarget     string       `json:"field_target"`
	CurrentValue    string       `json:"current_value"`
	ProposedValue   string       `json:"proposed_value"`
	ConfidenceScore float64      `json:"confidence_score"`
	Status          TicketStatus `json:"status"`
	ApprovedBy      *string      `json:"approved_by,omitempty"`
	RejectionReason *string      `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
	Documents       []Document   `json:"documents,omitempty"`
}

type CreateTicketInput struct {
	RawMessage      string  `json:"raw_message" binding:"required"`
	ExtractedIntent string  `json:"extracted_intent"`
	DocumentNo      string  `json:"document_no" binding:"required"`
	FieldTarget     string  `json:"field_target"`
	ProposedValue   string  `json:"proposed_value" binding:"required"`
	BranchID        *int    `json:"branch_id"`
	ConfidenceScore float64 `json:"confidence_score"`
}

type ApproveTicketInput struct {
	ApproverName string `json:"approver_name" binding:"required"`
}

type RejectTicketInput struct {
	ApproverName string `json:"approver_name" binding:"required"`
	Reason       string `json:"reason" binding:"required"`
}

type TicketRepository interface {
	GetAll(statusFilter string) ([]Ticket, error)
	GetByID(id int) (*Ticket, error)
	Create(ticket *Ticket) error
	UpdateStatus(id int, status TicketStatus, approver *string, reason *string) error
}

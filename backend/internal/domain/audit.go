package domain

import "time"

type AuditLog struct {
	ID          int       `json:"id"`
	TicketID    int       `json:"ticket_id"`
	Action      string    `json:"action"`
	PerformedBy string    `json:"performed_by"`
	OldState    string    `json:"old_state"`
	NewState    string    `json:"new_state"`
	IPAddress   string    `json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}

type AuditRepository interface {
	Record(log *AuditLog) error
	GetAuditLogsByTicketID(ticketID int) ([]AuditLog, error)
	GetRecent(limit int) ([]AuditLog, error)
}

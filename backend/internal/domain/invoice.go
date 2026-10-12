package domain

import "time"

type InvoiceStatus string

const (
	InvoiceOpen      InvoiceStatus = "OPEN"
	InvoicePosted    InvoiceStatus = "POSTED"
	InvoiceClosed    InvoiceStatus = "CLOSED"
	InvoiceCancelled InvoiceStatus = "CANCELLED"
)

type Invoice struct {
	ID           int           `json:"id"`
	InvoiceNo    string        `json:"invoice_no"`
	BranchID     *int          `json:"branch_id"`
	CustomerName string        `json:"customer_name"`
	Amount       float64       `json:"amount"`
	Status       InvoiceStatus `json:"status"`
	IsPosted     bool          `json:"is_posted"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

type InvoiceRepository interface {
	GetByInvoiceNo(invoiceNo string) (*Invoice, error)
	ListAll(limit int) ([]Invoice, error)
	UpdateCustomerName(invoiceNo string, newCustomerName string, approver string) error
}

package domain

import "time"

type Document struct {
	ID         int       `json:"id"`
	TicketID   *int      `json:"ticket_id,omitempty"`
	FileName   string    `json:"file_name"`
	FilePath   string    `json:"file_path"`
	MimeType   string    `json:"mime_type"`
	FileSize   int64     `json:"file_size"`
	UploadedBy string    `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type DocumentRepository interface {
	Save(doc *Document) error
	GetDocumentsByTicketID(ticketID int) ([]Document, error)
}

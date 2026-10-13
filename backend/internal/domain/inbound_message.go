package domain

import "time"

type MessageClassification string

const (
	ClassActionable   MessageClassification = "ACTIONABLE"
	ClassNeedsReview  MessageClassification = "NEEDS_REVIEW"
	ClassCasualBanter MessageClassification = "CASUAL_BANTER"
)

type InboundMessage struct {
	ID              int                   `json:"id"`
	Platform        string                `json:"platform"` // "whatsapp", "telegram", "discord", "slack"
	SenderID        string                `json:"sender_id"`
	SenderName      string                `json:"sender_name"`
	RawMessage      string                `json:"raw_message"`
	MediaType       string                `json:"media_type"` // "text", "image", "document", "audio"
	MediaURL        string                `json:"media_url,omitempty"`
	OCRText         string                `json:"ocr_text,omitempty"`
	Classification  MessageClassification `json:"classification"`
	ExtractedDoc    string                `json:"extracted_doc,omitempty"`
	ExtractedIntent string                `json:"extracted_intent,omitempty"`
	ExtractedTarget string                `json:"extracted_target,omitempty"`
	TicketID        *int                  `json:"ticket_id,omitempty"`
	TicketNo        string                `json:"ticket_no,omitempty"`
	CreatedAt       time.Time             `json:"created_at"`
}

type InboundMessageRepository interface {
	SaveMessage(msg *InboundMessage) error
	ListMessages(limit int, platform string, classification string) ([]InboundMessage, error)
	GetMessageByID(id int) (*InboundMessage, error)
	LinkTicket(messageID int, ticketID int, ticketNo string) error
}

type LearnedPattern struct {
	ID             int       `json:"id"`
	PatternName    string    `json:"pattern_name"`
	ExamplePhrase  string    `json:"example_phrase"`
	RegexPattern   string    `json:"regex_pattern"`
	TargetIntent   string    `json:"target_intent"`
	Classification string    `json:"classification"`
	Confidence     float64   `json:"confidence"`
	TimesMatched   int       `json:"times_matched"`
	LearnedBy      string    `json:"learned_by"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type LearnedPatternRepository interface {
	ListPatterns() ([]LearnedPattern, error)
	CreatePattern(p *LearnedPattern) error
	DeletePattern(id int) error
	IncrementMatched(id int) error
}

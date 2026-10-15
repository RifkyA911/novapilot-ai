package domain

import "time"

type GroupMember struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	Role         string `json:"role"`
	IsWhitelisted bool  `json:"isWhitelisted"`
	LastActive   string `json:"lastActive"`
}

type ContactChannel struct {
	ID                string        `json:"id"`
	Type              string        `json:"type"` // "GROUP" | "INDIVIDUAL"
	Name              string        `json:"name"`
	Branch            string        `json:"branch"`
	Platform          string        `json:"platform"` // "whatsapp" | "telegram" | "discord" | "slack"
	JidOrChatId       string        `json:"jidOrChatId"`
	Status            string        `json:"status"` // "ACTIVE" | "STANDBY" | "MUTED" | "RATE_LIMITED"
	IsWhitelisted     bool          `json:"isWhitelisted"`
	ContactPerson     string        `json:"contactPerson"`
	ContactPhone      string        `json:"contactPhone"`
	TotalMessages     int           `json:"totalMessages"`
	ActionableTickets int           `json:"actionableTickets"`
	LatencyMs         int           `json:"latencyMs"`
	LastActivity      string        `json:"lastActivity"`
	Members           []GroupMember `json:"members,omitempty"`
	CreatedAt         time.Time     `json:"createdAt"`
	UpdatedAt         time.Time     `json:"updatedAt"`
}

type ChannelRepository interface {
	ListChannels() ([]ContactChannel, error)
	GetChannelByID(id string) (*ContactChannel, error)
	SaveChannel(channel *ContactChannel) error
	DeleteChannel(id string) error
	ToggleChannelWhitelist(id string) (*ContactChannel, error)
}

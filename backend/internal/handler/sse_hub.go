package handler

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gin-gonic/gin"
)

type SSEHub struct {
	clients map[chan string]bool
	mu      sync.RWMutex
}

func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients: make(map[chan string]bool),
	}
}

func (h *SSEHub) Broadcast(event string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		return
	}

	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", event, string(payload))

	h.mu.RLock()
	defer h.mu.RUnlock()

	for clientChan := range h.clients {
		select {
		case clientChan <- msg:
		default:
		}
	}
}

func (h *SSEHub) HandleSSE(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	clientChan := make(chan string, 10)

	h.mu.Lock()
	h.clients[clientChan] = true
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.clients, clientChan)
		close(clientChan)
		h.mu.Unlock()
	}()

	// Send initial ping
	c.Writer.WriteString("event: ping\ndata: connected\n\n")
	c.Writer.Flush()

	notify := c.Request.Context().Done()
	for {
		select {
		case <-notify:
			return
		case msg := <-clientChan:
			_, err := c.Writer.WriteString(msg)
			if err != nil {
				return
			}
			c.Writer.Flush()
		}
	}
}

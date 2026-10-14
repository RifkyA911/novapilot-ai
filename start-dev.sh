#!/usr/bin/env bash

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "====================================================================="
echo "   NovaPilot AI - Linux/macOS/WSL Development Runner"
echo "   Autonomous Factory ChatOps Gatekeeper v2.0"
echo "====================================================================="
echo -e "${NC}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. Prerequisites Check
if ! command -v bun &> /dev/null; then
    echo -e "${RED}[ERROR] 'bun' is not installed! Install via: curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}[WARNING] 'go' is not installed in PATH.${NC}"
fi

# 2. Track background PIDs for graceful termination
PIDS=()

cleanup() {
    echo -e "\n${YELLOW}[!] Shutting down all NovaPilot microservices...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
        fi
    done
    wait 2>/dev/null
    echo -e "${GREEN}[✓] All services cleanly stopped. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 3. Launch Backend Core (:8088)
echo -e "${CYAN}[+] Starting Go Backend Core (:8088)...${NC}"
cd "$ROOT_DIR/backend"
if [ -f "./bin/server" ]; then
    ./bin/server &
    PIDS+=($!)
elif command -v go &> /dev/null; then
    go run ./cmd/server &
    PIDS+=($!)
else
    echo -e "${RED}[ERROR] Neither prebuilt binary nor go compiler found in backend!${NC}"
    exit 1
fi

# 4. Launch WhatsApp ChatOps Gateway (:3002)
echo -e "${CYAN}[+] Starting WhatsApp Baileys Gateway (:3002)...${NC}"
cd "$ROOT_DIR/whatsapp-gateway"
bun run src/index.ts --mock &
PIDS+=($!)

# 5. Launch SvelteKit Web Cockpit (:3000)
echo -e "${CYAN}[+] Starting SvelteKit Web Cockpit (:3000)...${NC}"
cd "$ROOT_DIR/frontend"
bun run dev --host 0.0.0.0 --port 3000 &
PIDS+=($!)

echo -e "\n${GREEN}=====================================================================${NC}"
echo -e "${GREEN}  NovaPilot AI Stack Running Successfully!${NC}"
echo -e "${GREEN}=====================================================================${NC}"
echo -e "  * Web Cockpit    : ${CYAN}http://localhost:3000${NC}"
echo -e "  * Go Backend API : ${CYAN}http://localhost:8088${NC}"
echo -e "  * WA Gateway API : ${CYAN}http://localhost:3002/api/status${NC}"
echo -e "${GREEN}=====================================================================${NC}"
echo -e "${YELLOW}Press [CTRL+C] at any time to stop all services.${NC}\n"

# Wait indefinitely until interrupted
wait

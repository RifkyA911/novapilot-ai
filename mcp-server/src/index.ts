import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";
import * as path from "node:path";

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";
const UPLOAD_DIR = path.resolve(process.cwd(), "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initialize MCP Server
const server = new Server(
  {
    name: "novapilot-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// 1. Resources: Provide Knowledge to the AI Agent
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "novapilot://sop/factory-rules",
        name: "Factory IT Support SOP & Invoice Rules",
        mimeType: "text/markdown",
        description: "Official operational guidelines for customer name revisions, cutoff closing dates, and branches.",
      },
      {
        uri: "novapilot://branches/directory",
        name: "Active Factory Branches Directory",
        mimeType: "application/json",
        description: "Directory of authorized factory branches, city hubs, and whitelist WhatsApp groups.",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "novapilot://sop/factory-rules") {
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: `# NovaPilot Enterprise SOP: Invoice Correction Policy

1. **Eligible Revisions:**
   - Typographical errors on customer company names (PT, CV, UD, Toko).
   - Invoices with status **OPEN** and \`is_posted = FALSE\` can be revised.
2. **Strictly Prohibited Revisions:**
   - Invoices with status **CLOSED** (already finalized in monthly accounting). Requires Supervisor override.
   - Modifying transaction amounts or quantities via chat is **STRICTLY PROHIBITED**.
3. **Approval Requirement:**
   - Every staged modification requires manual review and sign-off by the on-call IT engineer in the WebUI.
`,
        },
      ],
    };
  }

  if (uri === "novapilot://branches/directory") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify([
            { code: "SBY-01", name: "Surabaya Hub", waGroup: "120363001@g.us" },
            { code: "MDN-01", name: "Medan Hub", waGroup: "120363002@g.us" },
            { code: "SMG-01", name: "Semarang Hub", waGroup: "120363003@g.us" },
            { code: "MKS-01", name: "Makassar Hub", waGroup: "120363004@g.us" },
            { code: "BDG-01", name: "Bandung Hub", waGroup: "120363005@g.us" },
          ], null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// 2. Tools: Expose Actions to the AI Agent
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_invoice",
        description: "Query and verify an invoice in the database by its invoice number.",
        inputSchema: {
          type: "object",
          properties: {
            invoice_no: { type: "string", description: "The invoice number (e.g. INV/2026/001)" },
          },
          required: ["invoice_no"],
        },
      },
      {
        name: "stage_invoice_update",
        description: "Stage a proposed invoice customer name change into the on-call approval queue.",
        inputSchema: {
          type: "object",
          properties: {
            document_no: { type: "string", description: "The invoice number" },
            proposed_value: { type: "string", description: "The corrected customer name" },
            raw_message: { type: "string", description: "Original message text from WhatsApp" },
            branch_id: { type: "number", description: "Optional branch ID" },
          },
          required: ["document_no", "proposed_value", "raw_message"],
        },
      },
      {
        name: "upload_document",
        description: "Upload an attachment file (invoice PDF, proof photo, delivery order) associated with a ticket.",
        inputSchema: {
          type: "object",
          properties: {
            file_name: { type: "string", description: "Name of the file including extension (e.g. invoice_proof.pdf)" },
            file_content_base64: { type: "string", description: "Base64-encoded binary content of the file" },
            mime_type: { type: "string", description: "MIME type (e.g. application/pdf, image/jpeg, image/png)" },
            ticket_id: { type: "number", description: "Optional ticket ID to link this file to" },
          },
          required: ["file_name", "file_content_base64", "mime_type"],
        },
      },
      {
        name: "list_pending_tickets",
        description: "Retrieve all tickets currently waiting for human approval from the on-call engineer.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "check_invoice") {
      const invoiceNo = args?.invoice_no as string;
      const res = await fetch(`${BACKEND_URL}/api/invoices`);
      if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
      const invoices = (await res.json()) as any[];
      const found = invoices.find((inv) => inv.invoice_no === invoiceNo);

      if (!found) {
        return {
          content: [{ type: "text", text: `Invoice ${invoiceNo} NOT found in database.` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                invoice_no: found.invoice_no,
                current_customer_name: found.customer_name,
                amount: found.amount,
                status: found.status,
                is_posted: found.is_posted,
                eligible_for_change: found.status === "OPEN" && !found.is_posted,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "stage_invoice_update") {
      const res = await fetch(`${BACKEND_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_message: args?.raw_message,
          extracted_intent: "UPDATE_CUSTOMER_NAME",
          document_no: args?.document_no,
          field_target: "customer_name",
          proposed_value: args?.proposed_value,
          branch_id: args?.branch_id || 1,
          confidence_score: 0.98,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        return {
          content: [{ type: "text", text: `Failed to stage ticket: ${JSON.stringify(errData)}` }],
          isError: true,
        };
      }

      const created = await res.json();
      return {
        content: [
          {
            type: "text",
            text: `Successfully staged ticket #${created.ticket_no} for human approval. Current Status: ${created.status}`,
          },
        ],
      };
    }

    if (name === "upload_document") {
      const fileName = args?.file_name as string;
      const base64Content = args?.file_content_base64 as string;
      const mimeType = args?.mime_type as string;
      const ticketId = args?.ticket_id as number | undefined;

      const safeFileName = `${Date.now()}_${path.basename(fileName)}`;
      const targetPath = path.join(UPLOAD_DIR, safeFileName);

      const buffer = Buffer.from(base64Content, "base64");
      fs.writeFileSync(targetPath, buffer);

      // Register file via backend upload API or record
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: mimeType }), fileName);
      if (ticketId) formData.append("ticket_id", ticketId.toString());
      formData.append("uploaded_by", "MCP_AI_AGENT");

      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const responseData = res.ok ? await res.json() : { file_path: `/uploads/${safeFileName}` };

      return {
        content: [
          {
            type: "text",
            text: `File uploaded successfully.\nFile Name: ${fileName}\nStored Path: ${responseData.file_path}\nFile Size: ${buffer.length} bytes`,
          },
        ],
      };
    }

    if (name === "list_pending_tickets") {
      const res = await fetch(`${BACKEND_URL}/api/tickets?status=PENDING_APPROVAL`);
      if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
      const tickets = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(tickets, null, 2) }],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }],
      isError: true,
    };
  }
});

// Start STDIO transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NovaPilot MCP Server running on stdio transport.");
}

main().catch((err) => {
  console.error("Fatal error starting NovaPilot MCP Server:", err);
  process.exit(1);
});

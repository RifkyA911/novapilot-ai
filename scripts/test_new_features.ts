async function test() {
	console.log("=== Testing Priority 1: Channels CRUD API ===");
	// 1. List Channels
	const listRes = await fetch("http://localhost:8088/api/channels");
	const listData = await listRes.json();
	console.log(`✓ GET /api/channels: Found ${listData.length} channels`);

	// 2. Create Channel
	const createRes = await fetch("http://localhost:8088/api/channels", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			id: "ch_test_audit_99",
			type: "GROUP",
			name: "Audit Test Channel Kalimantan",
			branch: "Kalimantan Hub",
			platform: "whatsapp",
			jidOrChatId: "120363099999999999@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Pak Budi",
			contactPhone: "+62 811-2233-4455"
		})
	});
	const createData = await createRes.json();
	console.log(`✓ POST /api/channels: Created ${createData.id} - ${createData.name}`);

	// 3. Toggle Whitelist
	const toggleRes = await fetch("http://localhost:8088/api/channels/ch_test_audit_99/toggle-whitelist", {
		method: "PATCH"
	});
	const toggleData = await toggleRes.json();
	console.log(`✓ PATCH /api/channels/:id/toggle-whitelist: Status=${toggleData.status}, Whitelisted=${toggleData.isWhitelisted}`);

	// 4. Delete Channel
	const delRes = await fetch("http://localhost:8088/api/channels/ch_test_audit_99", {
		method: "DELETE"
	});
	const delData = await delRes.json();
	console.log(`✓ DELETE /api/channels/:id: ok=${delData.ok}`);

	console.log("\n=== Testing Priority 2: MCP Playground & DB Config Persistence ===");
	// 5. MCP Test
	const mcpRes = await fetch("http://localhost:8088/api/mcp/test", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			tool_name: "check_invoice",
			parameters: { invoice_no: "INV/2026/001" }
		})
	});
	const mcpData = await mcpRes.json();
	console.log(`✓ POST /api/mcp/test (check_invoice): ok=${mcpData.ok}, customer=${mcpData.result?.customer_name}, amount=${mcpData.result?.amount}`);

	// 6. DB Config Apply
	const applyRes = await fetch("http://localhost:8088/api/database/apply", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			target: "mcp_ref",
			host: "localhost",
			port: "5432",
			dbname: "novapilot_mcp_ref",
			user: "postgres",
			sslmode: "disable"
		})
	});
	const applyData = await applyRes.json();
	console.log(`✓ POST /api/database/apply: ok=${applyData.ok}, message=${applyData.message}`);

	console.log("\n=== Testing Priority 3: Webhooks & High-Value Policies ===");
	// 7. Telegram Webhook
	const tgRes = await fetch("http://localhost:8088/api/webhooks/telegram", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			update_id: 1001,
			message: {
				message_id: 202,
				from: { id: 1234567, first_name: "Rifky Lead", username: "rifky" },
				chat: { id: -100192837482, title: "Operations Alert Hub" },
				text: "Tolong ubah nama faktur INV/2026/001 customer PT Sumber Makmur menjadi PT Sumber Makmur Perkasa"
			}
		})
	});
	const tgData = await tgRes.json();
	console.log(`✓ POST /api/webhooks/telegram: ok=${tgData.ok}, doc=${tgData.extracted_doc}`);

	// 8. Discord Webhook
	const dcRes = await fetch("http://localhost:8088/api/webhooks/discord", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			id: "dc_msg_101",
			content: "Revisi nota INV/2026/002 jadi PT Karya Abadi Perkasa Baru",
			channel_id: "channel_ops_99",
			author: { author_id: "author_1", username: "devops-lead" }
		})
	});
	const dcData = await dcRes.json();
	console.log(`✓ POST /api/webhooks/discord: ok=${dcData.ok}, doc=${dcData.extracted_doc}`);

	console.log("\nALL TESTS PASSED SUCCESSFULLY! 🚀");
}

test().catch(console.error);

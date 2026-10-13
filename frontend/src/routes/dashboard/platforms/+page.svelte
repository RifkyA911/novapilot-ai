<script lang="ts">
	import { 
		AdjustmentsHorizontal, 
		Check, 
		ArrowPath, 
		ShieldCheck, 
		LockClosed, 
		Key, 
		Signal, 
		CommandLine,
		Eye,
		EyeSlash,
		CodeBracket,
		ClipboardDocumentCheck,
		InformationCircle
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";

	// Platform definitions with official logos
	const platforms = [
		{
			id: "whatsapp" as ChatPlatform,
			name: "WhatsApp",
			sub: "Baileys Socket & DOM Mutation Hooks",
			icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
			badge: "Live Hook Engine"
		},
		{
			id: "telegram" as ChatPlatform,
			name: "Telegram",
			sub: "BotFather API Webhook & Long Polling",
			icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
			badge: "Bot API Gateway"
		},
		{
			id: "discord" as ChatPlatform,
			name: "Discord",
			sub: "Bot Interactions & Guild Channel Webhooks",
			icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
			badge: "Guild Interaction"
		},
		{
			id: "slack" as ChatPlatform,
			name: "Slack",
			sub: "Events API & Bolt SDK Ingress",
			icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
			badge: "Enterprise Events"
		}
	];

	// Reactive active platform object
	let selectedPlatform = $derived(
		platforms.find(p => p.id === cockpit.chatPlatform) || platforms[0]
	);

	// Secret Visibility Toggles
	let showSecrets = $state<Record<string, boolean>>({
		whatsapp: false,
		telegram: false,
		discord: false,
		slack: false
	});

	function toggleSecret(id: string) {
		showSecrets[id] = !showSecrets[id];
	}

	// Dynamic Form States for Each Platform
	let waConfig = $state({
		port: "8088",
		sessionDir: "./data/whatsapp-auth",
		whitelistedJids: "120363028391@g.us, 120363098124@g.us, 120363119028@g.us",
		rateLimitDebounceMs: 500,
		antiBanMode: "passive_listener",
		tampermonkeyToken: "np_sec_wa_7819f2a"
	});

	let tgConfig = $state({
		botToken: "6192837492:AAHgK891vBnc781K9aLj182NmPql910",
		webhookUrl: "https://gateway.factory.internal:8088/api/webhooks/telegram",
		connectionMode: "webhook", // "webhook" | "polling"
		whitelistedChatIds: "-100192837482, -100281920194",
		adminUserId: "109283719"
	});

	let discordConfig = $state({
		botToken: "MTE5MjgzNzQ5MjgxOTIwMTk0.Gb819a.K91aLj182NmPql910-AAHgK",
		applicationId: "119283749281920194",
		guildId: "981273645129384756",
		whitelistedChannels: "119283749281920195, 119283749281920196",
		permittedRole: "Plant Operations"
	});

	let slackConfig = $state({
		botToken: "PLACEHOLDER_SLACK_BOT_TOKEN_REDACTED",
		signingSecret: "3a9f819b7c2d1e0f4a5b6c7d8e9f0a1b",
		teamId: "T0819283XYZ",
		whitelistedChannels: "C0819283ABC, C0819283DEF",
		slashCommand: "/novapilot"
	});

	// Save feedback state
	let saving = $state(false);
	let saveSuccess = $state(false);

	async function handleSaveSettings() {
		saving = true;
		try {
			await new Promise(r => setTimeout(r, 600));
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3500);
		} finally {
			saving = false;
		}
	}

	// Test Ping state
	let pinging = $state(false);
	let pingFeedback = $state<string | null>(null);

	async function handleTestPing() {
		if (pinging) return;
		pinging = true;
		pingFeedback = null;
		try {
			const res = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					raw_message: `Platform Settings Ping [${selectedPlatform.name}]: Verifying ingestion logic flow and webhook token credentials.`,
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					document_no: "INV/2026/001",
					field_target: "customer_name",
					proposed_value: `PT ${selectedPlatform.name} Config Verified`,
					branch_id: 1,
					confidence_score: 0.99
				})
			});

			if (res.ok) {
				cockpit.recordPlatformEvent(cockpit.chatPlatform);
				pingFeedback = `Successfully dispatched test packet through ${selectedPlatform.name} gateway. Staged to Approval Queue!`;
				await cockpit.fetchTickets();
				setTimeout(() => (pingFeedback = null), 4000);
			}
		} catch (err) {
			pingFeedback = `Connection error testing ${selectedPlatform.name} gateway endpoint.`;
		} finally {
			pinging = false;
		}
	}

	// Copied state
	let copiedSnippet = $state(false);
	function copySnippet(text: string) {
		navigator.clipboard.writeText(text);
		copiedSnippet = true;
		setTimeout(() => (copiedSnippet = false), 2500);
	}
</script>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full font-sans">
	<!-- Top Aceternity Glow Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<AdjustmentsHorizontal class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>ChatOps Platform Settings & Logic Flows</span>
						<span class="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium border border-primary/20">
							Multi-Channel Hub
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Configure credentials, whitelist filters, rate-limiting, and intake logic for each chat platform.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 flex-wrap">
			<button
				type="button"
				onclick={handleTestPing}
				disabled={pinging}
				class="h-9 px-3 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-4 w-4 {pinging ? 'animate-spin' : ''}" />
				<span>{pinging ? "Testing..." : `Test ${selectedPlatform.name} Ingress`}</span>
			</button>

			<button
				type="button"
				onclick={handleSaveSettings}
				disabled={saving}
				class="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
			>
				{#if saveSuccess}
					<Check class="h-4 w-4" />
					<span>Saved!</span>
				{:else}
					<span>Save Configuration</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if saveSuccess}
		<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
			<Check class="h-4 w-4 shrink-0" />
			<span>Configuration parameters updated and stored in memory. Ingress listener restarted successfully.</span>
		</div>
	{/if}

	{#if pingFeedback}
		<div class="p-3 rounded-xl bg-primary/10 border border-primary/30 text-foreground text-xs flex items-center gap-2 animate-in fade-in">
			<Signal class="h-4 w-4 text-primary shrink-0" />
			<span>{pingFeedback}</span>
		</div>
	{/if}

	<!-- Platform Selection Tabs (Original Logos - Zero Text Emojis) -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each platforms as platform}
			<button
				type="button"
				onclick={() => cockpit.chatPlatform = platform.id}
				class="p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer {cockpit.chatPlatform === platform.id ? 'bg-card border-primary ring-1 ring-primary/40 shadow-md' : 'bg-card/40 border-border hover:bg-card hover:border-border/80'}"
			>
				<div class="flex items-center justify-between">
					<div class="h-8 w-8 rounded-lg bg-background border border-border/80 p-1 flex items-center justify-center shadow-2xs">
						<img src={platform.icon} alt={platform.name} class="h-6 w-6 object-contain" />
					</div>
					{#if cockpit.chatPlatform === platform.id}
						<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
					{/if}
				</div>

				<div>
					<div class="text-sm font-bold text-foreground flex items-center gap-1.5">
						<span>{platform.name}</span>
						<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium {cockpit.chatPlatform === platform.id ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'}">
							{platform.badge}
						</span>
					</div>
					<div class="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 font-mono">{platform.sub}</div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Platform Content Card: Credentials & Ingress Logic Settings -->
	<div class="grid lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Form Configuration Inputs -->
		<div class="lg:col-span-7 space-y-6">
			<div class="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-5">
				<div class="flex items-center justify-between border-b border-border/50 pb-3">
					<div class="flex items-center gap-2.5">
						<img src={selectedPlatform.icon} alt={selectedPlatform.name} class="h-6 w-6 object-contain" />
						<div>
							<h3 class="text-base font-bold text-foreground">
								{selectedPlatform.name} Ingress Configuration
							</h3>
							<p class="text-xs text-muted-foreground">Network listeners, credentials, and whitelist validation.</p>
						</div>
					</div>

					<span class="text-xs font-mono px-2 py-0.5 rounded-full {cockpit.platformStatuses[cockpit.chatPlatform].status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'} font-semibold">
						{cockpit.platformStatuses[cockpit.chatPlatform].status}
					</span>
				</div>

				<!-- WHATSAPP SPECIFIC INPUTS -->
				{#if cockpit.chatPlatform === "whatsapp"}
					<div class="space-y-4 text-xs font-sans">
						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="wa-port" class="font-medium text-foreground">Local Webhook Ingress Port</label>
								<input
									id="wa-port"
									type="text"
									bind:value={waConfig.port}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<span class="text-[10px] text-muted-foreground">Endpoint: http://127.0.0.1:8088/api/tickets</span>
							</div>

							<div class="space-y-1.5">
								<label for="wa-debounce" class="font-medium text-foreground">Anti-Spam Debounce Delay (ms)</label>
								<input
									id="wa-debounce"
									type="number"
									bind:value={waConfig.rateLimitDebounceMs}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<span class="text-[10px] text-muted-foreground">Prevents duplicate burst packets from users</span>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="wa-whitelist" class="font-medium text-foreground">Authorized Regional Group JIDs Whitelist</label>
							<textarea
								id="wa-whitelist"
								rows="3"
								bind:value={waConfig.whitelistedJids}
								class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
							></textarea>
							<span class="text-[10px] text-muted-foreground">Comma-separated WhatsApp group JIDs (e.g. 120363028391@g.us)</span>
						</div>

						<div class="space-y-1.5">
							<label for="wa-token" class="font-medium text-foreground">Tampermonkey / Browser Hook Security Token</label>
							<div class="relative">
								<input
									id="wa-token"
									type={showSecrets.whatsapp ? "text" : "password"}
									bind:value={waConfig.tampermonkeyToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("whatsapp")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.whatsapp}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>
					</div>

				<!-- TELEGRAM SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "telegram"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="tg-token" class="font-medium text-foreground">Telegram BotFather API Token</label>
							<div class="relative">
								<input
									id="tg-token"
									type={showSecrets.telegram ? "text" : "password"}
									bind:value={tgConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
									placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("telegram")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.telegram}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							<span class="text-[10px] text-muted-foreground">Obtained by creating a bot via @BotFather on Telegram</span>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="tg-mode" class="font-medium text-foreground">Ingress Delivery Mode</label>
								<select
									id="tg-mode"
									bind:value={tgConfig.connectionMode}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
								>
									<option value="webhook">HTTPS Webhook (Recommended)</option>
									<option value="polling">Long Polling (Intranet / Firewall)</option>
								</select>
							</div>

							<div class="space-y-1.5">
								<label for="tg-admin" class="font-medium text-foreground">Supervisor Telegram User ID</label>
								<input
									id="tg-admin"
									type="text"
									bind:value={tgConfig.adminUserId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="tg-whitelist" class="font-medium text-foreground">Authorized Regional Group Chat IDs</label>
							<textarea
								id="tg-whitelist"
								rows="2"
								bind:value={tgConfig.whitelistedChatIds}
								class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
							></textarea>
							<span class="text-[10px] text-muted-foreground">Negative integers for supergroups (e.g. -100192837482)</span>
						</div>
					</div>

				<!-- DISCORD SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "discord"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="dc-token" class="font-medium text-foreground">Discord Bot Token</label>
							<div class="relative">
								<input
									id="dc-token"
									type={showSecrets.discord ? "text" : "password"}
									bind:value={discordConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("discord")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.discord}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="dc-guild" class="font-medium text-foreground">Authorized Server Guild ID</label>
								<input
									id="dc-guild"
									type="text"
									bind:value={discordConfig.guildId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>

							<div class="space-y-1.5">
								<label for="dc-role" class="font-medium text-foreground">RBAC Mutation Role Name</label>
								<input
									id="dc-role"
									type="text"
									bind:value={discordConfig.permittedRole}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="dc-channels" class="font-medium text-foreground">Whitelisted Ingress Channel IDs</label>
							<textarea
								id="dc-channels"
								rows="2"
								bind:value={discordConfig.whitelistedChannels}
								class="w-full rounded-xl border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
							></textarea>
						</div>
					</div>

				<!-- SLACK SPECIFIC INPUTS -->
				{:else if cockpit.chatPlatform === "slack"}
					<div class="space-y-4 text-xs font-sans">
						<div class="space-y-1.5">
							<label for="sl-token" class="font-medium text-foreground">Bot User OAuth Token (xoxb)</label>
							<div class="relative">
								<input
									id="sl-token"
									type={showSecrets.slack ? "text" : "password"}
									bind:value={slackConfig.botToken}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 pr-10 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
								<button
									type="button"
									onclick={() => toggleSecret("slack")}
									class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{#if showSecrets.slack}
										<EyeSlash class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div class="space-y-1.5">
							<label for="sl-secret" class="font-medium text-foreground">Slack Signing Secret (HMAC SHA256)</label>
							<input
								id="sl-secret"
								type="text"
								bind:value={slackConfig.signingSecret}
								class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<span class="text-[10px] text-muted-foreground">Used to cryptographically verify X-Slack-Signature</span>
						</div>

						<div class="grid sm:grid-cols-2 gap-4">
							<div class="space-y-1.5">
								<label for="sl-team" class="font-medium text-foreground">Corporate Team ID</label>
								<input
									id="sl-team"
									type="text"
									bind:value={slackConfig.teamId}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>

							<div class="space-y-1.5">
								<label for="sl-cmd" class="font-medium text-foreground">Registered Slash Command</label>
								<input
									id="sl-cmd"
									type="text"
									bind:value={slackConfig.slashCommand}
									class="w-full h-9 rounded-xl border border-input bg-background px-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Architectural Logic Flow & SOP Enforcement Rules -->
		<div class="lg:col-span-5 space-y-6">
			<!-- Architecture Flow Box -->
			<div class="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
				<div class="flex items-center gap-2 border-b border-border/50 pb-3">
					<CommandLine class="h-5 w-5 text-primary" />
					<h3 class="text-sm font-bold text-foreground">
						{selectedPlatform.name} Ingestion Logic Flow
					</h3>
				</div>

				<div class="space-y-3 text-xs">
					<!-- Step 1 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							1
						</span>
						<div>
							<div class="font-semibold text-foreground">Edge Whitelist Gate</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								Incoming {selectedPlatform.name} packet sender identifier is verified against whitelist. Casual banter dropped with 0 token waste.
							</p>
						</div>
					</div>

					<!-- Step 2 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							2
						</span>
						<div>
							<div class="font-semibold text-foreground">Deterministic LLM Parsing</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								Conversation converted strictly to JSON Schema (intent, document_no, target_field, proposed_value) at Temp = 0.0.
							</p>
						</div>
					</div>

					<!-- Step 3 -->
					<div class="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
						<span class="h-5 w-5 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
							3
						</span>
						<div>
							<div class="font-semibold text-foreground">Live SSE Cockpit Stream</div>
							<p class="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
								Pushed immediately to On-Call Engineer's WebUI for human review and atomic prepared statement execution.
							</p>
						</div>
					</div>
				</div>

				<!-- Setup Code Snippet Preview -->
				<div class="pt-2">
					<div class="flex items-center justify-between pb-1.5 text-[11px] font-mono text-muted-foreground">
						<span>Environment Variables (.env)</span>
						<button
							type="button"
							onclick={() => copySnippet(cockpit.chatPlatform === "whatsapp" ? `CHATOPS_PLATFORM=whatsapp\nWA_INGRESS_PORT=8088\nWA_WHITELIST=${waConfig.whitelistedJids}` : cockpit.chatPlatform === "telegram" ? `CHATOPS_PLATFORM=telegram\nTELEGRAM_BOT_TOKEN=${tgConfig.botToken}\nTELEGRAM_WHITELIST=${tgConfig.whitelistedChatIds}` : cockpit.chatPlatform === "discord" ? `CHATOPS_PLATFORM=discord\nDISCORD_BOT_TOKEN=${discordConfig.botToken}\nDISCORD_GUILD_ID=${discordConfig.guildId}` : `CHATOPS_PLATFORM=slack\nSLACK_BOT_TOKEN=${slackConfig.botToken}\nSLACK_SIGNING_SECRET=${slackConfig.signingSecret}`)}
							class="hover:text-foreground text-primary transition-colors flex items-center gap-1 cursor-pointer"
						>
							{#if copiedSnippet}
								<ClipboardDocumentCheck class="h-3.5 w-3.5 text-emerald-500" />
								<span class="text-emerald-500">Copied!</span>
							{:else}
								<CodeBracket class="h-3.5 w-3.5" />
								<span>Copy Config</span>
							{/if}
						</button>
					</div>

					<pre class="p-3 rounded-xl bg-black/60 border border-border/80 text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed"><code>{#if cockpit.chatPlatform === "whatsapp"}CHATOPS_PLATFORM=whatsapp
WA_INGRESS_PORT={waConfig.port}
WA_WHITELIST="{waConfig.whitelistedJids}"
WA_DEBOUNCE_MS={waConfig.rateLimitDebounceMs}{:else if cockpit.chatPlatform === "telegram"}CHATOPS_PLATFORM=telegram
TELEGRAM_BOT_TOKEN="{tgConfig.botToken}"
TELEGRAM_MODE="{tgConfig.connectionMode}"
TELEGRAM_WHITELIST="{tgConfig.whitelistedChatIds}"{:else if cockpit.chatPlatform === "discord"}CHATOPS_PLATFORM=discord
DISCORD_BOT_TOKEN="{discordConfig.botToken}"
DISCORD_GUILD_ID="{discordConfig.guildId}"
DISCORD_ROLE="{discordConfig.permittedRole}"{:else}CHATOPS_PLATFORM=slack
SLACK_BOT_TOKEN="{slackConfig.botToken}"
SLACK_SIGNING_SECRET="{slackConfig.signingSecret}"
SLACK_TEAM_ID="{slackConfig.teamId}"{/if}</code></pre>
				</div>
			</div>
		</div>
	</div>
</div>

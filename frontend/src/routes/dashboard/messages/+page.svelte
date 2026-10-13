<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { 
		ChatBubbleLeftRight, 
		MagnifyingGlass, 
		ArrowPath, 
		CheckCircle, 
		ExclamationTriangle, 
		ChatBubbleOvalLeftEllipsis,
		Eye, 
		Bolt, 
		Check, 
		XMark, 
		ClipboardDocument, 
		DocumentText, 
		Photo, 
		PaperClip, 
		ArrowTopRightOnSquare,
		Clock,
		ShieldCheck
	} from "svelte-heros-v2";
	import { cockpit, type InboundMessage, type Ticket } from "$lib/cockpit.svelte";
	import { timeAgo } from "$lib/utils";

	// Filter & Search State
	let searchQuery = $state("");
	let selectedPlatform = $state<"all" | "whatsapp" | "telegram" | "discord" | "slack">("all");
	let selectedClassification = $state<"all" | "ACTIONABLE" | "NEEDS_REVIEW" | "CASUAL_BANTER">("all");
	let isRefreshing = $state(false);
	let copiedId = $state<number | null>(null);

	// Modals & Actions
	let inspectModalMessage = $state<InboundMessage | null>(null);
	let stagingModalMessage = $state<InboundMessage | null>(null);
	let stagingDocNo = $state("INV/2026/001");
	let stagingProposedValue = $state("");
	let stagingSubmitting = $state(false);
	let stagingSuccessTicket = $state<Ticket | null>(null);
	let stagingError = $state<string | null>(null);

	// Self-Learning Pattern Studio & Image Preview
	let learningModalMessage = $state<InboundMessage | null>(null);
	let learnPatternName = $state("");
	let learnExamplePhrase = $state("");
	let learnRegexPattern = $state("");
	let learnTargetIntent = $state("UPDATE_CUSTOMER_NAME");
	let learnClassification = $state("NEEDS_REVIEW");
	let learnSubmitting = $state(false);
	let learnSuccess = $state(false);
	let learnError = $state<string | null>(null);

	let showPatternsDrawer = $state(false);
	let imagePreviewUrl = $state<string | null>(null);

	// Invoices list for quick dropdown in modal
	let openInvoices = $state<Array<{ invoice_no: string; customer_name: string; amount: number }>>([
		{ invoice_no: "INV/2026/001", customer_name: "PT Sumber Makmur", amount: 45000000 },
		{ invoice_no: "INV/2026/002", customer_name: "PT Karya Abadi Perkasa", amount: 82500000 },
		{ invoice_no: "INV/2026/003", customer_name: "CV Bintang Timur", amount: 19800000 },
		{ invoice_no: "INV/2026/004", customer_name: "PT Sentosa Raya", amount: 124000000 },
		{ invoice_no: "INV/2026/005", customer_name: "UD Jaya Baru Sejahtera", amount: 31200000 },
	]);

	// Filtered messages
	let filteredMessages = $derived(
		cockpit.inboundMessages
			.filter(m => {
				if (selectedPlatform !== "all" && m.platform !== selectedPlatform) return false;
				if (selectedClassification !== "all" && m.classification !== selectedClassification) return false;
				if (!searchQuery.trim()) return true;
				const q = searchQuery.toLowerCase();
				return (
					m.raw_message.toLowerCase().includes(q) ||
					m.sender_name.toLowerCase().includes(q) ||
					m.sender_id.toLowerCase().includes(q) ||
					(m.extracted_doc && m.extracted_doc.toLowerCase().includes(q)) ||
					(m.extracted_target && m.extracted_target.toLowerCase().includes(q))
				);
			})
	);

	async function handleRefresh() {
		isRefreshing = true;
		await cockpit.fetchInboundMessages();
		await cockpit.fetchLearnedPatterns();
		await cockpit.fetchTickets();
		setTimeout(() => { isRefreshing = false; }, 400);
	}

	function copyToClipboard(text: string, id: number) {
		navigator.clipboard.writeText(text);
		copiedId = id;
		setTimeout(() => {
			if (copiedId === id) copiedId = null;
		}, 2000);
	}

	function openStagingModal(msg: InboundMessage) {
		stagingModalMessage = msg;
		stagingProposedValue = msg.extracted_target || "";
		stagingDocNo = msg.extracted_doc || "INV/2026/001";
		stagingSuccessTicket = null;
		stagingError = null;
	}

	function openLearningModal(msg: InboundMessage) {
		learningModalMessage = msg;
		learnPatternName = `Koreksi Dokumen via Chat Kasual (${msg.platform})`;
		learnExamplePhrase = msg.raw_message;
		learnRegexPattern = "(ubah|ganti|revisi|gambar).*?(ke|menjadi|dari)";
		learnTargetIntent = "UPDATE_CUSTOMER_NAME";
		learnClassification = "NEEDS_REVIEW";
		learnSubmitting = false;
		learnSuccess = false;
		learnError = null;
	}

	async function handleSavePattern() {
		if (!learnPatternName.trim() || !learnExamplePhrase.trim()) {
			learnError = "Nama pola dan contoh kalimat wajib diisi.";
			return;
		}
		learnSubmitting = true;
		learnError = null;
		const res = await cockpit.createLearnedPattern({
			pattern_name: learnPatternName.trim(),
			example_phrase: learnExamplePhrase.trim(),
			regex_pattern: learnRegexPattern.trim(),
			target_intent: learnTargetIntent,
			classification: learnClassification,
			confidence: 0.95,
			learned_by: "Supervisor (Pattern Studio)"
		});
		learnSubmitting = false;
		if (res.success) {
			learnSuccess = true;
			setTimeout(() => {
				learningModalMessage = null;
				learnSuccess = false;
			}, 1200);
		} else {
			learnError = res.error || "Gagal menyimpan pola pembelajaran";
		}
	}

	async function handleDeletePattern(id: number) {
		if (confirm("Hapus pola ini dari memory NovaPilot AI?")) {
			await cockpit.deleteLearnedPattern(id);
		}
	}

	async function handleExecuteStaging() {
		if (!stagingModalMessage) return;
		if (!stagingDocNo.trim()) {
			stagingError = "Document number is required";
			return;
		}
		if (!stagingProposedValue.trim()) {
			stagingError = "Proposed customer value is required";
			return;
		}

		stagingSubmitting = true;
		stagingError = null;

		const res = await cockpit.stageTicketFromMessage(
			stagingModalMessage.id,
			stagingDocNo.trim(),
			stagingProposedValue.trim()
		);

		stagingSubmitting = false;
		if (res.success && res.ticket) {
			stagingSuccessTicket = res.ticket;
		} else {
			stagingError = res.error || "Failed to stage ticket";
		}
	}

	let autoPollTimer: any = null;

	onMount(async () => {
		await cockpit.fetchInboundMessages();
		await cockpit.fetchLearnedPatterns();
		try {
			const invRes = await fetch("/api/invoices");
			if (invRes.ok) {
				const data = await invRes.json();
				if (Array.isArray(data) && data.length > 0) {
					openInvoices = data;
				}
			}
		} catch {}

		// Active Real-Time Poller (every 2.5s) to guarantee zero latency updates alongside SSE
		autoPollTimer = setInterval(async () => {
			await cockpit.fetchInboundMessages();
		}, 2500);
	});

	onDestroy(() => {
		if (autoPollTimer) {
			clearInterval(autoPollTimer);
		}
	});
</script>

<svelte:head>
	<title>Omnichannel Inbound Messages • NovaPilot AI Cockpit</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
	<!-- ========================================================================= -->
	<!-- 1. HEADER SECTION                                                         -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
					<ChatBubbleLeftRight class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						Omnichannel Inbound Feed
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							REALTIME INGRESS
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						Unified live message stream from WhatsApp, Telegram, Discord, and Slack with heuristic classification and 1-click ticket staging.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
			<button
				type="button"
				onclick={() => showPatternsDrawer = true}
				class="h-9 px-3.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
			>
				<span>🧠 Memory Pola AI</span>
				<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 font-mono font-bold">
					{cockpit.learnedPatterns.length}
				</span>
			</button>
			<button
				type="button"
				onclick={handleRefresh}
				disabled={isRefreshing}
				class="h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-3.5 w-3.5 {isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}" />
				<span>Refresh Feed</span>
			</button>
			<a
				href="/dashboard/queue"
				class="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
			>
				<span>Approval Queue</span>
				<ArrowTopRightOnSquare class="h-3.5 w-3.5" />
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. METRIC CARDS                                                           -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
		<!-- Total Messages Ingested -->
		<div class="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Total Messages</span>
				<ChatBubbleLeftRight class="h-4 w-4 text-primary" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-foreground">
				{cockpit.inboundMessages.length}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				Packets ingested across all platforms
			</p>
		</div>

		<!-- Actionable Tickets -->
		<div class="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Actionable Tickets</span>
				<CheckCircle class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
				{cockpit.actionableCount}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				Invoice matched & staged automatically
			</p>
		</div>

		<!-- Needs Review / Ambiguous -->
		<div class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-amber-600 dark:text-amber-400">
				<span class="text-xs font-semibold">Needs Review</span>
				<ExclamationTriangle class="h-4 w-4 text-amber-500" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
				{cockpit.needsReviewCount}
			</div>
			<p class="text-[11px] text-amber-600/80 dark:text-amber-400/80 line-clamp-1">
				Mutation intent detected without doc ID
			</p>
		</div>

		<!-- Casual Banter / Discarded -->
		<div class="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">Casual Banter</span>
				<ChatBubbleOvalLeftEllipsis class="h-4 w-4 text-slate-400" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
				{cockpit.casualBanterCount}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				Filtered conversations (zero DB mutation)
			</p>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. FILTERING & SEARCH CONTROLS                                            -->
	<!-- ========================================================================= -->
	<div class="p-3.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-xs space-y-3 shadow-xs">
		<div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
			<!-- Platform Filter Tabs -->
			<div class="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-secondary/50 border border-border/50 text-xs">
				<button
					type="button"
					onclick={() => selectedPlatform = "all"}
					class="px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer {selectedPlatform === 'all' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}"
				>
					All Platforms
				</button>
				<button
					type="button"
					onclick={() => selectedPlatform = "whatsapp"}
					class="px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer {selectedPlatform === 'whatsapp' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					WhatsApp
				</button>
				<button
					type="button"
					onclick={() => selectedPlatform = "telegram"}
					class="px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer {selectedPlatform === 'telegram' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="h-2 w-2 rounded-full bg-sky-500"></span>
					Telegram
				</button>
				<button
					type="button"
					onclick={() => selectedPlatform = "discord"}
					class="px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer {selectedPlatform === 'discord' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="h-2 w-2 rounded-full bg-indigo-500"></span>
					Discord
				</button>
				<button
					type="button"
					onclick={() => selectedPlatform = "slack"}
					class="px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer {selectedPlatform === 'slack' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
				>
					<span class="h-2 w-2 rounded-full bg-amber-500"></span>
					Slack
				</button>
			</div>

			<!-- Classification Filter Tabs -->
			<div class="flex flex-wrap items-center gap-1.5 text-xs">
				<button
					type="button"
					onclick={() => selectedClassification = "all"}
					class="px-2.5 py-1 rounded-md border transition-all cursor-pointer {selectedClassification === 'all' ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-border/70 text-muted-foreground hover:text-foreground bg-card'}"
				>
					All Status
				</button>
				<button
					type="button"
					onclick={() => selectedClassification = "NEEDS_REVIEW"}
					class="px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer {selectedClassification === 'NEEDS_REVIEW' ? 'bg-amber-500 text-white border-amber-500 font-semibold' : 'border-border/70 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 bg-card'}"
				>
					<ExclamationTriangle class="h-3.5 w-3.5" />
					Needs Review
					{#if cockpit.needsReviewCount > 0}
						<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono font-bold">
							{cockpit.needsReviewCount}
						</span>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => selectedClassification = "ACTIONABLE"}
					class="px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer {selectedClassification === 'ACTIONABLE' ? 'bg-emerald-600 text-white border-emerald-600 font-semibold' : 'border-border/70 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-card'}"
				>
					<CheckCircle class="h-3.5 w-3.5" />
					Actionable
				</button>
				<button
					type="button"
					onclick={() => selectedClassification = "CASUAL_BANTER"}
					class="px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer {selectedClassification === 'CASUAL_BANTER' ? 'bg-muted-foreground text-background border-muted-foreground font-semibold' : 'border-border/70 text-muted-foreground hover:text-foreground bg-card'}"
				>
					<ChatBubbleOvalLeftEllipsis class="h-3.5 w-3.5" />
					Casual Banter
				</button>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="relative">
			<MagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search messages by content, sender ID, invoice number, or target company name..."
				class="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
			/>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 4. INBOUND MESSAGE FEED LIST                                              -->
	<!-- ========================================================================= -->
	<div class="space-y-3">
		{#if filteredMessages.length === 0}
			<div class="p-12 text-center rounded-xl border border-dashed border-border bg-card/30 space-y-3">
				<div class="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
					<ChatBubbleLeftRight class="h-6 w-6" />
				</div>
				<div class="space-y-1">
					<p class="text-sm font-semibold text-foreground">No inbound messages found</p>
					<p class="text-xs text-muted-foreground max-w-sm mx-auto">
						No messages matched your current platform or classification filter criteria. Send a message to WhatsApp or reset filters to view all.
					</p>
				</div>
				<button
					type="button"
					onclick={() => { searchQuery = ""; selectedPlatform = "all"; selectedClassification = "all"; }}
					class="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted font-medium text-foreground cursor-pointer"
				>
					Reset All Filters
				</button>
			</div>
		{:else}
			{#each filteredMessages as msg (msg.id)}
				<div 
					class="p-4 sm:p-5 rounded-xl border transition-all duration-200 {msg.classification === 'NEEDS_REVIEW' ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 shadow-xs' : msg.classification === 'ACTIONABLE' ? 'border-emerald-500/30 bg-card/70 hover:border-emerald-500/50 shadow-xs' : 'border-border/60 bg-card/40 hover:border-border'} space-y-3"
				>
					<!-- Top Row: Sender Info, Platform, Badges, Timestamp -->
					<div class="flex flex-wrap items-center justify-between gap-2.5">
						<div class="flex items-center gap-2.5 min-w-0">
							<!-- Platform Badge with Icon -->
							{#if msg.platform === 'whatsapp'}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
									<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
									WhatsApp
								</span>
							{:else if msg.platform === 'telegram'}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1 shrink-0">
									<span class="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
									Telegram
								</span>
							{:else if msg.platform === 'discord'}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1 shrink-0">
									<span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
									Discord
								</span>
							{:else}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
									<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
									Slack
								</span>
							{/if}

							<!-- Sender Name & Identifier -->
							<div class="flex items-center gap-1.5 min-w-0">
								<span class="text-xs font-semibold text-foreground truncate">
									{msg.sender_name || "Unknown Sender"}
								</span>
								<span class="text-[10px] text-muted-foreground font-mono truncate hidden sm:inline">
									({msg.sender_id})
								</span>
							</div>

							<!-- Media Type Badge -->
							{#if msg.media_type === 'image'}
								<span class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
									<Photo class="h-3 w-3" />
									Photo / Nota
								</span>
							{:else if msg.media_type === 'document'}
								<span class="px-1.5 py-0.2 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
									<DocumentText class="h-3 w-3" />
									Document PDF
								</span>
							{/if}
						</div>

						<!-- Right: Status Badge & Timestamp -->
						<div class="flex items-center gap-2">
							{#if msg.classification === 'ACTIONABLE'}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
									<CheckCircle class="h-3 w-3" />
									ACTIONABLE TICKET
								</span>
							{:else if msg.classification === 'NEEDS_REVIEW'}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
									<ExclamationTriangle class="h-3 w-3" />
									NEEDS ON-CALL REVIEW
								</span>
							{:else}
								<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-secondary text-muted-foreground border border-border/50 flex items-center gap-1">
									<ChatBubbleOvalLeftEllipsis class="h-3 w-3" />
									CASUAL BANTER
								</span>
							{/if}

							<span class="text-[11px] font-mono text-muted-foreground shrink-0">
								{timeAgo(msg.created_at)}
							</span>
						</div>
					</div>

					<!-- Middle: Chat Bubble Text & Media Attachments -->
					<div class="p-3.5 rounded-lg bg-background/80 border border-border/50 text-xs text-foreground font-mono leading-relaxed relative group space-y-2.5">
						<div class="relative pr-8">
							<p class="whitespace-pre-wrap select-text">{msg.raw_message}</p>
							<button
								type="button"
								onclick={() => copyToClipboard(msg.raw_message, msg.id)}
								class="absolute top-0 right-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
								title="Copy raw text"
							>
								{#if copiedId === msg.id}
									<Check class="h-3.5 w-3.5 text-emerald-500" />
								{:else}
									<ClipboardDocument class="h-3.5 w-3.5" />
								{/if}
							</button>
						</div>

						<!-- Image Media Attachment Preview -->
						{#if msg.media_url}
							<div class="pt-2 border-t border-border/40">
								<span class="text-[10px] uppercase font-mono font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
									<Photo class="h-3.5 w-3.5 text-blue-500" />
									Lampiran Gambar / Nota Masuk (WhatsApp Media):
								</span>
								<button
									type="button"
									onclick={() => imagePreviewUrl = msg.media_url || null}
									class="relative inline-block rounded-lg overflow-hidden border border-border bg-black/5 hover:border-primary transition-all cursor-pointer group/thumb"
								>
									<img
										src={msg.media_url}
										alt="Lampiran Dokumen dari {msg.sender_name}"
										class="max-h-48 max-w-xs object-cover rounded-lg group-hover/thumb:scale-102 transition-transform duration-200"
										onerror={(e) => {
											(e.currentTarget as HTMLImageElement).src = '/uploads/sample_invoice.svg';
										}}
									/>
									<div class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
										<Eye class="h-4 w-4" />
										<span>Klik untuk Zoom</span>
									</div>
								</button>
							</div>
						{:else if msg.media_type === 'image'}
							<div class="pt-2 border-t border-border/40">
								<span class="text-[10px] uppercase font-mono font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
									<Photo class="h-3.5 w-3.5 text-amber-500" />
									Lampiran Gambar / Nota Masuk:
								</span>
								<div class="p-3 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
									<Photo class="h-5 w-5 shrink-0" />
									<div>
										<p class="font-semibold">Foto Diterima Sebelum Modul Media Storage Diaktifkan</p>
										<p class="text-[11px] text-muted-foreground mt-0.5">Pesan ini masuk sebelum modul Baileys Media Downloader &amp; OCR diaktifkan di sesi server. Kirim foto baru via WhatsApp untuk melihat file asli &amp; OCR live.</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- OCR Extracted Text Box -->
						{#if msg.ocr_text}
							<div class="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5">
								<div class="flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
									<span class="flex items-center gap-1.5">
										<DocumentText class="h-3.5 w-3.5" />
										OCR Engine: Teks Nota / Faktur Terdeteksi (Tesseract)
									</span>
									<button
										type="button"
										onclick={() => copyToClipboard(msg.ocr_text || "", msg.id + 900000)}
										class="hover:underline flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground text-[10px]"
									>
										{#if copiedId === msg.id + 900000}
											<Check class="h-3 w-3 text-emerald-500" />
											<span>Tersalin</span>
										{:else}
											<ClipboardDocument class="h-3 w-3" />
											<span>Salin Teks OCR</span>
										{/if}
									</button>
								</div>
								<p class="font-mono text-[11px] text-foreground/90 whitespace-pre-wrap bg-background/60 p-2 rounded border border-blue-500/10 leading-relaxed select-text">
									{msg.ocr_text}
								</p>
							</div>
						{/if}
					</div>

					<!-- Bottom Row: Extracted Entity Tags & Actions -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/40">
						<!-- Extracted Metadata Pills -->
						<div class="flex flex-wrap items-center gap-2 text-[11px]">
							{#if msg.extracted_doc}
								<span class="px-2 py-0.5 rounded bg-secondary text-foreground font-mono font-medium border border-border/50 flex items-center gap-1">
									<DocumentText class="h-3 w-3 text-primary" />
									<span>Doc:</span>
									<span class="font-bold text-primary">{msg.extracted_doc}</span>
								</span>
							{:else if msg.classification === 'NEEDS_REVIEW'}
								<span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono border border-amber-500/20 flex items-center gap-1">
									<ExclamationTriangle class="h-3 w-3" />
									<span>Doc:</span>
									<span class="font-semibold italic">Missing in text (Referenced photo/nota)</span>
								</span>
							{/if}

							{#if msg.extracted_target}
								<span class="px-2 py-0.5 rounded bg-secondary text-foreground font-mono font-medium border border-border/50 flex items-center gap-1">
									<span>Target:</span>
									<span class="font-bold text-foreground">{msg.extracted_target}</span>
								</span>
							{/if}

							{#if msg.ticket_no}
								<a
									href="/dashboard/queue"
									class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/30 flex items-center gap-1 hover:underline"
								>
									<ShieldCheck class="h-3 w-3" />
									<span>Ticket:</span>
									<span>{msg.ticket_no}</span>
								</a>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
							<button
								type="button"
								onclick={() => openLearningModal(msg)}
								class="h-7 px-2.5 rounded-md border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
								title="Ajarkan AI mengenali gaya chat ini sebagai pola mutasi dokumen"
							>
								<span>🧠 Ajarkan NovaPilot</span>
							</button>

							<button
								type="button"
								onclick={() => inspectModalMessage = msg}
								class="h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
							>
								<Eye class="h-3 w-3" />
								<span>Inspect Details</span>
							</button>

							{#if msg.classification === 'NEEDS_REVIEW'}
								<button
									type="button"
									onclick={() => openStagingModal(msg)}
									class="h-7 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
								>
									<Bolt class="h-3 w-3" />
									<span>Convert to Ticket</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- ========================================================================= -->
<!-- 5. INSPECT METADATA MODAL                                                 -->
<!-- ========================================================================= -->
{#if inspectModalMessage}
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2">
					<div class="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
						<Eye class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Inbound Message Inspector</h3>
						<p class="text-[11px] text-muted-foreground font-mono">Message Packet #{inspectModalMessage.id}</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => inspectModalMessage = null}
					class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-3 text-xs font-mono">
				<div class="grid grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/30 border border-border/40">
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Platform</span>
						<span class="font-bold text-foreground uppercase">{inspectModalMessage.platform}</span>
					</div>
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Classification</span>
						<span class="font-bold {inspectModalMessage.classification === 'NEEDS_REVIEW' ? 'text-amber-500' : inspectModalMessage.classification === 'ACTIONABLE' ? 'text-emerald-500' : 'text-muted-foreground'}">
							{inspectModalMessage.classification}
						</span>
					</div>
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Sender Name</span>
						<span class="font-medium text-foreground">{inspectModalMessage.sender_name || 'N/A'}</span>
					</div>
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Sender JID / ID</span>
						<span class="font-medium text-foreground truncate block">{inspectModalMessage.sender_id}</span>
					</div>
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Media Ingress</span>
						<span class="font-medium text-foreground">{inspectModalMessage.media_type}</span>
					</div>
					<div>
						<span class="text-muted-foreground block text-[10px] uppercase">Timestamp</span>
						<span class="font-medium text-foreground">{new Date(inspectModalMessage.created_at).toLocaleString()}</span>
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-muted-foreground text-[10px] uppercase block">Raw Message Payload</span>
					<div class="p-3 rounded-lg bg-secondary/50 border border-border/50 text-foreground whitespace-pre-wrap select-text">
						{inspectModalMessage.raw_message}
					</div>
				</div>

				<div class="space-y-1">
					<span class="text-muted-foreground text-[10px] uppercase block">Extracted Entity Mapping</span>
					<div class="p-2.5 rounded-lg bg-secondary/30 border border-border/40 space-y-1 text-[11px]">
						<div>Intent: <span class="text-primary font-bold">{inspectModalMessage.extracted_intent || 'None'}</span></div>
						<div>Target Value: <span class="text-foreground font-bold">{inspectModalMessage.extracted_target || 'None'}</span></div>
						<div>Document Ref: <span class="text-primary font-bold">{inspectModalMessage.extracted_doc || 'None detected in text'}</span></div>
						{#if inspectModalMessage.ticket_no}
							<div>Linked Ticket: <span class="text-emerald-500 font-bold">{inspectModalMessage.ticket_no}</span></div>
						{/if}
					</div>
				</div>
			</div>

			<div class="pt-2 flex justify-end gap-2 border-t border-border/50">
				{#if inspectModalMessage.classification === 'NEEDS_REVIEW'}
					<button
						type="button"
						onclick={() => { const m = inspectModalMessage; inspectModalMessage = null; if (m) openStagingModal(m); }}
						class="h-8 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
					>
						<Bolt class="h-3.5 w-3.5" />
						<span>Proceed to Stage Ticket</span>
					</button>
				{/if}
				<button
					type="button"
					onclick={() => inspectModalMessage = null}
					class="h-8 px-3.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- 6. 1-CLICK CONVERT TO TICKET MODAL                                        -->
<!-- ========================================================================= -->
{#if stagingModalMessage}
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-card p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2">
					<div class="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
						<Bolt class="h-4 w-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Convert Message to Active Ticket</h3>
						<p class="text-[11px] text-muted-foreground font-mono">Human-in-the-Loop Ticket Staging</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => stagingModalMessage = null}
					class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			{#if stagingSuccessTicket}
				<div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 text-center">
					<div class="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
						<CheckCircle class="h-6 w-6" />
					</div>
					<div class="space-y-1">
						<h4 class="text-sm font-bold text-foreground">Ticket Successfully Created!</h4>
						<p class="text-xs text-muted-foreground">
							Ticket <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{stagingSuccessTicket.ticket_no}</span> is now active in the Approval Queue.
						</p>
					</div>
					<div class="pt-2 flex items-center justify-center gap-2">
						<a
							href="/dashboard/queue"
							class="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs"
						>
							<span>Go to Approval Queue</span>
							<ArrowTopRightOnSquare class="h-3.5 w-3.5" />
						</a>
						<button
							type="button"
							onclick={() => stagingModalMessage = null}
							class="h-8 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium"
						>
							Done
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-3.5 text-xs">
					<!-- Original Message Context Box -->
					<div class="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-1">
						<div class="text-[10px] font-mono font-semibold uppercase text-muted-foreground flex items-center justify-between">
							<span>Original Message from {stagingModalMessage.sender_name}</span>
							<span class="text-amber-500">Missing Explicit Invoice No</span>
						</div>
						<p class="font-mono text-xs text-foreground italic">"{stagingModalMessage.raw_message}"</p>
					</div>

					{#if stagingError}
						<div class="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
							{stagingError}
						</div>
					{/if}

					<!-- Form Field: Select or Type Invoice No -->
					<div class="space-y-1.5">
						<label for="docNoSelect" class="font-medium text-foreground block">
							Select Target Invoice Number <span class="text-destructive">*</span>
						</label>
						<select
							id="docNoSelect"
							bind:value={stagingDocNo}
							class="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono font-medium text-foreground shadow-xs"
						>
							{#each openInvoices as inv}
								<option value={inv.invoice_no}>
									{inv.invoice_no} — {inv.customer_name} (Rp {inv.amount.toLocaleString()})
								</option>
							{/each}
						</select>
						<p class="text-[11px] text-muted-foreground">
							Select the document referenced by the branch staff (e.g. from their attached picture/nota).
						</p>
					</div>

					<!-- Form Field: Confirm Proposed Value -->
					<div class="space-y-1.5">
						<label for="proposedValueInput" class="font-medium text-foreground block">
							New Customer Name / Target Value <span class="text-destructive">*</span>
						</label>
						<input
							id="proposedValueInput"
							type="text"
							bind:value={stagingProposedValue}
							placeholder="e.g. PT hahahaha"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono font-medium text-foreground shadow-xs"
						/>
						<p class="text-[11px] text-muted-foreground">
							Extracted value to apply upon IT On-Call verification and execution.
						</p>
					</div>
				</div>

				<div class="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
					<button
						type="button"
						onclick={() => stagingModalMessage = null}
						class="h-8 px-3.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleExecuteStaging}
						disabled={stagingSubmitting}
						class="h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
					>
						{#if stagingSubmitting}
							<ArrowPath class="h-3.5 w-3.5 animate-spin" />
							<span>Staging...</span>
						{:else}
							<Bolt class="h-3.5 w-3.5" />
							<span>Stage to Approval Queue</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- 7. IMAGE FULLSCREEN PREVIEW MODAL                                         -->
<!-- ========================================================================= -->
{#if imagePreviewUrl}
	<div 
		role="dialog" 
		aria-modal="true" 
		tabindex="-1"
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" 
		onclick={() => imagePreviewUrl = null}
		onkeydown={(e) => { if (e.key === 'Escape') imagePreviewUrl = null; }}
	>
		<div 
			role="document"
			class="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3" 
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="w-full flex items-center justify-between text-white/80 pb-2">
				<span class="text-xs font-mono font-bold flex items-center gap-1.5">
					<Photo class="h-4 w-4 text-blue-400" />
					Attachment Preview (WhatsApp / Omnichannel Ingress)
				</span>
				<div class="flex items-center gap-2">
					<a
						href={imagePreviewUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-white/70 hover:text-white flex items-center gap-1 underline"
					>
						<span>Open Original</span>
						<ArrowTopRightOnSquare class="h-3 w-3" />
					</a>
					<button
						type="button"
						onclick={() => imagePreviewUrl = null}
						class="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
					>
						<XMark class="h-5 w-5" />
					</button>
				</div>
			</div>
			<img
				src={imagePreviewUrl}
				alt="Zoomed Attachment"
				class="max-w-full max-h-[80vh] object-contain rounded-xl border border-white/20 shadow-2xl"
			/>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- 8. PATTERN LEARNING STUDIO (SELF-LEARNING FEEDBACK MODAL)                 -->
<!-- ========================================================================= -->
{#if learningModalMessage}
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-xl rounded-2xl border border-purple-500/40 bg-card p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
			<div class="flex items-center justify-between pb-3 border-b border-border/50">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
						🧠
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Pattern Learning Studio</h3>
						<p class="text-[11px] text-muted-foreground font-mono">Ajarkan NovaPilot AI Pola Bahasa Baru (Self-Learning)</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => learningModalMessage = null}
					class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			{#if learnSuccess}
				<div class="p-6 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-3 text-center">
					<div class="h-12 w-12 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto text-2xl">
						✨
					</div>
					<div class="space-y-1">
						<h4 class="text-sm font-bold text-foreground">Pola Berhasil Disimpan ke Memory NovaPilot!</h4>
						<p class="text-xs text-muted-foreground">
							Mulai sekarang, pesan dengan gaya bahasa serupa akan otomatis diklasifikasikan sebagai <span class="font-bold text-purple-500">{learnClassification}</span>.
						</p>
					</div>
				</div>
			{:else}
				<div class="space-y-3.5 text-xs">
					<div class="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-1">
						<span class="text-[10px] uppercase font-mono font-bold text-purple-600 dark:text-purple-400 block">
							Contoh Pesan Kasual dari Pengguna:
						</span>
						<p class="font-mono text-xs text-foreground italic">"{learningModalMessage.raw_message}"</p>
					</div>

					{#if learnError}
						<div class="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
							{learnError}
						</div>
					{/if}

					<div class="space-y-1.5">
						<label for="patternNameInput" class="font-medium text-foreground block">
							Nama Pola / Aturan <span class="text-destructive">*</span>
						</label>
						<input
							id="patternNameInput"
							type="text"
							bind:value={learnPatternName}
							placeholder="Contoh: Permintaan Mutasi via Foto Nota"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground shadow-xs"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label for="classificationSelect" class="font-medium text-foreground block">
								Klasifikasi Target
							</label>
							<select
								id="classificationSelect"
								bind:value={learnClassification}
								class="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium text-foreground shadow-xs"
							>
								<option value="ACTIONABLE">ACTIONABLE (Langsung Jadi Tiket)</option>
								<option value="NEEDS_REVIEW">NEEDS_REVIEW (Butuh Konfirmasi Staging)</option>
							</select>
						</div>

						<div class="space-y-1.5">
							<label for="intentSelect" class="font-medium text-foreground block">
								Target Intent
							</label>
							<select
								id="intentSelect"
								bind:value={learnTargetIntent}
								class="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-medium text-foreground shadow-xs"
							>
								<option value="UPDATE_CUSTOMER_NAME">UPDATE_CUSTOMER_NAME</option>
								<option value="CANCEL_INVOICE">CANCEL_INVOICE</option>
								<option value="GENERAL_MUTATION">GENERAL_MUTATION</option>
							</select>
						</div>
					</div>

					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<label for="regexPatternInput" class="font-medium text-foreground block">
								Pola Regex Kompilasi (Otomatis Dihasilkan)
							</label>
							<span class="text-[10px] text-muted-foreground font-mono">Case-Insensitive</span>
						</div>
						<input
							id="regexPatternInput"
							type="text"
							bind:value={learnRegexPattern}
							placeholder="(ubah|ganti|revisi|gambar).*?(ke|menjadi|dari)"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono text-purple-600 dark:text-purple-300 font-bold shadow-xs"
						/>
						<p class="text-[11px] text-muted-foreground">
							Ekspresi reguler yang digunakan untuk mencocokkan pesan chat kasual di masa depan.
						</p>
					</div>
				</div>

				<div class="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
					<button
						type="button"
						onclick={() => learningModalMessage = null}
						class="h-8 px-3.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium cursor-pointer"
					>
						Batal
					</button>
					<button
						type="button"
						onclick={handleSavePattern}
						disabled={learnSubmitting}
						class="h-8 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
					>
						{#if learnSubmitting}
							<ArrowPath class="h-3.5 w-3.5 animate-spin" />
							<span>Menyimpan ke Memory...</span>
						{:else}
							<span>🧠 Simpan ke Memory NovaPilot</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- 9. LEARNED PATTERNS MEMORY DRAWER / MODAL                                 -->
<!-- ========================================================================= -->
{#if showPatternsDrawer}
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
		<div class="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-purple-500/40 bg-card p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in-50 zoom-in-95">
			<div class="flex items-center justify-between pb-3 border-b border-border/50 shrink-0">
				<div class="flex items-center gap-2.5">
					<div class="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
						🧠
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">Long-Term Pattern Memory</h3>
						<p class="text-[11px] text-muted-foreground font-mono">
							{cockpit.learnedPatterns.length} Pola Chat Kasual yang Telah Dipelajari NovaPilot AI
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => showPatternsDrawer = false}
					class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			<div class="overflow-y-auto space-y-3 pr-1 text-xs">
				{#if cockpit.learnedPatterns.length === 0}
					<div class="p-8 text-center text-muted-foreground rounded-xl border border-dashed border-border">
						Belum ada pola pembelajaran tersimpan. Klik "🧠 Ajarkan NovaPilot" pada salah satu pesan kasual untuk menambahkan pola pertama.
					</div>
				{:else}
					{#each cockpit.learnedPatterns as pat (pat.id)}
						<div class="p-3.5 rounded-xl border border-border/70 bg-card/60 space-y-2 hover:border-purple-500/40 transition-colors">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold text-foreground">{pat.pattern_name}</span>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {pat.classification === 'ACTIONABLE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}">
										{pat.classification}
									</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
										Matched {pat.times_matched}x
									</span>
									<button
										type="button"
										onclick={() => handleDeletePattern(pat.id)}
										class="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
										title="Hapus pola"
									>
										<XMark class="h-3.5 w-3.5" />
									</button>
								</div>
							</div>

							<div class="p-2 rounded bg-secondary/50 text-[11px] font-mono text-muted-foreground italic">
								Contoh: "{pat.example_phrase}"
							</div>

							<div class="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
								<div>Regex: <span class="text-foreground font-bold">{pat.regex_pattern}</span></div>
								<div>Oleh: <span>{pat.learned_by}</span></div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="pt-3 flex justify-end border-t border-border/50 shrink-0">
				<button
					type="button"
					onclick={() => showPatternsDrawer = false}
					class="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

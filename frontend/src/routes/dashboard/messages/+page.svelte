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
		ShieldCheck,
		CommandLine,
		Play,
		Trash,
		CpuChip,
		PaperAirplane
	} from "svelte-heros-v2";
	import { cockpit, type InboundMessage, type Ticket } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import { timeAgo, formatCurrency } from "$lib/utils";

	// Filter & Search State
	let searchQuery = $state("");
	let selectedPlatform = $state<"all" | "whatsapp" | "telegram" | "discord" | "slack">("all");
	let selectedClassification = $state<"all" | "ACTIONABLE" | "NEEDS_REVIEW" | "CASUAL_BANTER">("all");
	let isRefreshing = $state(false);
	let copiedId = $state<number | null>(null);

	// Inbound Reply Modal State
	let replyModalMessage = $state<InboundMessage | null>(null);
	let replyRecipientPhone = $state("");
	let replyRecipientName = $state("");
	let replyText = $state("");
	let replySending = $state(false);
	let replySuccess = $state(false);
	let replyError = $state<string | null>(null);
	let replySuccessTimestamp = $state("");

	const quickReplyTemplates = [
		{
			title: "Permintaan Diterima & Masuk Antrean Verifikasi",
			badge: "Staging",
			generate: (msg: InboundMessage) =>
				`Halo ${msg.sender_name || 'Rekan'}, permintaan koreksi dokumen ${msg.extracted_doc || 'terkait'} telah kami terima dan masuk ke dalam antrean verifikasi tim IT On-Call NovaPilot. Kami akan segera memperbarui status ke sistem.`
		},
		{
			title: "Mohon Kirimkan Foto / Scan Nota Fisik",
			badge: "Clarification",
			generate: (msg: InboundMessage) =>
				`Halo ${msg.sender_name || 'Rekan'}, mohon bantuannya untuk mengirimkan foto fisik nota/surat jalan atau dokumen pendukung yang jelas agar kami dapat memvalidasi data ini ke database ERP resmi.`
		},
		{
			title: "Tiket Mutasi Disetujui & ERP Diperbarui",
			badge: "Resolved",
			generate: (msg: InboundMessage) =>
				`Halo ${msg.sender_name || 'Rekan'}, pembaruan data untuk dokumen ${msg.extracted_doc || 'terkait'} telah BERHASIL disetujui dan diterapkan ke database ERP resmi (${msg.extracted_target ? 'Target: ' + msg.extracted_target : 'Selesai'}). Silakan periksa kembali di portal cabang.`
		},
		{
			title: "Nomor Dokumen Tidak Ditemukan",
			badge: "Warning",
			generate: (msg: InboundMessage) =>
				`Halo ${msg.sender_name || 'Rekan'}, nomor dokumen ${msg.extracted_doc || ''} tidak ditemukan di database operasional. Mohon periksa kembali nomor faktur yang benar (contoh: INV/2026/001).`
		},
		{
			title: "Permintaan Ditolak (Dokumen Closed)",
			badge: "Policy",
			generate: (msg: InboundMessage) =>
				`Halo ${msg.sender_name || 'Rekan'}, mohon maaf dokumen ${msg.extracted_doc || 'terkait'} sudah berstatus CLOSED/POSTED di ERP sehingga mutasi langsung via chat diblokir oleh sistem SOP IT.`
		}
	];

	function openReplyModal(msg: InboundMessage) {
		replyModalMessage = msg;
		replyRecipientName = msg.sender_name || "Branch Staff";
		replyRecipientPhone = msg.sender_id || "";
		replyText = quickReplyTemplates[0].generate(msg);
		replySending = false;
		replySuccess = false;
		replyError = null;
		replySuccessTimestamp = "";
	}

	function applyReplyTemplate(template: typeof quickReplyTemplates[0]) {
		if (!replyModalMessage) return;
		replyText = template.generate(replyModalMessage);
	}

	async function handleSendReply() {
		if (!replyModalMessage || !replyRecipientPhone.trim() || !replyText.trim()) {
			replyError = "Recipient phone/JID and message body are required.";
			return;
		}

		replySending = true;
		replyError = null;
		replySuccess = false;

		try {
			const res = await fetch("/api/gateway/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone: replyRecipientPhone.trim(),
					message: replyText.trim()
				})
			});

			const data = await res.json();
			if (!res.ok || data.ok === false) {
				throw new Error(data.error || "Gagal mengirim balasan via WhatsApp Gateway.");
			}

			replySuccess = true;
			replySuccessTimestamp = new Date().toLocaleTimeString();
		} catch (err: any) {
			replyError = err.message || "Gagal menghubungi WhatsApp Gateway.";
		} finally {
			replySending = false;
		}
	}

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

	// Real-Time Exec Terminal State for WhatsApp Gateway Daemon
	let showTerminalModal = $state(false);
	let terminalLogs = $state<Array<{ id: string; time: string; level: string; text: string }>>([]);
	let terminalStatus = $state<{
		service: string;
		port: number;
		status: string;
		user: any;
		uptime_seconds: number;
		memory_rss_mb: string;
	} | null>(null);
	let terminalCommand = $state("");
	let terminalIsExecuting = $state(false);
	let terminalAutoScroll = $state(true);
	let terminalLogsContainer: HTMLDivElement | null = $state(null);
	let terminalPollTimer: any = null;
	let terminalOutputs = $state<Array<{ time: string; cmd: string; out: string }>>([]);

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

	async function fetchTerminalData() {
		try {
			// Query via Vite proxy or direct fallback to port 3002
			let statusRes = await fetch("/api/wa-gateway/status").catch(() => null);
			if (!statusRes || !statusRes.ok) {
				statusRes = await fetch("http://localhost:3002/api/status").catch(() => null);
			}
			if (statusRes && statusRes.ok) {
				terminalStatus = await statusRes.json();
			}

			let logsRes = await fetch("/api/wa-gateway/logs").catch(() => null);
			if (!logsRes || !logsRes.ok) {
				logsRes = await fetch("http://localhost:3002/api/logs").catch(() => null);
			}
			if (logsRes && logsRes.ok) {
				const logsData = await logsRes.json();
				terminalLogs = logsData.logs || [];
				if (terminalAutoScroll && terminalLogsContainer) {
					setTimeout(() => {
						if (terminalLogsContainer) {
							terminalLogsContainer.scrollTop = terminalLogsContainer.scrollHeight;
						}
					}, 40);
				}
			}
		} catch (err) {
			console.error("[TERMINAL FETCH ERROR]", err);
		}
	}

	function openTerminalModal() {
		showTerminalModal = true;
		fetchTerminalData();
		if (terminalPollTimer) clearInterval(terminalPollTimer);
		terminalPollTimer = setInterval(fetchTerminalData, 1500);
	}

	function closeTerminalModal() {
		showTerminalModal = false;
		if (terminalPollTimer) {
			clearInterval(terminalPollTimer);
			terminalPollTimer = null;
		}
	}

	async function execTerminalCommand(cmdString?: string) {
		const targetCmd = (cmdString || terminalCommand).trim();
		if (!targetCmd) return;
		terminalIsExecuting = true;
		try {
			let res = await fetch("/api/wa-gateway/exec", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ command: targetCmd })
			}).catch(() => null);

			if (!res || !res.ok) {
				res = await fetch("http://localhost:3002/api/exec", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ command: targetCmd })
				}).catch(() => null);
			}

			if (res && res.ok) {
				const resData = await res.json();
				terminalOutputs.unshift({
					time: new Date().toLocaleTimeString("id-ID", { hour12: false }),
					cmd: resData.command,
					out: resData.output
				});
				if (targetCmd === "clear") {
					terminalLogs = [];
					terminalOutputs = [];
				} else {
					await fetchTerminalData();
				}
			}
		} catch (e: any) {
			console.error("[EXEC ERROR]", e);
		} finally {
			terminalIsExecuting = false;
			terminalCommand = "";
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
		if (terminalPollTimer) {
			clearInterval(terminalPollTimer);
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
	<!-- ========================================================================= -->
	<!-- 1. HEADER SECTION (ROW 1: TITLE & TOP ACTIONS)                            -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/50">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5">
				<div class="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
					<ChatBubbleLeftRight class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						{i18n.t.messages.title}
						<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							REALTIME INGRESS
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.messages.subtitle}
					</p>
				</div>
			</div>
		</div>

		<!-- Top Row Primary Navigation Actions -->
		<div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
			<button
				type="button"
				onclick={handleRefresh}
				disabled={isRefreshing}
				class="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<ArrowPath class="h-3.5 w-3.5 {isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}" />
				<span>{i18n.t.actions.refresh}</span>
			</button>

			<a
				href="/dashboard/queue"
				class="h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
			>
				<span>{i18n.t.nav.queue}</span>
				{#if cockpit.pendingCount > 0}
					<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-foreground/20 text-primary-foreground font-mono font-bold">
						{cockpit.pendingCount}
					</span>
				{/if}
				<ArrowTopRightOnSquare class="h-3.5 w-3.5" />
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 1B. INGRESS COMMAND & INTEGRATION DECK (ROW 2: SEPARATED DEDICATED ROW)   -->
	<!-- ========================================================================= -->
	<div class="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
		<!-- Left Group: Daemon Controls & AI Memory -->
		<div class="flex items-center gap-2.5 flex-wrap">
			<!-- WhatsApp Gateway Daemon Status & Terminal Trigger -->
			<button
				type="button"
				onclick={openTerminalModal}
				class="h-9 px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
				title="Buka Real-time Terminal WhatsApp Gateway Daemon (:3002)"
			>
				<CommandLine class="h-4 w-4" />
				<span>{i18n.t.messages.terminal_btn}</span>
				<span class="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
					<span class="h-1.5 w-1.5 rounded-full {terminalStatus?.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
					{terminalStatus?.status || "LIVE :3002"}
				</span>
			</button>

			<!-- Memory Pola AI Trigger -->
			<button
				type="button"
				onclick={() => showPatternsDrawer = true}
				class="h-9 px-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
				title="Buka Kamus Pola Self-Learning AI"
			>
				<span>{i18n.t.messages.pattern_memory_btn}</span>
				<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 font-mono font-bold">
					{cockpit.learnedPatterns.length}
				</span>
			</button>
		</div>

		<!-- Right Group: Hermes Engine & Flow Shortcuts -->
		<div class="flex items-center gap-2.5 flex-wrap font-mono text-xs">
			<!-- Link to Hermes 3 GUI -->
			<a
				href="/dashboard/hermes"
				class="h-9 px-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
				title="Buka GUI Hermes 3 Agentic Engine & Reasoning Inspector"
			>
				<CpuChip class="h-4 w-4 text-sky-500" />
				<span>{i18n.t.messages.hermes_engine_btn}</span>
				<span class="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold">8B</span>
			</a>

			<!-- Link to Platform Flows -->
			<a
				href="/flow"
				class="h-9 px-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all"
			>
				<Bolt class="h-3.5 w-3.5 text-primary" />
				<span>{i18n.t.messages.platform_flows_btn}</span>
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
				<span class="text-xs font-medium">{i18n.t.messages.total_messages_kpi}</span>
				<ChatBubbleLeftRight class="h-4 w-4 text-primary" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-foreground">
				{cockpit.inboundMessages.length}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				{i18n.t.messages.total_messages_sub}
			</p>
		</div>

		<!-- Actionable Tickets -->
		<div class="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.messages.actionable_kpi}</span>
				<CheckCircle class="h-4 w-4 text-emerald-500" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
				{cockpit.actionableCount}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				{i18n.t.messages.actionable_sub}
			</p>
		</div>

		<!-- Needs Review / Ambiguous -->
		<div class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-amber-600 dark:text-amber-400">
				<span class="text-xs font-semibold">{i18n.t.messages.needs_review_kpi}</span>
				<ExclamationTriangle class="h-4 w-4 text-amber-500" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
				{cockpit.needsReviewCount}
			</div>
			<p class="text-[11px] text-amber-600/80 dark:text-amber-400/80 line-clamp-1">
				{i18n.t.messages.needs_review_sub}
			</p>
		</div>

		<!-- Casual Banter / Discarded -->
		<div class="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs space-y-1 shadow-xs">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.messages.casual_banter_kpi}</span>
				<ChatBubbleOvalLeftEllipsis class="h-4 w-4 text-slate-400" />
			</div>
			<div class="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
				{cockpit.casualBanterCount}
			</div>
			<p class="text-[11px] text-muted-foreground line-clamp-1">
				{i18n.t.messages.casual_banter_sub}
			</p>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. FILTERING & SEARCH CONTROLS                                            -->
	<!-- ========================================================================= -->
	<div class="p-3.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md space-y-3 shadow-xs">
		<div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
			<!-- Platform Filter Tabs -->
			<div class="flex items-center gap-2 overflow-x-auto pb-0.5 xl:pb-0 no-scrollbar">
				<div class="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/60 text-xs shrink-0">
					<button
						type="button"
						onclick={() => selectedPlatform = "all"}
						class="px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 {selectedPlatform === 'all' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						{i18n.t.messages.all_platforms}
					</button>
					<button
						type="button"
						onclick={() => selectedPlatform = "whatsapp"}
						class="px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 {selectedPlatform === 'whatsapp' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						<span class="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
						WhatsApp
					</button>
					<button
						type="button"
						onclick={() => selectedPlatform = "telegram"}
						class="px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 {selectedPlatform === 'telegram' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						<span class="h-2 w-2 rounded-full bg-sky-500 shrink-0"></span>
						Telegram
					</button>
					<button
						type="button"
						onclick={() => selectedPlatform = "discord"}
						class="px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 {selectedPlatform === 'discord' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						<span class="h-2 w-2 rounded-full bg-indigo-500 shrink-0"></span>
						Discord
					</button>
					<button
						type="button"
						onclick={() => selectedPlatform = "slack"}
						class="px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 {selectedPlatform === 'slack' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						<span class="h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
						Slack
					</button>
				</div>
			</div>

			<!-- Classification Filter Tabs -->
			<div class="flex items-center gap-2 overflow-x-auto pb-0.5 xl:pb-0 no-scrollbar">
				<div class="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/60 border border-border/60 text-xs shrink-0">
					<button
						type="button"
						onclick={() => selectedClassification = "all"}
						class="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 font-medium {selectedClassification === 'all' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						{i18n.t.messages.all_classes}
					</button>
					<button
						type="button"
						onclick={() => selectedClassification = "NEEDS_REVIEW"}
						class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 font-medium {selectedClassification === 'NEEDS_REVIEW' ? 'bg-amber-500 text-white font-semibold shadow-xs' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'}"
					>
						<ExclamationTriangle class="h-3.5 w-3.5 shrink-0" />
						<span>{i18n.t.messages.needs_review}</span>
						{#if cockpit.needsReviewCount > 0}
							<span class="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] {selectedClassification === 'NEEDS_REVIEW' ? 'bg-white/25 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'} font-mono font-bold leading-none shrink-0">
								{cockpit.needsReviewCount}
							</span>
						{/if}
					</button>
					<button
						type="button"
						onclick={() => selectedClassification = "ACTIONABLE"}
						class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 font-medium {selectedClassification === 'ACTIONABLE' ? 'bg-emerald-600 text-white font-semibold shadow-xs' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'}"
					>
						<CheckCircle class="h-3.5 w-3.5 shrink-0" />
						<span>{i18n.t.messages.actionable}</span>
					</button>
					<button
						type="button"
						onclick={() => selectedClassification = "CASUAL_BANTER"}
						class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 font-medium {selectedClassification === 'CASUAL_BANTER' ? 'bg-foreground text-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
					>
						<ChatBubbleOvalLeftEllipsis class="h-3.5 w-3.5 shrink-0" />
						<span>{i18n.t.messages.casual_banter}</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Search Bar -->
		<div class="relative">
			<MagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={i18n.t.messages.search_placeholder}
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
								onclick={() => openReplyModal(msg)}
								class="h-7 px-2.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
								title="Balas chat ini via WhatsApp Gateway"
							>
								<PaperAirplane class="h-3 w-3" />
								<span>Balas Chat</span>
							</button>

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
									{inv.invoice_no} — {inv.customer_name} ({formatCurrency(inv.amount)})
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
		class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer" 
		onclick={(e) => { if (e.target === e.currentTarget) imagePreviewUrl = null; }}
		onkeydown={(e) => { if (e.key === 'Escape') imagePreviewUrl = null; }}
	>
		<div 
			class="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3 cursor-default" 
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
<!-- 7.5 INBOUND MESSAGE REPLY MODAL (WHATSAPP GATEWAY DISPATCH)               -->
<!-- ========================================================================= -->
{#if replyModalMessage}
	<div 
		role="dialog" 
		aria-modal="true" 
		tabindex="-1"
		class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
		onkeydown={(e) => { if (e.key === 'Escape') replyModalMessage = null; }}
	>
		<div class="w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
			<!-- Header -->
			<div class="flex items-start justify-between pb-3 border-b border-border/60">
				<div class="flex items-center gap-3 min-w-0">
					<div class="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-emerald-500/30">
						<PaperAirplane class="h-5 w-5" />
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<h3 class="text-sm font-bold text-foreground truncate">Balas Chat WhatsApp Masuk</h3>
							<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
								Live Gateway :3002
							</span>
						</div>
						<p class="text-xs text-muted-foreground truncate">
							Kirim pesan langsung ke pengirim <span class="font-semibold text-foreground">{replyRecipientName}</span> ({replyRecipientPhone})
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={() => replyModalMessage = null}
					class="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<XMark class="h-4 w-4" />
				</button>
			</div>

			{#if replySuccess}
				<!-- Success Confirmation View -->
				<div class="p-6 text-center space-y-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
					<div class="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
						<Check class="h-6 w-6 stroke-2" />
					</div>
					<div class="space-y-1">
						<h4 class="text-base font-bold text-foreground">Balasan Berhasil Terkirim ke WhatsApp!</h4>
						<p class="text-xs text-muted-foreground max-w-md mx-auto">
							Pesan balasan telah diteruskan ke Baileys Gateway daemon dan sukses terkirim ke <span class="font-mono font-bold text-foreground">{replyRecipientPhone}</span> pada pukul <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{replySuccessTimestamp}</span>.
						</p>
					</div>
					<div class="pt-3 flex items-center justify-center gap-2.5">
						<button
							type="button"
							onclick={() => { replySuccess = false; replyText = ""; }}
							class="h-8.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
						>
							Tulis Pesan Lain
						</button>
						<button
							type="button"
							onclick={() => replyModalMessage = null}
							class="h-8.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs cursor-pointer"
						>
							Selesai &amp; Tutup
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-4 text-xs">
					<!-- Original Message Context Box -->
					<div class="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
						<div class="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
							<span class="font-bold uppercase flex items-center gap-1.5 text-foreground">
								<ChatBubbleLeftRight class="h-3.5 w-3.5 text-primary" />
								Pesan Masuk Asli
							</span>
							<span class="text-[10px]">{timeAgo(replyModalMessage.created_at)}</span>
						</div>
						<p class="font-mono text-xs text-foreground bg-background/80 p-2.5 rounded-lg border border-border/40 italic whitespace-pre-wrap select-text">
							"{replyModalMessage.raw_message}"
						</p>
						{#if replyModalMessage.extracted_doc || replyModalMessage.extracted_target}
							<div class="flex items-center gap-2 pt-1 font-mono text-[10px]">
								{#if replyModalMessage.extracted_doc}
									<span class="px-2 py-0.5 rounded bg-secondary text-primary font-bold border border-border/40">
										Doc: {replyModalMessage.extracted_doc}
									</span>
								{/if}
								{#if replyModalMessage.extracted_target}
									<span class="px-2 py-0.5 rounded bg-secondary text-foreground font-medium border border-border/40">
										Target: {replyModalMessage.extracted_target}
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Quick Reply Templates Pills -->
					<div class="space-y-1.5">
						<div class="font-semibold text-foreground flex items-center justify-between">
							<span>Pilih Template Respon Cepat (Quick Responses):</span>
							<span class="text-[10px] text-muted-foreground font-mono">Klik untuk memasukkan template</span>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each quickReplyTemplates as tmpl}
								<button
									type="button"
									onclick={() => applyReplyTemplate(tmpl)}
									class="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary/70 text-[11px] font-medium text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
								>
									<span class="text-[9px] px-1 py-0.2 rounded font-mono font-bold {tmpl.badge === 'Resolved' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : tmpl.badge === 'Warning' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-primary/15 text-primary'}">
										{tmpl.badge}
									</span>
									<span class="truncate max-w-[200px]">{tmpl.title}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Recipient Phone / JID Field -->
					<div class="space-y-1">
						<label for="replyPhoneInput" class="font-semibold text-foreground flex items-center justify-between">
							<span>Nomor Telepon / WhatsApp Target JID:</span>
							<span class="text-[10px] text-muted-foreground font-mono">Otomatis dari pesan masuk</span>
						</label>
						<input
							id="replyPhoneInput"
							type="text"
							bind:value={replyRecipientPhone}
							placeholder="Contoh: 6281228632195 atau 120363xxx@g.us"
							class="w-full h-9 px-3 rounded-lg border border-input bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
						/>
					</div>

					<!-- Message Textarea -->
					<div class="space-y-1">
						<div class="flex items-center justify-between">
							<label for="replyTextInput" class="font-semibold text-foreground">
								Isi Pesan Balasan (WhatsApp Outbound Body): <span class="text-destructive">*</span>
							</label>
							<span class="text-[10px] font-mono text-muted-foreground">
								{replyText.length} karakter
							</span>
						</div>
						<textarea
							id="replyTextInput"
							bind:value={replyText}
							rows="5"
							placeholder="Ketik balasan resmi Anda di sini..."
							class="w-full p-3 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary shadow-xs resize-y"
						></textarea>
						<div class="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
							<span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
								<ShieldCheck class="h-3.5 w-3.5" />
								<span>DLP Guardrail Aktif: Token kredensial &amp; nomor rahasia dilindungi otomatis.</span>
							</span>
						</div>
					</div>

					{#if replyError}
						<div class="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
							<p class="font-bold flex items-center gap-1.5">
								<ExclamationTriangle class="h-4 w-4 shrink-0" />
								<span>Gagal Mengirimkan Pesan Balasan:</span>
							</p>
							<p class="font-mono text-[11px]">{replyError}</p>
						</div>
					{/if}
				</div>

				<!-- Footer Actions -->
				<div class="pt-3 flex items-center justify-between gap-3 border-t border-border/60">
					<span class="text-[11px] text-muted-foreground hidden sm:inline">
						Pesan akan dipancarkan seketika melalui sesi WhatsApp Baileys.
					</span>

					<div class="flex items-center gap-2 ml-auto">
						<button
							type="button"
							onclick={() => replyModalMessage = null}
							class="h-8.5 px-3.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
						>
							Batal
						</button>
						<button
							type="button"
							onclick={handleSendReply}
							disabled={replySending || !replyText.trim() || !replyRecipientPhone.trim()}
							class="h-8.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
						>
							{#if replySending}
								<ArrowPath class="h-3.5 w-3.5 animate-spin" />
								<span>Mengirim...</span>
							{:else}
								<PaperAirplane class="h-3.5 w-3.5" />
								<span>Kirim Balasan via WA</span>
							{/if}
						</button>
					</div>
				</div>
			{/if}
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

<!-- ========================================================================= -->
<!-- 6. LIVE EXEC TERMINAL POPUP (WhatsApp Gateway Daemon :3002)                -->
<!-- ========================================================================= -->
{#if showTerminalModal}
	<div 
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-200 overflow-hidden font-mono">
			<!-- Terminal Window Titlebar -->
			<div class="h-11 px-4 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between shrink-0 select-none">
				<div class="flex items-center gap-3">
					<!-- Terminal Dots -->
					<div class="flex items-center gap-1.5">
						<button 
							type="button" 
							onclick={closeTerminalModal}
							class="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors"
							title="Close Terminal"
						></button>
						<span class="h-3 w-3 rounded-full bg-yellow-500/80"></span>
						<span class="h-3 w-3 rounded-full bg-green-500/80"></span>
					</div>
					<div class="flex items-center gap-2 pl-2 text-xs">
						<CommandLine class="h-4 w-4 text-emerald-400" />
						<span class="font-bold text-zinc-100">wa-gateway daemon terminal</span>
						<span class="text-[10px] text-zinc-500 hidden sm:inline">(Bun • Port 3002)</span>
					</div>
				</div>

				<div class="flex items-center gap-2.5">
					<!-- Live Status Indicator -->
					<div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border {terminalStatus?.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}">
						<span class="h-1.5 w-1.5 rounded-full {terminalStatus?.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
						<span>{terminalStatus?.status === 'CONNECTED' ? 'CONNECTED' : 'AWAITING HOOK'}</span>
						{#if terminalStatus?.user?.name}
							<span class="text-zinc-400 hidden md:inline">({terminalStatus.user.name})</span>
						{/if}
					</div>

					<!-- Daemon Stats -->
					{#if terminalStatus}
						<span class="text-[10px] text-zinc-500 hidden lg:inline">
							RAM: {terminalStatus.memory_rss_mb}MB • Up: {terminalStatus.uptime_seconds}s
						</span>
					{/if}

					<!-- Auto-Scroll Toggle -->
					<button
						type="button"
						onclick={() => terminalAutoScroll = !terminalAutoScroll}
						class="px-2 py-0.5 rounded text-[10px] border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer {terminalAutoScroll ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-zinc-400'}"
						title="Toggle auto-scroll to bottom"
					>
						Auto-Scroll: {terminalAutoScroll ? 'ON' : 'OFF'}
					</button>

					<!-- Close Button -->
					<button
						type="button"
						onclick={closeTerminalModal}
						class="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
					>
						<XMark class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Terminal Quick Action Chips -->
			<div class="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
				<span class="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Quick Exec:</span>
				<button
					type="button"
					onclick={() => execTerminalCommand('ping')}
					class="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-emerald-400 text-[11px] font-semibold border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
				>
					<span>⚡ Ping</span>
				</button>
				<button
					type="button"
					onclick={() => execTerminalCommand('status')}
					class="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-cyan-400 text-[11px] font-semibold border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
				>
					<span>🔍 Status</span>
				</button>
				<button
					type="button"
					onclick={() => execTerminalCommand('test_log')}
					class="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-purple-400 text-[11px] font-semibold border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
				>
					<span>🧪 Trigger Test Log</span>
				</button>
				<button
					type="button"
					onclick={() => execTerminalCommand('qr_status')}
					class="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-400 text-[11px] font-semibold border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
				>
					<span>📱 QR Status</span>
				</button>
				<button
					type="button"
					onclick={() => execTerminalCommand('clear')}
					class="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700/80 text-rose-400 text-[11px] font-semibold border border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-auto"
				>
					<Trash class="h-3 w-3" />
					<span>Clear Buffer</span>
				</button>
			</div>

			<!-- Terminal Body / Log Stream Canvas -->
			<div 
				bind:this={terminalLogsContainer}
				class="flex-1 overflow-y-auto p-4 space-y-1.5 text-[11px] font-mono bg-black/80 select-text"
			>
				<!-- Terminal ASCII Welcome -->
				<div class="text-zinc-500 pb-2 border-b border-zinc-800/60 mb-2 leading-relaxed">
					<div class="text-emerald-400 font-bold">NovaPilot AI • WhatsApp ChatOps Gateway Daemon v1.0</div>
					<div>Socket Engine: Baileys Multi-Device (WebSocket SSL) • Extractor: Regex + Tesseract.js OCR</div>
					<div>Streaming stdout buffer from port 3002 via active poller.</div>
				</div>

				<!-- Command Execution Responses -->
				{#if terminalOutputs.length > 0}
					<div class="space-y-1 pb-2 border-b border-zinc-800/60 mb-2">
						{#each terminalOutputs.slice(0, 3) as item}
							<div class="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-[11px]">
								<div class="flex items-center gap-2 text-zinc-400">
									<span class="text-emerald-400 font-bold">&gt; {item.cmd}</span>
									<span class="text-[9px] text-zinc-600">[{item.time}]</span>
								</div>
								<div class="text-zinc-200 mt-0.5 whitespace-pre-wrap">{item.out}</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Real-Time Log Entries -->
				{#if terminalLogs.length === 0}
					<div class="p-6 text-center text-zinc-600">
						Menunggu event atau pesan masuk dari daemon WhatsApp...
					</div>
				{:else}
					{#each terminalLogs as log (log.id)}
						<div class="flex items-start gap-2 hover:bg-zinc-900/40 px-1 py-0.5 rounded transition-colors leading-relaxed font-mono">
							<span class="text-[10px] text-zinc-600 shrink-0 select-none">[{log.time}]</span>
							<span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 {log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' : log.level === 'EXEC' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}">
								{log.level}
							</span>
							<span class="break-all whitespace-pre-wrap {log.level === 'ERROR' ? 'text-rose-300' : log.level === 'WARN' ? 'text-amber-300' : log.level === 'EXEC' ? 'text-emerald-300 font-bold' : 'text-zinc-300'}">
								{log.text}
							</span>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Terminal Interactive Exec Command Input Bar -->
			<div class="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-3 shrink-0">
				<span class="text-emerald-400 font-bold text-xs select-none flex items-center gap-1 shrink-0">
					<span>novapilot@wa-gateway:~$</span>
				</span>
				<input
					type="text"
					bind:value={terminalCommand}
					onkeydown={(e) => {
						if (e.key === "Enter" && !terminalIsExecuting) {
							execTerminalCommand();
						}
					}}
					placeholder="Ketik perintah exec (misal: ping, status, test_log, qr_status, clear, help)..."
					class="flex-1 bg-transparent border-none text-xs text-emerald-300 placeholder-zinc-600 focus:outline-none font-mono"
				/>
				<button
					type="button"
					onclick={() => execTerminalCommand()}
					disabled={terminalIsExecuting || !terminalCommand.trim()}
					class="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
				>
					<Play class="h-3.5 w-3.5" />
					<span>{terminalIsExecuting ? 'Running...' : 'Run Exec'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

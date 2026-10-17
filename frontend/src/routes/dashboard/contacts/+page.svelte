<script lang="ts">
	import { onMount } from "svelte";
	import { 
		UserGroup, 
		User,
		ShieldCheck, 
		CheckCircle, 
		XCircle,
		Bolt, 
		ArrowPath, 
		Check, 
		Signal,
		BuildingOffice2,
		Envelope,
		Radio,
		CpuChip,
		ExclamationTriangle,
		ChartBar,
		CommandLine,
		ClipboardDocument,
		UserPlus,
		Trash,
		XMark,
		Plus,
		Phone,
		MagnifyingGlass,
		InformationCircle,
		QuestionMarkCircle,
		ChatBubbleLeftRight,
		PaperAirplane
	} from "svelte-heros-v2";
	import { cockpit, type ChatPlatform } from "$lib/cockpit.svelte";
	import { i18n } from "$lib/i18n.svelte";
	import DataTable from "$lib/components/DataTable.svelte";
	import type { ColumnDef } from "$lib/types/table";

	interface GroupMember {
		id: string;
		name: string;
		phone: string;
		role: "SUPERADMIN" | "ADMIN" | "MEMBER" | "ON_CALL";
		isWhitelisted: boolean;
		lastActive: string;
	}

	interface ContactChannel {
		id: string;
		type: "GROUP" | "INDIVIDUAL";
		name: string;
		branch: string;
		platform: "whatsapp" | "telegram" | "discord" | "slack";
		jidOrChatId: string;
		status: "ACTIVE" | "STANDBY" | "MUTED" | "RATE_LIMITED";
		isWhitelisted: boolean;
		contactPerson: string;
		contactPhone: string;
		totalMessages: number;
		actionableTickets: number;
		latencyMs: number;
		lastActivity: string;
		members?: GroupMember[];
	}

	let testPingId = $state<string | null>(null);
	let copiedJid = $state<string | null>(null);

	onMount(async () => {
		await loadChannels();
	});

	const realIntegratedChannels: ContactChannel[] = [
		{
			id: "ch_wa_host_live",
			type: "INDIVIDUAL",
			name: "rifkyakhmadfer (WhatsApp Gateway Host)",
			branch: "Gateway Baileys (:3002)",
			platform: "whatsapp",
			jidOrChatId: "6289518326596@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "rifkyakhmadfer",
			contactPhone: "+62 895-1832-6596",
			totalMessages: 72,
			actionableTickets: 8,
			latencyMs: 12,
			lastActivity: "Terhubung Live"
		},
		{
			id: "ch_tg_bot_live",
			type: "GROUP",
			name: "NovaPilot AI Telegram Ingress (@novapilot_ai_ky_bot)",
			branch: "Telegram Bot API (Verified)",
			platform: "telegram",
			jidOrChatId: "@novapilot_ai_ky_bot",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "novapilot_ai (ID: 8625472390)",
			contactPhone: "@novapilot_ai_ky_bot",
			totalMessages: 35,
			actionableTickets: 5,
			latencyMs: 38,
			lastActivity: "Aktif Siaga",
			members: [
				{ id: "mem_tg_1", name: "Rifky Akhmad (Owner)", phone: "@rifkyakhmad", role: "SUPERADMIN", isWhitelisted: true, lastActive: "Baru saja" },
				{ id: "mem_tg_2", name: "novapilot_ai (@novapilot_ai_ky_bot)", phone: "@novapilot_ai_ky_bot", role: "ON_CALL", isWhitelisted: true, lastActive: "Aktif siaga" }
			]
		},
		{
			id: "ch_wa_grp_real_1",
			type: "GROUP",
			name: "Audi Retail dan Audit JO",
			branch: "Jawa Timur (Retail Audit Hub)",
			platform: "whatsapp",
			jidOrChatId: "120363390763723446@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Admin Pusat HBS / Audi Retail",
			contactPhone: "120363390763723446",
			totalMessages: 89,
			actionableTickets: 14,
			latencyMs: 65,
			lastActivity: "12 mnt yang lalu",
			members: [
				{ id: "mem_ar_1", name: "Audi Retail Lead", phone: "128814759850179", role: "ADMIN", isWhitelisted: true, lastActive: "12 mnt yang lalu" },
				{ id: "mem_ar_2", name: "Admin Pusat HBS", phone: "-", role: "ON_CALL", isWhitelisted: true, lastActive: "15 mnt yang lalu" },
				{ id: "mem_ar_3", name: "William", phone: "-", role: "MEMBER", isWhitelisted: true, lastActive: "25 mnt yang lalu" }
			]
		},
		{
			id: "ch_wa_grp_real_2",
			type: "GROUP",
			name: "Jesslyn CH & Operasional Cabang",
			branch: "Jawa Timur (Operasional)",
			platform: "whatsapp",
			jidOrChatId: "120363421057361734@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Jesslyn CH",
			contactPhone: "120363421057361734",
			totalMessages: 64,
			actionableTickets: 9,
			latencyMs: 72,
			lastActivity: "25 mnt yang lalu"
		},
		{
			id: "ch_wa_grp_real_3",
			type: "GROUP",
			name: "Surat Jalan Mutasi & Verifikasi",
			branch: "Gudang Pusat Distribusi",
			platform: "whatsapp",
			jidOrChatId: "120363401700594101@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "PIC Mutasi Surat Jalan",
			contactPhone: "120363401700594101",
			totalMessages: 51,
			actionableTickets: 12,
			latencyMs: 80,
			lastActivity: "42 mnt yang lalu"
		}
	];

	async function loadChannels() {
		try {
			const res = await fetch("/api/channels");
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data) && data.length > 0) {
					const merged = [...realIntegratedChannels];
					for (const ch of data) {
						if (!merged.some(m => m.jidOrChatId === ch.jidOrChatId || m.id === ch.id)) {
							merged.push(ch);
						}
					}
					channels = merged;
					return;
				}
			}
			channels = [...realIntegratedChannels];
		} catch (e) {
			console.error("Failed to load channels from backend:", e);
			channels = [...realIntegratedChannels];
		}
	}

	// Whitelisted regional branch contacts (both Groups and Individuals)
	let channels = $state<ContactChannel[]>([
		{
			id: "ch_wa_grp_1",
			type: "GROUP",
			name: "Ops Cabang Surabaya & Gudang Timur",
			branch: "Jawa Timur (Surabaya Hub)",
			platform: "whatsapp",
			jidOrChatId: "120363028192837492@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Bambang Santoso (Kepala Gudang)",
			contactPhone: "+62 812-3456-7890",
			totalMessages: 284,
			actionableTickets: 32,
			latencyMs: 78,
			lastActivity: "4 menit yang lalu",
			members: [
				{ id: "mem_sby_1", name: "Bambang Santoso", phone: "+62 812-3456-7890", role: "ADMIN", isWhitelisted: true, lastActive: "4 mnt yang lalu" },
				{ id: "mem_sby_2", name: "Rifky Firdaus (Regional Tech Lead)", phone: "+62 812-9876-1122", role: "ON_CALL", isWhitelisted: true, lastActive: "12 mnt yang lalu" },
				{ id: "mem_sby_3", name: "Siti Aminah (Logistik Hub)", phone: "+62 813-9876-5432", role: "MEMBER", isWhitelisted: true, lastActive: "35 mnt yang lalu" },
				{ id: "mem_sby_4", name: "Dedi Kurniawan (Admin Gudang)", phone: "+62 856-4321-8765", role: "MEMBER", isWhitelisted: true, lastActive: "2 jam yang lalu" },
				{ id: "mem_sby_5", name: "Eko Prasetyo (Driver Armada)", phone: "+62 878-1122-3344", role: "MEMBER", isWhitelisted: false, lastActive: "1 hari yang lalu" },
				{ id: "mem_sby_6", name: "Maya Indah (Staff Timbangan)", phone: "+62 821-5566-7788", role: "MEMBER", isWhitelisted: true, lastActive: "5 jam yang lalu" }
			]
		},
		{
			id: "ch_wa_ind_1",
			type: "INDIVIDUAL",
			name: "Rifky Firdaus (On-Call Regional Lead)",
			branch: "Jawa Timur (Surabaya)",
			platform: "whatsapp",
			jidOrChatId: "6281234567890@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Rifky Firdaus",
			contactPhone: "+62 812-3456-7890",
			totalMessages: 142,
			actionableTickets: 18,
			latencyMs: 65,
			lastActivity: "12 menit yang lalu"
		},
		{
			id: "ch_wa_grp_2",
			type: "GROUP",
			name: "Logistik Medan Priority & Distribusi",
			branch: "Sumatera Utara (Medan)",
			platform: "whatsapp",
			jidOrChatId: "120363098172635412@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Hendra Wijaya (Supervisor Logistik)",
			contactPhone: "+62 813-8821-4910",
			totalMessages: 198,
			actionableTickets: 24,
			latencyMs: 112,
			lastActivity: "25 menit yang lalu",
			members: [
				{ id: "mem_mdn_1", name: "Hendra Wijaya", phone: "+62 813-8821-4910", role: "ADMIN", isWhitelisted: true, lastActive: "25 mnt yang lalu" },
				{ id: "mem_mdn_2", name: "Surya Dharma (Dispatch On-Call)", phone: "+62 812-7766-5544", role: "ON_CALL", isWhitelisted: true, lastActive: "1 jam yang lalu" },
				{ id: "mem_mdn_3", name: "Rudi Tabuti (Checker Belawan)", phone: "+62 852-3344-5566", role: "MEMBER", isWhitelisted: true, lastActive: "4 jam yang lalu" },
				{ id: "mem_mdn_4", name: "Linda Siregar (Admin Surat Jalan)", phone: "+62 821-9988-7711", role: "MEMBER", isWhitelisted: false, lastActive: "1 hari yang lalu" }
			]
		},
		{
			id: "ch_wa_ind_2",
			type: "INDIVIDUAL",
			name: "Dewi Lestari (Lead AR/AP Finance)",
			branch: "DKI Jakarta (Head Office)",
			platform: "whatsapp",
			jidOrChatId: "6281192837411@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Dewi Lestari",
			contactPhone: "+62 811-9283-7411",
			totalMessages: 412,
			actionableTickets: 56,
			latencyMs: 72,
			lastActivity: "2 menit yang lalu"
		},
		{
			id: "ch_wa_grp_3",
			type: "GROUP",
			name: "Finansial Kantor Pusat Jakarta",
			branch: "DKI Jakarta (Head Office)",
			platform: "whatsapp",
			jidOrChatId: "120363012938475610@g.us",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Siti Rahmawati (Manajer Keuangan)",
			contactPhone: "+62 812-9900-1122",
			totalMessages: 540,
			actionableTickets: 72,
			latencyMs: 82,
			lastActivity: "8 menit yang lalu",
			members: [
				{ id: "mem_jkt_1", name: "Siti Rahmawati", phone: "+62 812-9900-1122", role: "SUPERADMIN", isWhitelisted: true, lastActive: "8 mnt yang lalu" },
				{ id: "mem_jkt_2", name: "Dewi Lestari (AR/AP Lead)", phone: "+62 811-9283-7411", role: "ON_CALL", isWhitelisted: true, lastActive: "2 mnt yang lalu" },
				{ id: "mem_jkt_3", name: "Kevin Gunawan (Tax Compliance)", phone: "+62 812-4433-2211", role: "ADMIN", isWhitelisted: true, lastActive: "15 mnt yang lalu" },
				{ id: "mem_jkt_4", name: "Anisa Tri (Kasir Utama)", phone: "+62 813-7766-1122", role: "MEMBER", isWhitelisted: true, lastActive: "1 jam yang lalu" },
				{ id: "mem_jkt_5", name: "Farhan Malik (Auditor Internal)", phone: "+62 857-8899-0011", role: "MEMBER", isWhitelisted: true, lastActive: "3 jam yang lalu" }
			]
		},
		{
			id: "ch_wa_grp_4",
			type: "GROUP",
			name: "Plant Operations Cikarang II",
			branch: "Jawa Barat (Cikarang Industrial)",
			platform: "whatsapp",
			jidOrChatId: "120363077889900112@g.us",
			status: "STANDBY",
			isWhitelisted: true,
			contactPerson: "Agus Pratama (Plant Manager)",
			contactPhone: "+62 821-7788-9900",
			totalMessages: 96,
			actionableTickets: 11,
			latencyMs: 95,
			lastActivity: "1 jam yang lalu",
			members: [
				{ id: "mem_ckr_1", name: "Agus Pratama", phone: "+62 821-7788-9900", role: "ADMIN", isWhitelisted: true, lastActive: "1 jam yang lalu" },
				{ id: "mem_ckr_2", name: "Wahyu Hidayat (Maintenance On-Call)", phone: "+62 812-3344-9988", role: "ON_CALL", isWhitelisted: true, lastActive: "2 jam yang lalu" },
				{ id: "mem_ckr_3", name: "Dani Ramadhan (QC Line 1)", phone: "+62 856-1122-3344", role: "MEMBER", isWhitelisted: true, lastActive: "5 jam yang lalu" },
				{ id: "mem_ckr_4", name: "Slamet Riyadi (Shift Supervisor)", phone: "+62 878-9900-1122", role: "MEMBER", isWhitelisted: false, lastActive: "2 hari yang lalu" }
			]
		},
		{
			id: "ch_wa_ind_3",
			type: "INDIVIDUAL",
			name: "Joko Anwar (Warehouse Dispatcher Semarang)",
			branch: "Jawa Tengah (Semarang)",
			platform: "whatsapp",
			jidOrChatId: "6285671239870@s.whatsapp.net",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Joko Anwar",
			contactPhone: "+62 856-7123-9870",
			totalMessages: 88,
			actionableTickets: 9,
			latencyMs: 90,
			lastActivity: "35 menit yang lalu"
		},
		{
			id: "ch_tg_grp_1",
			type: "GROUP",
			name: "Telegram On-Call Incident Alerts",
			branch: "Nasional (IT Infrastructure)",
			platform: "telegram",
			jidOrChatId: "-100192837482",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "Rudi Hartono (SRE Lead)",
			contactPhone: "@rudi_oncall",
			totalMessages: 165,
			actionableTickets: 21,
			latencyMs: 145,
			lastActivity: "18 menit yang lalu",
			members: [
				{ id: "mem_tg_1", name: "Rudi Hartono (SRE Lead)", phone: "@rudi_oncall", role: "ADMIN", isWhitelisted: true, lastActive: "18 mnt yang lalu" },
				{ id: "mem_tg_2", name: "NovaBot Incident Forwarder", phone: "@novapilot_bot", role: "ON_CALL", isWhitelisted: true, lastActive: "Aktif terus" },
				{ id: "mem_tg_3", name: "Ari Wibowo (DevOps)", phone: "@ari_wibowo", role: "MEMBER", isWhitelisted: true, lastActive: "4 jam yang lalu" }
			]
		},
		{
			id: "ch_dc_grp_1",
			type: "GROUP",
			name: "Discord #warehouse-ops Guild",
			branch: "Regional Plant IT Automation",
			platform: "discord",
			jidOrChatId: "channel_119283749281920195",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "DevOps Ops Bot",
			contactPhone: "ops-bot#1049",
			totalMessages: 130,
			actionableTickets: 14,
			latencyMs: 120,
			lastActivity: "40 menit yang lalu",
			members: [
				{ id: "mem_dc_1", name: "DevOps Ops Bot", phone: "ops-bot#1049", role: "ADMIN", isWhitelisted: true, lastActive: "40 mnt yang lalu" },
				{ id: "mem_dc_2", name: "Rifky Firdaus (Lead)", phone: "rifky#0001", role: "ON_CALL", isWhitelisted: true, lastActive: "12 mnt yang lalu" },
				{ id: "mem_dc_3", name: "Warehouse Webhook Pipe", phone: "pipe-bot#9999", role: "MEMBER", isWhitelisted: true, lastActive: "1 jam yang lalu" }
			]
		},
		{
			id: "ch_sl_grp_1",
			type: "GROUP",
			name: "Slack #it-helpdesk Enterprise",
			branch: "Kantor Pusat Jakarta",
			platform: "slack",
			jidOrChatId: "C0819283ABC",
			status: "ACTIVE",
			isWhitelisted: true,
			contactPerson: "IT Support Escalation Bot",
			contactPhone: "U06ABC1234",
			totalMessages: 220,
			actionableTickets: 29,
			latencyMs: 110,
			lastActivity: "15 menit yang lalu",
			members: [
				{ id: "mem_sl_1", name: "IT Support Escalation Bot", phone: "U06ABC1234", role: "ADMIN", isWhitelisted: true, lastActive: "15 mnt yang lalu" },
				{ id: "mem_sl_2", name: "Dewi Lestari (Finance)", phone: "U07XYZ5678", role: "ON_CALL", isWhitelisted: true, lastActive: "2 mnt yang lalu" },
				{ id: "mem_sl_3", name: "Budi Santoso (Helpdesk)", phone: "U08QWE9012", role: "MEMBER", isWhitelisted: true, lastActive: "3 jam yang lalu" }
			]
		},
		{
			id: "ch_wa_grp_5",
			type: "GROUP",
			name: "Ekspedisi Cargo Makassar Hub",
			branch: "Sulawesi Selatan (Makassar)",
			platform: "whatsapp",
			jidOrChatId: "120363066554433221@g.us",
			status: "MUTED",
			isWhitelisted: false,
			contactPerson: "Andi Mallarangeng",
			contactPhone: "+62 813-4455-6677",
			totalMessages: 45,
			actionableTickets: 2,
			latencyMs: 230,
			lastActivity: "4 jam yang lalu",
			members: [
				{ id: "mem_mks_1", name: "Andi Mallarangeng", phone: "+62 813-4455-6677", role: "ADMIN", isWhitelisted: false, lastActive: "4 jam yang lalu" },
				{ id: "mem_mks_2", name: "Daeng Rusli (Gudang Pelabuhan)", phone: "+62 812-9988-1122", role: "MEMBER", isWhitelisted: false, lastActive: "1 hari yang lalu" },
				{ id: "mem_mks_3", name: "Nur Hasanah (Admin Manifest)", phone: "+62 852-7788-9900", role: "MEMBER", isWhitelisted: false, lastActive: "3 hari yang lalu" }
			]
		},
		{
			id: "ch_wa_ind_4",
			type: "INDIVIDUAL",
			name: "Vendor Support Oracle Database",
			branch: "Third-Party SLA",
			platform: "whatsapp",
			jidOrChatId: "6289988776655@s.whatsapp.net",
			status: "STANDBY",
			isWhitelisted: true,
			contactPerson: "Senior DBA Support",
			contactPhone: "+62 899-8877-6655",
			totalMessages: 19,
			actionableTickets: 4,
			latencyMs: 160,
			lastActivity: "2 hari yang lalu"
		}
	]);

	// Group Members Modal State
	let selectedGroupForMembers = $state<ContactChannel | null>(null);
	let memberSearchQuery = $state("");
	let copiedMemberPhone = $state<string | null>(null);

	function openGroupMembers(channel: ContactChannel) {
		selectedGroupForMembers = channel;
		memberSearchQuery = "";
	}

	function closeGroupMembers() {
		selectedGroupForMembers = null;
		memberSearchQuery = "";
	}

	function copyMemberPhone(phone: string) {
		navigator.clipboard.writeText(phone);
		copiedMemberPhone = phone;
		setTimeout(() => { copiedMemberPhone = null; }, 1800);
	}

	async function toggleMemberWhitelist(memberId: string) {
		if (!selectedGroupForMembers || !selectedGroupForMembers.members) return;
		const member = selectedGroupForMembers.members.find(m => m.id === memberId);
		if (member) {
			member.isWhitelisted = !member.isWhitelisted;
			try {
				await fetch("/api/channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(selectedGroupForMembers)
				});
			} catch (e) {
				console.error("Failed to persist member whitelist toggle:", e);
			}
		}
	}

	// Add new member to group
	let isAddingMember = $state(false);
	let newMemberName = $state("");
	let newMemberPhone = $state("");
	let newMemberRole = $state<"ADMIN" | "MEMBER" | "ON_CALL" | "SUPERADMIN">("MEMBER");
	let newMemberError = $state<string | null>(null);

	async function addMemberToGroup() {
		if (!selectedGroupForMembers) return;
		if (!newMemberName.trim()) {
			newMemberError = "Nama anggota wajib diisi.";
			return;
		}
		if (!newMemberPhone.trim()) {
			newMemberError = "Nomor kontak / ID wajib diisi.";
			return;
		}
		newMemberError = null;

		const createdMember: GroupMember = {
			id: `mem_${Date.now()}`,
			name: newMemberName.trim(),
			phone: newMemberPhone.trim(),
			role: newMemberRole,
			isWhitelisted: true,
			lastActive: "Baru saja ditambahkan"
		};

		if (!selectedGroupForMembers.members) {
			selectedGroupForMembers.members = [];
		}
		selectedGroupForMembers.members = [...selectedGroupForMembers.members, createdMember];

		// Persist to backend
		try {
			await fetch("/api/channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(selectedGroupForMembers)
			});
		} catch (e) {
			console.error("Failed to persist new member to backend:", e);
		}

		newMemberName = "";
		newMemberPhone = "";
		newMemberRole = "MEMBER";
		isAddingMember = false;
	}

	async function removeMemberFromGroup(memberId: string) {
		if (!selectedGroupForMembers || !selectedGroupForMembers.members) return;
		selectedGroupForMembers.members = selectedGroupForMembers.members.filter(m => m.id !== memberId);
		try {
			await fetch("/api/channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(selectedGroupForMembers)
			});
		} catch (e) {
			console.error("Failed to persist member removal:", e);
		}
	}

	// =========================================================================
	// OUTBOUND WHATSAPP DISPATCH MODAL STATE
	// =========================================================================
	let chatTargetChannel = $state<ContactChannel | null>(null);
	let chatMessage = $state("");
	let isSendingChat = $state(false);
	let chatFeedback = $state<{ type: "success" | "error"; text: string } | null>(null);

	function openChatModal(channel: ContactChannel) {
		chatTargetChannel = channel;
		chatMessage = `Halo ${channel.contactPerson || channel.name}, ini pesan verifikasi dari NovaPilot AI Gatekeeper.`;
		chatFeedback = null;
	}

	function closeChatModal() {
		chatTargetChannel = null;
		chatMessage = "";
		chatFeedback = null;
	}

	async function sendOutboundChat() {
		if (!chatTargetChannel || !chatMessage.trim()) return;
		isSendingChat = true;
		chatFeedback = null;

		try {
			let phone = chatTargetChannel.contactPhone;
			if (!phone || phone === "-" || phone.includes("@")) {
				phone = chatTargetChannel.jidOrChatId.split("@")[0];
			}
			phone = phone.replace(/[^0-9]/g, "");

			const res = await fetch("/api/gateway/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					phone: phone,
					message: chatMessage.trim()
				})
			});

			const data = await res.json();
			if (res.ok && data.ok) {
				chatFeedback = {
					type: "success",
					text: `Pesan terkirim via WhatsApp Gateway (${data.delivery || "DELIVERED"}) ke ${data.phone || phone}!`
				};
				chatTargetChannel.totalMessages++;
				chatTargetChannel.lastActivity = "Baru saja";
				cockpit.recordPlatformEvent("whatsapp");
			} else {
				chatFeedback = {
					type: "error",
					text: data.error || "Gagal mengirim pesan melalui gateway."
				};
			}
		} catch (err: any) {
			chatFeedback = {
				type: "error",
				text: `Koneksi gagal: ${err.message}`
			};
		} finally {
			isSendingChat = false;
		}
	}

	const filteredMembers = $derived(
		!selectedGroupForMembers || !selectedGroupForMembers.members 
			? [] 
			: selectedGroupForMembers.members.filter(m => {
				const q = memberSearchQuery.trim().toLowerCase();
				if (!q) return true;
				return m.name.toLowerCase().includes(q) ||
					m.phone.toLowerCase().includes(q) ||
					m.role.toLowerCase().includes(q);
			})
	);

	// Interactive whitelist toggle
	async function toggleWhitelist(channelId: string) {
		const target = channels.find(c => c.id === channelId);
		if (target) {
			target.isWhitelisted = !target.isWhitelisted;
			target.status = target.isWhitelisted ? "ACTIVE" : "MUTED";
			try {
				await fetch(`/api/channels/${channelId}/toggle-whitelist`, { method: "PATCH" });
			} catch (e) {
				console.error("Failed to toggle whitelist on backend:", e);
			}
		}
	}

	// Copy JID to clipboard
	function copyJid(jid: string) {
		navigator.clipboard.writeText(jid);
		copiedJid = jid;
		setTimeout(() => { copiedJid = null; }, 1800);
	}

	// Ping Simulation to Backend Inbound Webhook
	async function pingChannel(c: ContactChannel) {
		testPingId = c.id;
		try {
			await fetch("/api/inbound-messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					platform: c.platform,
					sender_id: c.jidOrChatId,
					sender_name: `${c.name} (${c.contactPerson})`,
					raw_message: `[Simulasi Probing ${c.type}] Dari ${c.branch}: Tolong cek revisi faktur INV/2026/001 customer PT Sumber Makmur.`,
					media_type: "text",
					classification: "ACTIONABLE",
					extracted_doc: "INV/2026/001",
					extracted_intent: "UPDATE_CUSTOMER_NAME",
					extracted_target: "PT Sumber Makmur Berkah Abadi"
				})
			});
			c.totalMessages++;
			c.actionableTickets++;
			c.lastActivity = "Baru saja";
			cockpit.recordPlatformEvent(c.platform);
		} catch (e) {
			console.error("Failed to ping channel:", e);
		} finally {
			setTimeout(() => { testPingId = null; }, 1200);
		}
	}

	// =========================================================================
	// ADD & DELETE CONTACT CHANNELS LOGIC & MODAL STATE
	// =========================================================================
	let isAddModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let channelToDelete = $state<ContactChannel | null>(null);

	let newContact = $state<{
		type: "GROUP" | "INDIVIDUAL";
		name: string;
		branch: string;
		platform: "whatsapp" | "telegram" | "discord" | "slack";
		jidOrChatId: string;
		contactPerson: string;
		contactPhone: string;
		isWhitelisted: boolean;
	}>({
		type: "GROUP",
		name: "",
		branch: "",
		platform: "whatsapp",
		jidOrChatId: "",
		contactPerson: "",
		contactPhone: "",
		isWhitelisted: true
	});

	let formError = $state<string | null>(null);
	let showJidGuide = $state(false);

	const regionalBranchPresets = [
		"Jawa Timur (Surabaya Hub)",
		"Sumatera Utara (Medan Logistics Hub)",
		"DKI Jakarta (Head Office & Finansial)",
		"Jawa Tengah (Semarang Distribution)",
		"Jawa Barat (Cikarang Industrial Plant)",
		"Sulawesi Selatan (Makassar Central Hub)",
		"Nasional (IT Infrastructure & Ops)"
	];

	function fillJidFromPhone() {
		if (!newContact.contactPhone.trim()) return;
		let clean = newContact.contactPhone.replace(/[^0-9]/g, "");
		if (clean.startsWith("0")) {
			clean = "62" + clean.substring(1);
		}
		newContact.jidOrChatId = `${clean}@s.whatsapp.net`;
	}

	function selectBranchPreset(branch: string) {
		newContact.branch = branch;
	}

	function openAddModal() {
		newContact = {
			type: "GROUP",
			name: "",
			branch: "",
			platform: "whatsapp",
			jidOrChatId: "",
			contactPerson: "",
			contactPhone: "",
			isWhitelisted: true
		};
		showJidGuide = false;
		formError = null;
		isAddModalOpen = true;
	}

	async function saveContact() {
		if (!newContact.name.trim()) {
			formError = "Nama saluran atau grup wajib diisi.";
			return;
		}
		if (!newContact.jidOrChatId.trim()) {
			formError = "JID atau Chat ID wajib diisi untuk routing masuk.";
			return;
		}
		if (!newContact.branch.trim()) {
			formError = "Cabang atau unit kerja wajib diisi.";
			return;
		}

		let finalJid = newContact.jidOrChatId.trim();
		if (newContact.platform === "whatsapp") {
			if (newContact.type === "GROUP" && !finalJid.includes("@")) {
				finalJid = `${finalJid}@g.us`;
			} else if (newContact.type === "INDIVIDUAL" && !finalJid.includes("@")) {
				finalJid = `${finalJid.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
			}
		}

		const createdChannel: ContactChannel = {
			id: `ch_${newContact.platform}_${Date.now()}`,
			type: newContact.type,
			name: newContact.name.trim(),
			branch: newContact.branch.trim(),
			platform: newContact.platform,
			jidOrChatId: finalJid,
			status: "ACTIVE",
			isWhitelisted: newContact.isWhitelisted,
			contactPerson: newContact.contactPerson.trim() || "-",
			contactPhone: newContact.contactPhone.trim() || "-",
			totalMessages: 0,
			actionableTickets: 0,
			latencyMs: Math.floor(Math.random() * 40) + 60,
			lastActivity: "Baru saja",
			members: newContact.type === "GROUP" ? [
				{
					id: `mem_${Date.now()}_1`,
					name: newContact.contactPerson.trim() || `${newContact.name.trim()} (Admin)`,
					phone: newContact.contactPhone.trim() || "+62 812-0000-0000",
					role: "ADMIN",
					isWhitelisted: newContact.isWhitelisted,
					lastActive: "Baru saja"
				}
			] : undefined
		};

		try {
			const res = await fetch("/api/channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(createdChannel)
			});
			if (res.ok) {
				const saved = await res.json();
				channels = [saved, ...channels.filter(c => c.id !== saved.id)];
			} else {
				channels = [createdChannel, ...channels];
			}
		} catch (e) {
			console.error("Failed to persist channel to backend:", e);
			channels = [createdChannel, ...channels];
		}
		isAddModalOpen = false;
	}

	function promptDelete(channel: ContactChannel) {
		channelToDelete = channel;
		isDeleteModalOpen = true;
	}

	async function confirmDelete() {
		if (channelToDelete) {
			const id = channelToDelete.id;
			channels = channels.filter(c => c.id !== id);
			try {
				await fetch(`/api/channels/${id}`, { method: "DELETE" });
			} catch (e) {
				console.error("Failed to delete channel from backend:", e);
			}
			channelToDelete = null;
			isDeleteModalOpen = false;
		}
	}

	// TanStack Table Column Definitions
	const tableColumns = $derived<ColumnDef<ContactChannel>[]>([
		{
			id: "name",
			header: i18n.t.contacts.col_channel,
			sortable: true,
			accessorKey: "name",
			exportValue: (row) => `${row.name} (${row.type}) - ${row.branch}`
		},
		{
			id: "platform",
			header: i18n.t.contacts.col_platform,
			sortable: true,
			align: "center",
			accessorKey: "platform",
			exportValue: (row) => row.platform.toUpperCase()
		},
		{
			id: "jidOrChatId",
			header: i18n.t.contacts.col_jid,
			sortable: true,
			accessorKey: "jidOrChatId",
			exportValue: (row) => row.jidOrChatId
		},
		{
			id: "status",
			header: i18n.t.contacts.col_probe,
			sortable: true,
			align: "center",
			accessorKey: "status",
			exportValue: (row) => `${row.status} (${row.latencyMs}ms)`
		},
		{
			id: "telemetry",
			header: i18n.t.contacts.col_telemetry,
			sortable: true,
			accessorKey: "totalMessages",
			exportValue: (row) => `${row.totalMessages} chat, ${row.actionableTickets} tiket`
		},
		{
			id: "whitelist",
			header: i18n.t.contacts.col_whitelist,
			sortable: true,
			align: "center",
			accessorKey: "isWhitelisted",
			exportValue: (row) => row.isWhitelisted ? "WHITELISTED" : "MUTED"
		},
		{
			id: "actions",
			header: i18n.t.contacts.col_actions,
			sortable: false,
			align: "right"
		}
	]);

	// Filter options for dropdown
	const filterOptions = $derived([
		{ label: i18n.t.contacts.filter_group, value: "GROUP" },
		{ label: i18n.t.contacts.filter_individual, value: "INDIVIDUAL" }
	]);

	// Telemetry Calculations for Analytics Header
	const totalChannelsCount = $derived(channels.length);
	const totalGroupsCount = $derived(channels.filter(c => c.type === "GROUP").length);
	const totalIndividualsCount = $derived(channels.filter(c => c.type === "INDIVIDUAL").length);
	const whitelistedCount = $derived(channels.filter(c => c.isWhitelisted).length);
	const totalIngestedChats = $derived(channels.reduce((sum, c) => sum + c.totalMessages, 0));
	const totalActionableTickets = $derived(channels.reduce((sum, c) => sum + c.actionableTickets, 0));
	const avgLatency = $derived(
		Math.round(channels.reduce((sum, c) => sum + c.latencyMs, 0) / (channels.length || 1))
	);
</script>

<svelte:head>
	<title>Omnichannel Group & Contact Directory • NovaPilot AI</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">

	<!-- ========================================================================= -->
	<!-- 1. PAGE HEADER                                                            -->
	<!-- ========================================================================= -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
		<div class="space-y-1">
			<div class="flex items-center gap-2.5 flex-wrap">
				<div class="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shadow-xs">
					<UserGroup class="h-5 w-5" />
				</div>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
						{i18n.t.contacts.title}
						<span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							{i18n.t.contacts.monitoring_active}
						</span>
					</h1>
					<p class="text-xs text-muted-foreground mt-0.5">
						{i18n.t.contacts.subtitle}
					</p>
				</div>
			</div>
		</div>

		<!-- Action Buttons: Add Contact & E2E Flow Link -->
		<div class="flex items-center gap-2.5 font-mono text-xs flex-wrap">
			<button
				type="button"
				onclick={openAddModal}
				class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition-all cursor-pointer"
			>
				<UserPlus class="h-4 w-4" />
				<span>{i18n.t.contacts.add_contact}</span>
			</button>

			<a
				href="/flow"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
			>
				<CommandLine class="h-3.5 w-3.5 text-primary" />
				<span>{i18n.t.contacts.e2e_flow}</span>
			</a>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- ANIMATED SVG DIRECTORY TOPOLOGY (LIVE CHANNEL INGRESS & GUARDRAIL ROUTER) -->
	<!-- ========================================================================= -->
	<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 overflow-hidden relative pro-mode-only">
		<!-- Toolbar / Title -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
			<div class="flex items-center gap-2.5">
				<div class="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
					<Radio class="h-4.5 w-4.5" />
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h3 class="text-sm font-bold text-foreground">{i18n.t.contacts.topology_title}</h3>
						<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
							LIVE TOPOLOGY
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">{i18n.t.contacts.topology_subtitle}</p>
				</div>
			</div>

			<div class="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
				<span class="flex items-center gap-1.5">
					<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
					<strong class="text-foreground">{i18n.t.contacts.inbound_stream}</strong> {channels.filter(c => c.isWhitelisted).length} {i18n.t.contacts.verified_channels}
				</span>
			</div>
		</div>

		<!-- Animated SVG Canvas -->
		<div class="relative w-full rounded-xl bg-secondary/25 dark:bg-black/60 border border-border/80 overflow-hidden select-none h-[220px]">
			<svg viewBox="0 0 1080 220" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="ingressGradWA" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#059669" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="ingressGradTG" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#0369a1" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="guardrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#6d28d9" stop-opacity="0.9" />
					</linearGradient>
					<linearGradient id="wireGradIn" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#10b981" />
						<stop offset="100%" stop-color="#8b5cf6" />
					</linearGradient>
					<linearGradient id="wireGradOut" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="#8b5cf6" />
						<stop offset="100%" stop-color="#06b6d4" />
					</linearGradient>
					<filter id="contactGlow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="3.5" result="blur" />
						<feComposite in="SourceGraphic" in2="blur" operator="over" />
					</filter>
					<style>
						@keyframes packetFlow {
							from { stroke-dashoffset: 0; }
							to { stroke-dashoffset: -20; }
						}
						@keyframes laserScan {
							0%, 100% { transform: translateY(0px); opacity: 0.2; }
							50% { transform: translateY(60px); opacity: 0.8; }
						}
						.ingress-wire {
							stroke-dasharray: 5 4;
							animation: packetFlow 0.8s linear infinite;
						}
						.guardrail-laser {
							animation: laserScan 2s ease-in-out infinite;
						}
					</style>
				</defs>

				<!-- 1. LEFT INGRESS GATEWAY NODES -->
				<!-- WhatsApp Ingress Node -->
				<g transform="translate(30, 25)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-emerald-500/60 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#10b981" fill-opacity="0.15" />
					<circle cx="16" cy="13" r="3.5" fill="#10b981" />
					<text x="26" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#059669">WhatsApp Gateway</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="currentColor" class="text-foreground">Port :3002 Baileys</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalGroupsCount} Grup · {totalIndividualsCount} Hotline</text>
				</g>

				<!-- Telegram / Multi-Bot Ingress Node -->
				<g transform="translate(30, 125)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-sky-500/60 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#0284c7" fill-opacity="0.15" />
					<circle cx="16" cy="13" r="3.5" fill="#0284c7" />
					<text x="26" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#0284c7">Multi-Bot Ingress</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="currentColor" class="text-foreground">Telegram / Discord API</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">Rate Limit: Safe 2s Interval</text>
				</g>

				<!-- 2. WIRES: LEFT TO CENTER GUARDRAIL -->
				<!-- Wire 1: WA -> Center -->
				<path d="M 210 60 C 310 60, 340 100, 440 100" fill="none" stroke="url(#wireGradIn)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets WA -->
				<circle r="4.5" fill="#10b981" filter="url(#contactGlow)">
					<animateMotion dur="1.4s" repeatCount="indefinite" path="M 210 60 C 310 60, 340 100, 440 100" />
				</circle>

				<!-- Wire 2: Bot -> Center -->
				<path d="M 210 160 C 310 160, 340 120, 440 120" fill="none" stroke="url(#wireGradIn)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets Bot -->
				<circle r="4.5" fill="#0284c7" filter="url(#contactGlow)">
					<animateMotion dur="1.7s" begin="0.4s" repeatCount="indefinite" path="M 210 160 C 310 160, 340 120, 440 120" />
				</circle>

				<!-- 3. CENTER: DIRECTORY GUARDRAIL & WHITELIST GATEKEEPER -->
				<g transform="translate(440, 35)">
					<rect x="0" y="0" width="220" height="150" rx="16" fill="currentColor" class="text-card stroke-purple-500 stroke-[2px]" />
					<rect x="0" y="0" width="220" height="34" rx="16" fill="#8b5cf6" fill-opacity="0.18" />
					<text x="14" y="22" font-family="system-ui" font-size="12" font-weight="bold" fill="#7c3aed">🛡️ Directory Gatekeeper</text>
					
					<!-- Laser scanning beam -->
					<rect x="6" y="38" width="208" height="2" fill="#a855f7" filter="url(#contactGlow)" class="guardrail-laser" />

					<g transform="translate(14, 46)">
						<rect x="0" y="0" width="192" height="26" rx="6" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="17" font-family="monospace" font-size="10" font-weight="bold" fill="#10b981">● {whitelistedCount} Whitelisted (Pass)</text>
					</g>

					<g transform="translate(14, 78)">
						<rect x="0" y="0" width="192" height="26" rx="6" fill="currentColor" class="text-secondary/60" />
						<text x="10" y="17" font-family="monospace" font-size="10" font-weight="bold" fill="#ef4444">✕ {totalChannelsCount - whitelistedCount} Muted (Drop/Ignore)</text>
					</g>

					<g transform="translate(14, 110)">
						<rect x="0" y="0" width="192" height="28" rx="6" fill="#8b5cf6" fill-opacity="0.1" />
						<text x="10" y="18" font-family="monospace" font-size="9.5" fill="#7c3aed" font-weight="bold">AI Intent &amp; OCR Verification</text>
					</g>
				</g>

				<!-- 4. WIRES: CENTER TO RIGHT DESTINATIONS -->
				<!-- Wire 3: Center -> Groups -->
				<path d="M 660 100 C 760 100, 780 60, 870 60" fill="none" stroke="url(#wireGradOut)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets to Groups -->
				<circle r="4.5" fill="#8b5cf6" filter="url(#contactGlow)">
					<animateMotion dur="1.3s" repeatCount="indefinite" path="M 660 100 C 760 100, 780 60, 870 60" />
				</circle>

				<!-- Wire 4: Center -> Individuals -->
				<path d="M 660 120 C 760 120, 780 160, 870 160" fill="none" stroke="url(#wireGradOut)" stroke-width="2.5" class="ingress-wire" />
				<!-- Moving Packets to Individuals -->
				<circle r="4.5" fill="#06b6d4" filter="url(#contactGlow)">
					<animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path="M 660 120 C 760 120, 780 160, 870 160" />
				</circle>

				<!-- 5. RIGHT DESTINATION NODES -->
				<!-- Node 1: Regional WhatsApp Groups -->
				<g transform="translate(870, 25)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-primary/50 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#10b981" fill-opacity="0.12" />
					<circle cx="14" cy="13" r="3.5" fill="#10b981" />
					<text x="24" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="currentColor" class="text-foreground">🏢 Grup Cabang &amp; Gudang</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="#10b981" font-weight="bold">Target: @g.us</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalIngestedChats} Total Inbound Chat</text>
				</g>

				<!-- Node 2: Individual PIC Hotlines -->
				<g transform="translate(870, 125)">
					<rect x="0" y="0" width="180" height="70" rx="12" fill="currentColor" class="text-card stroke-cyan-500/50 stroke-[1.5px]" />
					<rect x="0" y="0" width="180" height="26" rx="12" fill="#06b6d4" fill-opacity="0.12" />
					<circle cx="14" cy="13" r="3.5" fill="#06b6d4" />
					<text x="24" y="17" font-family="system-ui" font-size="11" font-weight="bold" fill="#0891b2">👤 Hotline PIC Personal</text>
					<text x="14" y="42" font-family="monospace" font-size="9.5" fill="#06b6d4" font-weight="bold">Target: @s.whatsapp.net</text>
					<text x="14" y="58" font-family="monospace" font-size="9" fill="currentColor" class="text-muted-foreground">{totalActionableTickets} Tiket Staged (HITL)</text>
				</g>
			</svg>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 2. ANALYTICS & MONITORING METRIC CARDS                                    -->
	<!-- ========================================================================= -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Card 1: Channel Ingress Coverage -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.contacts.stat_channels}</span>
				<div class="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
					<Radio class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{totalChannelsCount} <span class="text-xs font-normal text-muted-foreground">Channel</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
					<span class="text-emerald-500 font-semibold">{totalGroupsCount} {i18n.t.contacts.stat_groups}</span>
					<span class="text-border">·</span>
					<span class="text-cyan-500 font-semibold">{totalIndividualsCount} {i18n.t.contacts.stat_hotlines}</span>
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-primary h-full rounded-full" style="width: {(whitelistedCount / totalChannelsCount) * 100}%"></div>
			</div>
		</div>

		<!-- Card 2: Monitoring Probe Health -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.contacts.stat_health}</span>
				<div class="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
					<Signal class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
					{avgLatency} <span class="text-xs font-normal text-muted-foreground">ms latency</span>
				</div>
				<p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
					99.8% {i18n.t.contacts.stat_uptime}
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-emerald-500 h-full rounded-full" style="width: 98%"></div>
			</div>
		</div>

		<!-- Card 3: Ingested Traffic & Ticket Yield -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.contacts.stat_yield}</span>
				<div class="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
					<ChartBar class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{totalIngestedChats} <span class="text-xs font-normal text-muted-foreground">Pesan</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">
					<strong class="text-foreground">{totalActionableTickets}</strong> {i18n.t.contacts.stat_staged_tickets}
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-cyan-500 h-full rounded-full" style="width: {(totalActionableTickets / totalIngestedChats) * 100 * 5}%"></div>
			</div>
		</div>

		<!-- Card 4: Whitelist Gatekeeper -->
		<div class="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 relative overflow-hidden">
			<div class="flex items-center justify-between text-muted-foreground">
				<span class="text-xs font-medium">{i18n.t.contacts.stat_gatekeeper}</span>
				<div class="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
					<ShieldCheck class="h-4 w-4" />
				</div>
			</div>
			<div>
				<div class="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
					{whitelistedCount} <span class="text-xs font-normal text-muted-foreground">{i18n.t.common.of} {totalChannelsCount} {i18n.t.contacts.active}</span>
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">
					{totalChannelsCount - whitelistedCount} {i18n.t.contacts.stat_muted}
				</p>
			</div>
			<div class="w-full bg-secondary h-1 rounded-full overflow-hidden">
				<div class="bg-amber-500 h-full rounded-full" style="width: {(whitelistedCount / totalChannelsCount) * 100}%"></div>
			</div>
		</div>
	</div>

	<!-- ========================================================================= -->
	<!-- 3. MODULAR TANSTACK-POWERED DATA TABLE                                     -->
	<!-- ========================================================================= -->
	<DataTable
		data={channels}
		columns={tableColumns}
		title={i18n.t.contacts.table_title}
		subtitle={i18n.t.contacts.table_subtitle}
		searchPlaceholder={i18n.t.contacts.table_search_placeholder}
		searchKeys={["name", "branch", "jidOrChatId", "contactPerson", "contactPhone"]}
		filterKey="type"
		{filterOptions}
		defaultPageSize={10}
		enableExport={true}
		exportFilename="novapilot_contacts_directory"
		emptyMessage={i18n.t.contacts.empty_table}
	>
		<!-- Custom Cell Rendering -->
		{#snippet rowCell({ row, column })}
			{#if column.id === "name"}
				<div class="flex items-center gap-3 min-w-[220px]">
					{#if row.type === 'GROUP'}
						<button
							type="button"
							onclick={() => openGroupMembers(row)}
							class="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border bg-primary/10 text-primary border-primary/25 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer shadow-2xs"
							title="Klik untuk membuka roster {row.members?.length || 0} anggota grup"
						>
							<UserGroup class="h-4 w-4" />
						</button>
					{:else}
						<div class="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
							<User class="h-4 w-4" />
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<div class="font-bold text-foreground text-xs truncate flex items-center gap-1.5">
							{#if row.type === 'GROUP'}
								<button
									type="button"
									onclick={() => openGroupMembers(row)}
									class="hover:text-primary hover:underline text-left truncate cursor-pointer font-bold transition-colors"
									title="Buka daftar anggota {row.name}"
								>
									{row.name}
								</button>
							{:else}
								<span class="truncate">{row.name}</span>
							{/if}
							<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold shrink-0 {row.type === 'GROUP' ? 'bg-secondary text-foreground border border-border' : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'}">
								{row.type}
							</span>
						</div>
						<div class="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
							<span class="inline-flex items-center gap-0.5">
								<BuildingOffice2 class="h-3 w-3 shrink-0" />
								<span>{row.branch}</span>
							</span>
							<span class="text-border">·</span>
							<span class="truncate max-w-[120px]">{row.contactPerson}</span>
							{#if row.type === 'GROUP' && row.members}
								<span class="text-border">·</span>
								<button
									type="button"
									onclick={(e) => { e.stopPropagation(); openGroupMembers(row); }}
									class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all text-[10px] font-semibold cursor-pointer shadow-2xs group"
									title="Klik untuk melihat {row.members.length} anggota grup"
								>
									<UserGroup class="h-2.5 w-2.5" />
									<span>{row.members.length} Anggota</span>
									<span class="text-[9px] opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
								</button>
							{/if}
						</div>
					</div>
				</div>

			{:else if column.id === "platform"}
				<div class="flex items-center justify-center">
					<span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 {row.platform === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : row.platform === 'telegram' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' : row.platform === 'discord' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'}">
						<span class="h-1.5 w-1.5 rounded-full {row.platform === 'whatsapp' ? 'bg-emerald-500' : row.platform === 'telegram' ? 'bg-sky-500' : row.platform === 'discord' ? 'bg-indigo-500' : 'bg-rose-500'}"></span>
						{row.platform}
					</span>
				</div>

			{:else if column.id === "jidOrChatId"}
				<div class="flex items-center gap-1.5 font-mono text-[11px]">
					<span class="text-foreground font-medium truncate max-w-[180px]" title={row.jidOrChatId}>
						{row.jidOrChatId}
					</span>
					<button
						type="button"
						onclick={() => copyJid(row.jidOrChatId)}
						class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary cursor-pointer"
						title="Salin JID"
					>
						{#if copiedJid === row.jidOrChatId}
							<Check class="h-3.5 w-3.5 text-emerald-500" />
						{:else}
							<ClipboardDocument class="h-3.5 w-3.5" />
						{/if}
					</button>
				</div>

			{:else if column.id === "status"}
				<div class="flex flex-col items-center justify-center space-y-0.5">
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {row.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : row.status === 'STANDBY' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground border border-border'}">
						<span class="h-1.5 w-1.5 rounded-full {row.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : row.status === 'STANDBY' ? 'bg-amber-500' : 'bg-zinc-400'}"></span>
						{row.status}
					</span>
					<span class="text-[10px] font-mono text-muted-foreground">
						{row.latencyMs}ms latency
					</span>
				</div>

			{:else if column.id === "telemetry"}
				<div class="space-y-0.5">
					<div class="font-semibold text-foreground text-xs">
						{row.totalMessages} <span class="font-normal text-muted-foreground">chat</span>
					</div>
					<div class="text-[11px] text-primary font-medium">
						{row.actionableTickets} tiket staging
					</div>
				</div>

			{:else if column.id === "whitelist"}
				<div class="flex items-center justify-center">
					<button
						type="button"
						onclick={() => toggleWhitelist(row.id)}
						class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {row.isWhitelisted ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}"
						title={row.isWhitelisted ? "Saluran diizinkan masuk pipeline otomatis" : "Saluran dimatikan / diabaikan oleh bot"}
					>
						<span
							class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out {row.isWhitelisted ? 'translate-x-4' : 'translate-x-0'}"
						></span>
					</button>
				</div>

			{:else if column.id === "actions"}
				<div class="flex items-center justify-end gap-1.5">
					<!-- Outbound WhatsApp & Telegram Action -->
					{#if row.platform === 'whatsapp'}
						<button
							type="button"
							onclick={() => openChatModal(row)}
							class="h-7 px-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
							title="Kirim pesan langsung ke {row.name} via WhatsApp"
						>
							<svg class="h-3.5 w-3.5 shrink-0 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
								<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.54 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.25-1.48-1.39-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32"/>
							</svg>
							<span>Kirim Pesan</span>
						</button>
					{:else if row.platform === 'telegram'}
						<a
							href={row.jidOrChatId.startsWith('@') ? `https://t.me/${row.jidOrChatId.replace('@', '')}` : `https://t.me/novapilot_ai_ky_bot`}
							target="_blank"
							rel="noreferrer"
							class="h-7 px-2.5 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
							title="Buka Telegram Bot"
						>
							<svg class="h-3.5 w-3.5 shrink-0 fill-current text-sky-500" viewBox="0 0 24 24">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
							</svg>
							<span>Buka Bot</span>
						</a>
					{/if}

					<!-- Simulasi Inbound Ping -->
					<button
						type="button"
						onclick={() => pingChannel(row)}
						disabled={testPingId === row.id}
						class="h-7 px-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
						title={i18n.t.contacts.action_sim}
					>
						{#if testPingId === row.id}
							<Check class="h-3 w-3 text-emerald-500" />
							<span class="text-emerald-500 font-bold">{i18n.t.contacts.action_sent}</span>
						{:else}
							<Bolt class="h-3 w-3 text-primary" />
							<span>{i18n.t.contacts.action_sim}</span>
						{/if}
					</button>

					<!-- Hapus Saluran -->
					<button
						type="button"
						onclick={() => promptDelete(row)}
						class="h-7 w-7 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
						title={i18n.t.contacts.action_delete}
					>
						<Trash class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
		{/snippet}
	</DataTable>

	<!-- ========================================================================= -->
	<!-- MODAL: TAMBAH SALURAN / KONTAK BARU                                       -->
	<!-- ========================================================================= -->
	{#if isAddModalOpen}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-lg rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-2.5">
						<div class="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<UserPlus class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">{i18n.t.contacts.modal_add_title}</h3>
							<p class="text-xs text-muted-foreground">{i18n.t.contacts.modal_add_subtitle}</p>
						</div>
					</div>
					<button 
						type="button" 
						onclick={() => isAddModalOpen = false}
						class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
					>
						<XMark class="h-4 w-4" />
					</button>
				</div>

				<!-- Form Error Alert -->
				{#if formError}
					<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
						<ExclamationTriangle class="h-4 w-4 shrink-0" />
						<span>{formError}</span>
					</div>
				{/if}

				<!-- Form Inputs -->
				<div class="space-y-4 text-xs font-sans">
					<!-- Tipe Saluran -->
					<div class="space-y-1.5">
						<span class="block font-semibold text-foreground">{i18n.t.contacts.channel_type}</span>
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								onclick={() => newContact.type = "GROUP"}
								class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 {newContact.type === 'GROUP' ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}"
							>
								<UserGroup class="h-4 w-4" />
								<div>
									<div class="font-semibold text-xs">{i18n.t.contacts.type_group}</div>
									<div class="text-[10px] opacity-75">{i18n.t.contacts.type_group_sub}</div>
								</div>
							</button>

							<button
								type="button"
								onclick={() => newContact.type = "INDIVIDUAL"}
								class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 {newContact.type === 'INDIVIDUAL' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-2xs' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'}"
							>
								<User class="h-4 w-4" />
								<div>
									<div class="font-semibold text-xs">{i18n.t.contacts.type_individual}</div>
									<div class="text-[10px] opacity-75">{i18n.t.contacts.type_individual_sub}</div>
								</div>
							</button>
						</div>
					</div>

					<!-- Platform -->
					<div class="space-y-1.5">
						<label for="add-contact-platform" class="block font-semibold text-foreground">{i18n.t.contacts.platform_label}</label>
						<select
							id="add-contact-platform"
							bind:value={newContact.platform}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						>
							<option value="whatsapp">WhatsApp (Baileys Hook)</option>
							<option value="telegram">Telegram Bot API</option>
							<option value="discord">Discord Webhook</option>
							<option value="slack">Slack Enterprise</option>
						</select>
					</div>

					<!-- Nama Saluran / Identitas -->
					<div class="space-y-1.5">
						<label for="add-contact-name" class="block font-semibold text-foreground">{i18n.t.contacts.channel_name}</label>
						<input
							id="add-contact-name"
							type="text"
							bind:value={newContact.name}
							placeholder={newContact.type === 'GROUP' ? i18n.t.contacts.name_placeholder_group : i18n.t.contacts.name_placeholder_individual}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>
					</div>

					<!-- JID / Chat ID Identifier -->
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<label for="add-contact-jid" class="font-semibold text-foreground">{i18n.t.contacts.jid_label}</label>
							<button 
								type="button" 
								onclick={() => showJidGuide = !showJidGuide} 
								class="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
							>
								<QuestionMarkCircle class="h-3.5 w-3.5" />
								<span>{showJidGuide ? i18n.t.contacts.jid_guide_close : i18n.t.contacts.jid_guide_open}</span>
							</button>
						</div>

						{#if showJidGuide}
							<div class="p-3 rounded-xl bg-primary/10 border border-primary/25 text-[11px] space-y-1.5 text-foreground animate-in fade-in duration-150">
								<div class="font-bold flex items-center gap-1.5 text-primary">
									<InformationCircle class="h-3.5 w-3.5" />
									<span>Panduan Mendapatkan JID Saluran:</span>
								</div>
								<ul class="list-disc list-inside space-y-1 text-muted-foreground pl-0.5">
									<li><strong class="text-foreground">Grup WhatsApp (@g.us):</strong> Masukkan nomor bot ke grup WA lalu kirim chat tes. Baileys otomatis mencetak ID grup di terminal log gateway (menu <code>/admin/whatsapp</code>). Formatnya: <code>120363xxx@g.us</code>.</li>
									<li><strong class="text-foreground">Kontak Hotline PIC (@s.whatsapp.net):</strong> Menggunakan nomor telepon internasional (misal <code>6281234567890</code>). Anda dapat mengetik nomor HP di bawah lalu klik tombol isi otomatis.</li>
									<li><strong class="text-foreground">Telegram / Discord / Slack:</strong> Salin Chat ID numerik atau Channel ID dari aplikasi bersangkutan.</li>
								</ul>
							</div>
						{/if}

						<input
							id="add-contact-jid"
							type="text"
							bind:value={newContact.jidOrChatId}
							placeholder={newContact.type === 'GROUP' ? '120363028192837492@g.us' : '6281234567890'}
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>

						{#if newContact.type === 'INDIVIDUAL' && newContact.contactPhone}
							<button
								type="button"
								onclick={fillJidFromPhone}
								class="text-[10.5px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
							>
								<Bolt class="h-3 w-3" />
								<span>{i18n.t.contacts.auto_convert_phone.replace('{phone}', newContact.contactPhone)}</span>
							</button>
						{/if}
					</div>

					<!-- Cabang & Regional -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="add-contact-branch" class="font-semibold text-foreground">{i18n.t.contacts.branch_label}</label>
							<span class="text-[10px] text-muted-foreground">Menghubungkan ke <code>branch_id</code> DB</span>
						</div>

						<!-- Branch Preset Selector Pills -->
						<div class="flex items-center gap-1.5 flex-wrap">
							<span class="text-[10px] text-muted-foreground font-medium">Pilih Cepat:</span>
							{#each regionalBranchPresets as preset}
								<button
									type="button"
									onclick={() => selectBranchPreset(preset)}
									class="px-2 py-0.5 rounded-lg text-[10px] border transition-all cursor-pointer {newContact.branch === preset ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs' : 'bg-secondary/60 hover:bg-secondary border-border text-muted-foreground hover:text-foreground'}"
								>
									{preset.split(' (')[0]}
								</button>
							{/each}
						</div>

						<input
							id="add-contact-branch"
							type="text"
							bind:value={newContact.branch}
							placeholder="mis. Jawa Timur (Surabaya Hub) / Head Office"
							class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>

						<!-- Impact of Branch on DB & App Card -->
						<div class="p-2.5 rounded-xl bg-secondary/35 border border-border/70 text-[10.5px] leading-relaxed text-muted-foreground flex items-start gap-2">
							<ShieldCheck class="h-4 w-4 text-primary shrink-0 mt-0.5" />
							<div>
								<strong class="text-foreground">{i18n.t.contacts.branch_impact_title}</strong> {i18n.t.contacts.branch_impact_desc}
							</div>
						</div>
					</div>

					<!-- Contact Person & Telepon -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label for="add-contact-pic-name" class="block font-semibold text-foreground">{i18n.t.contacts.pic_name}</label>
							<input
								id="add-contact-pic-name"
								type="text"
								bind:value={newContact.contactPerson}
								placeholder="mis. Budi Wicaksono"
								class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
							/>
						</div>
						<div class="space-y-1.5">
							<label for="add-contact-pic-phone" class="block font-semibold text-foreground">{i18n.t.contacts.pic_phone}</label>
							<input
								id="add-contact-pic-phone"
								type="text"
								bind:value={newContact.contactPhone}
								placeholder="+62 812-3456-7890"
								class="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
							/>
						</div>
					</div>

					<!-- Whitelist Intake Switch -->
					<div class="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between">
						<div>
							<div class="font-semibold text-foreground">{i18n.t.contacts.auto_whitelist_label}</div>
							<div class="text-[11px] text-muted-foreground">{i18n.t.contacts.auto_whitelist_desc}</div>
						</div>
						<input 
							type="checkbox" 
							bind:checked={newContact.isWhitelisted} 
							class="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
						/>
					</div>
				</div>

				<!-- Modal Footer -->
				<div class="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
					<button
						type="button"
						onclick={() => isAddModalOpen = false}
						class="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
					>
						{i18n.t.contacts.cancel}
					</button>
					<button
						type="button"
						onclick={saveContact}
						class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
					>
						<Check class="h-4 w-4" />
						<span>{i18n.t.contacts.save_channel}</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- MODAL: KONFIRMASI HAPUS SALURAN                                           -->
	<!-- ========================================================================= -->
	{#if isDeleteModalOpen && channelToDelete}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-md rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
			>
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold shrink-0">
						<Trash class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-foreground">{i18n.t.contacts.modal_delete_title}</h3>
						<p class="text-xs text-muted-foreground">{i18n.t.contacts.modal_delete_desc}</p>
					</div>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/50 border border-border/60 text-xs space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">{i18n.t.contacts.channel_name}:</span>
						<strong class="text-foreground">{channelToDelete.name}</strong>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">{i18n.t.contacts.channel_type} / {i18n.t.contacts.platform_label}:</span>
						<span class="font-mono">{channelToDelete.type} ({channelToDelete.platform})</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">JID / ID:</span>
						<span class="font-mono text-muted-foreground">{channelToDelete.jidOrChatId}</span>
					</div>
				</div>

				<p class="text-xs text-rose-600 dark:text-rose-400">
					⚠️ {i18n.t.contacts.delete_warning}
				</p>

				<div class="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
					<button
						type="button"
						onclick={() => isDeleteModalOpen = false}
						class="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
					>
						{i18n.t.contacts.cancel}
					</button>
					<button
						type="button"
						onclick={confirmDelete}
						class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
					>
						<Trash class="h-3.5 w-3.5" />
						<span>{i18n.t.contacts.confirm_delete}</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- MODAL: DAFTAR ANGGOTA GRUP (GROUP MEMBERS & PARTICIPANTS ROSTER)           -->
	<!-- ========================================================================= -->
	{#if selectedGroupForMembers}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-2xl rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
			>
				<!-- Modal Header -->
				<div class="flex items-start justify-between pb-3 border-b border-border/60 shrink-0">
					<div class="flex items-start gap-3">
						<div class="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0 mt-0.5">
							<UserGroup class="h-5 w-5" />
						</div>
						<div>
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="text-sm font-bold text-foreground">{selectedGroupForMembers.name}</h3>
								<span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-primary/15 text-primary border border-primary/30">
									{i18n.t.contacts.roster_badge}
								</span>
								<span class="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-secondary text-muted-foreground border border-border">
									{selectedGroupForMembers.platform}
								</span>
							</div>
							<p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
								<BuildingOffice2 class="h-3 w-3 shrink-0" />
								<span>{selectedGroupForMembers.branch}</span>
								<span class="text-border">·</span>
								<span class="font-mono text-[11px] text-foreground">{selectedGroupForMembers.jidOrChatId}</span>
							</p>
						</div>
					</div>
					<button 
						type="button" 
						onclick={closeGroupMembers}
						class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
						title={i18n.t.modals.close}
					>
						<XMark class="h-5 w-5" />
					</button>
				</div>

				<!-- Multi-Device Compatibility & Whitelist Notice -->
				<div class="p-3 rounded-xl bg-secondary/35 border border-border/80 text-[11px] leading-relaxed space-y-1 shrink-0">
					<div class="flex items-center justify-between font-semibold text-foreground">
						<span class="flex items-center gap-1.5 text-primary">
							<ShieldCheck class="h-3.5 w-3.5" />
							<span>{i18n.t.contacts.roster_notice_title}</span>
						</span>
						<span class="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
							BAILEYS &amp; FERDIUM READY
						</span>
					</div>
					<p class="text-muted-foreground">
						{i18n.t.contacts.roster_notice_desc}
					</p>
				</div>

				<!-- Search Filter & Quick Metric Badges -->
				<div class="space-y-2 shrink-0">
					<div class="relative">
						<MagnifyingGlass class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							type="text"
							bind:value={memberSearchQuery}
							placeholder={i18n.t.contacts.search_member}
							class="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground shadow-2xs focus:ring-1 focus:ring-ring"
						/>
					</div>

					<div class="flex items-center justify-between text-[11px] px-1 text-muted-foreground flex-wrap gap-2">
						<div class="flex items-center gap-2">
							<span class="font-semibold text-foreground">{i18n.t.contacts.total_members.replace('{count}', String(selectedGroupForMembers.members?.length || 0))}</span>
							<span class="text-border">·</span>
							<span class="text-blue-600 dark:text-blue-400 font-medium">
								{selectedGroupForMembers.members?.filter(m => m.role === 'ADMIN' || m.role === 'SUPERADMIN').length || 0} {i18n.t.contacts.admin_count}
							</span>
							<span class="text-border">·</span>
							<span class="text-emerald-600 dark:text-emerald-400 font-medium">
								{selectedGroupForMembers.members?.filter(m => m.role === 'ON_CALL').length || 0} {i18n.t.contacts.oncall_count}
							</span>
						</div>
						<div class="font-mono text-[10px]">
							{selectedGroupForMembers.members?.filter(m => m.isWhitelisted).length || 0} {i18n.t.contacts.whitelisted}
						</div>
					</div>
				</div>

				<!-- Add Member Toggle / Form -->
				<div class="space-y-2 shrink-0">
					<div class="flex items-center justify-between">
						<button
							type="button"
							onclick={() => isAddingMember = !isAddingMember}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all cursor-pointer shadow-2xs"
						>
							{#if isAddingMember}
								<XMark class="h-3.5 w-3.5" />
								<span>Batal Tambah</span>
							{:else}
								<Plus class="h-3.5 w-3.5" />
								<span>+ Tambah Anggota ke Grup</span>
							{/if}
						</button>
					</div>

					{#if isAddingMember}
						<div class="p-3 rounded-xl border border-primary/25 bg-primary/5 space-y-3 animate-in fade-in duration-150">
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
								<div>
									<label class="text-[10px] font-semibold text-muted-foreground block mb-0.5">Nama Anggota</label>
									<input
										type="text"
										bind:value={newMemberName}
										placeholder="e.g. Budi Santoso"
										class="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-ring"
									/>
								</div>
								<div>
									<label class="text-[10px] font-semibold text-muted-foreground block mb-0.5">Nomor Telepon / ID</label>
									<input
										type="text"
										bind:value={newMemberPhone}
										placeholder="+62 812-xxxx-xxxx"
										class="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-ring"
									/>
								</div>
								<div>
									<label class="text-[10px] font-semibold text-muted-foreground block mb-0.5">Role Otoritas</label>
									<select
										bind:value={newMemberRole}
										class="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-ring"
									>
										<option value="MEMBER">MEMBER (Staff)</option>
										<option value="ADMIN">ADMIN (Supervisor)</option>
										<option value="ON_CALL">ON_CALL (Hotline)</option>
										<option value="SUPERADMIN">SUPERADMIN (Lead)</option>
									</select>
								</div>
							</div>
							{#if newMemberError}
								<p class="text-[11px] text-rose-500 font-medium">⚠️ {newMemberError}</p>
							{/if}
							<div class="flex items-center justify-end gap-2">
								<button
									type="button"
									onclick={() => isAddingMember = false}
									class="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
								>
									Batal
								</button>
								<button
									type="button"
									onclick={addMemberToGroup}
									class="px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1"
								>
									<Check class="h-3.5 w-3.5" />
									<span>Simpan Anggota</span>
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Scrollable Members Roster List -->
				<div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[360px]">
					{#if filteredMembers.length === 0}
						<div class="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground space-y-1">
							<p class="text-xs font-semibold text-foreground">{i18n.t.contacts.no_members_found}</p>
							<p class="text-[11px]">{i18n.t.common.no_data}</p>
						</div>
					{:else}
						{#each filteredMembers as member (member.id)}
							<div class="p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/30 transition-all flex items-center justify-between gap-3 shadow-2xs">
								<!-- Left: Avatar & Info -->
								<div class="flex items-center gap-2.5 min-w-0">
									<div class="h-8.5 w-8.5 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border {member.role === 'SUPERADMIN' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' : member.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' : member.role === 'ON_CALL' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-secondary text-muted-foreground border-border'}">
										{member.name.substring(0, 2).toUpperCase()}
									</div>
									<div class="min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<span class="text-xs font-bold text-foreground truncate">{member.name}</span>
											<span class="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border {member.role === 'SUPERADMIN' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' : member.role === 'ADMIN' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' : member.role === 'ON_CALL' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-secondary text-muted-foreground border-border'}">
												{member.role}
											</span>
										</div>
										<div class="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
											<span class="font-mono flex items-center gap-1">
												<Phone class="h-2.5 w-2.5" />
												<span>{member.phone}</span>
											</span>
											<button
												type="button"
												onclick={() => copyMemberPhone(member.phone)}
												class="hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
												title="Salin nomor / handle"
											>
												{#if copiedMemberPhone === member.phone}
													<Check class="h-3 w-3 text-emerald-500" />
												{:else}
													<ClipboardDocument class="h-3 w-3" />
												{/if}
											</button>
											<span class="text-border">·</span>
											<span>Aktif {member.lastActive}</span>
										</div>
									</div>
								</div>

								<!-- Right: Actions & Whitelist Toggle Switch -->
								<div class="flex items-center gap-2 shrink-0">
									<div class="text-right hidden sm:block">
										<span class="text-[10px] font-mono font-semibold {member.isWhitelisted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}">
											{member.isWhitelisted ? i18n.t.contacts.whitelisted : "Muted"}
										</span>
									</div>
									<button
										type="button"
										onclick={() => toggleMemberWhitelist(member.id)}
										class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {member.isWhitelisted ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}"
										title={member.isWhitelisted ? "Pesan dari anggota ini diproses otomatis" : "Pesan dari anggota ini diabaikan"}
									>
										<span
											class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out {member.isWhitelisted ? 'translate-x-4' : 'translate-x-0'}"
										></span>
									</button>

									<!-- Remove member button -->
									<button
										type="button"
										onclick={() => removeMemberFromGroup(member.id)}
										class="p-1 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
										title="Keluarkan dari daftar grup"
									>
										<Trash class="h-3 w-3" />
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Modal Footer -->
				<div class="flex items-center justify-between pt-3 border-t border-border/60 shrink-0 text-xs">
					<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
						<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
						<span>Kompatibel WhatsApp Web / Ferdium / Rambox via Baileys</span>
					</div>
					<button
						type="button"
						onclick={closeGroupMembers}
						class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition-colors cursor-pointer"
					>
						{i18n.t.contacts.close_roster}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ========================================================================= -->
	<!-- MODAL: KIRIM PESAN OUTBOUND WHATSAPP (LIVE GATEWAY DISPATCH)              -->
	<!-- ========================================================================= -->
	{#if chatTargetChannel}
		<div 
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
			role="dialog"
			aria-modal="true"
		>
			<div 
				class="w-full max-w-lg rounded-2xl bg-card border border-border text-card-foreground shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
			>
				<!-- Modal Header -->
				<div class="flex items-start justify-between pb-3 border-b border-border/60">
					<div class="flex items-center gap-3">
						<div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
							<svg class="h-5 w-5 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24">
								<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.54 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.25-1.48-1.39-1.73-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32"/>
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-bold text-foreground">Kirim Pesan WhatsApp</h3>
							<p class="text-xs text-muted-foreground">Kirim pesan langsung ke {chatTargetChannel.name} ({chatTargetChannel.contactPhone || chatTargetChannel.jidOrChatId})</p>
						</div>
					</div>
					<button 
						type="button" 
						onclick={closeChatModal}
						class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
					>
						<XMark class="h-5 w-5" />
					</button>
				</div>

				<!-- Channel Metadata Badge -->
				<div class="p-3 rounded-xl bg-secondary/50 border border-border/70 text-xs space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Penerima:</span>
						<strong class="text-foreground">{chatTargetChannel.name}</strong>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">Cabang:</span>
						<span>{chatTargetChannel.branch}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">JID WhatsApp:</span>
						<span class="font-mono text-muted-foreground">{chatTargetChannel.jidOrChatId}</span>
					</div>
				</div>

				<!-- Quick Templates -->
				<div class="space-y-1.5">
					<span class="text-[11px] font-semibold text-muted-foreground">Template Cepat:</span>
					<div class="flex items-center gap-1.5 flex-wrap">
						<button
							type="button"
							onclick={() => chatMessage = "Halo tim operasional cabang, mohon konfirmasi revisi faktur INV/2026/001 customer PT Sumber Makmur."}
							class="text-[10px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
						>
							Konfirmasi Faktur
						</button>
						<button
							type="button"
							onclick={() => chatMessage = "Pemberitahuan: Sistem sinkronisasi ERP telah aktif untuk branch Anda."}
							class="text-[10px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
						>
							Notifikasi Sistem
						</button>
						<button
							type="button"
							onclick={() => chatMessage = "Halo, ini tes konektivitas outbound messaging NovaPilot AI WhatsApp Gateway."}
							class="text-[10px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
						>
							Tes Koneksi
						</button>
					</div>
				</div>

				<!-- Message Textarea -->
				<div class="space-y-1.5">
					<label for="chat-message-input" class="text-xs font-semibold text-foreground">Isi Pesan WhatsApp</label>
					<textarea
						id="chat-message-input"
						bind:value={chatMessage}
						rows="3"
						placeholder="Ketik pesan yang ingin dikirim..."
						class="w-full p-2.5 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
					></textarea>
				</div>

				<!-- Guardrail DLP Alert Notice -->
				<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
					<ShieldCheck class="h-4 w-4 shrink-0 text-amber-500" />
					<span>Dilindungi DLP Guardrail: Kredensial DB string, JWT, dan nomor darurat otomatis dicegah bocor.</span>
				</div>

				<!-- Feedback banner -->
				{#if chatFeedback}
					<div class="p-3 rounded-xl border text-xs {chatFeedback.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'}">
						{chatFeedback.text}
					</div>
				{/if}

				<!-- Modal Footer -->
				<div class="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
					<button
						type="button"
						onclick={closeChatModal}
						class="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
					>
						Tutup
					</button>
					<button
						type="button"
						onclick={sendOutboundChat}
						disabled={isSendingChat || !chatMessage.trim()}
						class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
					>
						{#if isSendingChat}
							<ArrowPath class="h-3.5 w-3.5 animate-spin" />
							<span>Mengirim...</span>
						{:else}
							<PaperAirplane class="h-3.5 w-3.5" />
							<span>Kirim Sekarang</span>
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

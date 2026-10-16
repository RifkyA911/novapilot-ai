// NovaPilot Internationalization (i18n) Engine
// Svelte 5 Rune-based reactive translation store with zero runtime dependencies.

export type Locale = "id" | "en";

export interface Translations {
	nav: {
		operations: string;
		overview: string;
		cockpit: string;
		queue: string;
		history: string;
		inbound: string;
		agents: string;
		hooks: string;
		contacts: string;
		databases: string;
		connectors: string;
		mcp: string;
		telemetry: string;
		logs: string;
		settings: string;
		flows: string;
		about: string;
		simulator: string;
		chatops_gateways: string;
	};
	actions: {
		approve: string;
		reject: string;
		stage: string;
		save: string;
		cancel: string;
		refresh: string;
		search: string;
		filter: string;
		export: string;
		test_connection: string;
		apply: string;
		run_inference: string;
		copy: string;
		copied: string;
		view_details: string;
		close: string;
		inspect: string;
		clear: string;
		confirm: string;
		back: string;
		next: string;
	};
	status: {
		pending: string;
		approved: string;
		rejected: string;
		executed: string;
		failed: string;
		online: string;
		offline: string;
		connected: string;
		disconnected: string;
		healthy: string;
		active: string;
		standby: string;
		whitelisted: string;
	};
	agents: {
		hub_title: string;
		hub_subtitle: string;
		hermes_title: string;
		hermes_badge: string;
		openclaw_title: string;
		openclaw_badge: string;
		reasoning_contract: string;
		reasoning_thought: string;
		tool_arguments: string;
		stage_ticket: string;
		prompt_label: string;
		prompt_placeholder: string;
		branch_context: string;
		presets_label: string;
		gateway_service: string;
		browser_driver: string;
		safety_gate: string;
		task_capacity: string;
		task_registry: string;
		task_instruction: string;
		dispatch_to_openclaw: string;
		stage_to_approval: string;
		model_architecture: string;
		execution_mode: string;
		offline_resilience: string;
		offline_resilience_sub: string;
		cli_detected: string;
		cli_active: string;
		cli_using: string;
		cli_activate: string;
		config_title: string;
		config_subtitle: string;
		save_config: string;
		saving: string;
		saved: string;
		mode_label: string;
		mode_auto: string;
		mode_cli: string;
		mode_http: string;
		base_url_label: string;
		model_name_label: string;
		cli_path_label: string;
		interactive_console: string;
		prompt_label_chat: string;
		branch_context_label: string;
		run_inference: string;
		running_inference: string;
		inference_result: string;
		copy_code: string;
		copied: string;
		staging_ticket_queue: string;
		staging_in_progress: string;
		prompt_hint: string;
		openclaw_config_title: string;
		openclaw_config_desc: string;
		openclaw_test_endpoint: string;
		browser_mode_label: string;
		openclaw_disconnected_title: string;
		openclaw_disconnected_desc: string;
		check_connection: string;
		checking: string;
		auto_reply_card_title: string;
		auto_reply_card_subtitle: string;
		auto_reply_toggle_label: string;
		auto_reply_toggle_desc: string;
		auto_reply_mode_label: string;
		auto_reply_mode_smart: string;
		auto_reply_mode_actionable: string;
		auto_reply_mode_all: string;
		auto_reply_mode_manual: string;
		auto_reply_tone_label: string;
		auto_reply_tone_professional: string;
		auto_reply_tone_friendly: string;
		auto_reply_tone_concise: string;
		auto_reply_prefix_label: string;
		auto_reply_lang_label: string;
		auto_reply_lang_auto: string;
		auto_reply_lang_id: string;
		auto_reply_lang_en: string;
		auto_reply_sandbox_title: string;
		auto_reply_sandbox_desc: string;
		auto_reply_generate_btn: string;
		auto_reply_generating: string;
		auto_reply_result_label: string;
		auto_reply_test_dispatch: string;
		auto_reply_dispatched: string;
	};
	overview: {
		guardrail_title: string;
		active_guard: string;
		guardrail_desc: string;
		sse_live: string;
		sse_offline: string;
		refresh: string;
		stage_simulator: string;
		kpi_pending: string;
		kpi_pending_sub: string;
		kpi_executed: string;
		kpi_executed_sub: string;
		kpi_rejected: string;
		kpi_rejected_sub: string;
		kpi_safety: string;
		kpi_safety_sub: string;
		queue_preview_title: string;
		queue_preview_desc: string;
		history_preview_title: string;
		history_preview_desc: string;
		view_all: string;
		empty_queue: string;
		empty_history: string;
		pipeline_title: string;
		pipeline_standby: string;
		expand_pipeline: string;
		fold_pipeline: string;
		needs_review_title: string;
		needs_review_desc: string;
		review_stage_btn: string;
		traffic_title: string;
		traffic_badge: string;
		traffic_subtitle: string;
		cockpit_btn: string;
		chart_volume_title: string;
		chart_total_intake: string;
		chart_approved: string;
		channel_share_title: string;
		channel_total_ingress: string;
	};
	cockpit: {
		title: string;
		subtitle: string;
		preview_notice_title: string;
		preview_notice_desc: string;
		intent_accuracy: string;
		intent_accuracy_sub: string;
		ocr_precision: string;
		ocr_precision_sub: string;
		avg_latency: string;
		avg_latency_sub: string;
		gatekeeper_block_rate: string;
		gatekeeper_block_rate_sub: string;
		circuit_title: string;
		circuit_desc: string;
		benchmark_title: string;
		benchmark_desc: string;
	};
	queue: {
		title: string;
		subtitle: string;
		search_placeholder: string;
		all_branches: string;
		all_confidence: string;
		high_confidence: string;
		needs_review: string;
		sort_newest: string;
		sort_oldest: string;
		sort_confidence: string;
		no_pending: string;
		no_pending_desc: string;
		no_match_desc: string;
		clear_filters: string;
		send_simulated: string;
		received: string;
		current_db_state: string;
		proposed_mutation: string;
		proof_attachments: string;
		inspect_plan: string;
		reject: string;
		approve_mutate: string;
		ai_confidence: string;
	};
	history: {
		title: string;
		records_count: string;
		subtitle: string;
		export_json: string;
		refresh: string;
		total_executed: string;
		total_executed_sub: string;
		policy_rejections: string;
		policy_rejections_sub: string;
		rollback_safety: string;
		rollback_safety_sub: string;
		table_title: string;
		table_subtitle: string;
		search_placeholder: string;
		empty_message: string;
		col_ticket: string;
		col_doc: string;
		col_branch: string;
		col_mutation: string;
		col_status: string;
		col_approved_by: string;
		col_executed_at: string;
		col_actions: string;
		filter_all: string;
		filter_executed: string;
		filter_rejected: string;
		filter_approved: string;
		modal_rollback_title: string;
		modal_copy_script: string;
		modal_copied: string;
		modal_raw_msg: string;
		modal_close: string;
		originally: string;
		rollback_btn: string;
	};
	modals: {
		inspect_title: string;
		target_engine: string;
		relational_sql: string;
		non_relational_bson: string;
		zero_sql_guard: string;
		diff_title: string;
		current_val: string;
		proposed_val: string;
		prepared_query: string;
		rollback_script: string;
		audit_metadata: string;
		close: string;
		reject_title: string;
		reject_desc: string;
		reason_label: string;
		reason_placeholder: string;
		cancel: string;
		confirm_reject: string;
		rejecting: string;
		confidence: string;
		document_num: string;
		target_field: string;
		sql_prepared_label: string;
		bson_command_label: string;
		orig_inbound_msg: string;
	};
	messages: {
		title: string;
		subtitle: string;
		search_placeholder: string;
		all_platforms: string;
		all_classes: string;
		actionable: string;
		needs_review: string;
		casual_banter: string;
		stage_ticket: string;
		learn_pattern: string;
		open_terminal: string;
		no_messages: string;
		no_messages_desc: string;
		total_messages_kpi: string;
		total_messages_sub: string;
		actionable_kpi: string;
		actionable_sub: string;
		needs_review_kpi: string;
		needs_review_sub: string;
		casual_banter_kpi: string;
		casual_banter_sub: string;
		terminal_btn: string;
		pattern_memory_btn: string;
		hermes_engine_btn: string;
		platform_flows_btn: string;
	};
	contacts: {
		title: string;
		subtitle: string;
		monitoring_active: string;
		add_contact: string;
		e2e_flow: string;
		search_placeholder: string;
		filter_platform: string;
		filter_status: string;
		active: string;
		whitelisted: string;
		total_messages: string;
		latency: string;
		last_active: string;
		topology_title: string;
		topology_subtitle: string;
		inbound_stream: string;
		verified_channels: string;
		stat_channels: string;
		stat_groups: string;
		stat_hotlines: string;
		stat_health: string;
		stat_uptime: string;
		stat_yield: string;
		stat_staged_tickets: string;
		stat_gatekeeper: string;
		stat_muted: string;
		table_title: string;
		table_subtitle: string;
		table_search_placeholder: string;
		col_channel: string;
		col_platform: string;
		col_jid: string;
		col_probe: string;
		col_telemetry: string;
		col_whitelist: string;
		col_actions: string;
		filter_group: string;
		filter_individual: string;
		empty_table: string;
		action_sim: string;
		action_sent: string;
		action_delete: string;
		modal_add_title: string;
		modal_add_subtitle: string;
		channel_type: string;
		type_group: string;
		type_group_sub: string;
		type_individual: string;
		type_individual_sub: string;
		platform_label: string;
		channel_name: string;
		name_placeholder_group: string;
		name_placeholder_individual: string;
		jid_label: string;
		jid_guide_open: string;
		jid_guide_close: string;
		auto_convert_phone: string;
		branch_label: string;
		branch_impact_title: string;
		branch_impact_desc: string;
		pic_name: string;
		pic_phone: string;
		auto_whitelist_label: string;
		auto_whitelist_desc: string;
		cancel: string;
		save_channel: string;
		modal_delete_title: string;
		modal_delete_desc: string;
		delete_warning: string;
		confirm_delete: string;
		roster_badge: string;
		roster_notice_title: string;
		roster_notice_desc: string;
		search_member: string;
		total_members: string;
		admin_count: string;
		oncall_count: string;
		no_members_found: string;
		close_roster: string;
	};
	connectors: {
		title: string;
		subtitle: string;
		tab_system: string;
		tab_mcp: string;
		tab_tools: string;
		tab_env: string;
		test_connection: string;
		apply_changes: string;
		pool_stats: string;
		open_connections: string;
		in_use: string;
		idle: string;
		max_open: string;
	};
	mcp: {
		title: string;
		subtitle: string;
		tab_dual_db: string;
		tab_resources: string;
		tab_tools: string;
		tab_playground: string;
		sop_policy: string;
		branches_directory: string;
		execute_tool: string;
	};
	telemetry: {
		title: string;
		subtitle: string;
		service_status: string;
		uptime: string;
		memory_rss: string;
		goroutines: string;
		test_ping: string;
		ping_success: string;
		how_to_integrate: string;
		lan_ingress_ip: string;
		lan_port_active: string;
		go_memory_alloc: string;
		low_footprint: string;
		active_goroutines: string;
		sse_duplex: string;
		server_status: string;
		online: string;
		uptime_label: string;
		db_pool_telemetry: string;
		driver_label: string;
		open_connections: string;
		idle_connections: string;
		in_use_concurrency: string;
		chatops_ingress_telemetry: string;
		realtime_diagnostics: string;
		socket_latency: string;
		tcp_roundtrip: string;
		events_captured: string;
		total_inbound: string;
		queue_backpressure: string;
		buffer_depth: string;
		filter_efficiency: string;
		zero_token_waste: string;
		telemetry_state: string;
		send_probe_ping: string;
		sending_probe: string;
		probe_ack: string;
	};
	logs: {
		title: string;
		subtitle: string;
		search_placeholder: string;
		all_levels: string;
		all_services: string;
		auto_scroll: string;
		pause_stream: string;
		resume_stream: string;
		clear_logs: string;
		export_logs: string;
		total_entries: string;
		no_logs_match: string;
	};
	settings: {
		title: string;
		subtitle: string;
		enterprise_badge: string;
		export_json: string;
		reset_default: string;
		save_changes: string;
		saving: string;
		saved: string;
		saved_toast: string;
		synced: string;
		reset_confirm_title: string;
		cancel: string;
		confirm_reset: string;
		tab_gatekeeper: string;
		tab_ai: string;
		tab_chatops: string;
		tab_database: string;
		tab_alerts: string;
		tab_interface: string;
		threshold_title: string;
		threshold_desc: string;
		supervisor_override: string;
		supervisor_override_desc: string;
		block_closed: string;
		block_closed_desc: string;
		auto_approve_low_risk: string;
		auto_approve_low_risk_desc: string;
		mandatory_audit_reason: string;
		mandatory_audit_reason_desc: string;
		rate_limit: string;
		rate_limit_desc: string;
		ai_engine_title: string;
		ai_engine_desc: string;
		model_provider: string;
		api_key: string;
		api_endpoint: string;
		temperature: string;
		confidence_threshold: string;
		injection_defense: string;
		injection_defense_desc: string;
		strict_json: string;
		strict_json_desc: string;
		rag_grounding: string;
		rag_grounding_desc: string;
		chatops_title: string;
		chatops_desc: string;
		wa_gateway_url: string;
		auto_reply: string;
		auto_reply_desc: string;
		auto_reply_template: string;
		auto_ocr: string;
		auto_ocr_desc: string;
		whitelisted_groups: string;
		blacklisted_jids: string;
		telegram_token: string;
		telegram_chat_id: string;
		discord_webhook: string;
		slack_webhook: string;
		test_webhook: string;
		db_title: string;
		db_desc: string;
		pg_host: string;
		pg_port: string;
		pg_db: string;
		pg_user: string;
		pg_password: string;
		pg_max_conns: string;
		pg_idle_conns: string;
		target_erp: string;
		mcp_endpoint: string;
		safe_dry_run: string;
		safe_dry_run_desc: string;
		test_db_conn: string;
		alerts_title: string;
		alerts_desc: string;
		sound_alerts: string;
		sound_alerts_desc: string;
		test_sound: string;
		sound_volume: string;
		nav_sound: string;
		nav_sound_desc: string;
		test_nav_click: string;
		push_alerts: string;
		push_alerts_desc: string;
		escalation: string;
		escalation_desc: string;
		idle_minutes: string;
		ui_title: string;
		ui_desc: string;
		compact_table: string;
		compact_table_desc: string;
		telemetry_rate: string;
		session_lock: string;
		export_format: string;
	};
	simulator: {
		title: string;
		subtitle: string;
		banner_title: string;
		banner_desc: string;
		run_simulation: string;
		step_1: string;
		step_2: string;
		step_3: string;
		step_4: string;
		chat_msg_label: string;
		branch_source_label: string;
		invoice_target_label: string;
		value_target_label: string;
		exec_pipeline_btn: string;
		executing_pipeline: string;
	};
	about: {
		badge: string;
		title: string;
		subtitle: string;
		open_github: string;
		copy_clone: string;
		copied: string;
		architecture_title: string;
		creator_title: string;
	};
	common: {
		loading: string;
		no_data: string;
		all: string;
		records: string;
		page: string;
		of: string;
		rows_per_page: string;
		language: string;
		theme: string;
		sound: string;
		public_home: string;
		system_flow: string;
		launch_cockpit: string;
		oncall_assistant: string;
		zero_sql_certified: string;
		universal_lts: string;
		multichannel_chatops: string;
		jump_to: string;
		filtered_from: string;
		go: string;
		showing: string;
	};
	landing: {
		pill_announcement: string;
		headline_main: string;
		headline_gradient: string;
		subtitle: string;
		launch_cockpit: string;
		flow_and_hooks: string;
		circuit_arch: string;
		all_channels: string;
		simulate_flow: string;
		simulating_stage: string;
		stage_1: string;
		stage_2: string;
		stage_3: string;
		stage_4: string;
		status_simulating: string;
		status_ready: string;
		cockpit_mockup_title: string;
		cockpit_mockup_sub: string;
		tab_live_ticket: string;
		tab_zero_sql: string;
		tab_auto_rollback: string;
		medan_hub: string;
		medan_msg: string;
		sender_info: string;
		confidence_score: string;
		high_confidence: string;
		target_doc: string;
		current_value: string;
		proposed_value: string;
		approve_execute: string;
		reject: string;
		sql_preview_title: string;
		dry_run_passed: string;
		zero_sql_note: string;
		rollback_preview_title: string;
		instant_reversible: string;
		rollback_note: string;
		stat_turnaround: string;
		stat_turnaround_sub: string;
		stat_safety: string;
		stat_safety_sub: string;
		stat_unchecked: string;
		stat_unchecked_sub: string;
		stat_hubs: string;
		stat_hubs_sub: string;
		bento_title: string;
		bento_sub: string;
		bento_1_title: string;
		bento_1_desc: string;
		bento_2_title: string;
		bento_2_desc: string;
		bento_3_title: string;
		bento_3_desc: string;
		how_it_works_title: string;
		how_it_works_sub: string;
		step_1_title: string;
		step_1_desc: string;
		step_2_title: string;
		step_2_desc: string;
		step_3_title: string;
		step_3_desc: string;
		faq_title: string;
		faq_sub: string;
		faq_1_q: string;
		faq_1_a: string;
		faq_2_q: string;
		faq_2_a: string;
		faq_3_q: string;
		faq_3_a: string;
		faq_4_q: string;
		faq_4_a: string;
	};
	flow: {
		title: string;
		subtitle: string;
		engine_pipeline: string;
		deterministic_badge: string;
		simulate_ingestion: string;
		simulating_stage: string;
		get_api_key: string;
		set_token_dashboard: string;
		gw_daemon_title: string;
		gw_daemon_sub: string;
		gw_online: string;
		gw_offline: string;
		gw_starting: string;
		gw_restarting: string;
		gw_stopping: string;
		gw_start_btn: string;
		gw_restart_btn: string;
		gw_stop_btn: string;
		gw_port: string;
		gw_uptime: string;
		gw_memory: string;
		gw_whitelisted: string;
		gw_terminal_btn: string;
		active_circuit: string;
		prev_stage: string;
		next_stage: string;
		root_mechanics: string;
		contract_payload: string;
		code_desc: string;
		copy_code: string;
		copied: string;
	};
	auth: {
		signin_title: string;
		signup_title: string;
		portal_subtitle: string;
		google_btn: string;
		divider_text: string;
		name_label: string;
		email_label: string;
		password_label: string;
		signin_btn: string;
		signup_btn: string;
		autofill_demo: string;
		need_credentials: string;
		register_link: string;
		already_registered: string;
		signin_link: string;
		unauthorized_error: string;
		logged_out_msg: string;
		session_guardrail: string;
	};
	platforms: {
		page_title: string;
		page_subtitle: string;
		hub_badge: string;
		select_method: string;
		verified_routes: string;
		tab_wa_api: string;
		tab_wa_gateway: string;
		tab_wa_web: string;
		wa_gateway_qr: string;
		wa_web: string;
		wa_ferdium: string;
		wa_rambox: string;
		api_title: string;
		api_subtitle: string;
		api_phone_id: string;
		api_waba_id: string;
		api_token: string;
		api_verify_token: string;
		api_callback_url: string;
		api_test_btn: string;
		api_qr_title: string;
		api_qr_sub: string;
		tos_modal_title: string;
		tos_modal_subtitle: string;
		tos_point_1_title: string;
		tos_point_1_desc: string;
		tos_point_2_title: string;
		tos_point_2_desc: string;
		tos_point_3_title: string;
		tos_point_3_desc: string;
		tos_point_4_title: string;
		tos_point_4_desc: string;
		tos_checkbox_label: string;
		tos_accept_btn: string;
		tos_cancel_btn: string;
		tos_locked_title: string;
		tos_locked_desc: string;
		tos_open_btn: string;
		tos_view_btn: string;
		tos_reset_btn: string;
		tos_accepted_badge: string;
		pc_support_title: string;
		pc_support_desc: string;
		qr_title: string;
		qr_subtitle: string;
		qr_status_connected: string;
		qr_status_waiting: string;
		qr_status_loading: string;
		qr_status_offline: string;
		qr_refresh_btn: string;
		qr_connected_title: string;
		qr_connected_desc: string;
		qr_steps_title: string;
		qr_step_1: string;
		qr_step_2: string;
		qr_step_3: string;
		qr_step_4: string;
		qr_step_5: string;
		qr_waiting_init: string;
		qr_waiting_desc: string;
		browser_hook_title: string;
		browser_hook_sub: string;
		ferdium_hook_title: string;
		ferdium_hook_sub: string;
		rambox_hook_title: string;
		rambox_hook_sub: string;
		how_to_install: string;
		browser_install_steps: string;
		ferdium_install_steps: string;
		rambox_install_steps: string;
		network_security_title: string;
		local_port: string;
		antispam_debounce: string;
		antispam_desc: string;
		whitelisted_jids: string;
		whitelisted_jids_desc: string;
		security_token: string;
		bot_token: string;
		bot_token_desc: string;
		delivery_mode: string;
		supervisor_id: string;
		authorized_chat_ids: string;
		authorized_chat_ids_desc: string;
		discord_token: string;
		guild_id: string;
		rbac_role: string;
		whitelisted_channels: string;
		slack_token: string;
		signing_secret: string;
		signing_secret_desc: string;
		team_id: string;
		slash_command: string;
		logic_flow_title: string;
		flow_step_1_title: string;
		flow_step_1_desc: string;
		flow_step_2_title: string;
		flow_step_2_desc: string;
		flow_step_3_title: string;
		flow_step_3_desc: string;
		copy_config: string;
	};
	tutorial: {
		title: string;
		subtitle: string;
		tab_ferdium: string;
		tab_rambox: string;
		tab_web: string;
		tab_pc: string;
		ferdium_title: string;
		ferdium_badge: string;
		ferdium_desc: string;
		steps_heading: string;
		ferdium_s1: string;
		ferdium_s2: string;
		ferdium_s3: string;
		ferdium_s4: string;
		copy_snippet: string;
		rambox_title: string;
		rambox_badge: string;
		rambox_desc: string;
		rambox_s1: string;
		rambox_s2: string;
		rambox_s3: string;
		rambox_s4: string;
		web_title: string;
		web_badge: string;
		web_desc: string;
		web_s1: string;
		web_s2: string;
		web_s3: string;
		web_s4: string;
		pc_title: string;
		pc_badge: string;
		pc_desc: string;
		pc_cmd_label: string;
		send_ping_btn: string;
		ping_received: string;
		close_btn: string;
	};
	command: {
		search_placeholder: string;
		no_results: string;
		category_core: string;
		category_operations: string;
		category_db: string;
		category_chatops: string;
		category_settings: string;
		nav_hint: string;
		select_hint: string;
	};
	user_nav: {
		oncall_role: string;
		it_support: string;
		signin: string;
		oncall_roster: string;
		roster_schedule: string;
		covered_branches: string;
		dashboard_queue: string;
		system_architecture: string;
		sign_out: string;
	};
};

const dictionaries: Record<Locale, Translations> = {
	id: {
		nav: {
			operations: "Operasional",
			overview: "Ringkasan Operasi",
			cockpit: "Cockpit Overview",
			queue: "Antrean Persetujuan",
			history: "Riwayat Eksekusi",
			inbound: "Pesan Masuk",
			agents: "AI Agents",
			hooks: "Client Hook Flows",
			contacts: "Kontak Saluran",
			databases: "Database & Telemetri",
			connectors: "Konektor DB",
			mcp: "Pengetahuan MCP",
			telemetry: "Telemetri Sistem",
			logs: "Log Sistem",
			settings: "Pengaturan",
			flows: "Platform Flows",
			about: "Tentang Kami",
			simulator: "Simulator",
			chatops_gateways: "ChatOps Gateways"
		},
		actions: {
			approve: "Setujui",
			reject: "Tolak",
			stage: "Stage ke Antrean",
			save: "Simpan Konfigurasi",
			cancel: "Batal",
			refresh: "Muat Ulang",
			search: "Cari data...",
			filter: "Filter",
			export: "Ekspor CSV",
			test_connection: "Uji Koneksi",
			apply: "Terapkan",
			run_inference: "Jalankan Inferensi",
			copy: "Salin",
			copied: "Tersalin",
			view_details: "Lihat Rincian",
			close: "Tutup",
			inspect: "Inspeksi",
			clear: "Bersihkan",
			confirm: "Konfirmasi",
			back: "Kembali",
			next: "Lanjut"
		},
		status: {
			pending: "Menunggu Persetujuan",
			approved: "Disetujui",
			rejected: "Ditolak",
			executed: "Tereksekusi",
			failed: "Gagal",
			online: "ONLINE",
			offline: "OFFLINE",
			connected: "Terhubung",
			disconnected: "Terputus",
			healthy: "Optimal",
			active: "Aktif",
			standby: "Standby",
			whitelisted: "Terverifikasi"
		},
		agents: {
			hub_title: "AI Agents Hub",
			hub_subtitle: "Manajemen integrasi model penalaran Hermes 3 (Cognitive Extraction) dan agen otonom OpenClaw (Browser Automation).",
			hermes_title: "Hermes 3 Reasoning Agent",
			hermes_badge: "8B LLM BRAIN",
			openclaw_title: "OpenClaw Autonomous Agent",
			openclaw_badge: "BROWSER & CHANNELS",
			reasoning_contract: "Kontrak Penalaran",
			reasoning_thought: "Penalaran Kognitif (<thought>):",
			tool_arguments: "Ekstraksi Parameter Terstruktur (<tool_call>):",
			stage_ticket: "Stage ke Antrean Approval (PostgreSQL)",
			prompt_label: "Pesan / Perintah Chat:",
			prompt_placeholder: "Ketik instruksi chat WhatsApp/Telegram...",
			branch_context: "Konteks Cabang Regional:",
			presets_label: "Preset Skenario Percakapan:",
			gateway_service: "Gateway Service",
			browser_driver: "Driver Browser",
			safety_gate: "Supervisor Gate",
			task_capacity: "Kapasitas Worker",
			task_registry: "Daftar Tugas Otonom (Task Registry)",
			task_instruction: "Instruksi Tugas (Prompt Eksekusi):",
			dispatch_to_openclaw: "Kirim ke OpenClaw",
			stage_to_approval: "Stage ke Approval",
			model_architecture: "Arsitektur Model",
			execution_mode: "Mode Eksekusi",
			offline_resilience: "Ketahanan Offline",
			offline_resilience_sub: "Fallback offline tanpa downtime",
			cli_detected: "TERDETEKSI",
			cli_active: "ENGINE AKTIF",
			cli_using: "Menggunakan CLI",
			cli_activate: "Gunakan Engine CLI",
			config_title: "Konfigurasi Endpoint & Model Hermes",
			config_subtitle: "Koneksi lokal ke instance Ollama, vLLM, atau wrapper CLI Hermes.",
			save_config: "Simpan Konfigurasi",
			saving: "Menyimpan...",
			saved: "Konfigurasi LLM berhasil disimpan ke runtime NovaPilot!",
			mode_label: "Mode Eksekusi",
			mode_auto: "Auto (Prioritas Ollama HTTP, Fallback Heuristic)",
			mode_cli: "CLI Native (hermes.cmd)",
			mode_http: "HTTP Dedicated (Ollama / vLLM)",
			base_url_label: "Base URL API",
			model_name_label: "Nama Model LLM",
			cli_path_label: "Path CLI Executable",
			interactive_console: "Konsol Prompt Interaktif",
			prompt_label_chat: "Pesan / Perintah Chat:",
			branch_context_label: "Konteks Cabang Regional:",
			run_inference: "Jalankan Inferensi",
			running_inference: "Menganalisis Penalaran...",
			inference_result: "Hasil Inferensi & Ekstraksi",
			copy_code: "Salin",
			copied: "Tersalin!",
			staging_ticket_queue: "Stage ke Antrean Approval (PostgreSQL)",
			staging_in_progress: "Menyimpan Tiket...",
			prompt_hint: 'Ketik prompt dan klik "Jalankan Inferensi" untuk melihat penalaran Hermes 3.',
			openclaw_config_title: "Konfigurasi Gateway & Driver Browser",
			openclaw_config_desc: "Parameter koneksi ke service OpenClaw dan instance headless browser.",
			openclaw_test_endpoint: "Test Endpoint",
			browser_mode_label: "Mode Browser Chromium",
			openclaw_disconnected_title: "OpenClaw Gateway belum terdeteksi aktif di {url}",
			openclaw_disconnected_desc: "NovaPilot siap mengintegrasikan alur tugas otonom. Untuk mengaktifkan eksekusi browser Playwright lokal, jalankan perintah berikut di terminal:",
			check_connection: "Cek Ulang Koneksi",
			checking: "Mengecek...",
			auto_reply_card_title: "AI Auto-Generate Reply Chat",
			auto_reply_card_subtitle: "Konfigurasi mesin otomatisasi respons balasan chat berbasis Hermes 3 & Fallback Heuristik untuk WhatsApp & Omnichannel.",
			auto_reply_toggle_label: "Aktifkan Balasan Otomatis AI (Auto-Reply)",
			auto_reply_toggle_desc: "Jika aktif, AI secara cerdas menghasilkan draf balasan kontekstual dan dapat membalas langsung ke nomor WhatsApp/grup.",
			auto_reply_mode_label: "Mode Pemicu Respons",
			auto_reply_mode_smart: "Smart Auto (Konfirmasi Mutasi, Kueri ERP & Klarifikasi Sopan)",
			auto_reply_mode_actionable: "Hanya Mutasi Faktur (Actionable Only)",
			auto_reply_mode_all: "Semua Pesan (Termasuk Sapaan & Obrolan Santai)",
			auto_reply_mode_manual: "Manual Clearance (Hanya Buat Draf Balasan di Dashboard)",
			auto_reply_tone_label: "Gaya Bahasa Respons (Tone)",
			auto_reply_tone_professional: "Formal Korporat (SOP Baku & Audit-Ready)",
			auto_reply_tone_friendly: "Ramah & Cepat (Bahasa Percakapan Santun)",
			auto_reply_tone_concise: "Ringkas Operasional (Format Singkat ChatOps)",
			auto_reply_prefix_label: "Awalan Bot (Prefix)",
			auto_reply_lang_label: "Bahasa Balasan",
			auto_reply_lang_auto: "Deteksi Otomatis (Mengikuti Bahasa Pesan)",
			auto_reply_lang_id: "Bahasa Indonesia",
			auto_reply_lang_en: "English (International)",
			auto_reply_sandbox_title: "Sandbox Pengujian Auto-Generate Balasan AI",
			auto_reply_sandbox_desc: "Ketik simulasi pesan masuk dari WhatsApp/grup untuk melihat dan menguji respons instan yang digenerate oleh AI.",
			auto_reply_generate_btn: "Generate Balasan AI",
			auto_reply_generating: "Menghasilkan Balasan...",
			auto_reply_result_label: "Hasil Balasan yang Digenerate AI",
			auto_reply_test_dispatch: "Kirim Balasan Uji ke WhatsApp",
			auto_reply_dispatched: "Terkirim ke WhatsApp!"
		},
		overview: {
			guardrail_title: "Guardrail Assurance & Intake Engine",
			active_guard: "Active Guard",
			guardrail_desc: "Validasi otomatis mutasi faktur terhadap batasan skema dan proteksi injeksi raw SQL/NoSQL.",
			sse_live: "SSE Live EventBus",
			sse_offline: "SSE Terputus",
			refresh: "Muat Ulang",
			stage_simulator: "Stage via Simulator",
			kpi_pending: "Mutasi Tertunda",
			kpi_pending_sub: "Menunggu persetujuan on-call",
			kpi_executed: "Tereksekusi Hari Ini",
			kpi_executed_sub: "Tersimpan ke database",
			kpi_rejected: "Permintaan Ditolak",
			kpi_rejected_sub: "Pelanggaran SOP diblokir",
			kpi_safety: "Tingkat Keamanan",
			kpi_safety_sub: "Bebas raw SQL langsung",
			queue_preview_title: "Antrean Persetujuan Terbaru",
			queue_preview_desc: "Tiket mutasi faktur yang memerlukan verifikasi manual.",
			history_preview_title: "Riwayat Eksekusi Terbaru",
			history_preview_desc: "Transaksi mutasi yang baru saja disetujui dan diaudit.",
			view_all: "Lihat Semua",
			empty_queue: "Beres! Tidak ada tiket tertunda dalam antrean.",
			empty_history: "Belum ada riwayat eksekusi.",
			pipeline_title: "Alur Ingesti Real-Time:",
			pipeline_standby: "Mode Siaga",
			expand_pipeline: "Buka Detail Alur",
			fold_pipeline: "Tutup ke Ringkasan Alur",
			needs_review_title: "{count} Pesan Masuk Memerlukan Review Operator",
			needs_review_desc: "Pesan masuk terdeteksi memuat instruksi mutasi tanpa nomor faktur eksplisit.",
			review_stage_btn: "Review & Buat Tiket",
			traffic_title: "Tren Operasional & Trafik Masuk Lintas Kanal",
			traffic_badge: "METRIK 7 HARI",
			traffic_subtitle: "Volume pesan harian, perbandingan intake otomatis vs persetujuan operator, dan distribusi kanal.",
			cockpit_btn: "Cockpit Overview [Metrik AI] →",
			chart_volume_title: "Volume Pesan Masuk vs Tiket Tereksekusi",
			chart_total_intake: "Total Intake",
			chart_approved: "Mutasi Disetujui (MCP)",
			channel_share_title: "Pangsa Kanal ChatOps",
			channel_total_ingress: "500 Total Ingress"
		},
		cockpit: {
			title: "Cockpit Overview & Analitik AI",
			subtitle: "Analisa komprehensif performa inferensi AI, akurasi OCR Tesseract, visualisasi sirkuit ChatOps, dan invariant transaksi SQL.",
			preview_notice_title: "Mode Pratinjau Model & Evaluasi (Synthetic Preview):",
			preview_notice_desc: "Metrik di halaman ini merefleksikan benchmark operasional NovaPilot AI (Tesseract Vision + Local Small LLM Gatekeeper + PostgreSQL 18 Local). Data telah dikurasi untuk simulasi beban kerja pabrik dan audit compliance.",
			intent_accuracy: "AKURASI INTENT",
			intent_accuracy_sub: "Ekstraksi entitas model Hermes 3",
			ocr_precision: "PRESISI OCR TESSERACT",
			ocr_precision_sub: "Ekstraksi digit gambar faktur",
			avg_latency: "RATA-RATA LATENSI PIPELINE",
			avg_latency_sub: "Dari pesan masuk hingga tiket staged",
			gatekeeper_block_rate: "TINGKAT BLOKIR GATEKEEPER",
			gatekeeper_block_rate_sub: "Akses raw SQL ilegal dicegah",
			circuit_title: "Topologi Ingress ChatOps & Pool Database",
			circuit_desc: "Sirkuit arsitektur interaktif real-time yang menampilkan aliran telemetri antara daemon pesan, inferensi AI, dan koneksi database.",
			benchmark_title: "Matrix Benchmark & Evaluasi Model",
			benchmark_desc: "Komparasi akurasi inferensi antara model penalaran lokal dan cloud."
		},
		queue: {
			title: "Antrean Persetujuan",
			subtitle: "Perbandingan diff verifikasi berdampingan untuk permintaan mutasi pesan masuk. Bersertifikasi zero raw SQL.",
			search_placeholder: "Cari nomor tiket, faktur, nama pelanggan, teks pesan...",
			all_branches: "Semua Cabang Regional",
			all_confidence: "Semua Tingkat Keyakinan",
			high_confidence: "Keyakinan Tinggi (≥ 90%)",
			needs_review: "Perlu Review Manual (< 90%)",
			sort_newest: "Terbaru Dulu",
			sort_oldest: "Terlama Dulu",
			sort_confidence: "Keyakinan Tertinggi",
			no_pending: "Tidak Ada Tiket Tertunda",
			no_pending_desc: "Antrean bersih! Semua permintaan pesan masuk telah selesai ditinjau.",
			no_match_desc: "Tidak ada tiket yang cocok dengan filter pencarian aktif. Coba bersihkan filter.",
			clear_filters: "Bersihkan Semua Filter",
			send_simulated: "Kirim Percakapan Simulasi",
			received: "Diterima",
			current_db_state: "KONDISI DATABASE SAAT INI",
			proposed_mutation: "MUTASI YANG DIAJUKAN",
			proof_attachments: "Lampiran Bukti:",
			inspect_plan: "Inspeksi Rencana",
			reject: "Tolak",
			approve_mutate: "Setujui & Mutasikan",
			ai_confidence: "Keyakinan AI"
		},
		history: {
			title: "Riwayat Eksekusi & Jejak Audit",
			records_count: "catatan audit",
			subtitle: "Catatan anti-manipulasi dari mutasi yang ditandatangani, penolakan kebijakan, dan skrip kompensasi rollback.",
			export_json: "Ekspor JSON",
			refresh: "Muat Ulang",
			total_executed: "Total Tereksekusi",
			total_executed_sub: "Tersimpan dengan zero raw SQL",
			policy_rejections: "Penolakan Kebijakan",
			policy_rejections_sub: "Memblokir periode pembukuan tertutup",
			rollback_safety: "Keamanan Rollback",
			rollback_safety_sub: "Skrip inversi telah dihitung otomatis",
			table_title: "Tabel Rekam Jejak Eksekusi (Execution Audit Log)",
			table_subtitle: "Log mutasi ERP yang telah diaudit, ditandatangani oleh operator, dilengkapi skrip rollback dan verifikasi status.",
			search_placeholder: "Cari nomor tiket, no faktur, nama cabang, atau penandatangan...",
			empty_message: "Tidak ditemukan rekam jejak audit yang sesuai",
			col_ticket: "Tiket #",
			col_doc: "No Faktur / Dokumen",
			col_branch: "Cabang / Hub",
			col_mutation: "Target Mutasi ERP",
			col_status: "Status Audit",
			col_approved_by: "Penandatangan",
			col_executed_at: "Waktu Eksekusi",
			col_actions: "Aksi / Rollback",
			filter_all: "Semua Status",
			filter_executed: "EXECUTED (Tereksekusi)",
			filter_rejected: "REJECTED (Ditolak)",
			filter_approved: "APPROVED (Disetujui)",
			modal_rollback_title: "Skrip Kompensasi Rollback SQL (Atomic Safe)",
			modal_copy_script: "Salin Skrip",
			modal_copied: "Tersalin!",
			modal_raw_msg: "Pesan Awal ChatOps:",
			modal_close: "Tutup",
			originally: "Semula:",
			rollback_btn: "Rollback"
		},
		modals: {
			inspect_title: "Rencana Mutasi:",
			target_engine: "Rencana Engine Target:",
			relational_sql: "SQL Relasional",
			non_relational_bson: "BSON Non-Relasional",
			zero_sql_guard: "Bersertifikasi Zero Raw SQL Guard",
			diff_title: "Diff Verifikasi Berdampingan",
			current_val: "NILAI DB SAAT INI:",
			proposed_val: "NILAI BARU YANG DIAJUKAN:",
			prepared_query: "QUERY PARAMETER TERSIAPKAN (PostgreSQL 18):",
			rollback_script: "SKRIP ROLLBACK KOMPENSASI (Inversi Terhitung):",
			audit_metadata: "METADATA AUDIT & KEAMANAN:",
			close: "Tutup Inspektor",
			reject_title: "Tolak Permintaan Mutasi",
			reject_desc: "Menolak tiket {ticket_no} ({doc_no}). Tindakan ini dicatat permanen dalam audit trail dan dikirimkan kembali ke saluran chat cabang.",
			reason_label: "Alasan Penolakan:",
			reason_placeholder: "cth. Faktur berstatus CLOSED dalam pembukuan akhir bulan; tidak memenuhi SOP koreksi.",
			cancel: "Batal",
			confirm_reject: "Konfirmasi Penolakan",
			rejecting: "Menolak...",
			confidence: "Tingkat Keyakinan",
			document_num: "Dokumen #",
			target_field: "Target:",
			sql_prepared_label: "Parameterized SQL Prepared Statement (PostgreSQL / Oracle):",
			bson_command_label: "Perintah BSON Kompensasi (MongoDB / Document Store):",
			orig_inbound_msg: "Pesan Masuk Asli:"
		},
		messages: {
			title: "Pesan Masuk Saluran (Inbound)",
			subtitle: "Aliran pesan real-time dari gateway WhatsApp, Telegram, Discord, dan Slack dengan klasifikasi intent AI.",
			search_placeholder: "Cari pengirim, teks pesan, faktur terekstraksi...",
			all_platforms: "Semua Platform",
			all_classes: "Semua Klasifikasi",
			actionable: "Actionable",
			needs_review: "Perlu Tinjauan",
			casual_banter: "Santai (Non-ops)",
			stage_ticket: "Stage ke Tiket",
			learn_pattern: "Pelajari Pola",
			open_terminal: "Terminal Daemon",
			no_messages: "Tidak Ada Pesan Masuk",
			no_messages_desc: "Menunggu pesan baru dari platform chat yang terhubung.",
			total_messages_kpi: "Total Pesan",
			total_messages_sub: "Paket pesan terproses di semua platform",
			actionable_kpi: "Tiket Siap Eksekusi",
			actionable_sub: "Faktur cocok & otomatis masuk antrean",
			needs_review_kpi: "Perlu Review",
			needs_review_sub: "Niat mutasi terdeteksi tanpa nomor dokumen",
			casual_banter_kpi: "Percakapan Kasual",
			casual_banter_sub: "Percakapan tersaring tanpa mutasi database",
			terminal_btn: "Exec Terminal WA Gateway",
			pattern_memory_btn: "🧠 Memory Pola AI",
			hermes_engine_btn: "Hermes 3 AI Engine",
			platform_flows_btn: "Platform Flows"
		},
		contacts: {
			title: "Direktori Saluran Ingress & Kontak ChatOps",
			subtitle: "Manajemen grup WhatsApp cabang, hotline darurat perorangan, dan saluran bot yang terintegrasi dengan filter AI Guardrail.",
			monitoring_active: "MONITORING AKTIF",
			add_contact: "Tambah Kontak / Grup",
			e2e_flow: "Lihat Alur E2E Flow",
			search_placeholder: "Cari grup, cabang, penanggung jawab, JID...",
			filter_platform: "Platform",
			filter_status: "Status",
			active: "Aktif",
			whitelisted: "Terverifikasi",
			total_messages: "Total Pesan",
			latency: "Latensi",
			last_active: "Aktivitas Terakhir",
			topology_title: "Topologi Aliran Ingress Saluran & Whitelist Gatekeeper",
			topology_subtitle: "Visualisasi rute pesan masuk dari saluran grup & hotline menuju filter AI Guardrail.",
			inbound_stream: "Aliran Masuk:",
			verified_channels: "Saluran Terverifikasi",
			stat_channels: "Saluran Terdaftar",
			stat_groups: "Grup WA",
			stat_hotlines: "Hotline Kontak",
			stat_health: "Monitoring Health",
			stat_uptime: "Uptime Ingress Socket",
			stat_yield: "Traffic & Tiket Yield",
			stat_staged_tickets: "Tiket staging terverifikasi AI",
			stat_gatekeeper: "Whitelist Gatekeeper",
			stat_muted: "saluran dalam status muted/standby",
			table_title: "Tabel Manajemen Saluran & Kontak",
			table_subtitle: "Daftar lengkap grup dan kontak dengan pencarian multi-kolom, filter jenis, pengurutan, dan ekspor instan.",
			table_search_placeholder: "Cari nama grup/kontak, cabang, nomor HP, atau JID...",
			col_channel: "Saluran & Identitas",
			col_platform: "Platform",
			col_jid: "JID / Identifier",
			col_probe: "Monitoring Probe",
			col_telemetry: "Volume Telemetry",
			col_whitelist: "Whitelist Intake",
			col_actions: "Aksi",
			filter_group: "Grup WhatsApp (@g.us)",
			filter_individual: "Kontak Perorangan (@s.whatsapp.net)",
			empty_table: "Tidak ditemukan saluran atau kontak yang cocok",
			action_sim: "Simulasi",
			action_sent: "Terkirim",
			action_delete: "Hapus saluran ini dari direktori",
			modal_add_title: "Tambah Saluran Ingress Baru",
			modal_add_subtitle: "Daftarkan grup atau kontak perorangan ke whitelist direktori.",
			channel_type: "Tipe Saluran Ingress",
			type_group: "Grup Cabang / Divisi",
			type_group_sub: "Target: @g.us",
			type_individual: "Kontak Hotline PIC",
			type_individual_sub: "Target: @s.whatsapp.net",
			platform_label: "Platform Pesan",
			channel_name: "Nama Saluran / Identitas Resmi",
			name_placeholder_group: "mis. Ops Cabang Semarang & Gudang",
			name_placeholder_individual: "mis. Budi Wicaksono (Lead AR Finance)",
			jid_label: "JID / Identifier Saluran",
			jid_guide_open: "Dari mana dapat ID ini?",
			jid_guide_close: "Tutup Panduan",
			auto_convert_phone: "Konversi otomatis No. HP PIC ({phone}) ke JID",
			branch_label: "Cabang / Regional Hub",
			branch_impact_title: "Pengaruh Cabang terhadap Database:",
			branch_impact_desc: "Saluran ini akan dipetakan ke branch_id di tabel branches & invoices. Sistem AI Guardrail memvalidasi apakah pengirim pesan memiliki wewenang atas faktur cabang tersebut, mencegah mutasi tidak sah lintas wilayah (Cross-Branch Protection).",
			pic_name: "Nama PIC / Penanggung Jawab",
			pic_phone: "Nomor Telepon / Handle",
			auto_whitelist_label: "Otomatiskan Whitelist Intake",
			auto_whitelist_desc: "Pesan yang masuk dari saluran ini langsung diproses Guardrail.",
			cancel: "Batal",
			save_channel: "Simpan Saluran",
			modal_delete_title: "Hapus Saluran dari Direktori?",
			modal_delete_desc: "Tindakan ini akan mencabut izin saluran dari ingress filter.",
			delete_warning: "Pesan masuk atau gambar faktur dari saluran ini selanjutnya akan diabaikan dan tidak dibuatkan tiket staging.",
			confirm_delete: "Ya, Hapus Saluran",
			roster_badge: "ROSTER ANGGOTA",
			roster_notice_title: "Resolusi Pengirim Multi-Device (`msg.key.participant`)",
			roster_notice_desc: "Ketika pesan masuk ke grup WhatsApp ini, gateway secara granular membaca nomor HP pengirim individual. Anggota bertanda Whitelisted dapat langsung memicu staging tiket AI tanpa disaring keluar.",
			search_member: "Cari nama anggota, nomor telepon/JID, atau role...",
			total_members: "Total: {count} Anggota",
			admin_count: "Admin",
			oncall_count: "On-Call PIC",
			no_members_found: "Tidak ditemukan anggota",
			close_roster: "Selesai & Tutup"
		},
		connectors: {
			title: "Konektor Database & Pool Koneksi",
			subtitle: "Kelola koneksi ke database transaksional utama PostgreSQL 18 dan database referensi sekunder (SAP, Oracle, MySQL, SQL Server).",
			tab_system: "DB Sistem Utama",
			tab_mcp: "DB Referensi MCP",
			tab_tools: "Skema & Alat",
			tab_env: "String Koneksi",
			test_connection: "Uji Koneksi",
			apply_changes: "Terapkan Perubahan",
			pool_stats: "Metrik Pool Koneksi",
			open_connections: "Koneksi Terbuka",
			in_use: "Sedang Dipakai",
			idle: "Tersedia",
			max_open: "Batas Maksimal"
		},
		mcp: {
			title: "Pengetahuan & Alat MCP (Model Context Protocol)",
			subtitle: "Kontekstualisasi standar dan direktori alat enterprise agar agen penalaran AI dapat berinteraksi secara aman dengan data bisnis.",
			tab_dual_db: "Arsitektur Dual DB",
			tab_resources: "Sumber Konteks",
			tab_tools: "Alat Skema",
			tab_playground: "Playground Agen",
			sop_policy: "Kebijakan SOP Support Pabrik",
			branches_directory: "Direktori Cabang",
			execute_tool: "Jalankan Alat"
		},
		telemetry: {
			title: "Telemetri Sistem & Probe Platform",
			subtitle: "Diagnostik daemon tingkat rendah, konsumsi memori, konkurensi goroutine, dan kesehatan soket chat aktif.",
			service_status: "Status Layanan",
			uptime: "Masa Aktif",
			memory_rss: "Alokasi Memori",
			goroutines: "Goroutine Aktif",
			test_ping: "Kirim Probe Ping Telemetri",
			ping_success: "Probe ping berhasil dikirim!",
			how_to_integrate: "Cara Integrasi",
			lan_ingress_ip: "IP Ingress LAN",
			lan_port_active: "Port HTTP 8088 Aktif",
			go_memory_alloc: "Alokasi Memori Go",
			low_footprint: "Runtime footprint rendah",
			active_goroutines: "Goroutine Aktif",
			sse_duplex: "Penyiar dupleks SSE",
			server_status: "Status Server",
			online: "ONLINE",
			uptime_label: "Masa Aktif: {min} mnt",
			db_pool_telemetry: "Telemetri Connection Pool Database",
			driver_label: "Driver:",
			open_connections: "Koneksi Terbuka:",
			idle_connections: "Koneksi Menganggur:",
			in_use_concurrency: "Konkurensi Digunakan:",
			chatops_ingress_telemetry: "Telemetri Ingress Platform ChatOps",
			realtime_diagnostics: "Metrik runtime real-time, probe heartbeat soket, dan diagnostik throughput paket.",
			socket_latency: "Probe Latensi Soket",
			tcp_roundtrip: "Roundtrip TCP",
			events_captured: "Peristiwa Ditangkap",
			total_inbound: "Total Inbound",
			queue_backpressure: "Backpressure Antrean",
			buffer_depth: "Kedalaman Buffer Nominal",
			filter_efficiency: "Efisiensi Filter Edge",
			zero_token_waste: "0 Drop Pemborosan Token",
			telemetry_state: "Status Telemetri:",
			send_probe_ping: "Kirim Probe Ping Uji",
			sending_probe: "Mengirim...",
			probe_ack: "Probe ping diakui! Paket uji dimasukkan ke Antrean Persetujuan."
		},
		logs: {
			title: "Log Sistem Enterprise & Telemetri Daemon",
			subtitle: "Aliran peristiwa audit langsung, peringatan keamanan, dan diagnostik daemon sistem.",
			search_placeholder: "Cari pesan log, nama layanan, error...",
			all_levels: "Semua Level",
			all_services: "Semua Layanan",
			auto_scroll: "Scroll Otomatis",
			pause_stream: "Jeda Aliran",
			resume_stream: "Lanjutkan Aliran",
			clear_logs: "Bersihkan Aliran",
			export_logs: "Ekspor Log",
			total_entries: "Total Entri:",
			no_logs_match: "Tidak ada log yang cocok dengan filter aktif."
		},
		settings: {
			title: "Pengaturan Sistem & Kebijakan Gatekeeper",
			subtitle: "Konfigurasi komprehensif pipeline AI, ambang batas SOP finansial, multiplatform ChatOps, dan arsitektur Dual-DB.",
			enterprise_badge: "ENTERPRISE v2.4",
			export_json: "Ekspor JSON",
			reset_default: "Reset Default",
			save_changes: "Simpan Perubahan",
			saving: "Menyimpan...",
			saved: "Tersimpan!",
			saved_toast: "Seluruh konfigurasi sistem, kebijakan SOP, dan preferensi konektor berhasil disimpan ke penyimpanan lokal.",
			synced: "Tersinkronisasi",
			reset_confirm_title: "Apakah Anda yakin ingin mereset seluruh preferensi dan kebijakan ke nilai default pabrik? Tindakan ini tidak dapat dibatalkan.",
			cancel: "Batal",
			confirm_reset: "Ya, Reset Sekarang",
			tab_gatekeeper: "Gatekeeper SOP",
			tab_ai: "Model AI & Guardrails",
			tab_chatops: "ChatOps & Gateway",
			tab_database: "Dual-DB & MCP",
			tab_alerts: "Alert & Notifikasi",
			tab_interface: "Cockpit UI",
			threshold_title: "Batas Threshold Nilai Faktur Tinggi (High-Value Policy)",
			threshold_desc: "Faktur di atas nilai ini mewajibkan persetujuan ganda (Two-Man Rule / Supervisor Override).",
			supervisor_override: "Wajibkan Persetujuan Supervisor",
			supervisor_override_desc: "Mutasi faktur di atas ambang batas hanya dapat disetujui akun bertingkat Supervisor.",
			block_closed: "Blokir Revisi Faktur Periode CLOSED",
			block_closed_desc: "Otomatis tolak jika status audit faktur sudah tutup buku akuntansi.",
			auto_approve_low_risk: "Otomatisasi Persetujuan Koreksi Risiko Rendah",
			auto_approve_low_risk_desc: "Khusus koreksi ejaan nama tanpa mengubah nominal atau item faktur.",
			mandatory_audit_reason: "Wajibkan Catatan Audit Alasan Penolakan",
			mandatory_audit_reason_desc: "Operator wajib mengisi alasan minimum 10 karakter saat menolak tiket mutasi.",
			rate_limit: "Batas Frekuensi Permintaan Saluran",
			rate_limit_desc: "Jumlah permintaan mutasi maksimal per saluran per menit untuk mencegah spam bot.",
			ai_engine_title: "Mesin Penalaran AI & Konfigurasi LLM",
			ai_engine_desc: "Pilih penyedia model bahasa besar untuk ekstraksi intent dan pembuatan rencana query SQL.",
			model_provider: "Penyedia Model AI",
			api_key: "Kunci API (API Key)",
			api_endpoint: "Endpoint Kustom / URL Gateway",
			temperature: "Suhu Inferensi (Temperature / Determinisme)",
			confidence_threshold: "Ambang Batas Minimum Keyakinan AI",
			injection_defense: "Pertahanan Prompt Injection & Jailbreak Guard",
			injection_defense_desc: "Saring upaya override instruksi sistem dalam pesan obrolan pengguna.",
			strict_json: "Validasi Skema Output JSON Ketat",
			strict_json_desc: "Tolak respons AI yang tidak mematuhi skema JSON parameter mutasi.",
			rag_grounding: "Grounding Pengetahuan SOP Pabrik (MCP)",
			rag_grounding_desc: "Berikan konteks aturan bisnis pabrik ke model AI saat penalaran intent.",
			chatops_title: "Gerbang Obrolan Multiplatform (Ingress Gateways)",
			chatops_desc: "Konfigurasi konektor perpesanan WhatsApp, Telegram, Discord, dan Slack.",
			wa_gateway_url: "URL Gateway WhatsApp (Baileys Hook)",
			auto_reply: "Aktifkan Balasan Otomatis Konfirmasi Tiket",
			auto_reply_desc: "Kirim pesan balasan ke pengirim saat tiket baru berhasil dibuat.",
			auto_reply_template: "Templat Teks Balasan Otomatis",
			auto_ocr: "Aktifkan Ekstraksi Gambar Faktur Otomatis (OCR)",
			auto_ocr_desc: "Gunakan Tesseract OCR untuk membaca foto faktur yang dikirim operator.",
			whitelisted_groups: "Daftar Putih ID Grup (Whitelist JIDs)",
			blacklisted_jids: "Daftar Hitam Nomor Spam (Blacklist JIDs)",
			telegram_token: "Token Bot Telegram",
			telegram_chat_id: "ID Saluran / Obrolan Telegram",
			discord_webhook: "URL Webhook Discord",
			slack_webhook: "URL Webhook Slack Incoming",
			test_webhook: "Kirim Uji Ping Webhook",
			db_title: "Profil Koneksi Dual-DB & Parameter MCP",
			db_desc: "Konfigurasi koneksi langsung ke PostgreSQL 18 dan database ERP referensi sekunder.",
			pg_host: "Host PostgreSQL",
			pg_port: "Port PostgreSQL",
			pg_db: "Nama Database",
			pg_user: "Nama Pengguna (Username)",
			pg_password: "Kata Sandi (Password)",
			pg_max_conns: "Koneksi Maksimum (Max Connections)",
			pg_idle_conns: "Koneksi Menganggur (Idle Connections)",
			target_erp: "Sistem ERP Target Sekunder",
			mcp_endpoint: "Endpoint Layanan MCP",
			safe_dry_run: "Mode Dry-Run Keamanan (Uji Transaksi Tanpa Komit)",
			safe_dry_run_desc: "Jalankan mutasi dalam blok transaksi simulasi yang selalu di-rollback.",
			test_db_conn: "Uji Koneksi Database",
			alerts_title: "Peringatan Sistem, Notifikasi & Umpan Balik Audio",
			alerts_desc: "Atur sinyal suara saat pesan baru masuk, eskalasi tiket tertunda, dan notifikasi browser.",
			sound_alerts: "Efek Suara Tiket Masuk & Aksi",
			sound_alerts_desc: "Mainkan sinyal audio Web Audio synthesizer saat ada mutasi baru.",
			test_sound: "Uji Suara",
			sound_volume: "Volume Suara Efek",
			nav_sound: "Efek Suara Klik Navigasi Menu",
			nav_sound_desc: "Mainkan klik tactile saat berpindah halaman dan menekan tombol kontrol.",
			test_nav_click: "Uji Klik",
			push_alerts: "Notifikasi Push Browser",
			push_alerts_desc: "Tampilkan notifikasi desktop saat ada tiket berisiko tinggi masuk antrean.",
			escalation: "Eskalasi Otomatis Tiket Nilai Tinggi",
			escalation_desc: "Kirim notifikasi darurat jika tiket di atas batas threshold belum ditinjau.",
			idle_minutes: "Batas Waktu Menunggu Peninjauan (Menit)",
			ui_title: "Pengaturan Antarmuka Cockpit & Tampilan Data",
			ui_desc: "Sesuaikan kerapatan tabel data, frekuensi penyegaran telemetri, dan format ekspor.",
			compact_table: "Tampilan Baris Tabel Rapat (Compact Mode)",
			compact_table_desc: "Kurangi padding baris tabel untuk menampilkan lebih banyak entri per layar.",
			telemetry_rate: "Frekuensi Penyegaran Telemetri Otomatis",
			session_lock: "Kunci Otomatis Sesi Peninjau",
			export_format: "Format Ekspor Default Berkas Laporan"
		},
		simulator: {
			title: "Simulator Ingesti ChatOps",
			subtitle: "Sandbox pengujian interaktif untuk menginjeksi pesan sintetis WhatsApp/Telegram ke pipeline ingesti dan penalaran.",
			banner_title: "MODUL SIMULATOR DALAM STATUS [EXPERIMENTAL]",
			banner_desc: "Simulator ini memicu injeksi payload pengujian sintetis ke pipeline backend tanpa memerlukan pesan chat fisik dari smartphone. Gunakan modul ini untuk pengujian fungsionalitas OCR dan ekstraksi intent pada lingkungan staging.",
			run_simulation: "Jalankan Seluruh Pipeline Ingesti",
			step_1: "1. Ingesti Pesan Masuk",
			step_2: "2. Penalaran AI Hermes 3",
			step_3: "3. Parameterisasi SQL",
			step_4: "4. Stage ke Antrean Persetujuan",
			chat_msg_label: "Pesan Chat WhatsApp Simulasi:",
			branch_source_label: "Cabang Sumber:",
			invoice_target_label: "No Faktur Target:",
			value_target_label: "Nilai Mutasi Target:",
			exec_pipeline_btn: "Jalankan Pipeline Ingesti Real-Time",
			executing_pipeline: "Mengeksekusi Pipeline Ingesti..."
		},
		about: {
			badge: "NOVAPILOT AI • CHATOPS GATEKEEPER v1.0.0",
			title: "Tentang NovaPilot AI & Tim Pengembang",
			subtitle: "Sistem ChatOps AI otonom kelas enterprise yang bertindak sebagai Human-in-the-Loop Gatekeeper untuk melindungi database bisnis (ERP) dari halusinasi bot chat dan akses SQL langsung.",
			open_github: "Buka GitHub Repo",
			copy_clone: "Salin Perintah Git Clone",
			copied: "Tersalin ke Clipboard!",
			architecture_title: "Arsitektur Enterprise & Teknologi",
			creator_title: "Kreator & Pengembang"
		},
		common: {
			loading: "Memuat...",
			no_data: "Tidak ada data yang tersedia",
			all: "Semua",
			records: "data",
			page: "Halaman",
			of: "dari",
			rows_per_page: "Baris per halaman:",
			language: "Bahasa",
			theme: "Tema",
			sound: "Efek Suara",
			public_home: "Beranda Publik (/)",
			system_flow: "Alur Sistem (/flow)",
			launch_cockpit: "Buka Cockpit On-Call",
			oncall_assistant: "Asisten Operasional On-Call",
			zero_sql_certified: "Tersertifikasi Zero Raw SQL",
			universal_lts: "Enterprise LTS Universal",
			multichannel_chatops: "ChatOps Multi-Saluran",
			jump_to: "Lompat ke:",
			filtered_from: "difilter dari",
			go: "Buka",
			showing: "Menampilkan"
		},
		landing: {
			pill_announcement: "Engine Guardrail Assurance Aktif",
			headline_main: "Nol mutasi tanpa verifikasi.",
			headline_gradient: "ChatOps on-call otonom.",
			subtitle: "NovaPilot mencerna eskalasi cabang WhatsApp yang kacau, memvalidasi mutasi database dengan zero raw SQL, dan memberi teknisi on-call cockpit persetujuan teraudit sekali klik yang aman untuk tidur nyenyak.",
			launch_cockpit: "Buka Cockpit On-Call",
			flow_and_hooks: "Alur Sistem & Hooks",
			circuit_arch: "Arsitektur Sirkuit Pipeline ChatOps",
			all_channels: "Semua Saluran",
			simulate_flow: "Simulasikan Alur Langsung",
			simulating_stage: "Memproses Tahap {stage}/4...",
			stage_1: "1. Ingesti Chat",
			stage_2: "2. Validasi Guardrail",
			stage_3: "3. Tanda Tangan Manusia",
			stage_4: "4. Siap Rollback",
			status_simulating: "Status: SIMULASI SEDANG BERJALAN",
			status_ready: "Status: SIAP UNTUK INGESTI",
			cockpit_mockup_title: "Cockpit on-call yang dirancang untuk giliran kerja berstres tinggi",
			cockpit_mockup_sub: "Setiap tiket tertunda menampilkan bukti asli WhatsApp, SQL terverifikasi AST, dan skor keyakinan sehingga Anda tidak perlu menebak pada jam 3 pagi.",
			tab_live_ticket: "Tiket Langsung",
			tab_zero_sql: "Zero Raw SQL",
			tab_auto_rollback: "Auto Rollback",
			medan_hub: "DISPATCH HUB MEDAN",
			medan_msg: "Pak John, tolong perbarui tarif pajak faktur INV-2024-8901 jadi 12%. Memo baru dari finance pusat. Makasih!",
			sender_info: "Pengirim: +62 812-4491-0021 · Grup: #ops-medan-dc",
			confidence_score: "Skor Keyakinan:",
			high_confidence: "KEYAKINAN TINGGI",
			target_doc: "DOKUMEN TARGET:",
			current_value: "Nilai Saat Ini",
			proposed_value: "Nilai yang Diajukan",
			approve_execute: "Setujui & Eksekusi Sekali Klik",
			reject: "Tolak",
			sql_preview_title: "Pratinjau Parameterized Query Ketat",
			dry_run_passed: "SIMULASI DRY-RUN LOLOS",
			zero_sql_note: "Tanpa konkatenasi string SQL mentah. Tipe parameter dan batas nilai diperiksa sebelum penguncian DB.",
			rollback_preview_title: "Skrip Rollback Kompensasi (Dihasilkan Otomatis)",
			instant_reversible: "DAPAT DIBALIKKAN INSTAN",
			rollback_note: "Snapshot rollback diarsipkan di PostgreSQL Audit Store. Dapat dieksekusi dalam 1 ketukan jika cabang membatalkan memo.",
			stat_turnaround: "30dtk",
			stat_turnaround_sub: "Rata-rata Waktu Penanganan",
			stat_safety: "100%",
			stat_safety_sub: "Keamanan Terparameterisasi",
			stat_unchecked: "0",
			stat_unchecked_sub: "Mutasi Tanpa Verifikasi",
			stat_hubs: "4 Hub",
			stat_hubs_sub: "Replika Pabrik DC",
			bento_title: "Dirancang untuk keandalan pabrik industri",
			bento_sub: "Dibangun khusus untuk pabrik industri misi-kritis di mana satu faktur korup dapat menghentikan jalur logistik.",
			bento_1_title: "Ingesti WhatsApp Pasif",
			bento_1_desc: "Hanya memantau grup cabang regional resmi. Tanpa spamming dan pola konfirmasi balasan tunggal yang sepenuhnya patuh pada Ketentuan Layanan Meta WhatsApp.",
			bento_2_title: "Guardrail Zero Raw SQL",
			bento_2_desc: "Setiap mutasi terikat secara ketat pada prepared statement dengan dry-run skema. Tidak ada interpolasi string mentah yang dapat mencapai replika PostgreSQL atau Oracle Anda.",
			bento_3_title: "Gerbang Human-in-the-Loop Ketat",
			bento_3_desc: "Nol mutasi langsung oleh AI. Teknisi on-call meninjau diff visual berdampingan dan menekan 'Setujui' untuk memicu prepared statement transaksional dengan jejak audit lengkap.",
			how_it_works_title: "Bagaimana NovaPilot mengamankan shift Anda",
			how_it_works_sub: "Tiga tahap jelas dari penerimaan pesan chat hingga komit database produksi yang dapat diverifikasi.",
			step_1_title: "Cegat & Ekstraksi",
			step_1_desc: "Hook WhatsApp mengekstrak nomor faktur, kolom target mutasi, dan nilai dengan skor keyakinan aktif di atas 85%.",
			step_2_title: "Simulasi Dry-Run",
			step_2_desc: "Engine menjalankan dry-run simulasi terhadap database, memverifikasi izin cabang, dan menyiapkan skrip auto-rollback.",
			step_3_title: "Persetujuan Manusia & Audit",
			step_3_desc: "Teknisi menyetujui perubahan melalui WebUI ramah seluler. Eksekusi transaksional atomik mencatat bukti permanen ke jejak audit.",
			faq_title: "Pertanyaan yang Sering Diajukan",
			faq_sub: "Semua yang perlu Anda ketahui tentang arsitektur keamanan, kepatuhan, dan integrasi NovaPilot.",
			faq_1_q: "Apakah NovaPilot pernah mengeksekusi SQL mentah tanpa escape secara langsung?",
			faq_1_a: "Tidak pernah. Setiap permintaan chat diurai menjadi parameter terstruktur dan diverifikasi terhadap templat prepared query yang telah ditentukan sebelumnya. Tanpa interpolasi string mentah, mencegah kerusakan skema yang tidak disengaja dan injeksi SQL.",
			faq_2_q: "Bagaimana NovaPilot terhubung ke WhatsApp tanpa terblokir?",
			faq_2_a: "NovaPilot menggunakan observer DOM sisi-klien pasif di dalam klien enterprise resmi (resep Ferdium, skrip Rambox, userscript browser, atau desktop observer). Sistem hanya memantau grup cabang internal resmi dan hanya mengirim balasan konfirmasi tunggal setelah persetujuan manusia.",
			faq_3_q: "Bisakah mutasi yang disetujui di-rollback dalam keadaan darurat?",
			faq_3_a: "Ya. Setiap mutasi tunggal secara otomatis menghasilkan skrip rollback invers kompensasi sebelum eksekusi. Teknisi on-call dapat memicu rollback sekali klik dari cockpit kapan saja.",
			faq_4_q: "Bagaimana akses dikontrol untuk teknisi on-call?",
			faq_4_a: "NovaPilot terintegrasi dengan Better Auth dan izin kriptografis berbasis sesi. Hanya personel on-call terautentikasi dengan token izin aktif yang dapat menyetujui mutasi tertunda."
		},
		flow: {
			title: "Alur Sistem & Arsitektur End-to-End",
			subtitle: "Dari eskalasi chat {platform} mentah hingga eksekusi prepared statement yang aman: bagaimana NovaPilot AI meniadakan kelelahan on-call sekaligus menjaga tata kelola database tanpa eror.",
			engine_pipeline: "Pipeline Mesin ChatOps",
			deterministic_badge: "100% Deterministik & Teraudit",
			simulate_ingestion: "Simulasikan Ingesti {platform} Langsung",
			simulating_stage: "Melewati Tahap 0{stage}/06...",
			get_api_key: "Dapatkan Kunci API {platform}",
			set_token_dashboard: "Atur Token di Dashboard",
			gw_daemon_title: "Daemon Layanan Gateway WhatsApp",
			gw_daemon_sub: "Socket listener Baileys di port 3002. Mencerna chat regional resmi dan mengirimkannya ke inti Golang NovaPilot.",
			gw_online: "ONLINE (:3002)",
			gw_offline: "BERHENTI / OFFLINE",
			gw_starting: "Meluncurkan layanan Gateway WhatsApp...",
			gw_restarting: "Memulai ulang daemon Gateway WhatsApp...",
			gw_stopping: "Menghentikan daemon Gateway WhatsApp...",
			gw_start_btn: "Mulai Layanan",
			gw_restart_btn: "Mulai Ulang Gateway",
			gw_stop_btn: "Hentikan",
			gw_port: "Port Daemon",
			gw_uptime: "Masa Aktif Proses",
			gw_memory: "Memori RSS",
			gw_whitelisted: "JID Masuk Daftar Putih",
			gw_terminal_btn: "Terminal & Ingress",
			active_circuit: "Sirkuit Aktif: Pemrosesan Tahap 0{stage}",
			prev_stage: "← Tahap Sebelumnya",
			next_stage: "Tahap Berikutnya →",
			root_mechanics: "Mekanika Eksekusi Inti:",
			contract_payload: "Kontrak Payload & Kode Eksekusi",
			code_desc: "Pratinjau skema JSON terstruktur atau cuplikan kode layanan backend.",
			copy_code: "Salin Kode",
			copied: "Tersalin!"
		},
		auth: {
			signin_title: "Masuk ke NovaPilot",
			signup_title: "Buat Akun On-Call",
			portal_subtitle: "Portal akses resmi untuk teknisi on-call TI pabrik dan penjaga integritas database.",
			google_btn: "Lanjutkan dengan Google Enterprise",
			divider_text: "atau lanjutkan dengan kredensial kerja",
			name_label: "Nama Lengkap",
			email_label: "Email Kerja Pabrik",
			password_label: "Kata Sandi",
			signin_btn: "Masuk ke Operasional",
			signup_btn: "Daftarkan Operator On-Call",
			autofill_demo: "Isi Otomatis Kredensial Demo (John Doe - On-Call)",
			need_credentials: "Perlu kredensial akses baru?",
			register_link: "Daftar",
			already_registered: "Sudah memiliki clearance on-call?",
			signin_link: "Masuk",
			unauthorized_error: "Akses Ditolak: Guardrail Middleware memblokir akses tanpa autentikasi ke Cockpit On-Call. Harap lakukan autentikasi di bawah ini.",
			logged_out_msg: "Anda telah keluar dengan aman. Token sesi dicabut.",
			session_guardrail: "Guardrail Sesi Better Auth Aktif"
		},
		platforms: {
			page_title: "Pengaturan Platform ChatOps & Alur Logika",
			page_subtitle: "Konfigurasikan kredensial, filter daftar putih, pembatasan kecepatan, dan logika penerimaan untuk setiap platform chat.",
			hub_badge: "Hub Multi-Saluran",
			select_method: "Pilih Metode Ingress / Koneksi WhatsApp:",
			verified_routes: "3 Metode Utama Terverifikasi",
			tab_wa_api: "WA API Scan",
			tab_wa_gateway: "WA Gateway (TOS)",
			tab_wa_web: "Web (PC & Desktop)",
			wa_gateway_qr: "WA Gateway (QR)",
			wa_web: "WhatsApp Web",
			wa_ferdium: "Ferdium Multi-Service",
			wa_rambox: "Rambox Desktop",
			api_title: "WhatsApp Cloud API (Meta Graph v21.0)",
			api_subtitle: "Integrasi resmi Meta dengan Webhook real-time dan generator QR Quick-Connect",
			api_phone_id: "Phone Number ID Meta",
			api_waba_id: "WhatsApp Business Account (WABA) ID",
			api_token: "Permanent System User Token (Bearer)",
			api_verify_token: "Webhook Verify Token",
			api_callback_url: "Webhook Callback URL",
			api_test_btn: "Uji Koneksi WhatsApp Cloud API",
			api_qr_title: "QR Quick-Connect Chat (wa.me)",
			api_qr_sub: "Scan QR berikut untuk langsung memulai obrolan ke nomor akun WhatsApp API",
			tos_modal_title: "Ketentuan Layanan & Disclaimer Risiko (TOS)",
			tos_modal_subtitle: "Persetujuan Wajib Operasional Baileys Multi-Device Gateway",
			tos_point_1_title: "1. Protokol Reverse-Engineered Unofficial",
			tos_point_1_desc: "Layanan Baileys menggunakan koneksi WhatsApp Web Multi-Device protokol non-resmi (Unofficial API) dan tidak berafiliasi resmi dengan Meta / WhatsApp LLC.",
			tos_point_2_title: "2. Risiko Pemblokiran Nomor (Account Ban)",
			tos_point_2_desc: "Penggunaan otomasi pesan berfrekuensi tinggi, blast massal, atau pesan spam dapat memicu sistem deteksi Meta yang mengakibatkan nomor Anda diblokir sementara atau permanen.",
			tos_point_3_title: "3. Khusus ChatOps Internal Perusahaan",
			tos_point_3_desc: "Gateway ini dirancang khusus untuk koordinasi internal cabang pabrik, notifikasi approval on-call, dan verifikasi faktur, bukan untuk pemasaran massal.",
			tos_point_4_title: "4. Tanggung Jawab Kepemilikan Akun",
			tos_point_4_desc: "Pengguna menyatakan memiliki hak penuh atas nomor seluler yang ditautkan dan membebaskan pengembang dari kerugian akibat pemblokiran akun oleh Meta.",
			tos_checkbox_label: "Saya telah membaca, memahami risiko pemblokiran, dan menyetujui Ketentuan Layanan (TOS) di atas.",
			tos_accept_btn: "Saya Setuju & Buka QR Code",
			tos_cancel_btn: "Batalkan",
			tos_locked_title: "Ketentuan Layanan & Risiko Wajib Disetujui",
			tos_locked_desc: "Demi keamanan akun operasional Anda, Anda wajib membaca dan menyetujui Ketentuan Layanan (TOS) sebelum memindai QR code Baileys.",
			tos_open_btn: "Buka & Setujui Ketentuan Layanan (TOS)",
			tos_view_btn: "Lihat Ketentuan Layanan (TOS)",
			tos_reset_btn: "Reset Persetujuan",
			tos_accepted_badge: "TOS Disetujui",
			pc_support_title: "100% Dukungan PC & Desktop Ready",
			pc_support_desc: "Mendukung browser PC (Chrome, Edge, Firefox), desktop aggregators (Ferdium, Rambox), dan background daemon di Windows / Linux.",
			qr_title: "Penyandingan QR Multi-Device Baileys",
			qr_subtitle: "Pindai QR langsung dari aplikasi seluler WhatsApp di ponsel Anda",
			qr_status_connected: "TERHUBUNG",
			qr_status_waiting: "MENUNGGU PINDAIAN",
			qr_status_loading: "MEMUAT...",
			qr_status_offline: "GATEWAY OFFLINE",
			qr_refresh_btn: "Segarkan QR",
			qr_connected_title: "WhatsApp Multi-Device Terhubung!",
			qr_connected_desc: "Sesi soket Baileys aktif. Gateway sedang mendengarkan pesan masuk dari grup cabang yang masuk daftar putih.",
			qr_steps_title: "Langkah-langkah Menautkan WhatsApp di Ponsel:",
			qr_step_1: "Buka aplikasi WhatsApp di ponsel Anda.",
			qr_step_2: "Ketuk menu titik tiga (Android) atau Pengaturan (iPhone).",
			qr_step_3: "Pilih Perangkat Tertaut.",
			qr_step_4: "Pilih Tautkan Perangkat.",
			qr_step_5: "Arahkan kamera ponsel ke kode QR di samping.",
			qr_waiting_init: "Menunggu Inisialisasi Gateway",
			qr_waiting_desc: "Pastikan layanan gateway berjalan: bun run start atau npx tsx src/index.ts di folder whatsapp-gateway.",
			browser_hook_title: "WhatsApp Web (Hook Tampermonkey)",
			browser_hook_sub: "Observer DOM pasif pada tab web.whatsapp.com",
			ferdium_hook_title: "Hook Integrasi Desktop Ferdium",
			ferdium_hook_sub: "Injeksi JavaScript ke dalam container layanan WhatsApp Ferdium",
			rambox_hook_title: "Hook Integrasi Workspace Rambox",
			rambox_hook_sub: "Injeksi JavaScript kustom ke aplikasi WhatsApp di Rambox",
			how_to_install: "Cara Menginstal:",
			browser_install_steps: "Pasang ekstensi Tampermonkey atau Violentmonkey di Chrome/Edge/Firefox, buat skrip baru, tempel kode di bawah, lalu buka web.whatsapp.com.",
			ferdium_install_steps: "Buka Ferdium > Klik kanan layanan WhatsApp > Edit Service > Menu Advanced > Tempel kode ke Custom Code (Inject JavaScript code) > Simpan & Muat Ulang.",
			rambox_install_steps: "Buka Rambox > Klik kanan tab layanan WhatsApp > Edit > Tab Advanced > Tempel kode ke Inject JavaScript code > Simpan.",
			network_security_title: "Pengaturan Jaringan & Daftar Putih Keamanan",
			local_port: "Port Ingress Webhook Lokal",
			antispam_debounce: "Jeda Anti-Spam Debounce (ms)",
			antispam_desc: "Mencegah ledakan pesan duplikat dari pengguna",
			whitelisted_jids: "Daftar Putih JID Grup Regional Resmi",
			whitelisted_jids_desc: "JID grup WhatsApp dipisahkan koma (cth. 120363028391@g.us)",
			security_token: "Token Keamanan Tampermonkey / Browser Hook",
			bot_token: "Token API Telegram BotFather",
			bot_token_desc: "Diperoleh dengan membuat bot melalui @BotFather di Telegram",
			delivery_mode: "Mode Pengiriman Ingress",
			supervisor_id: "ID Pengguna Telegram Supervisor",
			authorized_chat_ids: "ID Chat Grup Regional Resmi",
			authorized_chat_ids_desc: "Bilangan bulat negatif untuk supergrup (cth. -100192837482)",
			discord_token: "Token Bot Discord",
			guild_id: "ID Server Guild Resmi",
			rbac_role: "Nama Peran Mutasi RBAC",
			whitelisted_channels: "ID Saluran Ingress yang Masuk Daftar Putih",
			slack_token: "Token OAuth Pengguna Bot (xoxb)",
			signing_secret: "Rahasia Penandatanganan Slack (HMAC SHA256)",
			signing_secret_desc: "Digunakan untuk memverifikasi X-Slack-Signature secara kriptografis",
			team_id: "ID Tim Perusahaan",
			slash_command: "Perintah Garis Miring Terdaftar",
			logic_flow_title: "Alur Logika Ingesti {platform}",
			flow_step_1_title: "Gerbang Daftar Putih Edge",
			flow_step_1_desc: "Pengenal pengirim paket masuk diverifikasi terhadap daftar putih. Obrolan santai diabaikan dengan 0 pemborosan token.",
			flow_step_2_title: "Penguraian LLM Deterministik",
			flow_step_2_desc: "Percakapan dikonversi secara ketat ke Skema JSON (intent, no_dokumen, target_kolom, nilai_diajukan) pada Temp = 0.0.",
			flow_step_3_title: "Aliran Cockpit SSE Langsung",
			flow_step_3_desc: "Diteruskan seketika ke WebUI Teknisi On-Call untuk ditinjau manusia dan dieksekusi prepared statement secara atomik.",
			copy_config: "Salin Konfigurasi"
		},
		tutorial: {
			title: "Panduan Integrasi Client Hook",
			subtitle: "Petunjuk penyiapan dan cuplikan yang dapat disalin untuk Ferdium, Rambox, Web WA, dan PC WA.",
			tab_ferdium: "Ferdium Desktop",
			tab_rambox: "Aplikasi Rambox",
			tab_web: "WhatsApp Web (Chrome / Edge)",
			tab_pc: "PC WhatsApp (Gateway Baileys)",
			ferdium_title: "1. Sambungkan via Resep Native Ferdium Electron",
			ferdium_badge: "Tanpa Pindai QR",
			ferdium_desc: "Ferdium memungkinkan injeksi skrip langsung ke dalam webview layanan WhatsApp miliknya. NovaPilot menyediakan hook observer khusus yang menangkap chat mutasi faktur tanpa memerlukan ekstensi browser pihak ketiga.",
			steps_heading: "Langkah-Langkah Instalasi:",
			ferdium_s1: "Buka folder resep Ferdium Anda: %APPDATA%\\Ferdium\\recipes\\whatsapp\\",
			ferdium_s2: "Salin berkas novapilot-hook.js ke dalam folder tersebut.",
			ferdium_s3: "Buka webview.js di folder yang sama, lalu tambahkan cuplikan injeksi di bawah ini.",
			ferdium_s4: "Di Ferdium, tekan Ctrl + R pada tab WhatsApp Anda.",
			copy_snippet: "Salin Cuplikan",
			rambox_title: "2. Sambungkan via Injeksi JavaScript Kustom Rambox",
			rambox_badge: "Advanced Layanan",
			rambox_desc: "Rambox mendukung eksekusi JavaScript arbitrer di dalam tab aplikasi apa pun. Dengan menginjeksi observer kami, chat yang berisi mutasi faktur diteruskan secara pasif ke NovaPilot di http://127.0.0.1:8088/api/tickets.",
			rambox_s1: "Buka Rambox dan klik kanan ikon layanan WhatsApp Anda.",
			rambox_s2: "Pilih Settings -> Buka tab Advanced.",
			rambox_s3: "Cari kotak input \"Inject JavaScript code\".",
			rambox_s4: "Tempel cuplikan skrip di bawah ini lalu klik Save.",
			web_title: "3. Sambungkan via Userscript Browser (Chrome, Edge, Firefox)",
			web_badge: "Tampermonkey",
			web_desc: "Jika Anda menggunakan WhatsApp Web di Google Chrome, Microsoft Edge, atau Mozilla Firefox, Anda dapat memasang userscript Tampermonkey yang ringan untuk menangkap pesan masuk secara otomatis.",
			web_s1: "Pasang ekstensi Tampermonkey dari Chrome Web Store.",
			web_s2: "Klik ikon Tampermonkey -> Buat skrip baru.",
			web_s3: "Tempel kode Userscript di bawah ini lalu tekan Ctrl + S.",
			web_s4: "Muat ulang web.whatsapp.com.",
			pc_title: "4. Gateway WhatsApp PC Mandiri (Socket Baileys)",
			pc_badge: "Headless Daemon",
			pc_desc: "Jalankan layanan Node.js khusus menggunakan @whiskeysockets/baileys atau whatsapp-web.js secara lokal sebagai Layanan Windows atau proses latar belakang. Layanan ini terhubung langsung ke protokol Multi-Device WhatsApp.",
			pc_cmd_label: "Perintah Daemon:",
			send_ping_btn: "Kirim Uji Hook Ping",
			ping_received: "Ping Diterima di Antrean Persetujuan!",
			close_btn: "Tutup Panduan"
		},
		command: {
			search_placeholder: "Cari menu, operasional, konektor, atau dokumentasi...",
			no_results: "Tidak ada hasil yang ditemukan untuk \"{query}\".",
			category_core: "Navigasi Utama",
			category_operations: "Operasional",
			category_db: "Database & Telemetri",
			category_chatops: "ChatOps & Hooks",
			category_settings: "Pengaturan Sistem",
			nav_hint: "Gunakan ↑ ↓ untuk navigasi",
			select_hint: "↵ untuk memilih"
		},
		user_nav: {
			oncall_role: "Teknisi On-Call",
			it_support: "Dukungan TI",
			signin: "Masuk",
			oncall_roster: "Jadwal On-Call",
			roster_schedule: "2x Bulanan (Shift 1 dari 2)",
			covered_branches: "Cabang yang Dicakup:",
			dashboard_queue: "Antrean Persetujuan Dashboard",
			system_architecture: "Alur Arsitektur Sistem",
			sign_out: "Keluar"
		}
	},
	en: {
		nav: {
			operations: "Operations",
			overview: "Operations Overview",
			cockpit: "Cockpit Overview",
			queue: "Approval Queue",
			history: "Execution History",
			inbound: "Inbound Messages",
			agents: "AI Agents",
			hooks: "Client Hook Flows",
			contacts: "Channel Contacts",
			databases: "Databases & Telemetry",
			connectors: "DB Connectors",
			mcp: "MCP Knowledge",
			telemetry: "System Telemetry",
			logs: "System Logs",
			settings: "Settings",
			flows: "Platform Flows",
			about: "About Us",
			simulator: "Simulator",
			chatops_gateways: "ChatOps Gateways"
		},
		actions: {
			approve: "Approve",
			reject: "Reject",
			stage: "Stage to Queue",
			save: "Save Configuration",
			cancel: "Cancel",
			refresh: "Refresh",
			search: "Search data...",
			filter: "Filter",
			export: "Export CSV",
			test_connection: "Test Connection",
			apply: "Apply",
			run_inference: "Run Inference",
			copy: "Copy",
			copied: "Copied",
			view_details: "View Details",
			close: "Close",
			inspect: "Inspect",
			clear: "Clear",
			confirm: "Confirm",
			back: "Back",
			next: "Next"
		},
		status: {
			pending: "Pending Approval",
			approved: "Approved",
			rejected: "Rejected",
			executed: "Executed",
			failed: "Failed",
			online: "ONLINE",
			offline: "OFFLINE",
			connected: "Connected",
			disconnected: "Disconnected",
			healthy: "Healthy",
			active: "Active",
			standby: "Standby",
			whitelisted: "Whitelisted"
		},
		agents: {
			hub_title: "AI Agents Hub",
			hub_subtitle: "Fleet integration of Hermes 3 reasoning model (Cognitive Extraction) and OpenClaw autonomous agent (Browser Automation).",
			hermes_title: "Hermes 3 Reasoning Agent",
			hermes_badge: "8B LLM BRAIN",
			openclaw_title: "OpenClaw Autonomous Agent",
			openclaw_badge: "BROWSER & CHANNELS",
			reasoning_contract: "Reasoning Contract",
			reasoning_thought: "Cognitive Reasoning (<thought>):",
			tool_arguments: "Structured Parameter Extraction (<tool_call>):",
			stage_ticket: "Stage to Approval Queue (PostgreSQL)",
			prompt_label: "Chat Message / Instruction:",
			prompt_placeholder: "Type WhatsApp/Telegram instructions...",
			branch_context: "Regional Branch Context:",
			presets_label: "Conversation Scenario Presets:",
			gateway_service: "Gateway Service",
			browser_driver: "Browser Driver",
			safety_gate: "Supervisor Gate",
			task_capacity: "Worker Capacity",
			task_registry: "Autonomous Task Registry",
			task_instruction: "Task Instruction (Execution Prompt):",
			dispatch_to_openclaw: "Dispatch to OpenClaw",
			stage_to_approval: "Stage to Approval",
			model_architecture: "Model Architecture",
			execution_mode: "Execution Mode",
			offline_resilience: "Offline Resilience",
			offline_resilience_sub: "Zero-downtime offline fallback",
			cli_detected: "DETECTED",
			cli_active: "ENGINE ACTIVE",
			cli_using: "Using Native CLI",
			cli_activate: "Use Native CLI Engine",
			config_title: "Hermes Endpoint & Model Configuration",
			config_subtitle: "Local connection to Ollama, vLLM, or Hermes CLI wrapper.",
			save_config: "Save Configuration",
			saving: "Saving...",
			saved: "LLM configuration saved to NovaPilot runtime successfully!",
			mode_label: "Execution Mode",
			mode_auto: "Auto (Ollama HTTP Priority, Fallback Heuristic)",
			mode_cli: "Native CLI (hermes.cmd)",
			mode_http: "Dedicated HTTP (Ollama / vLLM)",
			base_url_label: "API Base URL",
			model_name_label: "LLM Model Name",
			cli_path_label: "CLI Executable Path",
			interactive_console: "Interactive Prompt Console",
			prompt_label_chat: "Chat / Command Message:",
			branch_context_label: "Regional Branch Context:",
			run_inference: "Run Inference",
			running_inference: "Inferring Reasoning...",
			inference_result: "Inference & Extraction Result",
			copy_code: "Copy",
			copied: "Copied!",
			staging_ticket_queue: "Stage to Approval Queue (PostgreSQL)",
			staging_in_progress: "Staging Ticket...",
			prompt_hint: 'Type a prompt and click "Run Inference" to observe Hermes 3 reasoning.',
			openclaw_config_title: "Gateway & Browser Driver Configuration",
			openclaw_config_desc: "Connection parameters for OpenClaw service and headless browser instance.",
			openclaw_test_endpoint: "Test Endpoint",
			browser_mode_label: "Chromium Browser Mode",
			openclaw_disconnected_title: "OpenClaw Gateway not detected on {url}",
			openclaw_disconnected_desc: "NovaPilot is ready to orchestrate autonomous browser flows. To enable local browser automation, start the gateway via terminal:",
			check_connection: "Recheck Connection",
			checking: "Checking...",
			auto_reply_card_title: "AI Auto-Generate Reply Chat",
			auto_reply_card_subtitle: "Configure autonomous chat response generation powered by Hermes 3 & Heuristic Fallback for WhatsApp & Omnichannel.",
			auto_reply_toggle_label: "Enable AI Auto-Reply",
			auto_reply_toggle_desc: "When enabled, AI intelligently generates contextual replies and can reply back to WhatsApp users or groups.",
			auto_reply_mode_label: "Trigger Mode",
			auto_reply_mode_smart: "Smart Auto (Mutation Acks, ERP Queries & Polite Clarifications)",
			auto_reply_mode_actionable: "Actionable Mutations Only",
			auto_reply_mode_all: "All Messages (Including Greetings & Casual Chat)",
			auto_reply_mode_manual: "Manual Clearance (Draft Replies in Dashboard Only)",
			auto_reply_tone_label: "Response Tone",
			auto_reply_tone_professional: "Corporate Formal (Audit-Ready & Standard SOP)",
			auto_reply_tone_friendly: "Warm & Helpful (Polite Conversational)",
			auto_reply_tone_concise: "Concise Telemetry (Fast ChatOps Format)",
			auto_reply_prefix_label: "Bot Prefix",
			auto_reply_lang_label: "Response Language",
			auto_reply_lang_auto: "Auto-Detect (Follows Inbound Message Language)",
			auto_reply_lang_id: "Bahasa Indonesia",
			auto_reply_lang_en: "English",
			auto_reply_sandbox_title: "AI Reply Sandbox & Live Preview",
			auto_reply_sandbox_desc: "Type a simulated incoming message from WhatsApp or ChatOps to preview instant AI response generation.",
			auto_reply_generate_btn: "Generate AI Reply",
			auto_reply_generating: "Generating Reply...",
			auto_reply_result_label: "AI Generated Response Preview",
			auto_reply_test_dispatch: "Send Test Reply to WhatsApp",
			auto_reply_dispatched: "Delivered to WhatsApp!"
		},
		overview: {
			guardrail_title: "Guardrail Assurance & Intake Engine",
			active_guard: "Active Guard",
			guardrail_desc: "Automated validation of incoming mutations against schema constraints and zero raw SQL/NoSQL injection.",
			sse_live: "SSE Live EventBus",
			sse_offline: "SSE Offline",
			refresh: "Refresh",
			stage_simulator: "Stage via Simulator",
			kpi_pending: "Pending Mutations",
			kpi_pending_sub: "Awaiting on-call sign-off",
			kpi_executed: "Executed Today",
			kpi_executed_sub: "Committed to database",
			kpi_rejected: "Rejected Requests",
			kpi_rejected_sub: "Policy violations blocked",
			kpi_safety: "Safety Confidence",
			kpi_safety_sub: "Zero raw SQL certified",
			queue_preview_title: "Recent Approval Queue",
			queue_preview_desc: "Pending mutation tickets requiring human-in-the-loop review.",
			history_preview_title: "Recent Executions",
			history_preview_desc: "Recently approved and audited mutation transactions.",
			view_all: "View All",
			empty_queue: "All caught up! No pending tickets in queue.",
			empty_history: "No execution records found.",
			pipeline_title: "Real-Time Ingestion Pipeline:",
			pipeline_standby: "Standby Mode",
			expand_pipeline: "Expand Pipeline Details",
			fold_pipeline: "Fold to Step View",
			needs_review_title: "{count} Inbound Message{plural} Require On-Call Review",
			needs_review_desc: "Incoming chats detected with company mutation requests lacking explicit invoice numbers.",
			review_stage_btn: "Review & Stage Tickets",
			traffic_title: "Operations Traffic & Omnichannel Ingress Trends",
			traffic_badge: "7-DAY METRICS",
			traffic_subtitle: "Daily inbound message volume, automated intake vs operator approvals, and channel distribution.",
			cockpit_btn: "Cockpit Overview [AI Metrics] →",
			chart_volume_title: "Inbound Messages vs Executed Tickets",
			chart_total_intake: "Total Intake",
			chart_approved: "Approved Mutations (MCP)",
			channel_share_title: "ChatOps Channel Share",
			channel_total_ingress: "500 Total Ingress"
		},
		cockpit: {
			title: "Cockpit Overview & AI Analytics",
			subtitle: "Comprehensive analysis of AI inference performance, Tesseract OCR accuracy, ChatOps circuit visualization, and SQL transaction invariants.",
			preview_notice_title: "Model Preview & Evaluation Mode (Synthetic Preview):",
			preview_notice_desc: "Metrics on this page reflect NovaPilot AI's operational benchmarks (Tesseract Vision + Local Small LLM Gatekeeper + PostgreSQL 18 Local). Curated for factory workloads and audit compliance.",
			intent_accuracy: "INTENT ACCURACY",
			intent_accuracy_sub: "Hermes 3 entity extraction model",
			ocr_precision: "TESSERACT OCR PRECISION",
			ocr_precision_sub: "Document image digit extraction",
			avg_latency: "AVG PIPELINE LATENCY",
			avg_latency_sub: "From inbound message to staged ticket",
			gatekeeper_block_rate: "GATEKEEPER BLOCK RATE",
			gatekeeper_block_rate_sub: "Unauthorized raw SQL prevented",
			circuit_title: "ChatOps Ingress & Database Pool Topology",
			circuit_desc: "Interactive real-time architecture circuit showing telemetry flow between messaging daemons, AI inference, and database connections.",
			benchmark_title: "Model Benchmark & Evaluation Matrix",
			benchmark_desc: "Inference accuracy comparison between local and cloud reasoning models."
		},
		queue: {
			title: "Approval Queue",
			subtitle: "Side-by-side verification diffs for incoming WhatsApp mutation requests. Zero raw SQL certified.",
			search_placeholder: "Search ticket, invoice, customer, raw text...",
			all_branches: "All Regional Branches",
			all_confidence: "All Confidence Levels",
			high_confidence: "High Confidence (≥ 90%)",
			needs_review: "Needs Manual Review (< 90%)",
			sort_newest: "Newest First",
			sort_oldest: "Oldest First",
			sort_confidence: "Highest Confidence",
			no_pending: "No Pending Tickets",
			no_pending_desc: "The queue is clean! All inbound WhatsApp requests have been reviewed.",
			no_match_desc: "No tickets match your active search filters. Try clearing filters.",
			clear_filters: "Clear All Filters",
			send_simulated: "Send Simulated Inbound Chat",
			received: "Received",
			current_db_state: "CURRENT DATABASE STATE",
			proposed_mutation: "PROPOSED MUTATION",
			proof_attachments: "Proof Attachments:",
			inspect_plan: "Inspect Plan",
			reject: "Reject",
			approve_mutate: "Approve & Mutate",
			ai_confidence: "AI Confidence"
		},
		history: {
			title: "Execution History & Audit Trail",
			records_count: "audit records",
			subtitle: "Tamper-evident logs of signed mutations, policy rejections, and compensating rollback scripts.",
			export_json: "Export JSON",
			refresh: "Refresh",
			total_executed: "Total Executed",
			total_executed_sub: "Committed with zero raw SQL",
			policy_rejections: "Policy Rejections",
			policy_rejections_sub: "Blocked closed accounting periods",
			rollback_safety: "Rollback Safety",
			rollback_safety_sub: "Inverse scripts pre-calculated",
			table_title: "Execution Audit Log Table",
			table_subtitle: "Audited ERP mutation logs signed off by operators, with compensating rollback scripts and status verification.",
			search_placeholder: "Search ticket #, invoice no, branch, or signatory...",
			empty_message: "No matching audit records found",
			col_ticket: "Ticket #",
			col_doc: "Invoice / Doc No",
			col_branch: "Branch / Hub",
			col_mutation: "Target ERP Mutation",
			col_status: "Audit Status",
			col_approved_by: "Signatory",
			col_executed_at: "Execution Time",
			col_actions: "Action / Rollback",
			filter_all: "All Statuses",
			filter_executed: "EXECUTED (Committed)",
			filter_rejected: "REJECTED (Policy Denied)",
			filter_approved: "APPROVED (Signed)",
			modal_rollback_title: "Atomic Safe Compensating Rollback SQL Script",
			modal_copy_script: "Copy Script",
			modal_copied: "Copied!",
			modal_raw_msg: "Initial ChatOps Message:",
			modal_close: "Close",
			originally: "Originally:",
			rollback_btn: "Rollback"
		},
		modals: {
			inspect_title: "Mutation Plan:",
			target_engine: "Target Engine Plan:",
			relational_sql: "Relational SQL",
			non_relational_bson: "Non-Relational BSON",
			zero_sql_guard: "Zero Raw SQL Guard Certified",
			diff_title: "Side-by-Side Verification Diff",
			current_val: "CURRENT DB VALUE:",
			proposed_val: "PROPOSED NEW VALUE:",
			prepared_query: "PREPARED PARAMETERIZED QUERY (PostgreSQL 18):",
			rollback_script: "COMPENSATING ROLLBACK SCRIPT (Pre-calculated Inverse):",
			audit_metadata: "AUDIT & SECURITY METADATA:",
			close: "Close Inspector",
			reject_title: "Reject Mutation Request",
			reject_desc: "Rejecting ticket {ticket_no} ({doc_no}). This action is logged permanently in the audit trail and sent back to the WhatsApp branch thread.",
			reason_label: "Reason for Rejection:",
			reason_placeholder: "e.g. Invoice has status CLOSED in month-end accounting; does not satisfy revision SOP.",
			cancel: "Cancel",
			confirm_reject: "Confirm Rejection",
			rejecting: "Rejecting...",
			confidence: "Confidence",
			document_num: "Document #",
			target_field: "Target:",
			sql_prepared_label: "Parameterized SQL Prepared Statement (PostgreSQL / Oracle):",
			bson_command_label: "Compensating BSON Command (MongoDB / Document Store):",
			orig_inbound_msg: "Original Inbound Message:"
		},
		messages: {
			title: "Inbound Messages Feed",
			subtitle: "Real-time message feed from WhatsApp, Telegram, Discord, and Slack gateways with AI intent classification.",
			search_placeholder: "Search sender, message text, extracted invoice...",
			all_platforms: "All Platforms",
			all_classes: "All Classifications",
			actionable: "Actionable",
			needs_review: "Needs Review",
			casual_banter: "Casual Banter",
			stage_ticket: "Stage Ticket",
			learn_pattern: "Learn Pattern",
			open_terminal: "Daemon Terminal",
			no_messages: "No Inbound Messages",
			no_messages_desc: "Waiting for new messages from connected chat platforms.",
			total_messages_kpi: "Total Messages",
			total_messages_sub: "Packets ingested across all platforms",
			actionable_kpi: "Actionable Tickets",
			actionable_sub: "Invoice matched & staged automatically",
			needs_review_kpi: "Needs Review",
			needs_review_sub: "Mutation intent detected without doc ID",
			casual_banter_kpi: "Casual Banter",
			casual_banter_sub: "Filtered conversations (zero DB mutation)",
			terminal_btn: "Exec Terminal WA Gateway",
			pattern_memory_btn: "🧠 AI Pattern Memory",
			hermes_engine_btn: "Hermes 3 AI Engine",
			platform_flows_btn: "Platform Flows"
		},
		contacts: {
			title: "Ingress Channel Directory & ChatOps Contacts",
			subtitle: "Branch WhatsApp groups, emergency PIC hotlines, and bot channels integrated with AI Guardrail routing filters.",
			monitoring_active: "MONITORING ACTIVE",
			add_contact: "Add Contact / Group",
			e2e_flow: "View E2E Flow",
			search_placeholder: "Search group, branch, contact person, JID...",
			filter_platform: "Platform",
			filter_status: "Status",
			active: "Active",
			whitelisted: "Whitelisted",
			total_messages: "Total Messages",
			latency: "Latency",
			last_active: "Last Active",
			topology_title: "Ingress Channel Topology & Gatekeeper Whitelist",
			topology_subtitle: "Real-time visualization of inbound message routing from group and hotline channels to AI Guardrail.",
			inbound_stream: "Inbound Stream:",
			verified_channels: "Verified Channels",
			stat_channels: "Registered Channels",
			stat_groups: "WA Groups",
			stat_hotlines: "Contact Hotlines",
			stat_health: "Monitoring Health",
			stat_uptime: "Ingress Socket Uptime",
			stat_yield: "Traffic & Ticket Yield",
			stat_staged_tickets: "AI verified staging tickets",
			stat_gatekeeper: "Whitelist Gatekeeper",
			stat_muted: "channels in muted/standby state",
			table_title: "Channel & Contact Management Table",
			table_subtitle: "Complete roster of groups and contacts with multi-column search, channel type filter, sorting, and instant export.",
			table_search_placeholder: "Search group/contact name, branch, phone number, or JID...",
			col_channel: "Channel & Identity",
			col_platform: "Platform",
			col_jid: "JID / Identifier",
			col_probe: "Monitoring Probe",
			col_telemetry: "Telemetry Volume",
			col_whitelist: "Whitelist Intake",
			col_actions: "Actions",
			filter_group: "WhatsApp Group (@g.us)",
			filter_individual: "Individual Contact (@s.whatsapp.net)",
			empty_table: "No matching channels or contacts found",
			action_sim: "Simulate",
			action_sent: "Sent",
			action_delete: "Delete this channel from directory",
			modal_add_title: "Add New Ingress Channel",
			modal_add_subtitle: "Register a group or individual contact to the directory whitelist.",
			channel_type: "Ingress Channel Type",
			type_group: "Branch / Division Group",
			type_group_sub: "Target: @g.us",
			type_individual: "PIC Hotline Contact",
			type_individual_sub: "Target: @s.whatsapp.net",
			platform_label: "Messaging Platform",
			channel_name: "Channel Name / Official Identity",
			name_placeholder_group: "e.g. Semarang Branch Ops & Warehouse",
			name_placeholder_individual: "e.g. Budi Wicaksono (Lead AR Finance)",
			jid_label: "JID / Channel Identifier",
			jid_guide_open: "Where do I get this ID?",
			jid_guide_close: "Close Guide",
			auto_convert_phone: "Auto-convert PIC Phone ({phone}) to JID",
			branch_label: "Branch / Regional Hub",
			branch_impact_title: "Database Impact of Branch ID:",
			branch_impact_desc: "This channel maps to branch_id in branches & invoices tables. AI Guardrail verifies whether message sender has regional authority over the invoice, preventing cross-branch unauthorized mutations.",
			pic_name: "PIC / Contact Person Name",
			pic_phone: "Phone Number / Handle",
			auto_whitelist_label: "Enable Automatic Whitelist Intake",
			auto_whitelist_desc: "Incoming messages from this channel are processed directly by Guardrail.",
			cancel: "Cancel",
			save_channel: "Save Channel",
			modal_delete_title: "Delete Channel from Directory?",
			modal_delete_desc: "This action will revoke channel intake permissions from ingress filters.",
			delete_warning: "Incoming messages and invoice images from this channel will subsequently be dropped without staging tickets.",
			confirm_delete: "Yes, Delete Channel",
			roster_badge: "MEMBER ROSTER",
			roster_notice_title: "Multi-Device Participant Resolution (`msg.key.participant`)",
			roster_notice_desc: "When a message arrives in this WhatsApp group, the gateway reads individual sender phone numbers granularly. Whitelisted members trigger AI ticket staging directly without being filtered out.",
			search_member: "Search member name, phone/JID, or role...",
			total_members: "Total: {count} Members",
			admin_count: "Admins",
			oncall_count: "On-Call PICs",
			no_members_found: "No members found",
			close_roster: "Done & Close"
		},
		connectors: {
			title: "Database Connectors & Connection Pooling",
			subtitle: "Manage connections to primary PostgreSQL 18 transactional database and secondary reference databases (SAP, Oracle, MySQL, SQL Server).",
			tab_system: "Primary System DB",
			tab_mcp: "MCP Reference DB",
			tab_tools: "Schema & Tools",
			tab_env: "Connection Strings",
			test_connection: "Test Connection",
			apply_changes: "Apply Changes",
			pool_stats: "Connection Pool Metrics",
			open_connections: "Open Connections",
			in_use: "In Use",
			idle: "Idle",
			max_open: "Max Open"
		},
		mcp: {
			title: "Model Context Protocol (MCP) Knowledge Base",
			subtitle: "Standardized context grounding and enterprise tool registry enabling AI reasoning agents to interact safely with enterprise data.",
			tab_dual_db: "Dual DB Architecture",
			tab_resources: "Context Resources",
			tab_tools: "Schema Tools",
			tab_playground: "Agent Playground",
			sop_policy: "Factory Support SOP Policy",
			branches_directory: "Branch Directory",
			execute_tool: "Execute Tool"
		},
		telemetry: {
			title: "System Telemetry & Platform Probes",
			subtitle: "Low-level daemon diagnostics, memory consumption, goroutine concurrency, and active chat socket health.",
			service_status: "Service Status",
			uptime: "Uptime",
			memory_rss: "Allocated Memory",
			goroutines: "Active Goroutines",
			test_ping: "Send Telemetry Probe Ping",
			ping_success: "Probe ping dispatched successfully!",
			how_to_integrate: "How to Integrate",
			lan_ingress_ip: "LAN Ingress IP",
			lan_port_active: "HTTP Port 8088 Active",
			go_memory_alloc: "Go Memory Alloc",
			low_footprint: "Low footprint runtime",
			active_goroutines: "Active Goroutines",
			sse_duplex: "SSE duplex broadcasters",
			server_status: "Server Status",
			online: "ONLINE",
			uptime_label: "Uptime: {min} min",
			db_pool_telemetry: "Database Connection Pool Telemetry",
			driver_label: "Driver:",
			open_connections: "Open Connections:",
			idle_connections: "Idle Connections:",
			in_use_concurrency: "In-Use Concurrency:",
			chatops_ingress_telemetry: "ChatOps Platform Ingress Telemetry",
			realtime_diagnostics: "Real-time runtime metrics, socket heartbeat probes, and packet throughput diagnostics.",
			socket_latency: "Socket Latency Probe",
			tcp_roundtrip: "TCP Roundtrip",
			events_captured: "Events Captured",
			total_inbound: "Total Inbound",
			queue_backpressure: "Queue Backpressure",
			buffer_depth: "Buffer Depth Nominal",
			filter_efficiency: "Edge Filter Efficiency",
			zero_token_waste: "0 Token Waste Drops",
			telemetry_state: "Telemetry State:",
			send_probe_ping: "Send Test Probe Ping",
			sending_probe: "Sending...",
			probe_ack: "Probe ping acknowledged! Staged test packet into Approval Queue."
		},
		logs: {
			title: "Enterprise System Logs & Daemon Telemetry",
			subtitle: "Live streamed audit events, security alerts, and system daemon diagnostics.",
			search_placeholder: "Search log messages, services, errors...",
			all_levels: "All Levels",
			all_services: "All Services",
			auto_scroll: "Auto Scroll",
			pause_stream: "Pause Stream",
			resume_stream: "Resume Stream",
			clear_logs: "Clear Stream",
			export_logs: "Export Logs",
			total_entries: "Total Entries:",
			no_logs_match: "No logs match the active filter criteria."
		},
		settings: {
			title: "System Settings & Gatekeeper Policies",
			subtitle: "Comprehensive configuration of AI pipeline, financial SOP thresholds, multiplatform ChatOps, and Dual-DB architecture.",
			enterprise_badge: "ENTERPRISE v2.4",
			export_json: "Export JSON",
			reset_default: "Reset Default",
			save_changes: "Save Changes",
			saving: "Saving...",
			saved: "Saved!",
			saved_toast: "All system configurations, SOP policies, and connector preferences were saved to local storage.",
			synced: "Synchronized",
			reset_confirm_title: "Are you sure you want to reset all preferences and policies to factory defaults? This action cannot be undone.",
			cancel: "Cancel",
			confirm_reset: "Yes, Reset Now",
			tab_gatekeeper: "Gatekeeper SOP",
			tab_ai: "AI Model & Guardrails",
			tab_chatops: "ChatOps & Gateway",
			tab_database: "Dual-DB & MCP",
			tab_alerts: "Alerts & Notifications",
			tab_interface: "Cockpit UI",
			threshold_title: "High-Value Invoice Threshold Policy",
			threshold_desc: "Invoices above this threshold mandate supervisor review (Two-Man Rule / Supervisor Override).",
			supervisor_override: "Require Supervisor Approval",
			supervisor_override_desc: "Invoice mutations exceeding threshold value can only be signed off by Supervisor accounts.",
			block_closed: "Block Closed Accounting Period Mutations",
			block_closed_desc: "Automatically reject changes if invoice status is flagged CLOSED in month-end books.",
			auto_approve_low_risk: "Auto-Approve Low-Risk Discrepancy Corrections",
			auto_approve_low_risk_desc: "Only applies to typo fixes on customer names without changing nominal amounts or items.",
			mandatory_audit_reason: "Mandatory Audit Trail Rejection Reason",
			mandatory_audit_reason_desc: "Operators must provide at least 10 characters justifying why a mutation ticket was rejected.",
			rate_limit: "Channel Request Rate Limit",
			rate_limit_desc: "Maximum number of mutation requests allowed per channel per minute to mitigate spam bots.",
			ai_engine_title: "AI Reasoning Engine & LLM Configuration",
			ai_engine_desc: "Select the large language model provider for intent extraction and SQL query plan generation.",
			model_provider: "AI Model Provider",
			api_key: "API Key",
			api_endpoint: "Custom Endpoint / Gateway URL",
			temperature: "Inference Temperature (Determinism)",
			confidence_threshold: "Minimum AI Confidence Threshold",
			injection_defense: "Prompt Injection & Jailbreak Guard",
			injection_defense_desc: "Filter system instruction override attempts hidden in user chat payloads.",
			strict_json: "Strict JSON Schema Validation",
			strict_json_desc: "Reject AI completions that deviate from strict parameter JSON schema contracts.",
			rag_grounding: "Factory SOP Grounding (MCP)",
			rag_grounding_desc: "Ground reasoning agent with real-time factory SOP rules when parsing intents.",
			chatops_title: "Multiplatform Chat Ingress Gateways",
			chatops_desc: "Configure messaging connectors for WhatsApp, Telegram, Discord, and Slack.",
			wa_gateway_url: "WhatsApp Gateway URL (Baileys Hook)",
			auto_reply: "Enable Auto-Reply Ticket Confirmation",
			auto_reply_desc: "Send confirmation receipt to channel sender when new ticket is staged.",
			auto_reply_template: "Auto-Reply Text Template",
			auto_ocr: "Enable Automatic Invoice OCR Extraction",
			auto_ocr_desc: "Trigger Tesseract OCR automatically when image attachments are detected in chat.",
			whitelisted_groups: "Whitelisted Group JIDs",
			blacklisted_jids: "Blacklisted Spam JIDs",
			telegram_token: "Telegram Bot Token",
			telegram_chat_id: "Telegram Chat / Channel ID",
			discord_webhook: "Discord Webhook URL",
			slack_webhook: "Slack Incoming Webhook URL",
			test_webhook: "Send Test Webhook Ping",
			db_title: "Dual-DB Connection Profiles & MCP Parameters",
			db_desc: "Configure direct connection to PostgreSQL 18 and secondary ERP reference databases.",
			pg_host: "PostgreSQL Host",
			pg_port: "PostgreSQL Port",
			pg_db: "Database Name",
			pg_user: "Database User",
			pg_password: "User Password",
			pg_max_conns: "Max Connection Pool",
			pg_idle_conns: "Idle Connections",
			target_erp: "Secondary Target ERP System",
			mcp_endpoint: "MCP Service Endpoint",
			safe_dry_run: "Safe Dry-Run Mode (Simulation Without Commit)",
			safe_dry_run_desc: "Execute mutations in an uncommitted rollback transaction block to verify invariants.",
			test_db_conn: "Test Database Connection",
			alerts_title: "System Alerts, Notifications & Audio Feedback",
			alerts_desc: "Configure audio signals on incoming messages, ticket escalation, and browser notifications.",
			sound_alerts: "Inbound Message & Action Sound Effects",
			sound_alerts_desc: "Play Web Audio synthesized sound pulses on incoming mutations and status updates.",
			test_sound: "Test Sound",
			sound_volume: "Sound Effects Volume",
			nav_sound: "Menu Navigation Click Sounds",
			nav_sound_desc: "Play tactile clicks when switching routes and pressing control buttons.",
			test_nav_click: "Test Click",
			push_alerts: "Browser Push Notifications",
			push_alerts_desc: "Show native desktop notifications when high-risk tickets enter approval queue.",
			escalation: "Automatic High-Value Escalation",
			escalation_desc: "Dispatch emergency alerts if high-value tickets remain unreviewed.",
			idle_minutes: "Review Idle Timeout (Minutes)",
			ui_title: "Cockpit Interface & Data Display Preferences",
			ui_desc: "Adjust table density, telemetry refresh intervals, and report export formats.",
			compact_table: "Compact Table Row Spacing",
			compact_table_desc: "Reduce row padding to fit more operational records per viewport.",
			telemetry_rate: "Auto-Refresh Telemetry Rate",
			session_lock: "Reviewer Session Auto-Lock",
			export_format: "Default Report Export Format"
		},
		simulator: {
			title: "ChatOps Ingestion Simulator",
			subtitle: "Interactive test sandbox for injecting synthetic WhatsApp/Telegram messages into the ingestion and reasoning pipeline.",
			banner_title: "SIMULATOR MODULE IN [EXPERIMENTAL] STATUS",
			banner_desc: "This sandbox injects synthetic test payloads into the backend pipeline without requiring physical mobile devices. Ideal for testing OCR and intent extraction in staging environments.",
			run_simulation: "Run Full Ingestion Pipeline",
			step_1: "1. Inbound Ingestion",
			step_2: "2. Hermes 3 AI Reasoning",
			step_3: "3. SQL Parameterization",
			step_4: "4. Stage to Approval Queue",
			chat_msg_label: "Simulated WhatsApp Chat Message:",
			branch_source_label: "Simulated Branch Source:",
			invoice_target_label: "Simulated Invoice Target #:",
			value_target_label: "Simulated Value to Mutate:",
			exec_pipeline_btn: "Execute Real-Time Ingestion Pipeline",
			executing_pipeline: "Executing Ingestion Pipeline..."
		},
		about: {
			badge: "NOVAPILOT AI • CHATOPS GATEKEEPER v1.0.0",
			title: "About NovaPilot AI & Creators",
			subtitle: "Autonomous enterprise ChatOps AI system acting as a Human-in-the-Loop Gatekeeper to safeguard core business ERP databases against hallucinated chat bot outputs and direct SQL mutations.",
			open_github: "Open GitHub Repo",
			copy_clone: "Copy Git Clone Command",
			copied: "Copied to Clipboard!",
			architecture_title: "Enterprise Architecture Stack",
			creator_title: "Creators & Engineers"
		},
		common: {
			loading: "Loading...",
			no_data: "No data available",
			all: "All",
			records: "records",
			page: "Page",
			of: "of",
			rows_per_page: "Rows per page:",
			language: "Language",
			theme: "Theme",
			sound: "Sound Effects",
			public_home: "Public Home (/)",
			system_flow: "System Flow (/flow)",
			launch_cockpit: "Launch On-Call Cockpit",
			oncall_assistant: "On-Call Operations Assistant",
			zero_sql_certified: "Zero Raw SQL Certified",
			universal_lts: "Universal Enterprise LTS",
			multichannel_chatops: "Multi-Platform ChatOps",
			jump_to: "Jump to:",
			filtered_from: "filtered from",
			go: "Go",
			showing: "Showing"
		},
		landing: {
			pill_announcement: "Guardrail Assurance Engine Active",
			headline_main: "Zero unchecked mutations.",
			headline_gradient: "Autonomous on-call ChatOps.",
			subtitle: "NovaPilot ingests chaotic WhatsApp branch escalations, validates database mutations with zero raw SQL, and gives on-call engineers a sleep-safe, one-click audited signoff cockpit.",
			launch_cockpit: "Launch On-Call Cockpit",
			flow_and_hooks: "System Flow & Hooks",
			circuit_arch: "ChatOps Pipeline Circuit Architecture",
			all_channels: "All Channels",
			simulate_flow: "Simulate Live Flow",
			simulating_stage: "Processing Stage {stage}/4...",
			stage_1: "1. Ingest Chat",
			stage_2: "2. Guardrail Validation",
			stage_3: "3. Human Sign-Off",
			stage_4: "4. Rollback Ready",
			status_simulating: "Status: SIMULATION IN PROGRESS",
			status_ready: "Status: READY FOR INGESTION",
			cockpit_mockup_title: "The on-call cockpit designed for high-stress shifts",
			cockpit_mockup_sub: "Every pending ticket displays original WhatsApp evidence, AST-verified SQL, and confidence scores so you never guess at 3 AM.",
			tab_live_ticket: "Live Ticket",
			tab_zero_sql: "Zero Raw SQL",
			tab_auto_rollback: "Auto Rollback",
			medan_hub: "MEDAN HUB DISPATCH",
			medan_msg: "Mr. John, please update tax rate for invoice INV-2024-8901 to 12%. New memo from central finance. Thanks!",
			sender_info: "Sender: +62 812-4491-0021 · Group: #ops-medan-dc",
			confidence_score: "Confidence Score:",
			high_confidence: "HIGH CONFIDENCE",
			target_doc: "TARGET DOCUMENT:",
			current_value: "Current Value",
			proposed_value: "Proposed Value",
			approve_execute: "One-Click Approve & Execute",
			reject: "Reject",
			sql_preview_title: "Strict Parameterized Query Preview",
			dry_run_passed: "DRY-RUN SIMULATION PASSED",
			zero_sql_note: "Zero raw SQL string concatenation. Parameter types and bounds checked before DB lock.",
			rollback_preview_title: "Compensating Rollback Script (Auto-Generated)",
			instant_reversible: "INSTANT REVERSIBLE",
			rollback_note: "Rollback snapshot archived in PostgreSQL Audit Store. Executable in 1 tap if branch recalls memo.",
			stat_turnaround: "30s",
			stat_turnaround_sub: "Average Turnaround",
			stat_safety: "100%",
			stat_safety_sub: "Parameterized Safety",
			stat_unchecked: "0",
			stat_unchecked_sub: "Unchecked Mutations",
			stat_hubs: "4 Hubs",
			stat_hubs_sub: "DC Factory Replicas",
			bento_title: "Engineered for factory reliability",
			bento_sub: "Built specifically for mission-critical industrial plants where a single corrupt invoice halts logistics lines.",
			bento_1_title: "Passive WhatsApp Ingestion",
			bento_1_desc: "Monitors authorized regional branch groups exclusively. Employs zero spamming and single-reply confirmation patterns strictly compliant with Meta WhatsApp ToS.",
			bento_2_title: "Zero Raw SQL Guardrail",
			bento_2_desc: "Every mutation is strictly bound to prepared statements with schema dry-runs. No raw string interpolation can ever reach your PostgreSQL or Oracle replicas.",
			bento_3_title: "Strict Human-in-the-Loop Gate",
			bento_3_desc: "Zero direct mutation by AI. On-call engineers review side-by-side visual diffs and tap 'Approve' to trigger transactional prepared statements with complete audit logs.",
			how_it_works_title: "How NovaPilot secures your shift",
			how_it_works_sub: "Three clear stages from chat intake to verifiable production database commit.",
			step_1_title: "Intercept & Extract",
			step_1_desc: "The WhatsApp hook extracts invoice numbers, target mutated fields, and values with an active confidence score over 85%.",
			step_2_title: "Dry-Run Simulation",
			step_2_desc: "The engine runs a simulated dry-run against the database, verifies branch permissions, and prepares an auto-rollback script.",
			step_3_title: "Human Sign-off & Audit",
			step_3_desc: "Engineers sign off changes via mobile-responsive WebUI. Atomic transactional execution logs permanent evidence to the audit trail.",
			faq_title: "Frequently Asked Questions",
			faq_sub: "Everything you need to know about NovaPilot security architecture, compliance, and integrations.",
			faq_1_q: "Does NovaPilot ever execute raw, unescaped SQL directly?",
			faq_1_a: "Never. Every chat request is parsed into structured parameters and verified against predefined parameterized query templates. Zero raw string interpolation is permitted, preventing accidental schema corruption and SQL injection.",
			faq_2_q: "How does NovaPilot hook into WhatsApp without getting banned?",
			faq_2_a: "NovaPilot uses passive client-side DOM observers inside authorized enterprise clients (Ferdium recipes, Rambox scripts, browser userscripts, or desktop observers). It exclusively monitors authorized internal branch groups and only sends single confirmation replies upon human sign-off.",
			faq_3_q: "Can approved mutations be rolled back in an emergency?",
			faq_3_a: "Yes. Every single mutation automatically generates an inverse compensating rollback script prior to execution. The on-call engineer can trigger a one-click rollback from the cockpit at any time.",
			faq_4_q: "How is access controlled for on-call engineers?",
			faq_4_a: "NovaPilot integrates with Better Auth and session-based cryptographic clearance. Only authenticated on-call personnel with active clearance tokens can approve pending mutations."
		},
		flow: {
			title: "End-to-End System Flow & Architecture",
			subtitle: "From raw {platform} chat escalation to safe prepared statement execution: how NovaPilot AI eliminates on-call burnout while preserving zero-error database governance.",
			engine_pipeline: "ChatOps Engine Pipeline",
			deterministic_badge: "100% Deterministic & Audited",
			simulate_ingestion: "Simulate Live {platform} Ingestion",
			simulating_stage: "Traversing Stage 0{stage}/06...",
			get_api_key: "Get {platform} API Key",
			set_token_dashboard: "Set Token in Dashboard",
			gw_daemon_title: "WhatsApp Gateway Service Daemon",
			gw_daemon_sub: "Baileys socket listener on port 3002. Ingests authorized regional chats and dispatches to NovaPilot Golang core.",
			gw_online: "ONLINE (:3002)",
			gw_offline: "STOPPED / OFFLINE",
			gw_starting: "Launching WhatsApp Gateway service...",
			gw_restarting: "Restarting WhatsApp Gateway daemon...",
			gw_stopping: "Shutting down WhatsApp Gateway daemon...",
			gw_start_btn: "Start Service",
			gw_restart_btn: "Restart Gateway",
			gw_stop_btn: "Shut Down",
			gw_port: "Daemon Port",
			gw_uptime: "Process Uptime",
			gw_memory: "Memory RSS",
			gw_whitelisted: "Whitelisted JIDs",
			gw_terminal_btn: "Terminal & Ingress",
			active_circuit: "Active Circuit: Stage 0{stage} Processing",
			prev_stage: "← Previous Stage",
			next_stage: "Next Stage →",
			root_mechanics: "Root Execution Mechanics:",
			contract_payload: "Payload Contract & Execution Code",
			code_desc: "Preview of structured JSON schema or backend service code snippet.",
			copy_code: "Copy Code",
			copied: "Copied!"
		},
		auth: {
			signin_title: "Sign In to NovaPilot",
			signup_title: "Create On-Call Account",
			portal_subtitle: "Authorized access portal for plant IT on-call engineers and database gatekeepers.",
			google_btn: "Continue with Google Enterprise",
			divider_text: "or continue with work credentials",
			name_label: "Full Name",
			email_label: "Plant Work Email",
			password_label: "Password",
			signin_btn: "Sign In to Operations",
			signup_btn: "Register On-Call Operator",
			autofill_demo: "Autofill Demo Credentials (John Doe - On-Call)",
			need_credentials: "Need new access credentials?",
			register_link: "Register",
			already_registered: "Already have on-call clearance?",
			signin_link: "Sign In",
			unauthorized_error: "Access Denied: Middleware Guardrail blocked unauthenticated access to the On-Call Cockpit. Please authenticate below.",
			logged_out_msg: "You have been signed out safely. Session token revoked.",
			session_guardrail: "Better Auth Session Guardrail Active"
		},
		platforms: {
			page_title: "ChatOps Platform Settings & Logic Flows",
			page_subtitle: "Configure credentials, whitelist filters, rate-limiting, and intake logic for each chat platform.",
			hub_badge: "Multi-Channel Hub",
			select_method: "Select WhatsApp Ingress / Connection Method:",
			verified_routes: "3 Primary Verified Methods",
			tab_wa_api: "WA API Scan",
			tab_wa_gateway: "WA Gateway (TOS)",
			tab_wa_web: "Web (PC & Desktop)",
			wa_gateway_qr: "WA Gateway (QR)",
			wa_web: "WhatsApp Web",
			wa_ferdium: "Ferdium Multi-Service",
			wa_rambox: "Rambox Desktop",
			api_title: "WhatsApp Cloud API (Meta Graph v21.0)",
			api_subtitle: "Official Meta integration with real-time Webhook intake and Quick-Connect QR generator",
			api_phone_id: "Meta Phone Number ID",
			api_waba_id: "WhatsApp Business Account (WABA) ID",
			api_token: "Permanent System User Token (Bearer)",
			api_verify_token: "Webhook Verify Token",
			api_callback_url: "Webhook Callback URL",
			api_test_btn: "Test WhatsApp Cloud API Connection",
			api_qr_title: "Quick-Connect QR Chat (wa.me)",
			api_qr_sub: "Scan this QR to start a direct message thread with the official WhatsApp API account",
			tos_modal_title: "Terms of Service & Risk Disclaimer (TOS)",
			tos_modal_subtitle: "Mandatory Operational Acceptance for Baileys Multi-Device Gateway",
			tos_point_1_title: "1. Unofficial Reverse-Engineered Protocol",
			tos_point_1_desc: "The Baileys service utilizes an unofficial reverse-engineered WhatsApp Web Multi-Device protocol and is not affiliated with Meta or WhatsApp LLC.",
			tos_point_2_title: "2. Account Suspension & Ban Risk",
			tos_point_2_desc: "High-frequency messaging, bulk broadcasting, or unsolicited messages may trigger Meta anti-abuse mechanisms and result in temporary or permanent phone number bans.",
			tos_point_3_title: "3. Internal Enterprise ChatOps Only",
			tos_point_3_desc: "This gateway is strictly designed for internal plant branch coordination, on-call engineer notifications, and invoice staging verification, not marketing blasts.",
			tos_point_4_title: "4. Account Ownership Responsibility",
			tos_point_4_desc: "The operator assumes full ownership and liability for the connected phone number and agrees that the developers bear no responsibility for account actions by Meta.",
			tos_checkbox_label: "I have read, understood the account ban risks, and accept the Terms of Service (TOS) above.",
			tos_accept_btn: "I Agree & Reveal QR Code",
			tos_cancel_btn: "Cancel",
			tos_locked_title: "TOS Acceptance Required",
			tos_locked_desc: "For operational safety, you must review and accept the Terms of Service (TOS) before scanning the Baileys QR code.",
			tos_open_btn: "Review & Accept Terms of Service (TOS)",
			tos_view_btn: "View Terms of Service (TOS)",
			tos_reset_btn: "Reset Agreement",
			tos_accepted_badge: "TOS Accepted",
			pc_support_title: "100% PC & Desktop Ready",
			pc_support_desc: "Fully compatible with PC browsers (Chrome, Edge, Firefox), desktop aggregators (Ferdium, Rambox), and background daemons on Windows / Linux.",
			qr_title: "Baileys Multi-Device QR Pairing",
			qr_subtitle: "Scan QR directly from WhatsApp mobile app on your smartphone",
			qr_status_connected: "CONNECTED",
			qr_status_waiting: "WAITING FOR SCAN",
			qr_status_loading: "LOADING...",
			qr_status_offline: "GATEWAY OFFLINE",
			qr_refresh_btn: "Refresh QR",
			qr_connected_title: "WhatsApp Multi-Device Connected!",
			qr_connected_desc: "Baileys socket session active. Gateway is listening for incoming messages from whitelisted branch groups.",
			qr_steps_title: "Steps to Link WhatsApp on Mobile:",
			qr_step_1: "Open WhatsApp app on your phone.",
			qr_step_2: "Tap three-dot menu (Android) or Settings (iPhone).",
			qr_step_3: "Select Linked Devices.",
			qr_step_4: "Select Link a Device.",
			qr_step_5: "Point your phone camera to the QR code on the side.",
			qr_waiting_init: "Waiting for Gateway Initialization",
			qr_waiting_desc: "Ensure gateway service is running: bun run start or npx tsx src/index.ts in whatsapp-gateway folder.",
			browser_hook_title: "WhatsApp Web (Tampermonkey Hook)",
			browser_hook_sub: "Passive DOM observer on web.whatsapp.com tab",
			ferdium_hook_title: "Ferdium Desktop Integration Hook",
			ferdium_hook_sub: "JavaScript injection into Ferdium WhatsApp service container",
			rambox_hook_title: "Rambox Workspace Integration Hook",
			rambox_hook_sub: "Custom JavaScript injection into WhatsApp app in Rambox",
			how_to_install: "How to Install:",
			browser_install_steps: "Install Tampermonkey or Violentmonkey extension in Chrome/Edge/Firefox, create new script, paste code below, then open web.whatsapp.com.",
			ferdium_install_steps: "Open Ferdium > Right click WhatsApp service > Edit Service > Advanced menu > Paste code into Custom Code (Inject JavaScript code) > Save & Reload.",
			rambox_install_steps: "Open Rambox > Right click WhatsApp service tab > Edit > Advanced tab > Paste code into Inject JavaScript code > Save.",
			network_security_title: "Network Settings & Security Whitelist",
			local_port: "Local Webhook Ingress Port",
			antispam_debounce: "Anti-Spam Debounce Delay (ms)",
			antispam_desc: "Prevents duplicate burst messages from users",
			whitelisted_jids: "Authorized Regional Group JIDs Whitelist",
			whitelisted_jids_desc: "Comma-separated WhatsApp group JIDs (e.g. 120363028391@g.us)",
			security_token: "Tampermonkey / Browser Hook Security Token",
			bot_token: "Telegram BotFather API Token",
			bot_token_desc: "Obtained by creating a bot via @BotFather on Telegram",
			delivery_mode: "Ingress Delivery Mode",
			supervisor_id: "Supervisor Telegram User ID",
			authorized_chat_ids: "Authorized Regional Group Chat IDs",
			authorized_chat_ids_desc: "Negative integers for supergroups (e.g. -100192837482)",
			discord_token: "Discord Bot Token",
			guild_id: "Authorized Server Guild ID",
			rbac_role: "RBAC Mutation Role Name",
			whitelisted_channels: "Whitelisted Ingress Channel IDs",
			slack_token: "Bot User OAuth Token (xoxb)",
			signing_secret: "Slack Signing Secret (HMAC SHA256)",
			signing_secret_desc: "Used to cryptographically verify X-Slack-Signature",
			team_id: "Corporate Team ID",
			slash_command: "Registered Slash Command",
			logic_flow_title: "{platform} Ingestion Logic Flow",
			flow_step_1_title: "Edge Whitelist Gate",
			flow_step_1_desc: "Incoming packet sender identifier is verified against whitelist. Casual banter dropped with 0 token waste.",
			flow_step_2_title: "Deterministic LLM Parsing",
			flow_step_2_desc: "Conversation converted strictly to JSON Schema (intent, document_no, target_field, proposed_value) at Temp = 0.0.",
			flow_step_3_title: "Live SSE Cockpit Stream",
			flow_step_3_desc: "Pushed immediately to On-Call Engineer's WebUI for human review and atomic prepared statement execution.",
			copy_config: "Copy Config"
		},
		tutorial: {
			title: "Client Hook Integration Guide",
			subtitle: "Setup instructions and copyable snippets for Ferdium, Rambox, Web WA, and PC WA.",
			tab_ferdium: "Ferdium Desktop",
			tab_rambox: "Rambox App",
			tab_web: "WhatsApp Web (Chrome / Edge)",
			tab_pc: "PC WhatsApp (Baileys Gateway)",
			ferdium_title: "1. Connect via Native Ferdium Electron Recipe",
			ferdium_badge: "Zero QR Scan",
			ferdium_desc: "Ferdium allows injecting scripts directly into its WhatsApp service webview. NovaPilot provides a dedicated observer hook that captures invoice mutation chats without requiring third-party browser extensions.",
			steps_heading: "Step-by-Step Installation:",
			ferdium_s1: "Locate your Ferdium recipe folder: %APPDATA%\\Ferdium\\recipes\\whatsapp\\",
			ferdium_s2: "Copy novapilot-hook.js into that folder.",
			ferdium_s3: "Open webview.js in the same folder, and append the injection snippet below.",
			ferdium_s4: "In Ferdium, press Ctrl + R on your WhatsApp tab.",
			copy_snippet: "Copy Snippet",
			rambox_title: "2. Connect via Rambox Custom JavaScript Injection",
			rambox_badge: "Service Advanced",
			rambox_desc: "Rambox supports running arbitrary JavaScript inside any app tab. By injecting our observer, chats containing invoice mutations are passively forwarded to NovaPilot at http://127.0.0.1:8088/api/tickets.",
			rambox_s1: "Open Rambox and right-click your WhatsApp service icon.",
			rambox_s2: "Select Settings -> Expand Advanced.",
			rambox_s3: "Find the \"Inject JavaScript code\" input box.",
			rambox_s4: "Paste the script snippet below and click Save.",
			web_title: "3. Connect via Browser Userscript (Chrome, Edge, Firefox)",
			web_badge: "Tampermonkey",
			web_desc: "If you use WhatsApp Web in Google Chrome, Microsoft Edge, or Mozilla Firefox, you can install the lightweight Tampermonkey userscript to hook incoming messages automatically.",
			web_s1: "Install Tampermonkey extension from Chrome Web Store.",
			web_s2: "Click Tampermonkey icon -> Create a new script.",
			web_s3: "Paste the Userscript code below and press Ctrl + S.",
			web_s4: "Reload web.whatsapp.com.",
			pc_title: "4. Standalone PC WhatsApp Gateway (Baileys Socket)",
			pc_badge: "Headless Daemon",
			pc_desc: "Run a dedicated Node.js service using @whiskeysockets/baileys or whatsapp-web.js locally as a Windows Service or background process. It connects directly to the WhatsApp Multi-Device protocol.",
			pc_cmd_label: "Daemon Command:",
			send_ping_btn: "Send Test Hook Ping",
			ping_received: "Ping Received in Approval Queue!",
			close_btn: "Close Guide"
		},
		command: {
			search_placeholder: "Search menus, operations, connectors, or docs...",
			no_results: "No results found for \"{query}\".",
			category_core: "Core Navigation",
			category_operations: "Operations",
			category_db: "Databases & Telemetry",
			category_chatops: "ChatOps & Hooks",
			category_settings: "System Settings",
			nav_hint: "Use ↑ ↓ to navigate",
			select_hint: "↵ to select"
		},
		user_nav: {
			oncall_role: "On-Call Engineer",
			it_support: "IT Support",
			signin: "Sign In",
			oncall_roster: "On-Call Roster",
			roster_schedule: "2x Monthly (Shift 1 of 2)",
			covered_branches: "Covered Branches:",
			dashboard_queue: "Dashboard Approval Queue",
			system_architecture: "System Architecture Flow",
			sign_out: "Sign Out"
		}
	}
};

class I18nState {
	current = $state<Locale>("id");

	constructor() {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("novapilot_locale") as Locale | null;
			if (saved && (saved === "id" || saved === "en")) {
				this.current = saved;
			} else {
				// Default to Indonesian if browser language contains "id", otherwise English
				const browserLang = navigator.language.toLowerCase();
				this.current = browserLang.startsWith("id") ? "id" : "en";
			}
		}
	}

	setLocale(locale: Locale) {
		this.current = locale;
		if (typeof window !== "undefined") {
			localStorage.setItem("novapilot_locale", locale);
			document.documentElement.lang = locale;
		}
	}

	toggleLocale() {
		this.setLocale(this.current === "id" ? "en" : "id");
	}

	get locale(): Locale {
		return this.current;
	}

	// Reactive dictionary getter
	get t(): Translations {
		return dictionaries[this.current] || dictionaries.id;
	}

	// Helper for nested path lookups: tKey("nav.cockpit")
	tKey(path: string): string {
		const parts = path.split(".");
		let cur: any = dictionaries[this.current];
		for (const part of parts) {
			if (cur && typeof cur === "object" && part in cur) {
				cur = cur[part];
			} else {
				return path;
			}
		}
		return typeof cur === "string" ? cur : path;
	}
}

export const i18n = new I18nState();

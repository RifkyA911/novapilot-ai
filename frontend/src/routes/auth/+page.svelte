<script lang="ts">
	import { ShieldCheck, LockClosed, Envelope, ArrowRight, CheckCircle, ExclamationTriangle, Sparkles, Key } from "svelte-heros-v2";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { i18n } from "$lib/i18n.svelte";

	let mode = $state<"signin" | "signup">("signin");
	let email = $state("");
	let password = $state("");
	let name = $state("");
	let loading = $state(false);
	let errorMessage = $state("");
	let successMessage = $state("");

	let unauthorizedError = $derived($page.url.searchParams.get("error") === "unauthorized");
	let loggedOutMsg = $derived($page.url.searchParams.get("message") === "logged_out");

	async function handleGoogleLogin() {
		loading = true;
		errorMessage = "";
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider: "google",
					email: "john.doe@enterprise.corp",
					name: "John Doe (Google Workspace)"
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to authenticate with Google");
			
			successMessage = "Google identity verified. Redirecting to On-Call Cockpit...";
			setTimeout(() => {
				window.location.href = "/dashboard";
			}, 400);
		} catch (err: any) {
			errorMessage = err?.message || "Failed to initiate Google Authentication";
			loading = false;
		}
	}

	async function handleEmailAuth(e: Event) {
		e.preventDefault();
		loading = true;
		errorMessage = "";
		successMessage = "";

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					name: mode === "signup" ? name : undefined
				})
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Authentication failed");
			}

			successMessage = mode === "signin" 
				? "Session granted by Guardrail Engine. Launching Cockpit..."
				: "Account registered successfully! Launching Cockpit...";
			
			setTimeout(() => {
				window.location.href = "/dashboard";
			}, 400);
		} catch (err: any) {
			errorMessage = err.message || "Authentication error occurred";
			loading = false;
		}
	}

	function fillDemoAccount() {
		email = "johndoe@factory.internal";
		password = "oncall-shift-password-2026";
		name = "John Doe";
	}
</script>

<div class="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
	<!-- VibeUI Ambient Gradient Glow -->
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
		style="background: radial-gradient(circle, #2FB479 0%, transparent 70%);"
	></span>
	<span
		aria-hidden="true"
		class="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-25 blur-3xl"
		style="background: radial-gradient(circle, #3B82F6 0%, transparent 70%);"
	></span>

	<!-- VibeUI Centered Card Container -->
	<div class="w-full max-w-md space-y-6 bg-card/90 backdrop-blur-xl p-8 rounded-2xl border border-border/70 shadow-2xl relative z-10 transition-all">
		<!-- Header -->
		<div class="text-center space-y-2">
			<div class="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg shadow-primary/25 border border-primary/20">
				<ShieldCheck class="h-6 w-6" />
			</div>
			<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-mono text-muted-foreground border border-border/50">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				<span>{i18n.t.auth.session_guardrail}</span>
			</div>
			<h2 class="text-2xl font-bold tracking-tight text-foreground">
				{mode === "signin" ? i18n.t.auth.signin_title : i18n.t.auth.signup_title}
			</h2>
			<p class="text-xs text-muted-foreground max-w-xs mx-auto">
				{i18n.t.auth.portal_subtitle}
			</p>
		</div>

		<!-- Alerts -->
		{#if unauthorizedError}
			<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
				<ExclamationTriangle class="h-4 w-4 shrink-0" />
				<span>{i18n.t.auth.unauthorized_error}</span>
			</div>
		{/if}

		{#if loggedOutMsg}
			<div class="p-3 rounded-lg bg-secondary/80 border border-border text-muted-foreground text-xs flex items-center gap-2">
				<CheckCircle class="h-4 w-4 shrink-0 text-emerald-400" />
				<span>{i18n.t.auth.logged_out_msg}</span>
			</div>
		{/if}

		{#if errorMessage}
			<div class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
				<ExclamationTriangle class="h-4 w-4 shrink-0" />
				<span>{errorMessage}</span>
			</div>
		{/if}
		{#if successMessage}
			<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
				<CheckCircle class="h-4 w-4 shrink-0" />
				<span>{successMessage}</span>
			</div>
		{/if}

		<!-- VibeUI Social-First Stack -->
		<div class="space-y-4">
			<button
				type="button"
				onclick={handleGoogleLogin}
				disabled={loading}
				class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border/80 bg-secondary/60 hover:bg-secondary text-foreground text-sm font-medium transition-all shadow-sm hover:border-foreground/30 active:scale-[0.99] disabled:opacity-50"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
					/>
				</svg>
				<span>{i18n.t.auth.google_btn}</span>
			</button>

			<div class="relative flex items-center justify-center text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
				<div class="w-full border-t border-border/50"></div>
				<span class="bg-card px-3 shrink-0">{i18n.t.auth.divider_text}</span>
				<div class="w-full border-t border-border/50"></div>
			</div>
		</div>

		<!-- Email Form -->
		<form onsubmit={handleEmailAuth} class="space-y-4">
			{#if mode === "signup"}
				<div>
					<label for="name-input" class="block text-xs font-medium text-foreground mb-1">{i18n.t.auth.name_label}</label>
					<input
						id="name-input"
						type="text"
						bind:value={name}
						required
						placeholder="e.g. John Doe"
						class="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
					/>
				</div>
			{/if}

			<div>
				<label for="email-input" class="block text-xs font-medium text-foreground mb-1">{i18n.t.auth.email_label}</label>
				<input
					id="email-input"
					type="email"
					bind:value={email}
					required
					placeholder="johndoe@factory.internal"
					class="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors font-mono text-xs"
				/>
			</div>

			<div>
				<label for="pass-input" class="block text-xs font-medium text-foreground mb-1">{i18n.t.auth.password_label}</label>
				<input
					id="pass-input"
					type="password"
					bind:value={password}
					required
					placeholder="••••••••••••"
					class="w-full px-3.5 py-2.5 rounded-xl bg-background/80 border border-border text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
			>
				<span>{mode === "signin" ? i18n.t.auth.signin_btn : i18n.t.auth.signup_btn}</span>
				<ArrowRight class="h-4 w-4" />
			</button>
		</form>

		<!-- Footer Controls -->
		<div class="pt-4 border-t border-border/40 flex flex-col items-center gap-2.5 text-xs">
			<button
				type="button"
				onclick={fillDemoAccount}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-primary font-mono text-[11px] transition-colors border border-border/50"
			>
				<Sparkles class="h-3.5 w-3.5" />
				<span>{i18n.t.auth.autofill_demo}</span>
			</button>

			<div class="text-muted-foreground text-[11px]">
				{#if mode === "signin"}
					{i18n.t.auth.need_credentials}
					<button
						type="button"
						onclick={() => (mode = "signup")}
						class="text-foreground font-semibold hover:underline ml-1"
					>
						{i18n.t.auth.register_link}
					</button>
				{:else}
					{i18n.t.auth.already_registered}
					<button
						type="button"
						onclick={() => (mode = "signin")}
						class="text-foreground font-semibold hover:underline ml-1"
					>
						{i18n.t.auth.signin_link}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

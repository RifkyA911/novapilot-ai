<script lang="ts">
	import { onMount } from "svelte";
	import { Sun, Moon } from "svelte-heros-v2";

	let isDark = $state(false);

	onMount(() => {
		try {
			const saved = localStorage.getItem("theme");
			if (saved === "dark") {
				isDark = true;
				document.documentElement.classList.add("dark");
			} else {
				isDark = false;
				document.documentElement.classList.remove("dark");
			}
		} catch (_) {}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	}
</script>

<button
	type="button"
	onclick={toggleTheme}
	class="relative inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-secondary text-foreground transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 focus:outline-none"
	title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
	aria-label="Toggle theme"
>
	{#if isDark}
		<Sun class="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0" />
	{:else}
		<Moon class="h-4 w-4 text-slate-700 transition-transform duration-200 rotate-0" />
	{/if}
</button>

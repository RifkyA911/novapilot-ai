<script lang="ts">
	import { cn } from "$lib/utils";

	interface Props {
		mainCircleSize?: number;
		mainCircleOpacity?: number;
		numCircles?: number;
		class?: string;
	}

	let {
		mainCircleSize = 210,
		mainCircleOpacity = 0.24,
		numCircles = 8,
		class: className = ""
	}: Props = $props();
</script>

<div
	class={cn(
		"pointer-events-none absolute inset-0 select-none overflow-hidden [mask-image:linear-gradient(to_bottom,white,transparent)]",
		className
	)}
>
	{#each Array.from({ length: numCircles }) as _, i}
		{@const size = mainCircleSize + i * 70}
		{@const opacity = mainCircleOpacity - i * 0.03}
		{@const animationDelay = `${i * 0.06}s`}
		<div
			class="animate-ripple absolute rounded-full border shadow-xl"
			style="
				--i: {i};
				width: {size}px;
				height: {size}px;
				opacity: {opacity};
				animation-delay: {animationDelay};
				border-style: solid;
				border-width: 1px;
				border-color: rgba(47, 180, 121, 0.45);
				background: radial-gradient(circle, rgba(47, 180, 121, 0.06) 0%, transparent 80%);
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%) scale(1);
			"
		></div>
	{/each}
</div>

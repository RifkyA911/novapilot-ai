<script lang="ts">
	import { onMount } from "svelte";

	interface Props {
		gridSize?: number;
		pulseSpeed?: number;
		className?: string;
		maxDistance?: number;
	}

	let { 
		gridSize = 42, 
		pulseSpeed = 0.035, 
		className = "",
		maxDistance = 160
	}: Props = $props();

	let canvasRef: HTMLCanvasElement;
	let isDark = $state(false);

	onMount(() => {
		if (!canvasRef) return;
		const ctx = canvasRef.getContext("2d");
		if (!ctx) return;

		// Detect dark mode
		const checkTheme = () => {
			isDark = document.documentElement.classList.contains("dark");
		};
		checkTheme();

		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

		let animationFrameId: number;
		let width = 0;
		let height = 0;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const mouse = { x: -2000, y: -2000, targetX: -2000, targetY: -2000 };

		const handleResize = () => {
			if (!canvasRef) return;
			const rect = canvasRef.getBoundingClientRect();
			width = rect.width;
			height = rect.height;
			canvasRef.width = width * dpr;
			canvasRef.height = height * dpr;
			ctx.scale(dpr, dpr);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		const handleMouseMove = (e: MouseEvent) => {
			if (!canvasRef) return;
			const rect = canvasRef.getBoundingClientRect();
			mouse.targetX = e.clientX - rect.left;
			mouse.targetY = e.clientY - rect.top;
		};

		const handleMouseLeave = () => {
			mouse.targetX = -2000;
			mouse.targetY = -2000;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseleave", handleMouseLeave);

		let time = 0;

		const render = () => {
			time += pulseSpeed;

			// Smooth mouse lerp
			mouse.x += (mouse.targetX - mouse.x) * 0.12;
			mouse.y += (mouse.targetY - mouse.y) * 0.12;

			ctx.clearRect(0, 0, width, height);

			const cols = Math.ceil(width / gridSize) + 1;
			const rows = Math.ceil(height / gridSize) + 1;

			// 1. Draw subtle connecting grid lines
			ctx.lineWidth = 0.6;
			for (let i = 0; i <= cols; i++) {
				const x = i * gridSize;
				const alpha = isDark ? 0.035 : 0.045;
				ctx.strokeStyle = isDark ? `rgba(16, 185, 129, ${alpha})` : `rgba(13, 148, 136, ${alpha})`;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, height);
				ctx.stroke();
			}

			for (let j = 0; j <= rows; j++) {
				const y = j * gridSize;
				const alpha = isDark ? 0.035 : 0.045;
				ctx.strokeStyle = isDark ? `rgba(16, 185, 129, ${alpha})` : `rgba(13, 148, 136, ${alpha})`;
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(width, y);
				ctx.stroke();
			}

			// 2. Moving Pulsar beam waves along lines
			const pulseWaveX = (Math.sin(time * 0.5) * 0.5 + 0.5) * width;
			const pulseWaveY = (Math.cos(time * 0.4) * 0.5 + 0.5) * height;

			// 3. Draw Pulsating Dots
			for (let i = 0; i < cols; i++) {
				for (let j = 0; j < rows; j++) {
					const baseX = i * gridSize;
					const baseY = j * gridSize;

					// Distance from mouse
					const dx = mouse.x - baseX;
					const dy = mouse.y - baseY;
					const dist = Math.sqrt(dx * dx + dy * dy);

					// Dynamic wave equation
					const wave = Math.sin(time + (i * 0.25) + (j * 0.25)) * 0.5 + 0.5;
					const distFactor = Math.max(0, 1 - dist / maxDistance);

					// Hover interaction: proximity enlargement & repulsion
					let radius = isDark ? 1.4 : 1.2;
					let opacity = isDark ? (0.15 + wave * 0.25) : (0.18 + wave * 0.2);

					if (dist < maxDistance) {
						// Enhanced pulse when mouse approaches
						radius += distFactor * 2.8;
						opacity = Math.min(1.0, opacity + distFactor * 0.75);
					}

					// Intersecting pulsar beam boost
					const distToBeamX = Math.abs(baseX - pulseWaveX);
					const distToBeamY = Math.abs(baseY - pulseWaveY);
					if (distToBeamX < gridSize * 1.5 || distToBeamY < gridSize * 1.5) {
						opacity = Math.min(0.9, opacity + 0.2);
						radius += 0.4;
					}

					// Glow ring on highly energized dots near cursor
					if (distFactor > 0.45) {
						ctx.beginPath();
						ctx.arc(baseX, baseY, radius * 2.4, 0, Math.PI * 2);
						ctx.fillStyle = isDark
							? `rgba(6, 182, 212, ${distFactor * 0.28})` // Cyan aura
							: `rgba(20, 184, 166, ${distFactor * 0.22})`;
						ctx.fill();
					}

					// Main dot
					ctx.beginPath();
					ctx.arc(baseX, baseY, Math.max(0.5, radius), 0, Math.PI * 2);
					ctx.fillStyle = isDark
						? (distFactor > 0.5 ? `rgba(52, 211, 153, ${opacity})` : `rgba(16, 185, 129, ${opacity})`)
						: (distFactor > 0.5 ? `rgba(15, 118, 110, ${opacity})` : `rgba(13, 148, 136, ${opacity})`);
					ctx.fill();
				}
			}

			animationFrameId = requestAnimationFrame(render);
		};

		render();

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseleave", handleMouseLeave);
			cancelAnimationFrame(animationFrameId);
		};
	});
</script>

<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden {className}">
	<canvas
		bind:this={canvasRef}
		class="h-full w-full opacity-90 transition-opacity duration-700 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_40%,#000_65%,transparent_100%)]"
	></canvas>
</div>

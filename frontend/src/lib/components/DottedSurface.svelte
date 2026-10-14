<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import * as THREE from "three";

	let container: HTMLDivElement | null = $state(null);
	let animationFrameId: number;

	onMount(() => {
		if (!container) return;

		// 1. Scene, Camera, Renderer
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || 650;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(65, width / height, 1, 10000);
		camera.position.set(0, 320, 520);
		camera.lookAt(0, -20, -120);

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
			powerPreference: "high-performance"
		});
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		container.appendChild(renderer.domElement);

		// 2. Dotted Surface Grid Geometry
		const SEPARATION = 38;
		const AMOUNTX = 60;
		const AMOUNTY = 50;
		const numParticles = AMOUNTX * AMOUNTY;

		const positions = new Float32Array(numParticles * 3);
		const scales = new Float32Array(numParticles);

		let i = 0, j = 0;
		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2; // x
				positions[i + 1] = 0; // y
				positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2; // z
				scales[j] = 1;
				i += 3;
				j++;
			}
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

		// Check initial dark theme
		const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
		const dotColor = isDark ? 0x10b981 : 0x059669;

		// Anti-aliased circle texture
		const canvas = document.createElement("canvas");
		canvas.width = 32;
		canvas.height = 32;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			ctx.beginPath();
			ctx.arc(16, 16, 13, 0, Math.PI * 2);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
		}
		const texture = new THREE.CanvasTexture(canvas);

		const material = new THREE.PointsMaterial({
			color: dotColor,
			size: 6.5,
			map: texture,
			transparent: true,
			opacity: isDark ? 0.42 : 0.32,
			blending: THREE.NormalBlending,
			depthWrite: false
		});

		const particles = new THREE.Points(geometry, material);
		scene.add(particles);

		// 3. Fluid Water Wave Animation Loop
		let count = 0;
		function animate() {
			animationFrameId = requestAnimationFrame(animate);

			const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
			const posArray = positionAttribute.array as Float32Array;

			let idx = 0;
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					// Dual sine-wave fluid motion formula
					posArray[idx + 1] =
						Math.sin((ix + count) * 0.32) * 36 +
						Math.sin((iy + count) * 0.48) * 36;
					idx += 3;
				}
			}

			positionAttribute.needsUpdate = true;
			count += 0.045;

			renderer.render(scene, camera);
		}
		animate();

		// 4. Resize Listener
		const handleResize = () => {
			if (!container) return;
			const newW = container.clientWidth;
			const newH = container.clientHeight;
			camera.aspect = newW / newH;
			camera.updateProjectionMatrix();
			renderer.setSize(newW, newH);
		};
		window.addEventListener("resize", handleResize);

		// 5. Theme Sync Observer (Switches Dot Tone on Light/Dark Toggle)
		const themeObserver = new MutationObserver(() => {
			const darkNow = document.documentElement.classList.contains("dark");
			material.color.setHex(darkNow ? 0x10b981 : 0x059669);
			material.opacity = darkNow ? 0.42 : 0.32;
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", handleResize);
			themeObserver.disconnect();
			renderer.dispose();
			geometry.dispose();
			material.dispose();
			texture.dispose();
			if (container && renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		};
	});

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== "undefined" && animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>

<div 
	bind:this={container} 
	class="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)] -z-10"
	aria-hidden="true"
></div>

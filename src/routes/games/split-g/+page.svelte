<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let imageElement: HTMLImageElement;
	let clickY = $state<number | null>(null);
	let previewY = $state<number | null>(null); // For showing line while dragging
	let isDragging = $state(false);
	let score = $state<number | null>(null);
	let loading = $state(false);
	let submitted = $state(false);

	const PERFECT_POSITION = 0.555; // 35% down from top is the "perfect" split

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	function getRelativeY(clientY: number): number {
		if (!imageElement) return 0;
		const rect = imageElement.getBoundingClientRect();
		const y = clientY - rect.top;
		return y / rect.height;
	}

	function handleStart(event: MouseEvent | TouchEvent) {
		if (submitted) return;

		isDragging = true;

		// Prevent scrolling on touch devices
		if ('touches' in event) {
			event.preventDefault();
		}

		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		previewY = getRelativeY(clientY);
	}

	function handleMove(event: MouseEvent | TouchEvent) {
		if (!isDragging || submitted) return;

		// Prevent scrolling while dragging
		event.preventDefault();

		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		previewY = getRelativeY(clientY);
	}

	function handleEnd(event: MouseEvent | TouchEvent) {
		if (!isDragging || submitted) return;

		// Prevent default action
		if ('touches' in event || 'changedTouches' in event) {
			event.preventDefault();
		}

		isDragging = false;

		if (previewY !== null) {
			clickY = previewY;

			// Calculate score - closer to perfect position = better score
			const difference = Math.abs(clickY - PERFECT_POSITION);
			score = Math.max(0, Math.round((1 - difference * 2) * 100));
		}
	}

	function handleCancel() {
		isDragging = false;
		previewY = null;
	}

	async function submitScore() {
		if (score === null || !auth.user) return;

		loading = true;

		try {
			const { error } = await supabase.from('scores').upsert(
				{
					user_id: auth.user.id,
					game_type: 'split_g',
					raw_value: score
				},
				{
					onConflict: 'user_id,game_type'
				}
			);

			if (error) throw error;

			submitted = true;

			setTimeout(() => {
				goto('/dashboard');
			}, 2000);
		} catch (err: any) {
			console.error('Fel vid inskickning:', err);
			alert('Kunde inte skicka in resultatet. Försök igen.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<div class="mb-6" in:fly={{ y: -20, duration: 500 }}>
			<a href="/dashboard" class="btn mb-4 btn-ghost btn-sm"> ← Tillbaka </a>
			<h1 class="flex items-center justify-center gap-2 text-4xl font-bold">Split the G</h1>
			<p class="mt-2 flex justify-center text-base-content/70">Placera linjen vid din skumgräns</p>
		</div>

		<div
			class="card mb-6 border border-info/30 bg-info/10 shadow-xl"
			in:fly={{ y: 20, duration: 500, delay: 50 }}
		>
			<div class="card-body">
				<h2 class="card-title text-info">📋 Spelregler</h2>
				<div class="space-y-2 text-sm">
					<p>🍺 Drick tills du prickar mitten av G:et.</p>
					<p>🍺 Drick i ett svep.</p>
					<p>🍺 Tips: Tre hyggliga klunkar brukar pricka rätt.</p>
				</div>
			</div>
		</div>

		<!-- Game Area -->
		<div
			class="card border border-base-300 bg-base-200/80 shadow-xl backdrop-blur-sm"
			in:fly={{ y: 20, duration: 500, delay: 100 }}
		>
			<div class="card-body">
				<div class="relative mx-auto w-full max-w-md">
					<!-- Guinness Glass Image Container -->
					<div
						class="relative overflow-hidden rounded-xl shadow-2xl select-none {isDragging
							? 'cursor-grabbing'
							: 'cursor-grab'}"
						style="touch-action: none;"
						onmousedown={handleStart}
						onmousemove={handleMove}
						onmouseup={handleEnd}
						onmouseleave={handleCancel}
						ontouchstart={handleStart}
						ontouchmove={handleMove}
						ontouchend={handleEnd}
						ontouchcancel={handleCancel}
						role="button"
						tabindex="0"
						aria-label="Tryck och dra för att placera linjen på Guinness-glaset"
					>
						<!-- The actual Guinness glass image -->
						<img
							bind:this={imageElement}
							src="/guinness-glass.jpg"
							alt="Guinness Glas"
							class="pointer-events-none block h-auto w-full"
							draggable="false"
						/>

						<!-- Preview line while dragging -->
						{#if isDragging && previewY !== null}
							<div
								class="pointer-events-none absolute right-0 left-0 animate-pulse border-t-2 border-dashed border-warning"
								style="top: {previewY * 100}%"
								transition:fly={{ x: -30, duration: 150 }}
							>
								<div
									class="absolute -top-6 right-2 rounded bg-warning px-2 py-1 text-xs font-bold text-warning-content shadow-lg"
								>
									Dra här
								</div>
							</div>
						{/if}

						<!-- Click indicator line - positioned absolutely over image -->
						{#if clickY !== null && !isDragging}
							<div
								class="pointer-events-none absolute right-0 left-0 border-t-2 border-dashed border-error"
								style="top: {clickY * 100}%"
								transition:fly={{ x: -50, duration: 300 }}
							>
								<div
									class="absolute -top-6 right-2 rounded bg-error px-2 py-1 text-xs font-bold text-error-content shadow-lg"
								>
									Ditt tryck
								</div>
							</div>
						{/if}

						<!-- Perfect position indicator (shown after click) -->
						{#if clickY !== null && !isDragging}
							<div
								class="pointer-events-none absolute right-0 left-0 border-t-2 border-dashed border-success"
								style="top: {PERFECT_POSITION * 100}%"
								transition:fly={{ x: 50, duration: 300, delay: 150 }}
							>
								<div
									class="absolute -top-6 left-2 rounded bg-success px-2 py-1 text-xs font-bold text-success-content shadow-lg"
								>
									Perfekt split
								</div>
							</div>
						{/if}
					</div>
				</div>

				{#if score !== null}
					<div class="mt-6 text-center" transition:fly={{ y: 20, duration: 400 }}>
						<div class="mb-4">
							<div class="text-6xl font-bold text-primary">{score}</div>
							<div class="text-sm text-base-content/70">Precisions-poäng</div>
						</div>

						{#if score >= 90}
							<div class="mb-2 text-2xl">🎯 Perfekt!</div>
						{:else if score >= 70}
							<div class="mb-2 text-2xl">👍 Bra jobbat!</div>
						{:else if score >= 50}
							<div class="mb-2 text-2xl">😅 Inte illa!</div>
						{:else}
							<div class="mb-2 text-2xl">🫣 Hmm...</div>
						{/if}

						{#if !submitted}
							<button
								onclick={submitScore}
								class="btn w-full shadow-lg btn-lg btn-primary hover:shadow-primary/50"
								disabled={loading}
							>
								{#if loading}
									<span class="loading loading-spinner"></span>
									Skickar...
								{:else}
									✅ Skicka in
								{/if}
							</button>
						{:else}
							<div class="alert alert-success">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 shrink-0 stroke-current"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>Resultatet inskickat! Omdirigerar...</span>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Hint -->
				<div class="mt-4 text-center text-sm text-base-content/50">
					💡 Tips: Håll och dra för att placera linjen där skummet delar sig på Guinness-glaset
				</div>
			</div>
		</div>
	</div>
</div>

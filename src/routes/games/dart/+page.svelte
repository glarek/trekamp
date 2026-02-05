<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let placement = $state<number | null>(null);
	let loading = $state(false);
	let submitted = $state(false);

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	async function submitScore() {
		if (placement === null || !auth.user || placement < 1) {
			alert('Vänligen ange en giltig placering (1 eller högre)');
			return;
		}

		loading = true;

		try {
			const { error } = await supabase.from('scores').upsert(
				{
					user_id: auth.user.id,
					game_type: 'dart',
					raw_value: placement
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

	function getPlacementSuffix(num: number): string {
		if (num === 1) return ':a';
		if (num === 2) return ':a';
		if (num === 3) return ':e';
		return ':e';
	}

	const placements = [
		{ value: 1, label: '🥇 1:a plats' },
		{ value: 2, label: '🥈 2:a plats' },
		{ value: 3, label: '🥉 3:e plats' },
		{ value: 4, label: '4:e plats' },
		{ value: 5, label: '5:e plats' },
		{ value: 6, label: '6:e plats' }
	];
</script>

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<div class="mb-6" in:fly={{ y: -20, duration: 500 }}>
			<a href="/dashboard" class="btn mb-4 btn-ghost btn-sm"> ← Tillbaka </a>
			<h1 class="flex items-center gap-2 text-4xl font-bold">🎯 Dart</h1>
			<p class="mt-2 text-base-content/70">Registrera din placering i dartspelet</p>
		</div>

		<!-- Game Rules -->
		<div
			class="card mb-6 border border-info/30 bg-info/10 shadow-xl"
			in:fly={{ y: 20, duration: 500, delay: 50 }}
		>
			<div class="card-body">
				<h2 class="card-title text-info">📋 Spelregler</h2>
				<div class="space-y-2 text-sm">
					<p>🎯 Alla börjar med <strong>101 poäng</strong></p>
					<p>🎯 Tre pilar kastas per runda</p>
					<p>🎯 Första som kommer till <strong>exakt 0</strong> vinner!</p>
					<p>🎯 Man behöver <strong>inte</strong> gå ut på en dubbel/trippel</p>
					<p>🎯 Den som går ut först får 1:a plats, nästa 2:a, osv.</p>
				</div>
			</div>
		</div>

		<!-- Game Area -->
		<div
			class="card border border-base-300 bg-base-200/80 shadow-xl backdrop-blur-sm"
			in:fly={{ y: 20, duration: 500, delay: 100 }}
		>
			<div class="card-body">
				<h2 class="mb-4 card-title">🏆 Vilken plats kom du på?</h2>

				<!-- Placement Options -->
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
					{#each placements as place, i}
						<button
							onclick={() => (placement = place.value)}
							class="btn h-auto flex-col gap-2 p-4 transition-all btn-lg {placement === place.value
								? 'scale-105 shadow-lg btn-primary'
								: 'btn-outline hover:btn-primary'}"
							in:fly={{ y: 20, duration: 400, delay: i * 50 }}
						>
							<div class="text-3xl">{place.label.split(' ')[0]}</div>
							<div class="text-sm">{place.label.split(' ').slice(1).join(' ')}</div>
						</button>
					{/each}
				</div>

				<!-- Custom Placement Input -->
				<div class="divider">ELLER</div>

				<div class="form-control">
					<label class="label" for="customPlacement">
						<span class="label-text">Ange annan placering</span>
					</label>
					<input
						id="customPlacement"
						type="number"
						min="1"
						placeholder="Vilken plats kom du på? (t.ex. 7, 8...)"
						class="input-bordered input w-full input-primary"
						bind:value={placement}
					/>
				</div>

				{#if placement !== null && placement > 0}
					<div class="mt-6" transition:fly={{ y: 20, duration: 400 }}>
						<div class="mb-4 alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="h-6 w-6 shrink-0 stroke-current"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span
								>Du kom på <strong>{placement}{getPlacementSuffix(placement)} plats</strong>! 🎉</span
							>
						</div>

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
									✅ Skicka in resultat
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
			</div>
		</div>
	</div>
</div>

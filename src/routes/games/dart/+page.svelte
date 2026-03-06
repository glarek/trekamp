<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let score = $state<number | null>(null);
	let loading = $state(false);
	let submitted = $state(false);
	let hasExistingScore = $state(false);

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
			return unsubscribe;
		}

		(async () => {
			try {
				const { data } = await supabase
					.from('scores')
					.select('*')
					.eq('user_id', auth.user.id)
					.eq('game_type', 'dart')
					.single();

				if (data) {
					hasExistingScore = true;
					score = data.raw_value;
				}
			} catch (err) {
				// No existing score
			}
		})();

		return unsubscribe;
	});

	async function submitScore() {
		if (score === null || !auth.user || score < 0) {
			alert('Vänligen ange ett giltigt poängresultat (0 eller högre)');
			return;
		}

		loading = true;

		try {
			const { error } = await supabase.from('scores').upsert(
				{
					user_id: auth.user.id,
					game_type: 'dart',
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
			<h1 class="flex items-center gap-2 text-4xl font-bold">🎯 Dart</h1>
			<p class="mt-2 text-base-content/70">Registrera ditt poängresultat i dartspelet</p>
		</div>

		<!-- Game Rules -->
		<div
			class="card mb-6 border border-info/30 bg-info/10 shadow-xl"
			in:fly={{ y: 20, duration: 500, delay: 50 }}
		>
			<div class="card-body">
				<h2 class="card-title text-info">📋 Spelregler</h2>
				<div class="space-y-2 text-sm">
					<p>🎯 Alla kastar <strong>6 stycken pilar</strong></p>
					<p>🎯 Pilarna kastas direkt efter varandra</p>
					<p>🎯 Summera resultatet från alla 6 pilar</p>
					<p>🎯 Högst totalpoäng vinner och får placering nr 1!</p>
				</div>
			</div>
		</div>

		<!-- Game Area -->
		<div
			class="card border border-base-300 bg-base-200/80 shadow-xl backdrop-blur-sm"
			in:fly={{ y: 20, duration: 500, delay: 100 }}
		>
			<div class="card-body">
				<h2 class="mb-4 card-title">🏆 Vad blev din totalpoäng?</h2>

				<!-- Custom Placement Input -->
				<div class="form-control">
					<label class="label" for="scoreInput">
						<span class="label-text">Ange din slutpoäng (summan av 6 pilar)</span>
					</label>
					<div class="join w-full">
						<input
							id="scoreInput"
							type="number"
							min="0"
							placeholder="T.ex. 60, 100, 180..."
							class="input-bordered input join-item w-full input-primary"
							bind:value={score}
							disabled={hasExistingScore}
						/>
						<span class="btn btn-disabled join-item bg-base-300">poäng</span>
					</div>
				</div>

				{#if hasExistingScore}
					<div class="mt-6 alert alert-warning">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span>Ditt resultat är låst! Prata med spelledaren om det blivit fel.</span>
					</div>
				{:else if score !== null && score >= 0}
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
							<span>Du fick ihop <strong>{score} poäng</strong>! 🎯</span>
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
			</div>
		</div>
	</div>
</div>

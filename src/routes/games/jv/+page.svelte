<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let currentBalance = $state<number | null>(null);
	let loading = $state(false);
	let submitted = $state(false);

	const STARTING_BALANCE = 100;

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	let netResult = $derived(currentBalance !== null ? currentBalance - STARTING_BALANCE : null);

	async function submitScore() {
		if (currentBalance === null || !auth.user) {
			alert('Vänligen ange ditt saldo');
			return;
		}

		loading = true;

		try {
			const { error } = await supabase.from('scores').upsert(
				{
					user_id: auth.user.id,
					game_type: 'jv',
					raw_value: netResult
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

	const quickBalances = [0, 50, 100, 150, 200, 250];
</script>

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<div class="mb-6" in:fly={{ y: -20, duration: 500 }}>
			<a href="/dashboard" class="btn mb-4 btn-ghost btn-sm"> ← Tillbaka </a>
			<h1 class="flex items-center gap-2 text-4xl font-bold">💰 JV - Spelande</h1>
			<p class="mt-2 text-base-content/70">Spåra dina spelresultat</p>
		</div>

		<!-- Game Area -->
		<div
			class="card border border-base-300 bg-base-200/80 shadow-xl backdrop-blur-sm"
			in:fly={{ y: 20, duration: 500, delay: 100 }}
		>
			<div class="card-body">
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
					<div>
						<div class="font-bold">💵 Startsaldo: {STARTING_BALANCE} kr</div>
						<div class="text-xs">Ange ditt nuvarande saldo för att räkna ut nettoresultatet</div>
					</div>
				</div>

				<h2 class="mb-4 card-title">💰 Vad är ditt nuvarande saldo?</h2>

				<!-- Quick Balance Buttons -->
				<div class="mb-4">
					<div class="mb-2 text-sm font-medium">
						<span class="label-text">Snabbval</span>
					</div>
					<div class="grid grid-cols-3 gap-2">
						{#each quickBalances as balance, i}
							<button
								onclick={() => (currentBalance = balance)}
								class="btn btn-sm {currentBalance === balance
									? 'shadow-lg btn-primary'
									: 'btn-outline hover:btn-primary'}"
								in:fly={{ x: -20, duration: 400, delay: i * 50 }}
							>
								{balance} kr
							</button>
						{/each}
					</div>
				</div>

				<!-- Custom Balance Input -->
				<div class="form-control">
					<label class="label" for="balanceInput">
						<span class="label-text">Eller ange eget belopp</span>
					</label>
					<div class="join w-full">
						<input
							id="balanceInput"
							type="number"
							min="0"
							step="10"
							placeholder="Ange ditt nuvarande saldo"
							class="input-bordered input join-item w-full input-primary"
							bind:value={currentBalance}
						/>
						<span class="btn btn-disabled join-item bg-base-300">kr</span>
					</div>
				</div>

				{#if netResult !== null && currentBalance !== null}
					<div class="mt-6" transition:fly={{ y: 20, duration: 400 }}>
						<div class="stats w-full shadow">
							<div class="stat">
								<div class="stat-title">Nettoresultat</div>
								<div class="stat-value {netResult >= 0 ? 'text-success' : 'text-error'}">
									{netResult >= 0 ? '+' : ''}{netResult} kr
								</div>
								<div class="stat-desc">
									{#if netResult > 0}
										🎉 Du vann {netResult} kr!
									{:else if netResult < 0}
										💸 Du förlorade {Math.abs(netResult)} kr
									{:else}
										😐 Plus minus noll
									{/if}
								</div>
							</div>
						</div>

						{#if !submitted}
							<button
								onclick={submitScore}
								class="btn mt-4 w-full shadow-lg btn-lg btn-primary hover:shadow-primary/50"
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
							<div class="mt-4 alert alert-success">
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

		<!-- Tips -->
		<div
			class="mt-4 rounded-xl border border-base-300 bg-base-200/80 p-4 text-sm text-base-content/70 backdrop-blur-sm"
		>
			<h3 class="mb-2 font-semibold">💡 Tips:</h3>
			<ul class="list-inside list-disc space-y-1">
				<li>Inkludera alla dina vinster och förluster</li>
				<li>Var ärlig - det är bara för kul! 😉</li>
				<li>Högre saldo = bättre poäng på topplistan</li>
			</ul>
		</div>
	</div>
</div>

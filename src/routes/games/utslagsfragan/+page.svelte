<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let userAnswer = $state<number | null>(null);
	let loading = $state(false);
	let submitted = $state(false);
	let result = $state<number | null>(null);

	const QUESTION = 'Ange ditt resultat från Kahoot!';

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	async function submitAnswer() {
		if (userAnswer === null || !auth.user) {
			alert('Vänligen ange ett svar');
			return;
		}

		loading = true;
		result = userAnswer;

		try {
			const { error } = await supabase.from('scores').upsert(
				{
					user_id: auth.user.id,
					game_type: 'utslagsfragan',
					raw_value: result
				},
				{
					onConflict: 'user_id,game_type'
				}
			);

			if (error) throw error;

			submitted = true;

			setTimeout(() => {
				goto('/dashboard');
			}, 3000);
		} catch (err: any) {
			console.error('Fel vid inskickning:', err);
			alert('Fel: ' + (err.message || JSON.stringify(err)));
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
			<h1 class="flex items-center gap-2 text-4xl font-bold">🎲 Kahoot</h1>
			<p class="mt-2 text-base-content/70">Mata in din slutpoäng från Kahoot!</p>
		</div>

		<!-- Question Card -->
		<div
			class="card border border-purple-500/30 bg-linear-to-br from-purple-900/40 via-base-200/80 to-pink-900/40 shadow-2xl backdrop-blur-md"
			in:fly={{ y: 20, duration: 500, delay: 100 }}
		>
			<div class="card-body">
				<!-- Question Icon -->
				<div class="mb-4 text-center">
					<div class="animate-pulse text-8xl">🧠</div>
				</div>

				<!-- The Question -->
				<div class="mb-6 text-center">
					<h2 class="mb-2 text-2xl font-bold text-purple-200">Uppgift:</h2>
					<p
						class="bg-base-900/50 rounded-xl border border-purple-400/30 p-4 text-xl font-medium text-white"
					>
						{QUESTION}
					</p>
				</div>

				<!-- Answer Input -->
				<div class="form-control">
					<label class="label" for="answerInput">
						<span class="label-text font-medium text-purple-200">🏆 Ditt resultat</span>
					</label>
					<div class="join w-full">
						<input
							id="answerInput"
							type="number"
							min="0"
							step="1"
							placeholder="Ange poäng..."
							class="input-bordered input join-item w-full text-lg input-primary"
							bind:value={userAnswer}
							disabled={submitted}
						/>
						<span class="btn btn-disabled join-item bg-base-300">p</span>
					</div>
					{#if userAnswer !== null && userAnswer > 0}
						<div class="label">
							<span class="label-text-alt text-purple-300">
								Ditt resultat: {userAnswer} p
							</span>
						</div>
					{/if}
				</div>

				{#if result !== null && submitted}
					<div class="mt-6 text-center" transition:fly={{ y: 20, duration: 400 }}>
						<div class="stats bg-base-200/80 shadow backdrop-blur-sm">
							<div class="stat">
								<div class="stat-title">Inskickat resultat</div>
								<div class="stat-value text-success">
									{result} p
								</div>
								<div class="stat-desc">
									Snyggt jobbat! 👏
								</div>
							</div>
						</div>

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
							<span>Svaret inskickat! Omdirigerar...</span>
						</div>
					</div>
				{:else if userAnswer !== null && userAnswer > 0}
					<div class="mt-6" transition:fly={{ y: 20, duration: 400 }}>
						<button
							onclick={submitAnswer}
							class="btn border-0 w-full bg-linear-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
							disabled={loading}
						>
							{#if loading}
								<span class="loading loading-spinner"></span>
								Skickar...
							{:else}
								📊 Skicka in
							{/if}
						</button>
					</div>
				{/if}

				<!-- Info -->
				<div class="mt-6 text-center text-sm text-purple-300/70">
					💡 Tips: Se till att du skriver in exakt samma poäng som du fick i Kahoot!
				</div>
			</div>
		</div>

		<!-- How it works -->
		<div
			class="mt-6 rounded-xl border border-base-300 bg-base-200/80 p-4 text-sm text-base-content/70 backdrop-blur-sm"
			in:fly={{ y: 20, duration: 500, delay: 200 }}
		>
			<h3 class="mb-2 font-semibold">📊 Så räknas poängen:</h3>
			<ul class="list-inside list-disc space-y-1">
				<li>Den som får högst poäng i Kahoot får placering 1</li>
				<li>Placering 1 ger lika poäng som det finns spelare totalt</li>
				<li>Alla påföljande placeringar ger fallande antal poäng</li>
			</ul>
		</div>
	</div>
</div>

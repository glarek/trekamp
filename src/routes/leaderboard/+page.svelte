<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import type { LeaderboardEntry } from '$lib/supabase';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import { fly, scale } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let leaderboard = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let channel: RealtimeChannel | null = null;

	// Reset modal
	let showResetModal = $state(false);
	let resetConfirmation = $state('');
	let resetting = $state(false);

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		loadLeaderboard();
		setupRealtimeSubscription();

		return unsubscribe;
	});

	onDestroy(() => {
		if (channel) {
			supabase.removeChannel(channel);
		}
	});

	async function loadLeaderboard() {
		loading = true;
		try {
			const { data: users, error: usersError } = await supabase.from('users').select('*');
			if (usersError) throw usersError;

			const { data: scores, error: scoresError } = await supabase.from('scores').select('*');
			if (scoresError) throw scoresError;

			leaderboard = calculateLeaderboard(users || [], scores || []);
		} catch (err) {
			console.error('Fel vid laddning av topplista:', err);
		} finally {
			loading = false;
		}
	}

	function calculateLeaderboard(users: any[], scores: any[]): LeaderboardEntry[] {
		const userScoresMap = new Map<
			string,
			{ split_g?: number; dart?: number; jv?: number; utslagsfragan?: number }
		>();

		scores.forEach((score) => {
			if (!userScoresMap.has(score.user_id)) {
				userScoresMap.set(score.user_id, {});
			}
			const userScores = userScoresMap.get(score.user_id)!;
			userScores[score.game_type as keyof typeof userScores] = score.raw_value;
		});

		function calculateRankPoints(
			rawValues: number[],
			userId: string,
			gameType: string,
			higherBetter: boolean
		): number {
			const userRawValue =
				userScoresMap.get(userId)?.[gameType as keyof ReturnType<typeof userScoresMap.get>];
			if (userRawValue === undefined) return 0;

			const valueCounts = new Map<number, number>();
			rawValues.forEach((val) => {
				valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
			});

			const uniqueValues = Array.from(valueCounts.keys()).sort((a, b) =>
				higherBetter ? b - a : a - b
			);

			let currentRank = 1;
			for (const value of uniqueValues) {
				if (value === userRawValue) {
					return rawValues.length - currentRank + 1;
				}
				currentRank += valueCounts.get(value)!;
			}

			return 0;
		}

		const splitGValues = scores.filter((s) => s.game_type === 'split_g').map((s) => s.raw_value);
		const dartValues = scores.filter((s) => s.game_type === 'dart').map((s) => s.raw_value);
		const jvValues = scores.filter((s) => s.game_type === 'jv').map((s) => s.raw_value);
		const utslagsfraganValues = scores
			.filter((s) => s.game_type === 'utslagsfragan')
			.map((s) => s.raw_value);

		const entries: LeaderboardEntry[] = users.map((user) => {
			const userScores = userScoresMap.get(user.id) || {};

			const splitGPoints =
				splitGValues.length > 0 ? calculateRankPoints(splitGValues, user.id, 'split_g', true) : 0;
			const dartPoints =
				dartValues.length > 0 ? calculateRankPoints(dartValues, user.id, 'dart', false) : 0;
			const jvPoints = jvValues.length > 0 ? calculateRankPoints(jvValues, user.id, 'jv', true) : 0;
			// Utslagsfrågan: lower percentage difference is better
			const utslagsfraganPoints =
				utslagsfraganValues.length > 0
					? calculateRankPoints(utslagsfraganValues, user.id, 'utslagsfragan', false)
					: 0;

			return {
				id: user.id,
				name: user.name,
				total_score: splitGPoints + dartPoints + jvPoints + utslagsfraganPoints,
				split_g: userScores.split_g ?? null,
				dart: userScores.dart ?? null,
				jv: userScores.jv ?? null,
				utslagsfragan: userScores.utslagsfragan ?? null,
				ass_count: user.ass_count || 0
			};
		});

		return entries.sort((a, b) => {
			if (b.total_score !== a.total_score) {
				return b.total_score - a.total_score;
			}
			return a.name.localeCompare(b.name);
		});
	}

	function setupRealtimeSubscription() {
		channel = supabase
			.channel('leaderboard-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
				loadLeaderboard();
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
				loadLeaderboard();
			})
			.subscribe();
	}

	function getRankDisplay(index: number, currentScore: number, allScores: number[]): string {
		let rank = 1;
		for (let i = 0; i < index; i++) {
			if (allScores[i] !== currentScore) {
				rank = i + 1;
			}
		}

		if (index > 0 && allScores[index - 1] === currentScore) {
			rank = getRankNumber(index - 1, allScores[index - 1], allScores);
		} else {
			rank = index + 1;
		}

		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `${rank}.`;
	}

	function getRankNumber(index: number, currentScore: number, allScores: number[]): number {
		for (let i = 0; i <= index; i++) {
			if (allScores[i] === currentScore) {
				return i + 1;
			}
		}
		return index + 1;
	}

	async function callAss(userId: string) {
		try {
			const user = leaderboard.find((u) => u.id === userId);
			if (!user) return;

			const { error } = await supabase
				.from('users')
				.update({ ass_count: (user.ass_count || 0) + 1 })
				.eq('id', userId);

			if (error) throw error;
		} catch (err) {
			console.error('Fel:', err);
		}
	}

	async function resetLeaderboard() {
		if (resetConfirmation.toLowerCase() !== 'radera') {
			alert('Du måste skriva "radera" för att bekräfta');
			return;
		}

		resetting = true;

		try {
			const { error } = await supabase
				.from('scores')
				.delete()
				.neq('id', '00000000-0000-0000-0000-000000000000');

			if (error) throw error;

			await supabase
				.from('users')
				.update({ ass_count: 0 })
				.neq('id', '00000000-0000-0000-0000-000000000000');

			showResetModal = false;
			resetConfirmation = '';
			loadLeaderboard();
		} catch (err: any) {
			console.error('Fel vid återställning:', err);
			alert('Kunde inte återställa topplistan. Försök igen.');
		} finally {
			resetting = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div
			class="mb-6 flex flex-wrap items-center justify-between gap-4"
			in:fly={{ y: -20, duration: 500 }}
		>
			<div>
				<h1
					class="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-4xl font-bold text-transparent"
				>
					🏆 Topplista
				</h1>
				<p class="mt-2 flex items-center gap-2 text-base-content/70">
					{#if !loading}
						<span class="relative flex h-3 w-3">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"
							></span>
							<span class="relative inline-flex h-3 w-3 rounded-full bg-success"></span>
						</span>
						Live uppdateringar
					{/if}
				</p>
			</div>
			<div class="flex gap-2">
				<button onclick={() => (showResetModal = true)} class="btn btn-outline btn-sm btn-error">
					🗑️ Återställ
				</button>
				<a href="/dashboard" class="btn btn-ghost btn-sm"> ← Tillbaka </a>
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<span class="loading loading-lg loading-spinner text-primary"></span>
			</div>
		{:else}
			<!-- Leaderboard Table -->
			<div class="overflow-x-auto rounded-xl" in:fly={{ y: 20, duration: 500, delay: 100 }}>
				<table class="table w-full table-zebra table-lg">
					<thead class="bg-base-200">
						<tr>
							<th>Plats</th>
							<th>Spelare</th>
							<th class="text-center">Poäng</th>
							<th class="text-center">🍺</th>
							<th class="text-center">🎯</th>
							<th class="text-center">💰</th>
							<th class="text-center">🎲</th>
							<th class="text-center">🍑</th>
							<th class="text-center"></th>
						</tr>
					</thead>
					<tbody>
						{#each leaderboard as entry, i (entry.id)}
							<tr
								class={entry.id === auth.user?.id ? 'bg-primary/20 font-bold' : ''}
								in:scale={{ duration: 400, delay: i * 50 }}
							>
								<td class="text-2xl"
									>{getRankDisplay(
										i,
										entry.total_score,
										leaderboard.map((e) => e.total_score)
									)}</td
								>
								<td>
									<div class="flex items-center gap-2">
										<span class="font-medium">{entry.name}</span>
										{#if entry.id === auth.user?.id}
											<span class="badge badge-sm badge-primary">Du</span>
										{/if}
									</div>
								</td>
								<td class="text-center">
									<div class="badge badge-lg font-bold badge-primary">
										{entry.total_score} p
									</div>
								</td>
								<td class="text-center">
									{#if entry.split_g !== null}
										<span class="badge badge-accent">{entry.split_g}</span>
									{:else}
										<span class="text-base-content/30">-</span>
									{/if}
								</td>
								<td class="text-center">
									{#if entry.dart !== null}
										<span class="badge badge-secondary">{entry.dart}</span>
									{:else}
										<span class="text-base-content/30">-</span>
									{/if}
								</td>
								<td class="text-center">
									{#if entry.jv !== null}
										<span class="badge badge-warning">{entry.jv >= 0 ? '+' : ''}{entry.jv}</span>
									{:else}
										<span class="text-base-content/30">-</span>
									{/if}
								</td>
								<td class="text-center">
									{#if entry.utslagsfragan !== null}
										<span
											class="badge border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
											>{entry.utslagsfragan}%</span
										>
									{:else}
										<span class="text-base-content/30">-</span>
									{/if}
								</td>
								<td class="text-center">
									{#if entry.ass_count > 0}
										<span class="badge badge-error">{entry.ass_count}</span>
									{:else}
										<span class="text-base-content/30">0</span>
									{/if}
								</td>
								<td class="text-center">
									<button
										onclick={() => callAss(entry.id)}
										class="btn btn-ghost btn-xs hover:btn-error"
										title="Kalla dem för en röv!"
									>
										🍑
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if leaderboard.length === 0}
				<div class="py-20 text-center">
					<div class="text-6xl">🎮</div>
					<h2 class="mt-4 text-2xl font-bold">Inga poäng ännu!</h2>
					<p class="mt-2 text-base-content/70">
						Bli först med att spela och skicka in ditt resultat
					</p>
					<a href="/dashboard" class="btn mt-6 btn-primary">🎯 Till spelen</a>
				</div>
			{/if}

			<!-- Scoring Info -->
			<div
				class="mt-8 rounded-xl border border-base-300 bg-base-200/80 p-6 backdrop-blur-sm"
				in:fly={{ y: 20, duration: 500, delay: 200 }}
			>
				<h3 class="mb-4 text-xl font-bold">📊 Så fungerar poängen</h3>
				<div class="space-y-2 text-sm text-base-content/80">
					<p>
						• <strong>Dynamiskt rankingsystem:</strong> Din placering i varje spel bestämmer dina poäng
					</p>
					<p>• Med N spelare får 1:an N poäng, 2:an får N-1 poäng, osv.</p>
					<p>• <strong>🍺 Split the G:</strong> Högre precision är bättre</p>
					<p>• <strong>🎯 Dart:</strong> Lägre placering är bättre (1:a slår 2:a)</p>
					<p>• <strong>💰 JV:</strong> Högre nettovinst är bättre</p>
					<p>• <strong>🎲 Utslagsfrågan:</strong> Lägst avvikelse (%) är bättre</p>
					<p>• <strong>🍑 Röv-räknare:</strong> Bara för kul - påverkar inte poängen!</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Reset Modal -->
{#if showResetModal}
	<div class="modal-open modal">
		<div class="modal-box" transition:fly={{ y: 20, duration: 300 }}>
			<h3 class="text-lg font-bold text-error">⚠️ Återställ topplistan</h3>
			<p class="py-4">Är du säker på att du vill radera ALLA poäng? Detta går inte att ångra!</p>
			<p class="mb-4 text-sm text-base-content/70">
				Skriv <strong class="text-error">"radera"</strong> nedan för att bekräfta:
			</p>

			<input
				type="text"
				placeholder="Skriv radera..."
				class="input-bordered input mb-4 w-full input-error"
				bind:value={resetConfirmation}
			/>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showResetModal = false;
						resetConfirmation = '';
					}}
				>
					Avbryt
				</button>
				<button
					class="btn btn-error"
					onclick={resetLeaderboard}
					disabled={resetting || resetConfirmation.toLowerCase() !== 'radera'}
				>
					{#if resetting}
						<span class="loading loading-spinner"></span>
						Återställer...
					{:else}
						🗑️ Radera allt
					{/if}
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (showResetModal = false)}></div>
	</div>
{/if}

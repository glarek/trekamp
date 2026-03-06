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
				dartValues.length > 0 ? calculateRankPoints(dartValues, user.id, 'dart', true) : 0;
			const jvPoints = jvValues.length > 0 ? calculateRankPoints(jvValues, user.id, 'jv', true) : 0;
			// Utslagsfrågan: lower percentage difference is better
			const utslagsfraganPoints =
				utslagsfraganValues.length > 0
					? calculateRankPoints(utslagsfraganValues, user.id, 'utslagsfragan', true)
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

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between gap-2" in:fly={{ y: -20, duration: 500 }}>
			<div class="flex items-center gap-2">
				<h1
					class="bg-linear-to-r from-yellow-400 to-yellow-600 bg-clip-text text-2xl font-bold text-transparent"
				>
					🏆 Topplista
				</h1>
				{#if !loading}
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
					</span>
				{/if}
			</div>
			<div class="flex gap-2">
				<a
					href="/settings"
					class="btn btn-circle bg-base-200/50 shadow-md transition-transform hover:-rotate-12 hover:scale-110 hover:bg-base-300"
					title="Inställningar"
				>
					<span class="text-2xl drop-shadow-sm">⚙️</span>
				</a>
				<a
					href="/dashboard"
					class="btn btn-circle bg-base-200/50 shadow-md transition-transform hover:rotate-12 hover:scale-110 hover:bg-base-300"
					title="Tillbaka"
				>
					<span class="text-2xl drop-shadow-sm">🏠</span>
				</a>
			</div>
		</div>

		{#if loading}
			<div class="flex justify-center py-20">
				<span class="loading loading-lg loading-spinner text-primary"></span>
			</div>
		{:else}
			<!-- Leaderboard Cards -->
			<div class="flex flex-col gap-4" in:fly={{ y: 20, duration: 500, delay: 100 }}>
				{#each leaderboard as entry, i (entry.id)}
					{@const rank = getRankNumber(i, entry.total_score, leaderboard.map((e) => e.total_score))}
					<div
						class="card relative overflow-hidden border transition-all hover:scale-[1.02] 
							{rank === 1
								? 'border-yellow-500/50 bg-linear-to-br from-yellow-300/40 via-yellow-500/20 to-yellow-600/40 shadow-yellow-500/20 shadow-xl'
								: rank === 2
									? 'border-gray-400/50 bg-linear-to-br from-gray-300/40 via-gray-400/20 to-gray-500/40 shadow-gray-400/20 shadow-xl'
									: rank === 3
										? 'border-amber-700/50 bg-linear-to-br from-amber-600/40 via-amber-700/20 to-amber-800/40 shadow-amber-700/20 shadow-xl'
										: 'border-base-300 bg-base-200/80 shadow-md backdrop-blur-sm'}"
						in:scale={{ duration: 400, delay: i * 50 }}
					>
						{#if rank === 1}
							<div class="absolute -right-2 -top-2 rotate-12 text-6xl opacity-80 drop-shadow-lg">
								🥇
							</div>
						{:else if rank === 2}
							<div class="absolute -right-2 -top-2 rotate-12 text-6xl opacity-80 drop-shadow-lg">
								🥈
							</div>
						{:else if rank === 3}
							<div class="absolute -right-2 -top-2 rotate-12 text-6xl opacity-80 drop-shadow-lg">
								🥉
							</div>
						{/if}

						<div class="card-body p-4 sm:p-6">
							<div class="flex items-center gap-4">
								<!-- Rank Badge -->
								<div
									class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-base-content/10 bg-base-100/50 text-2xl font-bold shadow-inner"
								>
									{#if rank === 1}🥇{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}{rank}{/if}
								</div>

								<!-- Player Info -->
								<div class="flex-1">
									<h2 class="flex items-center gap-2 text-2xl font-bold leading-tight">
										{entry.name}
										{#if entry.id === auth.user?.id}
											<span class="badge badge-primary badge-sm">Du</span>
										{/if}
									</h2>
									<div class="mt-1 text-xl font-black drop-shadow-sm opacity-90">
										{entry.total_score} poäng
									</div>
								</div>

								<!-- Ass Button -->
								<div class="text-right">
									<button
										onclick={() => callAss(entry.id)}
										class="btn btn-circle btn-ghost btn-sm text-2xl hover:bg-error/20 sm:btn-md {entry.ass_count >
										0
											? 'text-error'
											: 'opacity-50 grayscale hover:grayscale-0'}"
										title="Kalla dem för en röv!"
									>
										🍑
										{#if entry.ass_count > 0}
											<div class="badge badge-error badge-sm absolute -right-1 -top-1">
												{entry.ass_count}
											</div>
										{/if}
									</button>
								</div>
							</div>

							<div class="divider my-4 opacity-30"></div>

							<!-- Game Results -->
							<div class="grid grid-cols-4 gap-2 text-center text-sm">
								<div
									class="flex flex-col items-center justify-center rounded-lg border border-base-content/10 bg-base-100/50 p-3 shadow-inner transition-transform hover:scale-105"
								>
									<span class="mb-1 text-3xl drop-shadow-md">🍺</span>
									<span class="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-1">G-Split</span>
									<span class="text-base font-black">{entry.split_g !== null ? entry.split_g : '-'}</span>
								</div>
								<div
									class="flex flex-col items-center justify-center rounded-lg border border-base-content/10 bg-base-100/50 p-3 shadow-inner transition-transform hover:scale-105"
								>
									<span class="mb-1 text-3xl drop-shadow-md">🎯</span>
									<span class="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-1">Dart</span>
									<span class="text-base font-black">{entry.dart !== null ? entry.dart : '-'}</span>
								</div>
								<div
									class="flex flex-col items-center justify-center rounded-lg border border-base-content/10 bg-base-100/50 p-3 shadow-inner transition-transform hover:scale-105"
								>
									<span class="mb-1 text-3xl drop-shadow-md">💰</span>
									<span class="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-1">JV</span>
									<span
										class="text-base font-black {entry.jv !== null
											? entry.jv >= 0
												? 'text-success'
												: 'text-error'
											: ''}"
									>
										{entry.jv !== null ? `${entry.jv >= 0 ? '+' : ''}${entry.jv}` : '-'}
									</span>
								</div>
								<div
									class="flex flex-col items-center justify-center rounded-lg border border-base-content/10 bg-base-100/50 p-3 shadow-inner transition-transform hover:scale-105"
								>
									<span class="mb-1 text-3xl drop-shadow-md">🎲</span>
									<span class="text-[10px] uppercase tracking-wider opacity-70 font-bold mb-1">Kahoot</span>
									<span class="text-base font-black"
										>{entry.utslagsfragan !== null ? entry.utslagsfragan : '-'}</span
									>
								</div>
							</div>
						</div>
					</div>
				{/each}
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

			<!-- Bottom Actions & Info -->
			<div class="mt-4 flex flex-col gap-4">
				<div
					class="rounded-xl border border-base-300 bg-base-200/80 p-4 backdrop-blur-sm"
					in:fly={{ y: 20, duration: 500, delay: 200 }}
				>
					<h3 class="mb-2 text-sm font-bold">📊 Poängberäkning</h3>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-base-content/70 md:text-sm">
						<p>🍺 Split the G: Precision (0-100)</p>
						<p>🎯 Dart: Poäng (högst vinner)</p>
						<p>💰 JV: Nettovinst (kr)</p>
						<p>🎲 Kahoot: Poäng (högst vinner)</p>
					</div>
				</div>

				<button
					onclick={() => (showResetModal = true)}
					class="btn mx-auto opacity-30 btn-outline btn-xs btn-error hover:opacity-100"
				>
					🗑️ Återställ Topplista
				</button>
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
		<div
			class="modal-backdrop"
			onclick={() => (showResetModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showResetModal = false)}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>
	</div>
{/if}

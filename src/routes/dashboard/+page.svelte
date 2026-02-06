<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { fly, scale } from 'svelte/transition';
	import { clearAuthCookies } from '$lib/utils/cookies';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let imageErrors = $state<Record<string, boolean>>({});

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	function handleLogout() {
		clearAuthCookies();
		authStore.logout();
		goto('/');
	}

	function handleImageError(route: string) {
		imageErrors[route] = true;
	}

	const games = [
		{
			name: 'Split the G',
			icon: '🍺',
			image: 'split-g-game.jpg',
			description: 'Bara bögar (lappen) dricker Murphys',
			route: '/games/split-g',
			color: 'btn-accent'
		},
		{
			name: 'Dart',
			icon: '🎯',
			image: 'dart-game.jpg',
			description: '101-utslagning, alla spelar',
			route: '/games/dart',
			color: 'btn-secondary'
		},
		{
			name: 'JV',
			icon: '💰',
			image: 'jv-game.jpg',
			description: 'Bäst skills av 100 krrr',
			route: '/games/jv',
			color: 'btn-warning'
		},
		{
			name: 'Utslagsfrågan',
			icon: '🎲',
			image: 'utslagsfragan-game.jpg',
			description: 'Närmast vinner',
			route: '/games/utslagsfragan',
			color: 'bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white'
		}
	];
</script>

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between" in:fly={{ y: -20, duration: 500 }}>
			<div>
				<h1 class="flex items-center gap-2 text-4xl font-bold">🍻 Trekampen</h1>
				{#if auth.user}
					<p class="mt-2 text-base-content/70">
						Välkommen tillbaka, <span class="font-bold text-primary">{auth.user.name}</span>! 🎉
					</p>
				{/if}
			</div>
			<div class="flex gap-1">
				<a href="/settings" class="btn btn-square btn-ghost btn-sm" title="Inställningar"> ⚙️ </a>
				<button onclick={handleLogout} class="btn btn-square btn-ghost btn-sm" title="Logga ut">
					🚪
				</button>
			</div>
		</div>

		<!-- Game Cards -->
		<div class="mb-8">
			<h2 class="mb-4 flex items-center justify-center gap-2 text-4xl font-semibold">Välj spel</h2>
			<div class="grid gap-4 md:grid-cols-2">
				{#each games as game, i}
					<a
						href={game.route}
						class="card cursor-pointer border border-base-300 bg-base-200/80 shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/50 hover:shadow-2xl"
						in:scale={{ duration: 400, delay: i * 100 }}
					>
						<div class="card-body items-center p-6 text-center">
							{#if imageErrors[game.route]}
								<!-- Fallback to icon if image failed to load -->
								<div class="mb-4 text-6xl hover:animate-bounce">{game.icon}</div>
							{:else}
								<!-- Try to load image first -->
								<div class="mb-4 overflow-hidden rounded-lg">
									<img
										src="/{game.image}"
										alt={game.name}
										class="h-40 w-auto object-contain transition-transform hover:scale-110"
										onerror={() => handleImageError(game.route)}
										loading="lazy"
									/>
								</div>
							{/if}
							<h3 class="mb-2 card-title text-2xl">{game.name}</h3>
							<p class="text-sm text-base-content/70">{game.description}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Leaderboard Link -->
		<div class="mt-8" in:fly={{ y: 20, duration: 500, delay: 300 }}>
			<a
				href="/leaderboard"
				class="btn w-full text-lg shadow-lg transition-all btn-lg btn-primary hover:shadow-primary/50"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
				Scoreboard
			</a>
		</div>

		<!-- Fun footer -->
		<div class="mt-8 text-center text-sm text-base-content/40">
			<p>Må den bästa bögen vinna!</p>
		</div>
	</div>
</div>

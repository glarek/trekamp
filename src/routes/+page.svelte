<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { authStore } from '$lib/stores/authStore';
	import { fly, scale } from 'svelte/transition';

	let username = $state('');
	let accessCode = $state('');
	let error = $state('');
	let loading = $state(false);

	const ACCESS_CODE = '1234';
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4"
>
	<!-- Floating beer emojis background -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden opacity-10">
		<div class="absolute animate-bounce text-8xl" style="top: 10%; left: 5%;">🍺</div>
		<div class="absolute animate-pulse text-6xl" style="top: 60%; left: 15%;">🎯</div>
		<div class="absolute animate-bounce text-7xl" style="top: 20%; right: 10%;">💰</div>
		<div class="absolute animate-pulse text-5xl" style="top: 70%; right: 20%;">🏆</div>
		<div class="absolute animate-bounce text-6xl" style="bottom: 15%; left: 40%;">🎉</div>
	</div>

	<div
		class="card w-full max-w-md border border-primary/20 bg-base-200/90 shadow-2xl backdrop-blur-sm"
		in:fly={{ y: 20, duration: 500, delay: 100 }}
	>
		<div class="card-body">
			<div class="mb-6 text-center">
				<div class="mb-4 text-6xl" in:scale={{ duration: 600, delay: 200 }}>🍻</div>
				<h1
					class="card-title justify-center bg-linear-to-r from-primary to-secondary bg-clip-text text-4xl font-bold text-transparent"
				>
					Trekampen
				</h1>
				<p class="mt-2 text-base-content/70">DG's trekamp. Skriv in ditt namn.</p>
			</div>

			<form
				onsubmit={async (e) => {
					e.preventDefault();
					error = '';
					loading = true;

					if (!username.trim()) {
						error = 'Vänligen ange ett användarnamn';
						loading = false;
						return;
					}

					if (!accessCode) {
						error = 'Vänligen ange en åtkomstkod';
						loading = false;
						return;
					}

					if (accessCode !== ACCESS_CODE) {
						error = 'Fel åtkomstkod';
						loading = false;
						return;
					}

					try {
						const { data: existingUser } = await supabase
							.from('users')
							.select('*')
							.eq('name', username.trim())
							.single();

						let user;

						if (existingUser) {
							user = existingUser;
						} else {
							const { data: newUser, error: createError } = await supabase
								.from('users')
								.insert({ name: username.trim(), ass_count: 0 })
								.select()
								.single();

							if (createError) throw createError;
							user = newUser;
						}

						authStore.login(user);
						goto('/dashboard');
					} catch (err: any) {
						console.error('Inloggningsfel:', err);
						error = err.message || 'Ett fel uppstod vid inloggning';
					} finally {
						loading = false;
					}
				}}
				class="space-y-4"
			>
				<div class="form-control">
					<label class="label" for="username">
						<span class="label-text font-medium">👤 Användarnamn</span>
					</label>
					<input
						id="username"
						type="text"
						placeholder="Ditt namn"
						class="input-bordered input w-full text-lg input-primary"
						bind:value={username}
						disabled={loading}
						autocomplete="username"
					/>
				</div>

				<div class="form-control">
					<label class="label" for="accessCode">
						<span class="label-text font-medium">🔑 Åtkomstkod</span>
					</label>
					<input
						id="accessCode"
						type="password"
						placeholder="Skriv in koden"
						class="input-bordered input w-full text-lg input-primary"
						bind:value={accessCode}
						disabled={loading}
						autocomplete="current-password"
					/>
				</div>

				{#if error}
					<div class="alert alert-error" transition:fly={{ y: -10, duration: 300 }}>
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
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{error}</span>
					</div>
				{/if}

				<div class="card-actions pt-2">
					<button
						type="submit"
						class="btn w-full text-lg shadow-lg transition-all btn-lg btn-primary hover:shadow-primary/50"
						disabled={loading}
					>
						{#if loading}
							<span class="loading loading-spinner"></span>
							Laddar...
						{:else}
							🚀 Kör igång!
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-4 text-center text-sm text-base-content/50">
				<p>💡 Tips: Koden är 1234</p>
			</div>
		</div>
	</div>
</div>

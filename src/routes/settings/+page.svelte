<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { supabase } from '$lib/supabase';
	import { fly } from 'svelte/transition';

	let auth = $state({ user: null as any, isAuthenticated: false });
	let deleteConfirmation = $state('');
	let masterResetCode = $state('');
	let deleting = $state(false);
	let resettingAll = $state(false);
	let showDeleteModal = $state(false);
	let showMasterResetModal = $state(false);

	onMount(() => {
		const unsubscribe = authStore.subscribe((value) => {
			auth = value;
		});

		if (!auth.isAuthenticated) {
			goto('/');
		}

		return unsubscribe;
	});

	async function deleteUser() {
		if (deleteConfirmation.toLowerCase() !== 'radera') {
			alert('Du måste skriva "radera" för att bekräfta');
			return;
		}

		if (!auth.user) return;

		deleting = true;

		try {
			// Delete user's scores first
			await supabase.from('scores').delete().eq('user_id', auth.user.id);

			// Delete user
			const { error } = await supabase.from('users').delete().eq('id', auth.user.id);

			if (error) throw error;

			// Logout and redirect
			authStore.logout();
			goto('/');
		} catch (err: any) {
			console.error('Fel vid radering:', err);
			alert('Kunde inte radera användaren. Försök igen.');
		} finally {
			deleting = false;
		}
	}

	async function masterReset() {
		if (masterResetCode !== '666') {
			alert('Fel kod!');
			return;
		}

		resettingAll = true;

		try {
			// Delete all scores
			const { error: scoresError } = await supabase
				.from('scores')
				.delete()
				.neq('id', '00000000-0000-0000-0000-000000000000');

			if (scoresError) throw scoresError;

			// Delete all users
			const { error: usersError } = await supabase
				.from('users')
				.delete()
				.neq('id', '00000000-0000-0000-0000-000000000000');

			if (usersError) throw usersError;

			// Logout and redirect
			authStore.logout();
			goto('/');
		} catch (err: any) {
			console.error('Master reset failed:', err);
			alert('Kunde inte genomföra total återställning: ' + err.message);
		} finally {
			resettingAll = false;
		}
	}
</script>

<div class="min-h-screen bg-linear-to-br from-base-300 via-base-100 to-base-300 p-4">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<div class="mb-6" in:fly={{ y: -20, duration: 500 }}>
			<a href="/dashboard" class="btn mb-4 btn-ghost btn-sm"> ← Tillbaka </a>
			<h1 class="text-4xl font-bold">⚙️ Inställningar</h1>
			<p class="mt-2 text-base-content/70">Hantera din profil</p>
		</div>

		<!-- User Info -->
		<div class="card mb-6 bg-base-200 shadow-xl" in:fly={{ y: 20, duration: 500, delay: 100 }}>
			<div class="card-body">
				<h2 class="card-title">👤 Din profil</h2>
				{#if auth.user}
					<div class="flex items-center gap-4 py-4">
						<div class="placeholder avatar">
							<div class="w-16 rounded-full bg-primary text-2xl text-primary-content">
								<span>{auth.user.name.charAt(0).toUpperCase()}</span>
							</div>
						</div>
						<div>
							<p class="text-xl font-bold">{auth.user.name}</p>
							<p class="text-sm text-base-content/70">Spelare sedan du gick med</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Danger Zone -->
		<div
			class="card border border-error/30 bg-error/10 shadow-xl"
			in:fly={{ y: 20, duration: 500, delay: 200 }}
		>
			<div class="card-body">
				<h2 class="card-title text-error">⚠️ Farozonen</h2>
				<p class="mb-4 text-base-content/70">Dessa åtgärder kan inte ångras. Var försiktig!</p>

				<button onclick={() => (showDeleteModal = true)} class="btn w-full btn-outline btn-error">
					🗑️ Ta bort min användare
				</button>

				<div class="divider">ELLER</div>

				<button onclick={() => (showMasterResetModal = true)} class="btn w-full btn-error">
					💀 Radera ALLA användare (666)
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Delete User Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box" transition:fly={{ y: 20, duration: 300 }}>
			<h3 class="text-lg font-bold text-error">⚠️ Radera användare</h3>
			<p class="py-4">
				Är du säker på att du vill radera din användare? Detta kommer ta bort alla dina poäng och
				speldata permanent.
			</p>
			<p class="mb-4 text-sm text-base-content/70">
				Skriv <strong class="text-error">"radera"</strong> nedan för att bekräfta:
			</p>

			<input
				type="text"
				placeholder="Skriv radera..."
				class="input-bordered input mb-4 w-full input-error"
				bind:value={deleteConfirmation}
			/>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						deleteConfirmation = '';
					}}
				>
					Avbryt
				</button>
				<button
					class="btn btn-error"
					onclick={deleteUser}
					disabled={deleting || deleteConfirmation.toLowerCase() !== 'radera'}
				>
					{#if deleting}
						<span class="loading loading-spinner"></span>
						Raderar...
					{:else}
						🗑️ Radera permanent
					{/if}
				</button>
			</div>
		</div>
		<div
			class="modal-backdrop"
			onclick={() => (showDeleteModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showDeleteModal = false)}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>
	</div>
{/if}

<!-- Master Reset Modal -->
{#if showMasterResetModal}
	<div class="modal-open modal">
		<div class="modal-box border-4 border-error" transition:fly={{ y: 20, duration: 300 }}>
			<h3 class="text-2xl font-bold text-error">💀 TOTAL ÅTERSTÄLLNING</h3>
			<p class="py-4 font-bold">
				VARNING! Detta kommer radera SAMTLIGA användare och ALLA poäng i hela systemet. Du kommer
				även bli utloggad och raderad.
			</p>
			<p class="mb-4 text-sm text-base-content/70">
				Ange master-koden för att genomföra raderingen:
			</p>

			<input
				type="password"
				placeholder="Ange kod..."
				class="input-bordered input mb-4 w-full text-center text-2xl input-error"
				bind:value={masterResetCode}
			/>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showMasterResetModal = false;
						masterResetCode = '';
					}}
				>
					Ångra mig!
				</button>
				<button
					class="btn btn-error"
					onclick={masterReset}
					disabled={resettingAll || masterResetCode !== '666'}
				>
					{#if resettingAll}
						<span class="loading loading-spinner"></span>
						Raderar allt...
					{:else}
						🔥 RADERA ALLT
					{/if}
				</button>
			</div>
		</div>
		<div
			class="modal-backdrop"
			onclick={() => (showMasterResetModal = false)}
			onkeydown={(e) => e.key === 'Escape' && (showMasterResetModal = false)}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>
	</div>
{/if}

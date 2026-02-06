<script lang="ts">
	import '@fontsource/permanent-marker';
	import '@fontsource-variable/rethink-sans';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<title>Trekampen - Barkamp</title>
	<meta name="description" content="Trekampen" />
</svelte:head>

<div data-theme="dark" class="min-h-screen overflow-x-hidden bg-base-100">
	{@render children()}
</div>

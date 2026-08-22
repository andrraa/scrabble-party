<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let playerName = $state('');
	let gameCodeInput = $state('');
	let activeTab = $state<'create' | 'join'>('create');
	let errorMessage = $state('');
	let isLoading = $state(true);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('scrabble_player_name');
			if (saved) playerName = saved;
		}
		// Smooth transition timeout
		const timer = setTimeout(() => {
			isLoading = false;
		}, 550);
		return () => clearTimeout(timer);
	});

	function generateRoomCode(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	}

	function handleCreateGame(vsBot: boolean = false) {
		const trimmedName = playerName.trim() || 'Player';
		errorMessage = '';
		localStorage.setItem('scrabble_player_name', trimmedName);
		const code = generateRoomCode();
		const botParam = vsBot ? '&bot=1' : '';
		goto(`/game/${code}?name=${encodeURIComponent(trimmedName)}${botParam}`);
	}

	function handleJoinGame() {
		const trimmedName = playerName.trim() || 'Player';
		const trimmedCode = gameCodeInput.trim().toUpperCase();

		if (!trimmedCode || trimmedCode.length < 4) {
			errorMessage = 'Please enter a valid game code.';
			return;
		}

		errorMessage = '';
		localStorage.setItem('scrabble_player_name', trimmedName);
		goto(`/game/${trimmedCode}?name=${encodeURIComponent(trimmedName)}`);
	}
</script>

<svelte:head>
	<title>Scrabble Online - 2-Player Word Game</title>
</svelte:head>

<!-- Initial Loading Screen with Svelte Out:Fade Transition -->
{#if isLoading}
	<div
		out:fade={{ duration: 450 }}
		class="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-4 select-none pointer-events-auto"
	>
		<div class="flex items-center gap-1.5 animate-bounce">
			{#each ['S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'] as letter, idx}
				<span
					class="w-9 h-10 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/90 border border-amber-300 shadow-md flex items-center justify-center font-bold text-amber-950 text-xl font-serif"
					style="animation-delay: {idx * 50}ms;"
				>
					{letter}
				</span>
			{/each}
		</div>
		<p class="text-xs font-medium text-slate-400 tracking-wider animate-pulse">Loading Scrabble Online...</p>
	</div>
{/if}

<!-- Main Page Content with Smooth Glide In -->
<main
	in:fly={{ y: 10, duration: 500, delay: 250 }}
	class="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-slate-50 select-none transition-all duration-300"
>
	<!-- Top Spacer -->
	<div></div>

	<!-- Main Card Content -->
	<div class="w-full max-w-md mx-auto flex flex-col items-center gap-6 my-auto">
		<!-- Minimal Logo / Header with rounded tiles -->
		<div class="flex flex-col items-center text-center gap-2.5">
			<div class="flex items-center gap-1 sm:gap-1.5">
				{#each ['S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'] as letter}
					<span class="w-8 h-9 sm:w-9 sm:h-10 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/90 border border-amber-300/80 shadow-xs flex items-center justify-center font-bold text-amber-950 text-lg sm:text-xl font-serif">
						{letter}
					</span>
				{/each}
			</div>
			<p class="text-xs text-slate-500 font-medium">2-Player Realtime Online Match</p>
		</div>

		<!-- Card Component -->
		<Card class="w-full shadow-lg border-slate-200/80 p-5 sm:p-6 rounded-2xl">
			<!-- Name Input -->
			<div class="flex flex-col gap-1.5 mb-5">
				<label for="name" class="text-xs font-semibold uppercase tracking-wider text-slate-600">
					Your Name
				</label>
				<Input
					id="name"
					bind:value={playerName}
					placeholder="Enter your name..."
					maxlength={20}
				/>
			</div>

			<!-- Tab Switcher -->
			<div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5">
				<button
					type="button"
					onclick={() => { activeTab = 'create'; errorMessage = ''; }}
					class="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer {activeTab === 'create'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					Create Game
				</button>
				<button
					type="button"
					onclick={() => { activeTab = 'join'; errorMessage = ''; }}
					class="py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer {activeTab === 'join'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					Join Game
				</button>
			</div>

			<!-- Tab Content -->
			{#if activeTab === 'create'}
				<div class="flex flex-col gap-3">
					<p class="text-xs text-slate-500 leading-relaxed">
						Start a new game session. Invite a friend or practice solo against the AI bot.
					</p>

					<Button
						variant="default"
						size="lg"
						onclick={() => handleCreateGame(false)}
						class="w-full bg-slate-900 hover:bg-slate-800"
					>
						Create 2-Player Room
					</Button>

					<Button
						variant="outline"
						size="default"
						onclick={() => handleCreateGame(true)}
						class="w-full border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold text-xs"
					>
						🤖 Play vs AI Bot (Single Player)
					</Button>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<label for="code" class="text-xs font-semibold uppercase tracking-wider text-slate-600">
							Game Code
						</label>
						<Input
							id="code"
							bind:value={gameCodeInput}
							placeholder="e.g. WORD88"
							maxlength={10}
							class="uppercase font-mono font-bold tracking-widest text-center"
						/>
					</div>

					<Button
						variant="default"
						size="lg"
						onclick={handleJoinGame}
						class="w-full bg-slate-900 hover:bg-slate-800"
					>
						Join Match
					</Button>
				</div>
			{/if}

			{#if errorMessage}
				<div class="mt-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
					{errorMessage}
				</div>
			{/if}
		</Card>

		<!-- Features Badges -->
		<div class="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
			<span>CSW Dictionary</span>
			<span>•</span>
			<span>AI Bot Mode</span>
			<span>•</span>
			<span>Responsive</span>
		</div>
	</div>

	<!-- Footer with Author Signature -->
	<footer class="w-full text-center py-3">
		<p class="text-xs text-slate-400 font-medium tracking-wide">
			Made with <span class="text-red-500 inline-block animate-pulse">❤️</span> by <span class="text-slate-700 font-bold">ARP</span>
		</p>
	</footer>
</main>

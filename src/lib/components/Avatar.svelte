<script lang="ts">
	import { User, Bot } from 'lucide-svelte';

	type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	let {
		src = null,
		name = '',
		email = '',
		size = 'md' as AvatarSize,
		isSimulator = false,
		class: className = ''
	} = $props<{
		src?: string | null;
		name?: string;
		email?: string;
		size?: AvatarSize;
		isSimulator?: boolean;
		class?: string;
	}>();

	// Size mappings
	const sizeClasses: Record<AvatarSize, string> = {
		xs: 'h-6 w-6 text-xs',
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-base',
		lg: 'h-12 w-12 text-lg',
		xl: 'h-16 w-16 text-xl'
	};

	const iconSizes: Record<AvatarSize, string> = {
		xs: 'h-3 w-3',
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
		xl: 'h-8 w-8'
	};

	// Get initials from name or email
	function getInitials(name: string, email: string): string {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		if (email) {
			return email[0].toUpperCase();
		}
		return '?';
	}

	// Get background color based on name/email for consistency
	function getBackgroundColor(name: string, email: string): string {
		const text = name || email || '';
		const colors = [
			'bg-gradient-to-br from-blue-500 to-purple-600',
			'bg-gradient-to-br from-green-500 to-teal-600',
			'bg-gradient-to-br from-purple-500 to-pink-600',
			'bg-gradient-to-br from-orange-500 to-red-600',
			'bg-gradient-to-br from-indigo-500 to-blue-600',
			'bg-gradient-to-br from-pink-500 to-rose-600',
			'bg-gradient-to-br from-teal-500 to-cyan-600',
			'bg-gradient-to-br from-yellow-500 to-orange-600'
		];

		// Simple hash function to get consistent color
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			hash = text.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	}

	// Special styling for simulator
	function getSimulatorStyle(): string {
		return 'bg-gradient-to-br from-green-500 to-emerald-600';
	}

	const initials = $derived(getInitials(name, email));
	const bgColor = $derived(isSimulator ? getSimulatorStyle() : getBackgroundColor(name, email));
	const sizeClass = $derived(sizeClasses[size as AvatarSize]);
	const iconSizeClass = $derived(iconSizes[size as AvatarSize]);
</script>

<div
	class="flex items-center justify-center overflow-hidden rounded-full font-medium text-white {sizeClass} {src
		? ''
		: bgColor} {className}"
>
	{#if src}
		<img
			{src}
			alt="{name || email || 'User'}'s avatar"
			class="h-full w-full object-cover"
			loading="lazy"
		/>
	{:else if isSimulator}
		<Bot class={iconSizeClass} />
	{:else if initials !== '?'}
		{initials}
	{:else}
		<User class={iconSizeClass} />
	{/if}
</div>

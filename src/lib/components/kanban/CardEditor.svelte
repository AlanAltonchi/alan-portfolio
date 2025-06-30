<script lang="ts">
	import { Bold, Italic, List, ListOrdered, Link2, Code } from 'lucide-svelte';

	interface Props {
		content: string;
	}

	let { content = $bindable('') }: Props = $props();

	let editor: HTMLDivElement;
	// let selectedText = $state(''); // Unused

	function formatText(command: string, value?: string) {
		document.execCommand(command, false, value);
		editor.focus();
	}

	function insertLink() {
		const url = prompt('Enter URL:');
		if (url) {
			formatText('createLink', url);
		}
	}

	function updateContent() {
		content = editor.innerHTML;
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain');
		if (text) {
			document.execCommand('insertText', false, text);
		}
	}

	$effect(() => {
		if (editor && editor.innerHTML !== content) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			editor.innerHTML = content;
		}
	});
</script>

<div
	class="overflow-hidden rounded-xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 p-[1px] backdrop-blur-sm dark:from-gray-800/50 dark:to-gray-900/50"
>
	<div class="overflow-hidden rounded-xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
		<!-- Toolbar -->
		<div
			class="flex items-center gap-1 border-b border-gray-200/20 bg-gradient-to-r from-gray-50/50 to-gray-100/50 p-2 backdrop-blur-sm dark:border-gray-700/20 dark:from-gray-800/50 dark:to-gray-900/50"
		>
			<button
				type="button"
				onclick={() => formatText('bold')}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Bold"
			>
				<Bold
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>

			<button
				type="button"
				onclick={() => formatText('italic')}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Italic"
			>
				<Italic
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>

			<div
				class="mx-1 h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600"
			></div>

			<button
				type="button"
				onclick={() => formatText('insertUnorderedList')}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Bullet List"
			>
				<List
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>

			<button
				type="button"
				onclick={() => formatText('insertOrderedList')}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Numbered List"
			>
				<ListOrdered
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>

			<div
				class="mx-1 h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600"
			></div>

			<button
				type="button"
				onclick={insertLink}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Insert Link"
			>
				<Link2
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>

			<button
				type="button"
				onclick={() => formatText('formatBlock', '<pre>')}
				class="group relative rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-sm"
				title="Code Block"
			>
				<Code
					class="h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
				/>
			</button>
		</div>

		<!-- Editor -->
		<div
			bind:this={editor}
			contenteditable="true"
			oninput={updateContent}
			onpaste={handlePaste}
			class="prose dark:prose-invert prose-sm min-h-[150px] max-w-none bg-gradient-to-br from-white/50 to-gray-50/50
				p-4 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:from-white/80 focus:to-gray-50/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:ring-inset dark:from-gray-900/50 dark:to-gray-800/50 dark:text-white dark:focus:from-gray-900/80 dark:focus:to-gray-800/80"
			role="textbox"
			aria-multiline="true"
			aria-label="Rich text editor"
		></div>
	</div>
</div>

<style>
	:global(.prose) {
		font-size: 0.875rem;
		line-height: 1.6;
	}

	:global(.prose p) {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	:global(.prose ul, .prose ol) {
		margin-top: 0.5em;
		margin-bottom: 0.5em;
		padding-left: 1.5em;
	}

	:global(.prose li) {
		margin-top: 0.25em;
		margin-bottom: 0.25em;
	}

	:global(.prose pre) {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05));
		padding: 0.75em;
		border-radius: 0.5rem;
		overflow-x: auto;
		border: 1px solid rgba(147, 51, 234, 0.1);
	}

	:global(.dark .prose pre) {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
		border-color: rgba(147, 51, 234, 0.2);
	}

	:global(.prose a) {
		color: #3b82f6;
		text-decoration: none;
		background: linear-gradient(to right, #3b82f6, #3b82f6);
		background-size: 0% 2px;
		background-position: left bottom;
		background-repeat: no-repeat;
		transition: background-size 0.3s ease;
	}

	:global(.prose a:hover) {
		background-size: 100% 2px;
	}

	:global(.dark .prose a) {
		color: #60a5fa;
		background-image: linear-gradient(to right, #60a5fa, #60a5fa);
	}
</style>

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

<div class="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600">
	<!-- Toolbar -->
	<div
		class="flex items-center gap-1 border-b border-gray-300 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-800"
	>
		<button
			type="button"
			onclick={() => formatText('bold')}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Bold"
		>
			<Bold class="h-4 w-4" />
		</button>

		<button
			type="button"
			onclick={() => formatText('italic')}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Italic"
		>
			<Italic class="h-4 w-4" />
		</button>

		<div class="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

		<button
			type="button"
			onclick={() => formatText('insertUnorderedList')}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Bullet List"
		>
			<List class="h-4 w-4" />
		</button>

		<button
			type="button"
			onclick={() => formatText('insertOrderedList')}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Numbered List"
		>
			<ListOrdered class="h-4 w-4" />
		</button>

		<div class="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

		<button
			type="button"
			onclick={insertLink}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Insert Link"
		>
			<Link2 class="h-4 w-4" />
		</button>

		<button
			type="button"
			onclick={() => formatText('formatBlock', '<pre>')}
			class="rounded p-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
			title="Code Block"
		>
			<Code class="h-4 w-4" />
		</button>
	</div>

	<!-- Editor -->
	<div
		bind:this={editor}
		contenteditable="true"
		oninput={updateContent}
		onpaste={handlePaste}
		class="prose dark:prose-invert prose-sm min-h-[150px] max-w-none bg-white
			p-3 text-gray-900 focus:outline-none dark:bg-gray-900 dark:text-white"
		role="textbox"
		aria-multiline="true"
		aria-label="Rich text editor"
	></div>
</div>

<style>
	:global(.prose) {
		font-size: 0.875rem;
		line-height: 1.5;
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
		background-color: rgba(0, 0, 0, 0.05);
		padding: 0.5em;
		border-radius: 0.25rem;
		overflow-x: auto;
	}

	:global(.dark .prose pre) {
		background-color: rgba(255, 255, 255, 0.05);
	}

	:global(.prose a) {
		color: #3b82f6;
		text-decoration: underline;
	}

	:global(.dark .prose a) {
		color: #60a5fa;
	}
</style>

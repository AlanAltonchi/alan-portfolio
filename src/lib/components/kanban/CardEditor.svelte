<script lang="ts">
	import { Bold, Italic, List, ListOrdered, Link2, Code } from 'lucide-svelte';
	
	interface Props {
		content: string;
	}
	
	let { content = $bindable('') }: Props = $props();
	
	let editor: HTMLDivElement;
	let selectedText = $state('');
	
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
			editor.innerHTML = content;
		}
	});
</script>

<div class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
	<!-- Toolbar -->
	<div class="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
		<button
			type="button"
			onclick={() => formatText('bold')}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Bold"
		>
			<Bold class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			onclick={() => formatText('italic')}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Italic"
		>
			<Italic class="w-4 h-4" />
		</button>
		
		<div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
		
		<button
			type="button"
			onclick={() => formatText('insertUnorderedList')}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Bullet List"
		>
			<List class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			onclick={() => formatText('insertOrderedList')}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Numbered List"
		>
			<ListOrdered class="w-4 h-4" />
		</button>
		
		<div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
		
		<button
			type="button"
			onclick={insertLink}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Insert Link"
		>
			<Link2 class="w-4 h-4" />
		</button>
		
		<button
			type="button"
			onclick={() => formatText('formatBlock', '<pre>')}
			class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
			title="Code Block"
		>
			<Code class="w-4 h-4" />
		</button>
	</div>
	
	<!-- Editor -->
	<div
		bind:this={editor}
		contenteditable="true"
		oninput={updateContent}
		onpaste={handlePaste}
		class="min-h-[150px] p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white
			focus:outline-none prose dark:prose-invert max-w-none prose-sm"
		role="textbox"
		aria-multiline="true"
		aria-label="Rich text editor"
	>
	</div>
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
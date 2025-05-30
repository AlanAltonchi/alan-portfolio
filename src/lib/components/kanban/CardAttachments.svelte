<script lang="ts">
	import { supabase } from '$lib/db.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Upload, X, Download, FileText, Image, File as GenericFileIcon } from 'lucide-svelte';

	interface Attachment {
		id: string;
		card_id: string;
		file_name: string;
		file_path: string;
		file_size: number;
		mime_type: string;
		uploaded_by: string | null;
		uploaded_at: string;
		signed_url?: string;
		uploader?: {
			email: string;
			full_name: string | null;
		};
	}

	interface Props {
		cardId: string;
		boardId: string;
	}

	let { cardId, boardId }: Props = $props();

	let attachments = $state<Attachment[]>([]);
	let isLoading = $state(true);
	let isUploading = $state(false);
	let fileInput: HTMLInputElement;

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

	async function loadAttachments() {
		if (!authStore.user) return;

		isLoading = true;

		// First get the attachments
		const { data: attachmentsData, error } = await supabase
			.from('card_attachments')
			.select('*')
			.eq('card_id', cardId)
			.order('uploaded_at', { ascending: false });

		if (!error && attachmentsData) {
			// Get unique user IDs from attachments (filter out nulls)
			const userIds = [
				...new Set(
					attachmentsData.map((a) => a.uploaded_by).filter((id): id is string => id !== null)
				)
			];

			// Get user details
			const { data: usersData } = await supabase
				.from('users')
				.select('id, email')
				.in('id', userIds);

			// Get signed URLs for each attachment and add user data
			const attachmentsWithUrls = await Promise.all(
				attachmentsData.map(async (attachment) => {
					const { data: signedUrlData } = await supabase.storage
						.from('kanban-attachments')
						.createSignedUrl(attachment.file_path, 3600); // 1 hour expiry

					return {
						...attachment,
						signed_url: signedUrlData?.signedUrl,
						uploader: usersData?.find((u) => u.id === attachment.uploaded_by)
							? {
									email: usersData.find((u) => u.id === attachment.uploaded_by)?.email || '',
									full_name: null
								}
							: undefined
					};
				})
			);

			attachments = attachmentsWithUrls;
		}

		isLoading = false;
	}

	async function uploadFile(file: File) {
		if (!authStore.user) return;

		if (file.size > MAX_FILE_SIZE) {
			alert('File size must be less than 10MB');
			return;
		}

		isUploading = true;

		// Create unique file path
		const fileExt = file.name.split('.').pop();
		const fileName = `${boardId}/${cardId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

		// Upload to Supabase Storage
		const { error: uploadError } = await supabase.storage
			.from('kanban-attachments')
			.upload(fileName, file);

		if (uploadError) {
			console.error('Upload error:', uploadError);
			alert('Failed to upload file');
			isUploading = false;
			return;
		}

		// Create attachment record
		const { error: dbError } = await supabase.from('card_attachments').insert({
			card_id: cardId,
			file_name: file.name,
			file_path: fileName,
			file_size: file.size,
			mime_type: file.type,
			uploaded_by: authStore.user.id
		});

		if (!dbError) {
			await loadAttachments();
		}

		isUploading = false;
	}

	async function deleteAttachment(attachment: Attachment) {
		if (!authStore.user || !confirm('Delete this attachment?')) return;

		// Delete from storage
		const { error: storageError } = await supabase.storage
			.from('kanban-attachments')
			.remove([attachment.file_path]);

		if (storageError) {
			console.error('Storage delete error:', storageError);
		}

		// Delete from database
		const { error: dbError } = await supabase
			.from('card_attachments')
			.delete()
			.eq('id', attachment.id);

		if (!dbError) {
			attachments = attachments.filter((a) => a.id !== attachment.id);
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function getFileIcon(mimeType: string) {
		if (mimeType.startsWith('image/')) return Image;
		if (mimeType.includes('pdf')) return FileText;
		return GenericFileIcon;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			uploadFile(file);
			input.value = '';
		}
	}

	$effect(() => {
		loadAttachments();
	});
</script>

<div class="space-y-4">
	<input bind:this={fileInput} type="file" class="hidden" onchange={handleFileSelect} />

	{#if isLoading}
		<div class="py-8 text-center text-gray-500 dark:text-gray-400">Loading attachments...</div>
	{:else}
		<!-- Attachments List -->
		{#if attachments.length > 0}
			<div class="space-y-2">
				{#each attachments as attachment (attachment.id)}
					{@const Icon = getFileIcon(attachment.mime_type)}
					<div class="group flex items-center gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
						<Icon class="h-8 w-8 flex-shrink-0 text-gray-400 dark:text-gray-500" />

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<a
									href={attachment.signed_url || '#'}
									target="_blank"
									rel="noopener noreferrer"
									class="truncate text-sm font-medium text-blue-600
										hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
								>
									{attachment.file_name}
								</a>
								<span class="text-xs text-gray-500 dark:text-gray-400">
									{formatFileSize(attachment.file_size)}
								</span>
							</div>
							<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Uploaded by {attachment.uploader?.full_name ||
									attachment.uploader?.email ||
									'Unknown'}
								on {new Date(attachment.uploaded_at).toLocaleDateString()}
							</div>
						</div>

						<div
							class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<a
								href={attachment.signed_url || '#'}
								download={attachment.file_name}
								class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
								title="Download"
							>
								<Download class="h-4 w-4" />
							</a>
							<button
								onclick={() => deleteAttachment(attachment)}
								class="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
								title="Delete"
							>
								<X class="h-4 w-4" />
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-8 text-center text-gray-500 dark:text-gray-400">No attachments yet</div>
		{/if}

		<!-- Upload Button -->
		<button
			onclick={() => fileInput.click()}
			disabled={isUploading}
			class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white
				px-4 py-2 text-sm font-medium text-gray-700 transition-colors
				hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600
				dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
		>
			<Upload class="h-4 w-4" />
			{isUploading ? 'Uploading...' : 'Upload Attachment'}
		</button>

		<p class="text-center text-xs text-gray-500 dark:text-gray-400">Maximum file size: 10MB</p>
	{/if}
</div>

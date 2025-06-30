import { kanbanStore } from '$lib/stores/kanban.svelte';
export const load = async ({ params, parent }) => {
	await parent();
	const { boardId } = params;
	const board = await kanbanStore.loadBoard(boardId);

	return {
		boardId: boardId,
		board: board
	};
};

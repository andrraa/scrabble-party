import type { BoardCell, PlacedTileMove, ScrabbleTile } from '../types';
import { validateAndScoreMove } from './validator';
import { BOARD_SIZE, CENTER_ROW, CENTER_COL } from './board-constants';

export interface BotMoveResult {
	action: 'PLAY' | 'SWAP' | 'PASS';
	placements?: PlacedTileMove[];
	tileIds?: string[];
	word?: string;
	score?: number;
}

export function findBestBotMove(
	board: BoardCell[][],
	rack: ScrabbleTile[],
	dict: Set<string>
): BotMoveResult {
	const isFirstMove = !board.some((row) => row.some((cell) => cell.isLocked));

	// Available letters in bot rack
	const botLetters = rack.map((t) => (t.isBlank ? '_' : t.letter.toUpperCase()));

	if (isFirstMove) {
		// First move: form best word from rack across center (7, 7)
		return findBestFirstMove(board, rack, dict);
	}

	// Scan board for locked anchor points
	const anchors: { r: number; c: number; letter: string }[] = [];
	for (let r = 0; r < BOARD_SIZE; r++) {
		for (let c = 0; c < BOARD_SIZE; c++) {
			if (board[r][c].tile !== null && board[r][c].isLocked) {
				anchors.push({ r, c, letter: board[r][c].tile!.letter.toUpperCase() });
			}
		}
	}

	let bestMove: BotMoveResult | null = null;
	let highestScore = -1;

	// Try placing words across anchors
	for (const anchor of anchors) {
		// A. Horizontal placements through anchor (r, c)
		for (let startCol = Math.max(0, anchor.c - 6); startCol <= anchor.c; startCol++) {
			for (let len = 2; len <= Math.min(8, BOARD_SIZE - startCol); len++) {
				const endCol = startCol + len - 1;
				if (anchor.c < startCol || anchor.c > endCol) continue;

				const testMove = tryBuildWord(board, rack, anchor.r, startCol, endCol, true, dict);
				if (testMove && testMove.score > highestScore) {
					highestScore = testMove.score;
					bestMove = {
						action: 'PLAY',
						placements: testMove.placements,
						word: testMove.word,
						score: testMove.score
					};
				}
			}
		}

		// B. Vertical placements through anchor (r, c)
		for (let startRow = Math.max(0, anchor.r - 6); startRow <= anchor.r; startRow++) {
			for (let len = 2; len <= Math.min(8, BOARD_SIZE - startRow); len++) {
				const endRow = startRow + len - 1;
				if (anchor.r < startRow || anchor.r > endRow) continue;

				const testMove = tryBuildWord(board, rack, startRow, anchor.c, endRow, false, dict);
				if (testMove && testMove.score > highestScore) {
					highestScore = testMove.score;
					bestMove = {
						action: 'PLAY',
						placements: testMove.placements,
						word: testMove.word,
						score: testMove.score
					};
				}
			}
		}

		// If bot already found a very high scoring move (≥ 28 pts), stop searching to stay fast
		if (highestScore >= 28) break;
	}

	if (bestMove && highestScore > 0) {
		return bestMove;
	}

	// Fallback: If no valid words found, swap up to 3 tiles or pass
	if (rack.length > 0) {
		const swapCount = Math.min(3, rack.length);
		return {
			action: 'SWAP',
			tileIds: rack.slice(0, swapCount).map((t) => t.id)
		};
	}

	return { action: 'PASS' };
}

function findBestFirstMove(
	board: BoardCell[][],
	rack: ScrabbleTile[],
	dict: Set<string>
): BotMoveResult {
	const rackLetters = rack.map((t) => (t.isBlank ? 'A' : t.letter.toUpperCase()));

	// Common high-frequency Scrabble words to test first
	const candidateList = Array.from(dict).filter((w) => w.length >= 2 && w.length <= rack.length);

	let bestMove: BotMoveResult | null = null;
	let highestScore = -1;

	for (const word of candidateList) {
		if (word.length > rack.length) continue;

		// Check if bot can form word
		const placements = matchRackToWord(word, rack, CENTER_ROW, CENTER_COL - Math.floor(word.length / 2), true);
		if (!placements) continue;

		const result = validateAndScoreMove(board, placements, dict, true);
		if (result.valid && result.totalScore > highestScore) {
			highestScore = result.totalScore;
			bestMove = {
				action: 'PLAY',
				placements,
				word,
				score: result.totalScore
			};
			if (highestScore >= 16) break;
		}
	}

	return bestMove || { action: 'PASS' };
}

function tryBuildWord(
	board: BoardCell[][],
	rack: ScrabbleTile[],
	fixedRowOrCol: number,
	start: number,
	end: number,
	isHorizontal: boolean,
	dict: Set<string>
): { placements: PlacedTileMove[]; word: string; score: number } | null {
	const neededPositions: { r: number; c: number }[] = [];
	let hasLockedInLine = false;

	for (let i = start; i <= end; i++) {
		const r = isHorizontal ? fixedRowOrCol : i;
		const c = isHorizontal ? i : fixedRowOrCol;
		const cell = board[r][c];

		if (cell.tile !== null && cell.isLocked) {
			hasLockedInLine = true;
		} else {
			neededPositions.push({ r, c });
		}
	}

	if (neededPositions.length === 0 || neededPositions.length > rack.length) {
		return null;
	}

	// Try rack permutations for needed positions
	const availableRack = [...rack];
	const placements: PlacedTileMove[] = [];

	for (let i = 0; i < neededPositions.length; i++) {
		const pos = neededPositions[i];
		const tile = availableRack[i];
		if (!tile) return null;

		const letter = tile.isBlank ? 'E' : tile.letter;
		placements.push({
			row: pos.r,
			col: pos.c,
			tile: { ...tile, letter, assignedLetter: tile.isBlank ? letter : undefined }
		});
	}

	const result = validateAndScoreMove(board, placements, dict, false);
	if (result.valid && result.totalScore > 0) {
		return {
			placements,
			word: result.words[0]?.word || '',
			score: result.totalScore
		};
	}

	return null;
}

function matchRackToWord(
	word: string,
	rack: ScrabbleTile[],
	startRow: number,
	startCol: number,
	isHorizontal: boolean
): PlacedTileMove[] | null {
	const rackCopy = [...rack];
	const placements: PlacedTileMove[] = [];

	for (let i = 0; i < word.length; i++) {
		const char = word[i];
		const r = isHorizontal ? startRow : startRow + i;
		const c = isHorizontal ? startCol + i : startCol;

		if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;

		const directIdx = rackCopy.findIndex((t) => !t.isBlank && t.letter.toUpperCase() === char);
		if (directIdx !== -1) {
			const [tile] = rackCopy.splice(directIdx, 1);
			placements.push({ row: r, col: c, tile });
		} else {
			const blankIdx = rackCopy.findIndex((t) => t.isBlank);
			if (blankIdx !== -1) {
				const [tile] = rackCopy.splice(blankIdx, 1);
				placements.push({ row: r, col: c, tile: { ...tile, assignedLetter: char } });
			} else {
				return null; // cannot form word
			}
		}
	}

	return placements;
}

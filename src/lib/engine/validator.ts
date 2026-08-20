import {
	BOARD_SIZE,
	CENTER_ROW,
	CENTER_COL,
	RACK_CAPACITY,
	BINGO_BONUS
} from './board-constants';
import type {
	BoardCell,
	PlacedTileMove,
	FormedWord,
	MoveValidationResult,
	MultiplierType,
	ScrabbleTile
} from '../types';

export function validateAndScoreMove(
	currentBoard: BoardCell[][],
	placements: PlacedTileMove[],
	dict: Set<string>,
	isFirstMove: boolean
): MoveValidationResult {
	if (placements.length === 0) {
		return { valid: false, error: 'No tiles placed on the board.', words: [], totalScore: 0, isBingo: false };
	}

	// Check if any placement coordinates are out of bounds or placed on an existing locked tile
	for (const p of placements) {
		if (p.row < 0 || p.row >= BOARD_SIZE || p.col < 0 || p.col >= BOARD_SIZE) {
			return { valid: false, error: 'Tiles must be placed within the 15x15 board.', words: [], totalScore: 0, isBingo: false };
		}
		if (currentBoard[p.row][p.col].tile !== null && currentBoard[p.row][p.col].isLocked) {
			return { valid: false, error: 'Cannot place tile on an already occupied square.', words: [], totalScore: 0, isBingo: false };
		}
		// Validate blank tile assignment
		if (p.tile.isBlank && (!p.tile.assignedLetter || !/^[A-Z]$/i.test(p.tile.assignedLetter))) {
			return { valid: false, error: 'Blank wildcard tiles must have an assigned letter (A-Z).', words: [], totalScore: 0, isBingo: false };
		}
	}

	// Check for duplicate placement coordinates
	const coordSet = new Set<string>();
	for (const p of placements) {
		const key = `${p.row},${p.col}`;
		if (coordSet.has(key)) {
			return { valid: false, error: 'Duplicate tile placement on the same square.', words: [], totalScore: 0, isBingo: false };
		}
		coordSet.add(key);
	}

	// 1. Check Alignment: all placements must be strictly along a single row OR single column
	const sameRow = placements.every((p) => p.row === placements[0].row);
	const sameCol = placements.every((p) => p.col === placements[0].col);

	if (!sameRow && !sameCol) {
		return { valid: false, error: 'All placed tiles must be in a single straight row or column.', words: [], totalScore: 0, isBingo: false };
	}

	// Create a temp board representing the state after this move
	const tempBoard: BoardCell[][] = currentBoard.map((row) =>
		row.map((cell) => ({ ...cell }))
	);

	const newPlacementMap = new Map<string, PlacedTileMove>();
	for (const p of placements) {
		const placedTile: ScrabbleTile = {
			...p.tile,
			letter: p.tile.isBlank ? (p.tile.assignedLetter?.toUpperCase() || 'A') : p.tile.letter.toUpperCase(),
			value: p.tile.isBlank ? 0 : p.tile.value
		};
		tempBoard[p.row][p.col] = {
			...tempBoard[p.row][p.col],
			tile: placedTile,
			isLocked: false // marked as newly placed for scoring
		};
		newPlacementMap.set(`${p.row},${p.col}`, p);
	}

	// 2. First move rule: must cover center square (7,7) and have at least 2 tiles
	if (isFirstMove) {
		const coversCenter = placements.some((p) => p.row === CENTER_ROW && p.col === CENTER_COL);
		if (!coversCenter) {
			return { valid: false, error: 'First move must cover the center star (H8).', words: [], totalScore: 0, isBingo: false };
		}
		if (placements.length < 2) {
			return { valid: false, error: 'First word must consist of at least two letters.', words: [], totalScore: 0, isBingo: false };
		}
	}

	// 3. Continuity check: Ensure no empty gaps between the span of placed tiles in the main direction
	let isHorizontal = true;
	if (sameRow && sameCol) {
		// Single tile placement
		// Determine direction by checking adjacent existing locked tiles
		const r = placements[0].row;
		const c = placements[0].col;
		const hasHorizontalAdj =
			(c > 0 && tempBoard[r][c - 1].tile !== null) ||
			(c < BOARD_SIZE - 1 && tempBoard[r][c + 1].tile !== null);
		const hasVerticalAdj =
			(r > 0 && tempBoard[r - 1][c].tile !== null) ||
			(r < BOARD_SIZE - 1 && tempBoard[r + 1][c].tile !== null);

		isHorizontal = hasHorizontalAdj || !hasVerticalAdj;
	} else if (sameRow) {
		isHorizontal = true;
	} else {
		isHorizontal = false;
	}

	if (isHorizontal) {
		const row = placements[0].row;
		const cols = placements.map((p) => p.col).sort((a, b) => a - b);
		const minCol = cols[0];
		const maxCol = cols[cols.length - 1];

		// Check every cell from minCol to maxCol is filled
		for (let c = minCol; c <= maxCol; c++) {
			if (tempBoard[row][c].tile === null) {
				return { valid: false, error: 'Letters in a row must be continuous without empty spaces.', words: [], totalScore: 0, isBingo: false };
			}
		}
	} else {
		const col = placements[0].col;
		const rows = placements.map((p) => p.row).sort((a, b) => a - b);
		const minRow = rows[0];
		const maxRow = rows[rows.length - 1];

		// Check every cell from minRow to maxRow is filled
		for (let r = minRow; r <= maxRow; r++) {
			if (tempBoard[r][col].tile === null) {
				return { valid: false, error: 'Letters in a column must be continuous without empty spaces.', words: [], totalScore: 0, isBingo: false };
			}
		}
	}

	// 4. Non-first move connectivity check: Must connect to at least one pre-existing locked tile
	if (!isFirstMove) {
		let connectsToLocked = false;
		for (const p of placements) {
			const neighbors = [
				[p.row - 1, p.col],
				[p.row + 1, p.col],
				[p.row, p.col - 1],
				[p.row, p.col + 1]
			];

			for (const [nr, nc] of neighbors) {
				if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
					if (currentBoard[nr][nc].tile !== null && currentBoard[nr][nc].isLocked) {
						connectsToLocked = true;
						break;
					}
				}
			}
			if (connectsToLocked) break;
		}

		if (!connectsToLocked) {
			return { valid: false, error: 'Word must connect to at least one existing tile on the board.', words: [], totalScore: 0, isBingo: false };
		}
	}

	// 5. Extract Words:
	// A) Primary Word along main axis
	const formedWords: FormedWord[] = [];

	if (isHorizontal) {
		const row = placements[0].row;
		const cols = placements.map((p) => p.col).sort((a, b) => a - b);
		let startCol = cols[0];
		let endCol = cols[cols.length - 1];

		// Expand backwards
		while (startCol > 0 && tempBoard[row][startCol - 1].tile !== null) {
			startCol--;
		}
		// Expand forwards
		while (endCol < BOARD_SIZE - 1 && tempBoard[row][endCol + 1].tile !== null) {
			endCol++;
		}

		// Only form main word if length > 1
		if (endCol > startCol) {
			const wordTiles = [];
			let wordStr = '';
			for (let c = startCol; c <= endCol; c++) {
				const cell = tempBoard[row][c];
				const isNew = newPlacementMap.has(`${row},${c}`);
				const letter = cell.tile?.letter || '';
				const value = cell.tile?.value ?? 0;
				wordStr += letter;
				wordTiles.push({
					letter,
					value,
					multiplier: cell.multiplier,
					isNew
				});
			}
			formedWords.push({
				word: wordStr,
				score: calculateWordScore(wordTiles),
				startRow: row,
				startCol,
				isVertical: false,
				tiles: wordTiles
			});
		}

		// B) Perpendicular cross-words for each newly placed tile
		for (const p of placements) {
			let startRow = p.row;
			let endRow = p.row;

			while (startRow > 0 && tempBoard[startRow - 1][p.col].tile !== null) {
				startRow--;
			}
			while (endRow < BOARD_SIZE - 1 && tempBoard[endRow + 1][p.col].tile !== null) {
				endRow++;
			}

			if (endRow > startRow) {
				const crossTiles = [];
				let crossStr = '';
				for (let r = startRow; r <= endRow; r++) {
					const cell = tempBoard[r][p.col];
					const isNew = r === p.row;
					const letter = cell.tile?.letter || '';
					const value = cell.tile?.value ?? 0;
					crossStr += letter;
					crossTiles.push({
						letter,
						value,
						multiplier: cell.multiplier,
						isNew
					});
				}
				formedWords.push({
					word: crossStr,
					score: calculateWordScore(crossTiles),
					startRow,
					startCol: p.col,
					isVertical: true,
					tiles: crossTiles
				});
			}
		}
	} else {
		// Main axis is Vertical
		const col = placements[0].col;
		const rows = placements.map((p) => p.row).sort((a, b) => a - b);
		let startRow = rows[0];
		let endRow = rows[rows.length - 1];

		while (startRow > 0 && tempBoard[startRow - 1][col].tile !== null) {
			startRow--;
		}
		while (endRow < BOARD_SIZE - 1 && tempBoard[endRow + 1][col].tile !== null) {
			endRow++;
		}

		if (endRow > startRow) {
			const wordTiles = [];
			let wordStr = '';
			for (let r = startRow; r <= endRow; r++) {
				const cell = tempBoard[r][col];
				const isNew = newPlacementMap.has(`${r},${col}`);
				const letter = cell.tile?.letter || '';
				const value = cell.tile?.value ?? 0;
				wordStr += letter;
				wordTiles.push({
					letter,
					value,
					multiplier: cell.multiplier,
					isNew
				});
			}
			formedWords.push({
				word: wordStr,
				score: calculateWordScore(wordTiles),
				startRow,
				startCol: col,
				isVertical: true,
				tiles: wordTiles
			});
		}

		// Perpendicular horizontal cross-words
		for (const p of placements) {
			let startCol = p.col;
			let endCol = p.col;

			while (startCol > 0 && tempBoard[p.row][startCol - 1].tile !== null) {
				startCol--;
			}
			while (endCol < BOARD_SIZE - 1 && tempBoard[p.row][endCol + 1].tile !== null) {
				endCol++;
			}

			if (endCol > startCol) {
				const crossTiles = [];
				let crossStr = '';
				for (let c = startCol; c <= endCol; c++) {
					const cell = tempBoard[p.row][c];
					const isNew = c === p.col;
					const letter = cell.tile?.letter || '';
					const value = cell.tile?.value ?? 0;
					crossStr += letter;
					crossTiles.push({
						letter,
						value,
						multiplier: cell.multiplier,
						isNew
					});
				}
				formedWords.push({
					word: crossStr,
					score: calculateWordScore(crossTiles),
					startRow: p.row,
					startCol,
					isVertical: false,
					tiles: crossTiles
				});
			}
		}
	}

	if (formedWords.length === 0) {
		return { valid: false, error: 'Move did not create any complete valid words of at least 2 letters.', words: [], totalScore: 0, isBingo: false };
	}

	// 6. Validate words against dictionary
	for (const formed of formedWords) {
		if (!dict.has(formed.word.toUpperCase())) {
			return {
				valid: false,
				error: `"${formed.word.toUpperCase()}" is not in the Scrabble dictionary.`,
				words: formedWords,
				totalScore: 0,
				isBingo: false
			};
		}
	}

	// 7. Calculate total points and Bingo bonus
	let totalScore = formedWords.reduce((acc, curr) => acc + curr.score, 0);
	const isBingo = placements.length >= RACK_CAPACITY;
	if (isBingo) {
		totalScore += BINGO_BONUS;
	}

	return {
		valid: true,
		words: formedWords,
		totalScore,
		isBingo
	};
}

export function calculateWordScore(
	tiles: { letter: string; value: number; multiplier: MultiplierType; isNew: boolean }[]
): number {
	let letterSum = 0;
	let wordMultiplier = 1;

	for (const t of tiles) {
		let tileVal = t.value;

		if (t.isNew) {
			if (t.multiplier === 'DL') {
				tileVal *= 2;
			} else if (t.multiplier === 'TL') {
				tileVal *= 3;
			} else if (t.multiplier === 'DW' || t.multiplier === 'CENTER') {
				wordMultiplier *= 2;
			} else if (t.multiplier === 'TW') {
				wordMultiplier *= 3;
			}
		}

		letterSum += tileVal;
	}

	return letterSum * wordMultiplier;
}

import type { BoardCell, MultiplierType, ScrabbleTile } from '../types';

export const BOARD_SIZE = 15;
export const CENTER_ROW = 7;
export const CENTER_COL = 7;
export const RACK_CAPACITY = 7;
export const BINGO_BONUS = 50;

// Scrabble Standard Letter Points
export const LETTER_VALUES: Record<string, number> = {
	A: 1,
	B: 3,
	C: 3,
	D: 2,
	E: 1,
	F: 4,
	G: 2,
	H: 4,
	I: 1,
	J: 8,
	K: 5,
	L: 1,
	M: 3,
	N: 1,
	O: 1,
	P: 3,
	Q: 10,
	R: 1,
	S: 1,
	T: 1,
	U: 1,
	V: 4,
	W: 4,
	X: 8,
	Y: 4,
	Z: 10,
	_: 0 // Blank wildcard
};

// Scrabble Standard Letter Distribution (Total 100 tiles)
export const LETTER_DISTRIBUTION: Record<string, number> = {
	A: 9,
	B: 2,
	C: 2,
	D: 4,
	E: 12,
	F: 2,
	G: 3,
	H: 2,
	I: 9,
	J: 1,
	K: 1,
	L: 4,
	M: 2,
	N: 6,
	O: 8,
	P: 2,
	Q: 1,
	R: 6,
	S: 4,
	T: 6,
	U: 4,
	V: 2,
	W: 2,
	X: 1,
	Y: 2,
	Z: 1,
	_: 2 // 2 Blanks
};

// Premium squares coordinates on 15x15 board
const TW_COORDS = [
	[0, 0],
	[0, 7],
	[0, 14],
	[7, 0],
	[7, 14],
	[14, 0],
	[14, 7],
	[14, 14]
];

const DW_COORDS = [
	[1, 1],
	[2, 2],
	[3, 3],
	[4, 4],
	[1, 13],
	[2, 12],
	[3, 11],
	[4, 10],
	[13, 1],
	[12, 2],
	[11, 3],
	[10, 4],
	[13, 13],
	[12, 12],
	[11, 11],
	[10, 10]
];

const TL_COORDS = [
	[1, 5],
	[1, 9],
	[5, 1],
	[5, 5],
	[5, 9],
	[5, 13],
	[9, 1],
	[9, 5],
	[9, 9],
	[9, 13],
	[13, 5],
	[13, 9]
];

const DL_COORDS = [
	[0, 3],
	[0, 11],
	[2, 6],
	[2, 8],
	[3, 0],
	[3, 7],
	[3, 14],
	[6, 2],
	[6, 6],
	[6, 8],
	[6, 12],
	[7, 3],
	[7, 11],
	[8, 2],
	[8, 6],
	[8, 8],
	[8, 12],
	[11, 0],
	[11, 7],
	[11, 14],
	[12, 6],
	[12, 8],
	[14, 3],
	[14, 11]
];

function hasCoord(list: number[][], r: number, c: number): boolean {
	return list.some(([row, col]) => row === r && col === c);
}

export function getCellMultiplier(row: number, col: number): MultiplierType {
	if (row === CENTER_ROW && col === CENTER_COL) return 'CENTER';
	if (hasCoord(TW_COORDS, row, col)) return 'TW';
	if (hasCoord(DW_COORDS, row, col)) return 'DW';
	if (hasCoord(TL_COORDS, row, col)) return 'TL';
	if (hasCoord(DL_COORDS, row, col)) return 'DL';
	return 'NORMAL';
}

export function createEmptyBoard(): BoardCell[][] {
	const board: BoardCell[][] = [];
	for (let r = 0; r < BOARD_SIZE; r++) {
		const row: BoardCell[] = [];
		for (let c = 0; c < BOARD_SIZE; c++) {
			row.push({
				row: r,
				col: c,
				multiplier: getCellMultiplier(r, c),
				tile: null,
				isLocked: false
			});
		}
		board.push(row);
	}
	return board;
}

export function createFreshTileBag(): ScrabbleTile[] {
	const bag: ScrabbleTile[] = [];
	let idCounter = 1;

	for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
		const value = LETTER_VALUES[letter] || 0;
		const isBlank = letter === '_';
		for (let i = 0; i < count; i++) {
			bag.push({
				id: `tile-${idCounter++}-${letter}`,
				letter: isBlank ? '_' : letter,
				value,
				isBlank
			});
		}
	}

	// Fisher-Yates Shuffle
	for (let i = bag.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}

	return bag;
}

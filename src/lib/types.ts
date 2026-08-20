export type MultiplierType = 'NORMAL' | 'DL' | 'TL' | 'DW' | 'TW' | 'CENTER';

export interface ScrabbleTile {
	id: string; // Unique identifier for DOM dragging / tracking
	letter: string; // 'A'-'Z' or '_' for blank
	value: number; // 0 for blank, 1-10 for regular
	isBlank?: boolean;
	assignedLetter?: string; // Assigned letter 'A'-'Z' if isBlank is true
}

export interface BoardCell {
	row: number;
	col: number;
	multiplier: MultiplierType;
	tile: ScrabbleTile | null;
	isLocked: boolean; // True if placed in previous turns
}

export interface PlacedTileMove {
	row: number;
	col: number;
	tile: ScrabbleTile;
}

export interface FormedWord {
	word: string;
	score: number;
	startRow: number;
	startCol: number;
	isVertical: boolean;
	tiles: { letter: string; value: number; multiplier: MultiplierType; isNew: boolean }[];
}

export interface MoveValidationResult {
	valid: boolean;
	error?: string;
	words: FormedWord[];
	totalScore: number;
	isBingo: boolean; // Bonus 50 for all 7 tiles
}

export interface Player {
	id: string;
	name: string;
	rack: ScrabbleTile[];
	score: number;
	isHost: boolean;
	isConnected: boolean;
	consecutivePasses: number;
	invalidAttempts: number; // 3 strikes = auto-pass
}

export interface MoveHistoryItem {
	id: string;
	playerId: string;
	playerName: string;
	type: 'PLAY' | 'PASS' | 'SWAP';
	words?: { word: string; score: number }[];
	totalScore: number;
	swappedCount?: number;
	timestamp: number;
}

export interface GameState {
	code: string;
	status: 'LOBBY' | 'PLAYING' | 'FINISHED';
	board: BoardCell[][]; // 15x15
	tileBag: ScrabbleTile[];
	remainingBagCount: number;
	players: Record<string, Player>;
	playerOrder: string[]; // [p1Id, p2Id]
	turnPlayerId: string;
	consecutivePasses: number;
	moveHistory: MoveHistoryItem[];
	winnerId: string | null;
	lastMoveTime: number;
	timerDuration: number; // 0 = no timer, or 60, 90, 120, 180 seconds
	turnStartTime: number;
}

// WebSocket Message Types
export type ClientMessage =
	| { type: 'JOIN'; name: string; playerId?: string }
	| { type: 'START_GAME'; playerId?: string }
	| { type: 'PLAY_MOVE'; placements: PlacedTileMove[]; playerId?: string }
	| { type: 'PASS_TURN'; playerId?: string }
	| { type: 'SWAP_TILES'; tileIds: string[]; playerId?: string }
	| { type: 'RESTART_GAME'; playerId?: string }
	| { type: 'SET_TIMER'; seconds: number; playerId?: string }
	| { type: 'SEND_EMOTE'; emote: string; playerId?: string };

export type ServerMessage =
	| { type: 'SYNC_STATE'; state: GameState; yourPlayerId: string }
	| { type: 'ERROR'; message: string }
	| { type: 'NOTIFICATION'; message: string; toastType?: 'info' | 'success' | 'warning' | 'error' }
	| { type: 'EMOTE_EVENT'; playerId: string; playerName: string; emote: string };

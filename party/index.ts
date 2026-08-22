import type * as Party from 'partykit/server';
import type {
	GameState,
	Player,
	ClientMessage,
	ServerMessage,
	PlacedTileMove,
	ScrabbleTile
} from '../src/lib/types';
import {
	createEmptyBoard,
	createFreshTileBag,
	RACK_CAPACITY
} from '../src/lib/engine/board-constants';
import { validateAndScoreMove } from '../src/lib/engine/validator';
import { getDictionary } from './dictionary-loader';

export default class ScrabbleServer implements Party.Server {
	party: Party.Party;
	state: GameState;
	dictionary: Set<string>;
	connPlayerMap: Map<string, string> = new Map();

	constructor(party: Party.Party) {
		this.party = party;
		this.dictionary = getDictionary();
		this.state = this.getInitialState();
	}

	getInitialState(): GameState {
		return {
			code: this.party.id.toUpperCase(),
			status: 'LOBBY',
			board: createEmptyBoard(),
			tileBag: createFreshTileBag(),
			remainingBagCount: 100,
			players: {},
			playerOrder: [],
			turnPlayerId: '',
			consecutivePasses: 0,
			moveHistory: [],
			winnerId: null,
			lastMoveTime: Date.now(),
			timerDuration: 90, // default 90s, or 0 for off
			allowDeadlock: false, // default false
			draftPlacements: [], // live realtime preview of opponent drafting
			turnStartTime: Date.now()
		};
	}

	onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		// Connected
	}

	onClose(conn: Party.Connection) {
		const playerId = (conn.state?.playerId as string) || this.connPlayerMap.get(conn.id);
		this.connPlayerMap.delete(conn.id);

		if (playerId && this.state.players[playerId]) {
			const isStillConnected = [...this.connPlayerMap.values()].some((pid) => pid === playerId);
			if (!isStillConnected) {
				this.state.players[playerId].isConnected = false;

				// Notify other player if during playing match
				if (this.state.status === 'PLAYING') {
					for (const c of this.party.getConnections()) {
						if (c.id !== conn.id) {
							this.sendNotification(
								c,
								`⚠️ ${this.state.players[playerId].name} disconnected`,
								'warning'
							);
						}
					}
				}

				this.broadcastState();
			}
		}
	}

	onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message) as ClientMessage;
			this.handleClientMessage(data, sender);
		} catch (err: any) {
			this.sendError(sender, err?.message || 'Invalid format');
		}
	}

	handleClientMessage(msg: ClientMessage, conn: Party.Connection) {
		const senderId = (conn.state?.playerId as string) || this.connPlayerMap.get(conn.id) || msg.playerId || '';

		switch (msg.type) {
			case 'JOIN':
				this.handleJoin(msg.name, msg.playerId, conn);
				break;
			case 'CHANGE_NAME':
				this.handleNameChange(msg.name, senderId, conn);
				break;
			case 'SET_TIMER':
				this.handleSetTimer(msg.seconds, senderId, conn);
				break;
			case 'SET_DEADLOCK':
				this.handleSetDeadlock(msg.enabled, senderId, conn);
				break;
			case 'START_GAME':
				this.handleStartGame(senderId, conn);
				break;
			case 'DRAFT_MOVE':
				this.handleDraftMove(msg.placements, senderId, conn);
				break;
			case 'PLAY_MOVE':
				this.handlePlayMove(msg.placements, senderId, conn);
				break;
			case 'PASS_TURN':
				this.handlePassTurn(senderId, conn);
				break;
			case 'SWAP_TILES':
				this.handleSwapTiles(msg.tileIds, senderId, conn);
				break;
			case 'SEND_EMOTE':
				this.handleSendEmote(msg.emote, senderId, conn);
				break;
			case 'LEAVE_GAME':
				this.handleLeaveGame(senderId, conn);
				break;
			case 'TIMER_EXPIRED':
				this.handleTimerExpired(senderId, conn);
				break;
			case 'RESTART_GAME':
				this.handleRestartGame(senderId, conn);
				break;
		}
	}

	handleJoin(name: string, requestedPlayerId: string | undefined, conn: Party.Connection) {
		let cleanName = (name || 'Player').trim().slice(0, 20);
		let playerId = requestedPlayerId;

		// 1. Reconnecting existing player by ID
		if (playerId && this.state.players[playerId]) {
			this.state.players[playerId].name = cleanName || this.state.players[playerId].name;
			this.state.players[playerId].isConnected = true;
			conn.setState({ playerId });
			this.connPlayerMap.set(conn.id, playerId);

			if (this.state.status === 'PLAYING') {
				for (const c of this.party.getConnections()) {
					if (c.id !== conn.id) {
						this.sendNotification(c, `✅ ${cleanName} reconnected`, 'success');
					}
				}
			}

			this.syncSender(conn, playerId);
			this.broadcastState();
			return;
		}

		// 2. Fallback: Reconnecting disconnected player by name match
		const disconnectedMatch = Object.values(this.state.players).find(
			(p) => p.name.toLowerCase() === cleanName.toLowerCase() && !p.isConnected
		);
		if (disconnectedMatch) {
			const restoredId = disconnectedMatch.id;
			this.state.players[restoredId].isConnected = true;
			conn.setState({ playerId: restoredId });
			this.connPlayerMap.set(conn.id, restoredId);

			if (this.state.status === 'PLAYING') {
				for (const c of this.party.getConnections()) {
					if (c.id !== conn.id) {
						this.sendNotification(c, `✅ ${cleanName} reconnected`, 'success');
					}
				}
			}

			this.syncSender(conn, restoredId);
			this.broadcastState();
			return;
		}

		// 3. Joining as player 1 (Host) or player 2
		const currentCount = this.state.playerOrder.length;
		if (currentCount < 2) {
			playerId = playerId || `p_${Math.random().toString(36).slice(2, 9)}`;
			const isHost = currentCount === 0;

			const existingPlayers = Object.values(this.state.players);
			const nameExists = existingPlayers.some((p) => p.name.toLowerCase() === cleanName.toLowerCase());
			if (nameExists) {
				cleanName = `${cleanName} 2`;
			}

			const newPlayer: Player = {
				id: playerId,
				name: cleanName,
				rack: this.state.status === 'PLAYING' ? this.drawTiles(RACK_CAPACITY) : [],
				score: 0,
				isHost,
				isConnected: true,
				consecutivePasses: 0,
				invalidAttempts: 0
			};

			this.state.players[playerId] = newPlayer;
			this.state.playerOrder.push(playerId);
			conn.setState({ playerId });
			this.connPlayerMap.set(conn.id, playerId);

			for (const c of this.party.getConnections()) {
				if (c.id !== conn.id) {
					this.sendNotification(c, `👋 ${cleanName} joined`, 'info');
				}
			}

			this.syncSender(conn, playerId);
			this.broadcastState();
		} else {
			// Spectator mode
			const spectatorId = playerId || `spec_${Math.random().toString(36).slice(2, 9)}`;
			conn.setState({ playerId: spectatorId });
			this.connPlayerMap.set(conn.id, spectatorId);
			this.syncSender(conn, spectatorId);
			this.sendNotification(conn, 'Joined as Spectator', 'info');
		}
	}

	handleNameChange(name: string, senderId: string, conn: Party.Connection) {
		let cleanName = (name || 'Player').trim().slice(0, 20);
		if (!cleanName || !this.state.players[senderId]) return;

		const otherPlayers = Object.values(this.state.players).filter((p) => p.id !== senderId);
		if (otherPlayers.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
			cleanName = `${cleanName} 2`;
		}

		const oldName = this.state.players[senderId].name;
		this.state.players[senderId].name = cleanName;

		for (const c of this.party.getConnections()) {
			this.sendNotification(c, `✏️ ${oldName} is now "${cleanName}"`, 'info');
		}

		this.broadcastState();
	}

	handleDraftMove(placements: PlacedTileMove[], senderId: string, conn: Party.Connection) {
		if (this.state.status !== 'PLAYING' || this.state.turnPlayerId !== senderId) return;
		this.state.draftPlacements = placements || [];
		this.broadcastState();
	}

	handleLeaveGame(senderId: string, conn: Party.Connection) {
		const leavingPlayer = this.state.players[senderId];
		if (!leavingPlayer) return;

		this.connPlayerMap.delete(conn.id);

		if (this.state.status === 'PLAYING') {
			const otherPlayerId = this.state.playerOrder.find((pid) => pid !== senderId);

			this.state.status = 'FINISHED';
			this.state.winnerId = otherPlayerId || null;
			this.state.draftPlacements = [];

			this.state.moveHistory.unshift({
				id: `leave_${Date.now()}`,
				playerId: leavingPlayer.id,
				playerName: leavingPlayer.name,
				type: 'PASS',
				totalScore: 0,
				timestamp: Date.now()
			});

			for (const c of this.party.getConnections()) {
				if (c.id !== conn.id) {
					this.sendNotification(
						c,
						`🚪 ${leavingPlayer.name} left. You win by forfeit!`,
						'success'
					);
				}
			}
		} else if (this.state.status === 'LOBBY') {
			delete this.state.players[senderId];
			this.state.playerOrder = this.state.playerOrder.filter((pid) => pid !== senderId);

			if (leavingPlayer.isHost && this.state.playerOrder.length > 0) {
				const newHostId = this.state.playerOrder[0];
				if (this.state.players[newHostId]) {
					this.state.players[newHostId].isHost = true;
				}
			}

			for (const c of this.party.getConnections()) {
				if (c.id !== conn.id) {
					this.sendNotification(c, `🚪 ${leavingPlayer.name} left the lobby`, 'info');
				}
			}
		}

		this.broadcastState();
	}

	handleSetTimer(seconds: number, senderId: string, conn: Party.Connection) {
		const isHost = this.state.players[senderId]?.isHost || this.state.playerOrder[0] === senderId;
		if (!isHost || this.state.status !== 'LOBBY') {
			return;
		}
		this.state.timerDuration = Math.max(0, Math.min(300, seconds));
		this.broadcastState();
	}

	handleSetDeadlock(enabled: boolean, senderId: string, conn: Party.Connection) {
		const isHost = this.state.players[senderId]?.isHost || this.state.playerOrder[0] === senderId;
		if (!isHost || this.state.status !== 'LOBBY') {
			return;
		}
		this.state.allowDeadlock = Boolean(enabled);
		this.broadcastState();
	}

	handleTimerExpired(senderId: string, conn: Party.Connection) {
		if (this.state.status !== 'PLAYING' || this.state.timerDuration === 0) return;
		if (this.state.turnPlayerId !== senderId && senderId !== '') return;

		const player = this.state.players[this.state.turnPlayerId];
		if (!player) return;

		player.invalidAttempts = 0;
		player.consecutivePasses = (player.consecutivePasses || 0) + 1;
		this.state.consecutivePasses++;
		this.state.draftPlacements = [];

		this.state.moveHistory.unshift({
			id: `timeout_${Date.now()}`,
			playerId: player.id,
			playerName: player.name,
			type: 'PASS',
			totalScore: 0,
			timestamp: Date.now()
		});

		for (const c of this.party.getConnections()) {
			this.sendNotification(
				c,
				`⏱️ ${player.name}'s time is up! Turn passed.`,
				'warning'
			);
		}

		if (this.state.allowDeadlock) {
			const maxPasses = this.state.tileBag.length === 0 ? 2 : 6;
			if (this.state.consecutivePasses >= maxPasses) {
				this.finishGame(null);
				this.broadcastState();
				return;
			}
		}

		this.switchTurn();
		this.broadcastState();
	}

	handleSendEmote(emote: string, senderId: string, conn: Party.Connection) {
		const player = this.state.players[senderId];
		if (!player) return;

		const msg: ServerMessage = {
			type: 'EMOTE_EVENT',
			playerId: player.id,
			playerName: player.name,
			emote: emote.slice(0, 30)
		};

		for (const c of this.party.getConnections()) {
			c.send(JSON.stringify(msg));
		}
	}

	handleStartGame(senderId: string, conn: Party.Connection) {
		const isHost = this.state.players[senderId]?.isHost || this.state.playerOrder[0] === senderId;
		if (!isHost) {
			this.sendError(conn, 'Only host can start the game.');
			return;
		}

		if (this.state.playerOrder.length < 2) {
			this.sendError(conn, 'Waiting for Player 2 to join.');
			return;
		}

		// Initialize clean game state
		const bag = createFreshTileBag();
		this.state.board = createEmptyBoard();
		this.state.tileBag = bag;
		this.state.consecutivePasses = 0;
		this.state.moveHistory = [];
		this.state.winnerId = null;
		this.state.draftPlacements = [];
		this.state.status = 'PLAYING';

		// Deal 7 tiles to each player
		for (const pid of this.state.playerOrder) {
			this.state.players[pid].rack = this.drawTiles(RACK_CAPACITY);
			this.state.players[pid].score = 0;
			this.state.players[pid].consecutivePasses = 0;
			this.state.players[pid].invalidAttempts = 0;
		}

		this.state.remainingBagCount = this.state.tileBag.length;
		this.state.turnPlayerId = this.state.playerOrder[0];
		this.state.turnStartTime = Date.now();
		this.state.lastMoveTime = Date.now();

		this.broadcastState();
	}

	handlePlayMove(placements: PlacedTileMove[], senderId: string, conn: Party.Connection) {
		if (this.state.status !== 'PLAYING') {
			this.sendError(conn, 'Game is not active.');
			return;
		}

		if (this.state.turnPlayerId !== senderId) {
			this.sendError(conn, "It's not your turn!");
			return;
		}

		const player = this.state.players[senderId];
		if (!player) return;

		this.state.draftPlacements = [];

		// Check if board has any locked tiles to determine if it's the first move
		const isFirstMove = !this.state.board.some((row) => row.some((cell) => cell.isLocked));

		// Verify player actually holds these tiles in their rack
		const rackCopy = [...player.rack];
		for (const p of placements) {
			const index = rackCopy.findIndex((t) =>
				p.tile.isBlank ? t.isBlank : t.letter === p.tile.letter
			);
			if (index === -1) {
				this.sendError(conn, `Missing tile "${p.tile.letter}" in rack.`);
				return;
			}
			rackCopy.splice(index, 1);
		}

		// Run Scrabble validation and scoring
		const result = validateAndScoreMove(
			this.state.board,
			placements,
			this.dictionary,
			isFirstMove
		);

		// 1-Strike Rule: If move is invalid, immediately pass turn to opponent
		if (!result.valid) {
			player.invalidAttempts = 0;
			this.state.consecutivePasses = 0;

			this.state.moveHistory.unshift({
				id: `invalid_${Date.now()}`,
				playerId: player.id,
				playerName: player.name,
				type: 'PASS',
				totalScore: 0,
				timestamp: Date.now()
			});

			for (const c of this.party.getConnections()) {
				this.sendNotification(
					c,
					`❌ ${result.error || 'Invalid move'} — Turn passed!`,
					'warning'
				);
			}

			this.switchTurn();
			this.broadcastState();
			return;
		}

		// Reset consecutive passes on valid move
		player.consecutivePasses = 0;
		this.state.consecutivePasses = 0;

		// Apply move to board
		for (const p of placements) {
			const finalLetter = p.tile.isBlank ? (p.tile.assignedLetter?.toUpperCase() || 'A') : p.tile.letter.toUpperCase();
			const placedTile: ScrabbleTile = {
				id: p.tile.id,
				letter: finalLetter,
				value: p.tile.isBlank ? 0 : p.tile.value,
				isBlank: p.tile.isBlank,
				assignedLetter: p.tile.assignedLetter
			};

			this.state.board[p.row][p.col] = {
				...this.state.board[p.row][p.col],
				tile: placedTile,
				isLocked: true
			};
		}

		// Update Player Rack: remove used tiles and draw replacements
		player.rack = rackCopy;
		const neededTiles = RACK_CAPACITY - player.rack.length;
		const newTiles = this.drawTiles(neededTiles);
		player.rack.push(...newTiles);

		// Update player score
		player.score += result.totalScore;
		this.state.remainingBagCount = this.state.tileBag.length;

		// Add to move history
		const wordsSummary = result.words.map((w) => ({ word: w.word, score: w.score }));
		const wordsListStr = result.words.map((w) => w.word).join(', ');
		this.state.moveHistory.unshift({
			id: `move_${Date.now()}`,
			playerId: player.id,
			playerName: player.name,
			type: 'PLAY',
			words: wordsSummary,
			totalScore: result.totalScore,
			timestamp: Date.now()
		});

		// Notify players of the move
		const successMessage = result.isBingo
			? `🎉 BINGO! ${player.name} played "${wordsListStr}" (+${result.totalScore} pts)`
			: `${player.name} played "${wordsListStr}" (+${result.totalScore} pts)`;

		for (const c of this.party.getConnections()) {
			this.sendNotification(c, successMessage, 'success');
		}

		// Check Game End Condition: Tile bag is empty and one player used all tiles
		if (this.state.tileBag.length === 0 && player.rack.length === 0) {
			this.finishGame(player.id);
		} else {
			this.switchTurn();
		}

		this.broadcastState();
	}

	handlePassTurn(senderId: string, conn: Party.Connection) {
		if (this.state.status !== 'PLAYING' || this.state.turnPlayerId !== senderId) {
			this.sendError(conn, 'Cannot pass right now.');
			return;
		}

		const player = this.state.players[senderId];
		player.invalidAttempts = 0;
		player.consecutivePasses++;
		this.state.consecutivePasses++;
		this.state.draftPlacements = [];

		this.state.moveHistory.unshift({
			id: `pass_${Date.now()}`,
			playerId: player.id,
			playerName: player.name,
			type: 'PASS',
			totalScore: 0,
			timestamp: Date.now()
		});

		if (this.state.allowDeadlock) {
			const maxPasses = this.state.tileBag.length === 0 ? 2 : 6;
			if (this.state.consecutivePasses >= maxPasses) {
				this.finishGame(null);
				this.broadcastState();
				return;
			}
		}

		this.switchTurn();
		this.broadcastState();
	}

	handleSwapTiles(tileIds: string[], senderId: string, conn: Party.Connection) {
		if (this.state.status !== 'PLAYING' || this.state.turnPlayerId !== senderId) {
			this.sendError(conn, 'Cannot swap tiles right now.');
			return;
		}

		if (this.state.tileBag.length < 7) {
			this.sendError(conn, 'Need ≥7 tiles in bag to swap.');
			return;
		}

		const player = this.state.players[senderId];
		player.invalidAttempts = 0;
		this.state.draftPlacements = [];

		if (!tileIds || tileIds.length === 0 || tileIds.length > player.rack.length) {
			this.sendError(conn, 'Invalid tile selection.');
			return;
		}

		// Separate swapped tiles
		const remainingRack: ScrabbleTile[] = [];
		const tilesToReturn: ScrabbleTile[] = [];

		for (const t of player.rack) {
			if (tileIds.includes(t.id)) {
				tilesToReturn.push(t);
			} else {
				remainingRack.push(t);
			}
		}

		if (tilesToReturn.length !== tileIds.length) {
			this.sendError(conn, 'Selected tiles not found in rack.');
			return;
		}

		// Draw new tiles first, then put old tiles back in bag & shuffle
		const newTiles = this.drawTiles(tilesToReturn.length);
		player.rack = [...remainingRack, ...newTiles];

		this.state.tileBag.push(...tilesToReturn);
		this.shuffleBag();
		this.state.remainingBagCount = this.state.tileBag.length;

		this.state.moveHistory.unshift({
			id: `swap_${Date.now()}`,
			playerId: player.id,
			playerName: player.name,
			type: 'SWAP',
			swappedCount: tilesToReturn.length,
			totalScore: 0,
			timestamp: Date.now()
		});

		this.switchTurn();
		this.broadcastState();
	}

	handleRestartGame(senderId: string, conn: Party.Connection) {
		const isHost = this.state.players[senderId]?.isHost || this.state.playerOrder[0] === senderId;
		if (!isHost) {
			this.sendError(conn, 'Only host can restart the game.');
			return;
		}
		this.handleStartGame(senderId, conn);
	}

	switchTurn() {
		const order = this.state.playerOrder;
		if (order.length < 2) return;
		const currentIndex = order.indexOf(this.state.turnPlayerId);
		const nextIndex = (currentIndex + 1) % order.length;
		this.state.turnPlayerId = order[nextIndex];
		this.state.turnStartTime = Date.now();
		this.state.lastMoveTime = Date.now();
		this.state.draftPlacements = [];

		for (const p of Object.values(this.state.players)) {
			p.invalidAttempts = 0;
		}
	}

	drawTiles(count: number): ScrabbleTile[] {
		const drawn: ScrabbleTile[] = [];
		for (let i = 0; i < count; i++) {
			if (this.state.tileBag.length === 0) break;
			const tile = this.state.tileBag.pop()!;
			drawn.push(tile);
		}
		return drawn;
	}

	shuffleBag() {
		const bag = this.state.tileBag;
		for (let i = bag.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[bag[i], bag[j]] = [bag[j], bag[i]];
		}
	}

	finishGame(finisherId: string | null) {
		this.state.status = 'FINISHED';
		this.state.draftPlacements = [];

		// Scrabble end-game scoring adjustment
		if (finisherId) {
			let unplayedTotal = 0;
			for (const pid of this.state.playerOrder) {
				if (pid !== finisherId) {
					const remainingSum = this.state.players[pid].rack.reduce((sum, t) => sum + t.value, 0);
					this.state.players[pid].score = Math.max(0, this.state.players[pid].score - remainingSum);
					unplayedTotal += remainingSum;
				}
			}
			this.state.players[finisherId].score += unplayedTotal;
		}

		// Determine winner
		let highestScore = -1;
		let winner: string | null = null;
		for (const pid of this.state.playerOrder) {
			const p = this.state.players[pid];
			if (p.score > highestScore) {
				highestScore = p.score;
				winner = p.id;
			}
		}
		this.state.winnerId = winner;
	}

	broadcastState() {
		this.state.remainingBagCount = this.state.tileBag.length;

		for (const conn of this.party.getConnections()) {
			const playerId = (conn.state?.playerId as string) || this.connPlayerMap.get(conn.id) || '';
			this.syncSender(conn, playerId);
		}
	}

	syncSender(conn: Party.Connection, forPlayerId: string) {
		// Clone state to sanitize opponent's secret rack tiles
		const sanitizedState: GameState = {
			...this.state,
			tileBag: [], // Hide remaining bag letters from client inspection
			players: {}
		};

		for (const [pid, player] of Object.entries(this.state.players)) {
			sanitizedState.players[pid] = {
				...player,
				rack: pid === forPlayerId
					? player.rack
					: player.rack.map((t) => ({ id: t.id, letter: '?', value: 0 }))
			};
		}

		const msg: ServerMessage = {
			type: 'SYNC_STATE',
			state: sanitizedState,
			yourPlayerId: forPlayerId
		};

		conn.send(JSON.stringify(msg));
	}

	sendError(conn: Party.Connection, message: string) {
		const msg: ServerMessage = { type: 'ERROR', message };
		conn.send(JSON.stringify(msg));
	}

	sendNotification(conn: Party.Connection, message: string, toastType: 'info' | 'success' | 'warning' | 'error' = 'info') {
		const msg: ServerMessage = { type: 'NOTIFICATION', message, toastType };
		conn.send(JSON.stringify(msg));
	}
}

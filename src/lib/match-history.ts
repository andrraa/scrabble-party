export interface RecentMatch {
	id: string;
	timestamp: number;
	roomCode: string;
	player1: { name: string; score: number };
	player2: { name: string; score: number };
	winnerName: string | null;
	isTie: boolean;
}

const STORAGE_KEY = 'scrabble_recent_matches';

export function getRecentMatches(): RecentMatch[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveMatchResult(match: RecentMatch): void {
	if (typeof window === 'undefined') return;
	try {
		const list = getRecentMatches();
		if (list.some((m) => m.id === match.id)) return;
		const updated = [match, ...list].slice(0, 10);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	} catch (e) {
		console.error('Failed to save match history:', e);
	}
}

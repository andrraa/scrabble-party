import PartySocket from 'partysocket';
import type { ClientMessage, ServerMessage } from '../types';

export function getCleanPartyHost(): string {
	let rawHost = (import.meta.env.PUBLIC_PARTYKIT_HOST as string | undefined)?.trim();

	if (!rawHost) {
		if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
			return 'localhost:1999';
		}
		// Default to your deployed Cloudflare Worker
		return 'scrabble-party.andrra-cloudflare.workers.dev';
	}

	// Remove protocol (http:// or https:// or ws:// or wss://) and trailing slashes
	return rawHost.replace(/^(https?:\/\/|wss?:\/\/)/i, '').replace(/\/+$/, '');
}

export function createGameSocket(
	roomCode: string,
	onMessage: (msg: ServerMessage) => void,
	onOpen?: () => void,
	onClose?: () => void
): PartySocket {
	const host = getCleanPartyHost();

	const socket = new PartySocket({
		host,
		room: roomCode.toUpperCase()
	});

	socket.addEventListener('message', (event) => {
		try {
			const data = JSON.parse(event.data) as ServerMessage;
			onMessage(data);
		} catch (err) {
			console.error('Error parsing server message:', err);
		}
	});

	if (onOpen) {
		socket.addEventListener('open', onOpen);
	}

	if (onClose) {
		socket.addEventListener('close', onClose);
	}

	return socket;
}

export function sendSocketMessage(socket: PartySocket, msg: ClientMessage) {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(msg));
	}
}

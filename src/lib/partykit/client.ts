import PartySocket from 'partysocket';
import type { ClientMessage, ServerMessage } from '../types';

export function createGameSocket(
	roomCode: string,
	onMessage: (msg: ServerMessage) => void,
	onOpen?: () => void,
	onClose?: () => void
): PartySocket {
	const host =
		import.meta.env.PUBLIC_PARTYKIT_HOST ||
		(typeof window !== 'undefined' && window.location.hostname === 'localhost'
			? 'localhost:1999'
			: 'scrabble-party.username.partykit.dev');

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

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import ScrabbleServer from './index';
import type * as Party from 'partykit/server';

const PORT = parseInt(process.env.PORT || '1999', 10);

// In-memory rooms
const rooms = new Map<string, { server: ScrabbleServer; connections: Set<Party.Connection> }>();

function getOrCreateRoom(roomId: string) {
	const normalizedId = roomId.toUpperCase();
	if (rooms.has(normalizedId)) {
		return rooms.get(normalizedId)!;
	}

	const connections = new Set<Party.Connection>();

	const mockParty: Party.Party = {
		id: normalizedId,
		name: 'main',
		env: {},
		storage: {} as any,
		getConnections: () => connections.values(),
		getConnection: (id: string) => [...connections].find((c) => c.id === id),
		broadcast: (msg: string, without?: string[]) => {
			for (const c of connections) {
				if (!without || !without.includes(c.id)) {
					c.send(msg);
				}
			}
		},
		context: {} as any
	};

	const server = new ScrabbleServer(mockParty);
	const roomObj = { server, connections };
	rooms.set(normalizedId, roomObj);
	return roomObj;
}

const httpServer = createServer((req, res) => {
	// Enable CORS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', '*');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.url === '/' || req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'ok', activeRooms: rooms.size, service: 'Scrabble Party Realtime' }));
		return;
	}

	res.writeHead(404);
	res.end('Not Found');
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
	const url = new URL(request.url || '', `http://${request.headers.host}`);
	// Path pattern: /parties/main/:roomId or /party/:roomId or /:roomId
	const segments = url.pathname.split('/').filter(Boolean);
	const roomId = segments[segments.length - 1] || 'DEFAULT';

	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit('connection', ws, request, roomId);
	});
});

wss.on('connection', (ws: WebSocket, request, roomId: string) => {
	const room = getOrCreateRoom(roomId);
	const connId = `conn_${Math.random().toString(36).slice(2, 9)}`;

	let connState: any = {};

	const connection: Party.Connection = {
		id: connId,
		socket: ws as any,
		state: connState,
		setState: (newState: any) => {
			connState = typeof newState === 'function' ? newState(connState) : { ...connState, ...newState };
			connection.state = connState;
		},
		send: (msg: string) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(msg);
			}
		},
		close: () => ws.close(),
		deserializeAttachment: () => null,
		serializeAttachment: () => {}
	};

	room.connections.add(connection);
	room.server.onConnect?.(connection, { request } as any);

	ws.on('message', (data) => {
		const messageStr = data.toString();
		room.server.onMessage(messageStr, connection);
	});

	ws.on('close', () => {
		room.connections.delete(connection);
		room.server.onClose?.(connection);
		if (room.connections.size === 0) {
			// Room clean up after 10 minutes of inactivity if desired
		}
	});

	ws.on('error', (err) => {
		console.error(`WebSocket error in room ${roomId}:`, err);
	});
});

httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`🎮 Scrabble Realtime WebSocket Server running on http://0.0.0.0:${PORT}`);
});

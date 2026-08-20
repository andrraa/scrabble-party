import ScrabbleServer from './party/index';
import type * as Party from 'partykit/server';

export class ScrabbleDurableObject implements DurableObject {
	state: DurableObjectState;
	server: ScrabbleServer;
	connections: Map<WebSocket, { id: string; state: any }> = new Map();

	constructor(state: DurableObjectState, env: any) {
		this.state = state;

		const mockParty: Party.Party = {
			id: 'ROOM',
			name: 'main',
			env,
			storage: {} as any,
			getConnections: () => {
				const conns: Party.Connection[] = [];
				for (const [ws, data] of this.connections.entries()) {
					conns.push(this.wrapConnection(ws, data));
				}
				return conns.values();
			},
			getConnection: (id: string) => {
				for (const [ws, data] of this.connections.entries()) {
					if (data.id === id) return this.wrapConnection(ws, data);
				}
				return undefined;
			},
			broadcast: (msg: string, without?: string[]) => {
				for (const [ws, data] of this.connections.entries()) {
					if (!without || !without.includes(data.id)) {
						if (ws.readyState === WebSocket.OPEN) {
							ws.send(msg);
						}
					}
				}
			},
			context: {} as any
		};

		this.server = new ScrabbleServer(mockParty);
	}

	wrapConnection(ws: WebSocket, data: { id: string; state: any }): Party.Connection {
		return {
			id: data.id,
			socket: ws as any,
			state: data.state,
			setState: (newState: any) => {
				data.state = typeof newState === 'function' ? newState(data.state) : { ...data.state, ...newState };
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
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const segments = url.pathname.split('/').filter(Boolean);
		const roomId = (segments[segments.length - 1] || 'ROOM').toUpperCase();
		this.server.party.id = roomId;
		this.server.state.code = roomId;

		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response(JSON.stringify({ status: 'ok', room: roomId }), {
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
			});
		}

		const pair = new WebSocketPair();
		const client = pair[0];
		const serverWs = pair[1];

		(serverWs as any).accept();

		const connData = { id: `conn_${Math.random().toString(36).slice(2, 9)}`, state: {} };
		this.connections.set(serverWs, connData);
		const conn = this.wrapConnection(serverWs, connData);

		this.server.onConnect?.(conn, { request } as any);

		serverWs.addEventListener('message', (event) => {
			const msgStr = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data as any);
			this.server.onMessage(msgStr, conn);
		});

		serverWs.addEventListener('close', () => {
			this.connections.delete(serverWs);
			this.server.onClose?.(conn);
		});

		serverWs.addEventListener('error', (err) => {
			this.connections.delete(serverWs);
		});

		return new Response(null, {
			status: 101,
			webSocket: client
		});
	}
}

export default {
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': '*'
				}
			});
		}

		const url = new URL(request.url);

		if (url.pathname === '/' || url.pathname === '/health') {
			return new Response(JSON.stringify({ status: 'ok', service: 'Scrabble Cloudflare Worker' }), {
				headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
			});
		}

		const segments = url.pathname.split('/').filter(Boolean);
		const roomId = (segments[segments.length - 1] || 'DEFAULT').toUpperCase();

		const id = env.SCRABBLE_ROOMS.idFromName(roomId);
		const roomObj = env.SCRABBLE_ROOMS.get(id);

		return roomObj.fetch(request);
	}
};

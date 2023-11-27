import { io, type Socket } from 'socket.io-client';

const PROD = true;

const BASE_URL = PROD ? '' : 'http://127.0.0.1:5003';
const socket = io(BASE_URL, { transports: ['websocket']});


const SERVER_CHANNELS = [
    'send-message',
    'stop-generating',
] as const;
type ServerChannel = (typeof SERVER_CHANNELS)[number];

const CLIENT_CHANNELS = [
    'config',
    'finish-generating',
    'update-message',
    'error',
] as const;
type ClientChannel = (typeof CLIENT_CHANNELS)[number];


type AckCallback = (...args: any[]) => void;

export function socketEmit(eventName: ServerChannel, ...args: any[]) {
	if (typeof args[args.length - 1] === 'function') {
		const ack: AckCallback = args.pop() as AckCallback;
		socket.emit(eventName, ...args, ack);
	} else {
		socket.emit(eventName, ...args);
	}
}

export async function socketOn(
	eventName: ClientChannel,
	listener: (...args: any[]) => void
): Promise<void> {
	socket.on(eventName, listener);
}

export async function socketOff(
	eventName: ClientChannel,
	listener?: (...args: any[]) => void
): Promise<void> {
	if (listener) {
		socket.off(eventName, listener);
	} else {
		socket.off(eventName);
	}
}

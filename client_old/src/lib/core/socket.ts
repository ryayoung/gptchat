import { io, type Socket as SocketIO } from 'socket.io-client';

export class Socket<ClientChannel extends string, ServerChannel extends string> {
    instance: SocketIO;

    constructor(...args: Parameters<typeof io>) {
        this.instance = io(...args);
    }

    on(eventName: ClientChannel, listener: (...args: any[]) => void) {
        this.instance.on(eventName, listener as any);
    }

    emit(eventName: ServerChannel, ...args: any[]) {
        if (typeof args[args.length - 1] === 'function') {
            const ack = args.pop() as (...args: any[]) => void;
            this.instance.emit(eventName, ...args, ack);
        } else {
            this.instance.emit(eventName, ...args);
        }
    }

    off(eventName: ClientChannel, listener?: (...args: any[]) => void) {
        if (listener) {
            this.instance.off(eventName, listener as any);
        } else {
            this.instance.off(eventName);
        }
    }
}

export default Socket;

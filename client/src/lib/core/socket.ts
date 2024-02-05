import { io, type Socket as SocketIO } from 'socket.io-client'

export class Socket<ClientChannel extends string, ServerChannel extends string> {
    instance: SocketIO

    constructor(...args: Parameters<typeof io>) {
        this.instance = io(...args)
    }

    on = (eventName: ClientChannel | 'connect' | 'disconnect', listener: (...args: any[]) => void) => {
        this.instance.on(eventName, listener)
    }

    emit = (eventName: ServerChannel, ...args: any[]) => {
        this.instance.emit(eventName, ...args)
    }

    off = (eventName: ClientChannel | 'connect' | 'disconnect', listener?: (...args: any[]) => void) => {
        this.instance.off(eventName, listener)
    }
}

export default Socket

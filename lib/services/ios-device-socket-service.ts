import * as net from "net";

export class IOSDeviceSocketService implements Mobile.IiOSDeviceSocketsService {
    private static sockets: { [id: string]: net.Socket; } = {};

    constructor() {
    }

    getSocket(deviceId: string): net.Socket {
        return IOSDeviceSocketService.sockets[deviceId];
    }

    addSocket(deviceId: string, socket: any): void {
        if (IOSDeviceSocketService.sockets[deviceId] === socket) {
            return;
        }

        console.log("cached socket");
        IOSDeviceSocketService.sockets[deviceId] = socket;
        socket.on("close", () => {
            console.log("delete cached socket");
            delete IOSDeviceSocketService.sockets[deviceId];
        });
    }

}

$injector.register("iOSDeviceSocketService", IOSDeviceSocketService);
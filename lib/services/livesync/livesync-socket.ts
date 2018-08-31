import * as net from "net";

class LiveSyncSocket extends net.Socket {
	public uid: string;
}

$injector.register("LiveSyncSocket", LiveSyncSocket, false);

import { Socket } from "net";

declare global {
	interface INetSocket extends Socket {
		uid?: string;
	}
}

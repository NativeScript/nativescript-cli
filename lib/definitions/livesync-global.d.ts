import * as stream from "stream";

declare global {
	interface IDuplexSocket extends stream.Duplex {
		uid?: string;
	}
}


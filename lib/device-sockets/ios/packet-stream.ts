import * as stream from "stream";

export class PacketStream extends stream.Transform {
	private buffer: Buffer;
	private offset: number;

	constructor(opts?: stream.TransformOptions) {
		super(opts);
	}

	public _transform(packet: any, encoding: string, done: Function): void {
		while (packet.length > 0) {
			if (!this.buffer) {
				// read length
				let length = packet.readInt32BE(0);
				this.buffer = new Buffer(length);
				this.offset = 0;
				packet = packet.slice(4);
			}

			packet.copy(this.buffer, this.offset);
			let copied = Math.min(this.buffer.length - this.offset, packet.length);
			this.offset += copied;
			packet = packet.slice(copied);

			if (this.offset === this.buffer.length) {
				this.push(this.buffer);
				this.buffer = undefined;
			}
		}
		done();
	}
}

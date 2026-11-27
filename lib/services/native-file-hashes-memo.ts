import * as path from "path";
import { injector } from "../common/yok";
import { INativeFileHashesMemo } from "../definitions/files-hash-service";

export class NativeFileHashesMemo implements INativeFileHashesMemo {
	private hashes = new Map<string, string>();

	public clear(): void {
		this.hashes.clear();
	}

	public remember(filePath: string, sha1: string): void {
		this.hashes.set(path.resolve(filePath), sha1);
	}

	public take(filePath: string): string | undefined {
		const key = path.resolve(filePath);
		const sha1 = this.hashes.get(key);
		this.hashes.delete(key);
		return sha1;
	}
}

injector.register("nativeFileHashesMemo", NativeFileHashesMemo);

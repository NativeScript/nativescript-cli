import { Client, Hash, Mode, Srp, util } from "@foxt/js-srp";
import * as crypto from "crypto";

export type SRPProtocol = "s2k" | "s2k_fo";

export interface ServerSRPInitRequest {
	a: string;
	accountName: string;
	protocols: SRPProtocol[];
}
export interface ServerSRPInitResponse {
	iteration: number;
	salt: string;
	protocol: "s2k" | "s2k_fo";
	b: string;
	c: string;
}
export interface ServerSRPCompleteRequest {
	accountName: string;
	c: string;
	m1: string;
	m2: string;
	rememberMe: boolean;
	trustTokens: string[];
}

let srp = new Srp(Mode.GSA, Hash.SHA256, 2048);
const stringToU8Array = (str: string) => new TextEncoder().encode(str);
const base64ToU8Array = (str: string) =>
	Uint8Array.from(Buffer.from(str, "base64"));
export class GSASRPAuthenticator {
	constructor(private username: string) {}
	private srpClient?: Client = undefined;

	private async derivePassword(
		protocol: "s2k" | "s2k_fo",
		password: string,
		salt: Uint8Array,
		iterations: number
	) {
		let passHash = new Uint8Array(
			await util.hash(srp.h, stringToU8Array(password))
		);
		if (protocol == "s2k_fo") {
			passHash = stringToU8Array(util.toHex(passHash));
		}

		let imported = await crypto.subtle.importKey(
			"raw",
			passHash,
			{ name: "PBKDF2" },
			false,
			["deriveBits"]
		);
		let derived = await crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				hash: { name: "SHA-256" },
				iterations,
				salt,
			},
			imported,
			256
		);

		return new Uint8Array(derived);
	}

	async getInit(): Promise<ServerSRPInitRequest> {
		if (this.srpClient) throw new Error("Already initialized");
		this.srpClient = await srp.newClient(
			stringToU8Array(this.username),
			// provide fake passsword because we need to get data from server
			new Uint8Array()
		);
		let a = Buffer.from(util.bytesFromBigint(this.srpClient.A)).toString(
			"base64"
		);
		return {
			a,
			protocols: ["s2k", "s2k_fo"],
			accountName: this.username,
		};
	}
	async getComplete(
		password: string,
		serverData: ServerSRPInitResponse
	): Promise<
		Pick<ServerSRPCompleteRequest, "m1" | "m2" | "c" | "accountName">
	> {
		if (!this.srpClient) throw new Error("Not initialized");
		if (serverData.protocol != "s2k" && serverData.protocol != "s2k_fo")
			throw new Error("Unsupported protocol " + serverData.protocol);
		let salt = base64ToU8Array(serverData.salt);
		let serverPub = base64ToU8Array(serverData.b);
		let iterations = serverData.iteration;
		let derived = await this.derivePassword(
			serverData.protocol,
			password,
			salt,
			iterations
		);
		this.srpClient.p = derived;
		await this.srpClient.generate(salt, serverPub);
		let m1 = Buffer.from(this.srpClient._M).toString("base64");
		let M2 = await this.srpClient.generateM2();
		let m2 = Buffer.from(M2).toString("base64");
		return {
			accountName: this.username,
			m1,
			m2,
			c: serverData.c,
		};
	}
}

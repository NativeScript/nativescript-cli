import { HostInfo } from "./host-info";

export class Helpers {
	constructor(private hostInfo: HostInfo) { }

	public getPropertyName(method: Function): string {
		if (method) {
			let match = method.toString().match(/(?:return\s+?.*\.(.+);)|(?:=>\s*?.*\.(.+)\b)/);
			if (match) {
				return (match[1] || match[2]).trim();
			}
		}

		return null;
	}

	public quoteString(value: string): string {
		if (!value) {
			return value;
		}

		return this.hostInfo.isWindows ? this.cmdQuote(value) : this.bashQuote(value);
	}

	private bashQuote(s: string): string {
		if (s[0] === "'" && s[s.length - 1] === "'") {
			return s;
		}
		// replace ' with '"'"' and wrap in ''
		return "'" + s.replace(/'/g, '\'"\'"\'') + "'";
	}

	private cmdQuote(s: string): string {
		if (s[0] === '"' && s[s.length - 1] === '"') {
			return s;
		}
		// replace " with \" and wrap in ""
		return '"' + s.replace(/"/g, '\\"') + '"';
	}
}

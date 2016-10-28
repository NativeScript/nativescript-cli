import { platform } from "os";

export class Helpers {
	public quoteString(value: string): string {
		if (!value) {
			return value;
		}

		return (platform() === "win32") ? this.cmdQuote(value) : this.bashQuote(value);
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

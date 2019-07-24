import { HostInfo } from "./host-info";

export class Helpers {
	constructor(private hostInfo: HostInfo) { }

	public getPropertyName(method: Function): string {
		if (method) {
			const match = method.toString().match(/(?:return\s+?.*\.(.+);)|(?:=>\s*?.*\.(.+)\b)/);
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

	/**
	 * Appends zeroes to a version string until it reaches a specified length.
	 * @param {string} version The version on which to append zeroes.
	 * @param {number} requiredVersionLength The required length of the version string.
	 * @returns {string} Appended version string. In case input is null, undefined or empty string, it is returned immediately without appending anything.
	 */
	public appendZeroesToVersion(version: string, requiredVersionLength: number): string {
		if (version) {
			const zeroesToAppend = requiredVersionLength - version.split(".").length;
			for (let index = 0; index < zeroesToAppend; index++) {
				version += ".0";
			}
		}

		return version;
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

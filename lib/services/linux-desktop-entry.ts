/**
 * Desktop integration files of Linux builds: the desktop entry, AppStream
 * metainfo and install.sh, filled from App_Resources/Linux templates.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/** Reverse-DNS style id; it names files (`<id>.desktop`) and the install folder. */
const APP_ID = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/;

export function assertLinuxAppId(appId: string): void {
	if (!appId || !APP_ID.test(appId)) {
		throw new Error(
			`Invalid Linux app id '${appId ?? ""}': set "id" (or "linux.id") in nativescript.config to a reverse-DNS name such as org.example.MyApp.`,
		);
	}
}

/** A desktop entry string value: no line breaks, so it can't start new keys. */
export function desktopString(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t")
		.replace(/^ /, "\\s");
}

/** A quoted `Exec=` argument (Desktop Entry spec: quoting, then string escapes, `%%` for `%`). */
export function desktopExecArg(value: string): string {
	if (/[\r\n]/.test(value)) {
		throw new Error(`The path ${JSON.stringify(value)} has a line break.`);
	}
	const quoted = value.replace(/["`$\\]/g, "\\$&");
	return `"${desktopString(quoted).replace(/%/g, "%%")}"`;
}

export function xmlEscape(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&apos;",
			})[c],
	);
}

/** Replaces `__KEY__` placeholders with already escaped values. */
export function fillTemplate(
	template: string,
	values: Record<string, string>,
): string {
	return Object.entries(values).reduce(
		(text, [key, value]) => text.split(`__${key}__`).join(value),
		template,
	);
}

/** A POSIX shell single-quoted word. */
export function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Marks entries written by debug runs. */
export const DEBUG_ENTRY_KEY = "X-NativeScript-Debug";

export function xdgDataHome(): string {
	const value = process.env.XDG_DATA_HOME;
	return value && path.isAbsolute(value)
		? value
		: path.join(os.homedir(), ".local", "share");
}

/** Installs a debug build's desktop entry and icons; never replaces an entry it didn't write. */
export function installDebugDesktopEntry(
	stage: string,
	appId: string,
	dataHome: string = xdgDataHome(),
): boolean {
	assertLinuxAppId(appId);
	const source = path.join(stage, `${appId}.desktop`);
	if (!fs.existsSync(source)) {
		return false;
	}
	const entry = fs.readFileSync(source, "utf8");
	if (entry.includes("__EXEC__")) {
		return false;
	}
	const applications = path.join(dataHome, "applications");
	const destination = path.join(applications, `${appId}.desktop`);
	if (
		fs.existsSync(destination) &&
		!fs
			.readFileSync(destination, "utf8")
			.split(/\r?\n/)
			.includes(`${DEBUG_ENTRY_KEY}=true`)
	) {
		return false;
	}
	// before any action groups
	const group = /^\[Desktop Entry\][^\S\n]*$/m;
	const marked = group.test(entry)
		? entry.replace(group, (header) => `${header}\n${DEBUG_ENTRY_KEY}=true`)
		: `[Desktop Entry]\n${DEBUG_ENTRY_KEY}=true\n${entry}`;
	fs.mkdirSync(applications, { recursive: true });
	const temp = `${destination}.${process.pid}.tmp`;
	fs.writeFileSync(temp, marked);
	fs.renameSync(temp, destination);

	const icons = path.join(stage, "icons");
	if (fs.existsSync(icons)) {
		fs.cpSync(icons, path.join(dataHome, "icons"), { recursive: true });
	}
	return true;
}

/**
 * install.sh of release packages: copies the app into $XDG_DATA_HOME/<id> and
 * fills the desktop entry's `__EXEC__` with the quoted executable path.
 */
export function installScript(appId: string, name: string): string {
	assertLinuxAppId(appId);
	return [
		"#!/bin/sh",
		"# Installs the app for the current user (~/.local).",
		"set -e",
		`id=${shellQuote(appId)}`,
		`name=${shellQuote(name)}`,
		'src="$(cd "$(dirname "$0")" && pwd)"',
		'data="${XDG_DATA_HOME:-$HOME/.local/share}"',
		'dest="$data/$id"',
		'case "$dest" in *"',
		'"*) echo "Unsupported install path: $dest" >&2; exit 1 ;; esac',
		'rm -rf "$dest" && mkdir -p "$dest" "$data/applications" "$data/icons"',
		'cp -r "$src/." "$dest/"',
		// Exec= quoting, then desktop string escapes; awk replaces literally
		"exec_arg=\"\\\"$(printf '%s' \"$dest/$name\" | sed -e 's/[\\\\\"`$]/\\\\&/g' -e 's/\\\\/\\\\\\\\/g' -e 's/%/%%/g')\\\"\"",
		`NS_EXEC="$exec_arg" awk '{ s = $0; out = ""; while ((i = index(s, "__EXEC__")) > 0) { out = out substr(s, 1, i - 1) ENVIRON["NS_EXEC"]; s = substr(s, i + 8) } print out s }' "$src/$id.desktop" > "$data/applications/$id.desktop"`,
		'[ -d "$src/icons" ] && cp -r "$src/icons/." "$data/icons/"',
		'echo "Installed $name to $dest"',
		"",
	].join("\n");
}

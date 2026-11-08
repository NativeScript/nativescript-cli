import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { assert } from "chai";
import {
	assertLinuxAppId,
	DEBUG_ENTRY_KEY,
	desktopExecArg,
	desktopString,
	fillTemplate,
	installDebugDesktopEntry,
	installScript,
	xmlEscape,
} from "../../lib/services/linux-desktop-entry";

describe("linuxDesktopEntry", () => {
	it("rejects app ids that aren't file names", () => {
		for (const id of ["", "../evil", "a/b", "a b", "a\nb", ".a", "a..b"]) {
			assert.throws(() => assertLinuxAppId(id), /Invalid Linux app id/);
		}
		assertLinuxAppId("org.nativescript.my_app-1");
	});

	it("keeps values on one line", () => {
		assert.equal(desktopString("My\nExec=evil\\"), "My\\nExec=evil\\\\");
	});

	it("quotes Exec arguments", () => {
		assert.equal(desktopExecArg("/home/a b/app"), '"/home/a b/app"');
		assert.equal(
			desktopExecArg('/x/100%/$HOME/"q"/b\\s'),
			'"/x/100%%/\\\\$HOME/\\\\"q\\\\"/b\\\\\\\\s"',
		);
		assert.throws(() => desktopExecArg("/a\nb"));
	});

	it("escapes XML", () => {
		assert.equal(
			fillTemplate("<name>__APP_NAME__</name>", {
				APP_NAME: xmlEscape(`A & <b> "'`),
			}),
			"<name>A &amp; &lt;b&gt; &quot;&apos;</name>",
		);
	});

	it("installs with a quoted Exec and no shell injection", () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), "ns-linux-install-"));
		try {
			const src = path.join(root, "pkg");
			const data = path.join(root, "data 100%");
			const name = `My $(touch pwned) 'App'`;
			fs.mkdirSync(src);
			fs.writeFileSync(
				path.join(src, "install.sh"),
				installScript("org.x.app", name),
			);
			fs.writeFileSync(
				path.join(src, "org.x.app.desktop"),
				"[Desktop Entry]\nExec=__EXEC__ %U\n",
			);
			const out = execFileSync("sh", [path.join(src, "install.sh")], {
				cwd: root,
				env: { ...process.env, XDG_DATA_HOME: data },
			}).toString();
			assert.include(out, `Installed ${name}`);
			assert.isFalse(fs.existsSync(path.join(root, "pwned")));
			const exe = path.join(data, "org.x.app", name);
			assert.equal(
				fs.readFileSync(
					path.join(data, "applications", "org.x.app.desktop"),
					"utf8",
				),
				`[Desktop Entry]\nExec=${desktopExecArg(exe)} %U\n`,
			);
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	describe("installDebugDesktopEntry", () => {
		let root: string;
		let stage: string;
		let data: string;
		const installed = () =>
			fs.readFileSync(
				path.join(data, "applications", "org.x.app.desktop"),
				"utf8",
			);

		beforeEach(() => {
			root = fs.mkdtempSync(path.join(os.tmpdir(), "ns-linux-debug-entry-"));
			stage = path.join(root, "stage");
			data = path.join(root, "data");
			fs.mkdirSync(path.join(stage, "icons", "hicolor", "512x512", "apps"), {
				recursive: true,
			});
			fs.writeFileSync(
				path.join(
					stage,
					"icons",
					"hicolor",
					"512x512",
					"apps",
					"org.x.app.png",
				),
				"png",
			);
		});

		afterEach(() => {
			fs.rmSync(root, { recursive: true, force: true });
		});

		it("installs the entry, marked as a debug entry, and its icons", () => {
			fs.writeFileSync(
				path.join(stage, "org.x.app.desktop"),
				'[Desktop Entry]\nName=App\nExec="/s/app"\n\n[Desktop Action new]\nName=New\n',
			);
			assert.isTrue(installDebugDesktopEntry(stage, "org.x.app", data));
			assert.equal(
				installed(),
				`[Desktop Entry]\n${DEBUG_ENTRY_KEY}=true\nName=App\nExec="/s/app"\n\n[Desktop Action new]\nName=New\n`,
			);
			assert.isTrue(
				fs.existsSync(
					path.join(
						data,
						"icons",
						"hicolor",
						"512x512",
						"apps",
						"org.x.app.png",
					),
				),
			);
		});

		it("replaces its own entry on later runs", () => {
			const entry = path.join(stage, "org.x.app.desktop");
			fs.writeFileSync(entry, "[Desktop Entry]\nName=Old\n");
			installDebugDesktopEntry(stage, "org.x.app", data);
			fs.writeFileSync(entry, "[Desktop Entry]\nName=New\n");
			assert.isTrue(installDebugDesktopEntry(stage, "org.x.app", data));
			assert.equal(
				installed(),
				`[Desktop Entry]\n${DEBUG_ENTRY_KEY}=true\nName=New\n`,
			);
		});

		it("leaves an installed release entry alone", () => {
			fs.mkdirSync(path.join(data, "applications"), { recursive: true });
			const release =
				'[Desktop Entry]\nName=App\nExec="/home/u/.local/share/org.x.app/app"\n';
			fs.writeFileSync(
				path.join(data, "applications", "org.x.app.desktop"),
				release,
			);
			fs.writeFileSync(
				path.join(stage, "org.x.app.desktop"),
				'[Desktop Entry]\nName=App\nExec="/s/app"\n',
			);
			assert.isFalse(installDebugDesktopEntry(stage, "org.x.app", data));
			assert.equal(installed(), release);
		});

		it("skips release stages and stages without an entry", () => {
			assert.isFalse(installDebugDesktopEntry(stage, "org.x.app", data));
			fs.writeFileSync(
				path.join(stage, "org.x.app.desktop"),
				"[Desktop Entry]\nExec=__EXEC__\n",
			);
			assert.isFalse(installDebugDesktopEntry(stage, "org.x.app", data));
			assert.isFalse(fs.existsSync(path.join(data, "applications")));
		});

		it("rejects app ids that aren't file names", () => {
			assert.throws(
				() => installDebugDesktopEntry(stage, "../evil", data),
				/Invalid Linux app id/,
			);
		});
	});
});

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import { assert } from "chai";
import {
	assertLinuxAppId,
	desktopExecArg,
	desktopString,
	fillTemplate,
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
});

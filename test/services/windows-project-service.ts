import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import { WindowsProjectService } from "../../lib/services/windows-project-service";
import { injector } from "../../lib/common/yok";
import * as stubs from "../stubs";

// Native sources on Windows: C# files under App_Resources/Windows and a plugin's
// platforms/windows are staged into the platform project, where the template's SDK-style csproj
// compiles them into the app (the counterpart of App_Resources/Android/src, App_Resources/iOS/src
// and plugins' platforms/android|ios sources).

const projectName = "TestApp";

// The subset of IFileSystem the Windows project service uses, backed by the real file system.
const realFs = <any>{
	exists: (p: string) => fs.existsSync(p),
	ensureDirectoryExists: (p: string) => fs.mkdirSync(p, { recursive: true }),
	copyFile: (from: string, to: string) => {
		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.copyFileSync(from, to);
	},
	writeFile: (p: string, content: string) => {
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, content);
	},
	writeJson: (p: string, value: any) => fs.writeFileSync(p, JSON.stringify(value)),
	deleteDirectory: (p: string) => fs.rmSync(p, { recursive: true, force: true }),
};

function write(file: string, content = "") {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

describe("WindowsProjectService native sources", () => {
	let root: string;
	let projectDir: string;
	let projectData: any;
	let service: WindowsProjectService;
	let appProjectDir: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "ns-windows-project-"));
		projectDir = path.join(root, "app");
		fs.mkdirSync(projectDir);
		projectData = {
			projectDir,
			projectName,
			projectId: "org.nativescript.testapp",
			projectIdentifiers: { windows: "org.nativescript.testapp" },
			platformsDir: path.join(projectDir, "platforms"),
			nsConfig: {},
		};
		const projectDataService = <any>{
			getRuntimePackage: () => ({ name: "@nativescript/windows", version: "0.1.0" }),
		};
		service = new WindowsProjectService(
			realFs,
			projectDataService,
			<any>{},
			new stubs.LoggerStub(),
			<any>{},
			<any>{},
		);
		appProjectDir = path.join(projectData.platformsDir, "windows", projectName);
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	function plugin(name: string, files: Record<string, string>) {
		const fullPath = path.join(projectDir, "node_modules", ...name.split("/"));
		for (const [rel, content] of Object.entries(files)) {
			write(path.join(fullPath, "platforms", "windows", rel), content);
		}
		return <any>{ name, fullPath, nativescript: {} };
	}

	describe("preparePluginNativeCode", () => {
		it("stages C# sources into the app project, where the csproj compiles them", async () => {
			const p = plugin("test-plugin", {
				"src/Greeter.cs": "namespace TestPlugin { public class Greeter {} }",
				"src/index.js": "module.exports = {};",
				"lib/Native.dll": "dll",
			});
			await service.preparePluginNativeCode(p, projectData);

			const stage = path.join(appProjectDir, "plugins", "test-plugin");
			assert.isTrue(fs.existsSync(path.join(stage, "src", "Greeter.cs")));
			assert.isTrue(fs.existsSync(path.join(stage, "lib", "Native.dll")));
			assert.isFalse(fs.existsSync(path.join(stage, "src", "index.js")));
		});

		it("does not ship C# sources with the app", async () => {
			const p = plugin("test-plugin", {
				"src/Greeter.cs": "namespace TestPlugin { public class Greeter {} }",
				"lib/Native.dll": "dll",
			});
			await service.preparePluginNativeCode(p, projectData);

			const stage = path.join(appProjectDir, "plugins", "test-plugin");
			const props = fs.readFileSync(path.join(stage, "plugin.props"), "utf8");
			const targets = fs.readFileSync(path.join(stage, "plugin.targets"), "utf8");
			assert.include(props, "lib\\Native.dll");
			assert.notInclude(props, "Greeter.cs");
			assert.include(targets, "lib\\Native.dll");
			assert.notInclude(targets, "Greeter.cs");
		});

		it("stages scoped plugins under plugins/@scope/name", async () => {
			const p = plugin("@acme/native", { "src/Acme.cs": "namespace Acme { public class A {} }" });
			await service.preparePluginNativeCode(p, projectData);
			assert.isTrue(fs.existsSync(path.join(appProjectDir, "plugins", "@acme", "native", "src", "Acme.cs")));
		});

		it("drops sources a newer plugin version no longer has", async () => {
			const p = plugin("test-plugin", { "src/Old.cs": "class Old {}", "src/Kept.cs": "class Kept {}" });
			await service.preparePluginNativeCode(p, projectData);
			fs.rmSync(path.join(p.fullPath, "platforms", "windows", "src", "Old.cs"));
			await service.preparePluginNativeCode(p, projectData);

			const stage = path.join(appProjectDir, "plugins", "test-plugin", "src");
			assert.isFalse(fs.existsSync(path.join(stage, "Old.cs")));
			assert.isTrue(fs.existsSync(path.join(stage, "Kept.cs")));
		});
	});

	describe("prepareAppResources", () => {
		it("mirrors App_Resources/Windows, C# sources included", () => {
			write(path.join(projectDir, "App_Resources", "Windows", "src", "Fixtures.cs"), "class Fixtures {}");
			write(path.join(projectDir, "App_Resources", "Windows", "app.csproj"), "<Project />");
			service.prepareAppResources(projectData);

			const dest = path.join(appProjectDir, "App_Resources", "Windows");
			assert.isTrue(fs.existsSync(path.join(dest, "src", "Fixtures.cs")));
			assert.isTrue(fs.existsSync(path.join(dest, "app.csproj")));
		});

		it("removes C# sources deleted from App_Resources/Windows", () => {
			const src = path.join(projectDir, "App_Resources", "Windows", "src");
			write(path.join(src, "Gone.cs"), "class Gone {}");
			write(path.join(src, "Stays.cs"), "class Stays {}");
			service.prepareAppResources(projectData);
			fs.rmSync(path.join(src, "Gone.cs"));
			service.prepareAppResources(projectData);

			const dest = path.join(appProjectDir, "App_Resources", "Windows", "src");
			assert.isFalse(fs.existsSync(path.join(dest, "Gone.cs")));
			assert.isTrue(fs.existsSync(path.join(dest, "Stays.cs")));
		});
	});

	describe("prepareProject", () => {
		it("removes the staged sources of uninstalled plugins", async () => {
			const kept = plugin("kept-plugin", { "src/Kept.cs": "class Kept {}" });
			const scoped = plugin("@acme/kept", { "src/Acme.cs": "class Acme {}" });
			write(path.join(appProjectDir, "plugins", "removed-plugin", "src", "Removed.cs"), "class Removed {}");
			write(path.join(appProjectDir, "plugins", "@acme", "removed", "src", "Gone.cs"), "class Gone {}");

			injector.register("pluginsService", { getAllInstalledPlugins: async () => [kept, scoped] });
			await service.prepareProject(projectData, {});

			const plugins = path.join(appProjectDir, "plugins");
			assert.isTrue(fs.existsSync(path.join(plugins, "kept-plugin", "src", "Kept.cs")));
			assert.isTrue(fs.existsSync(path.join(plugins, "@acme", "kept", "src", "Acme.cs")));
			assert.isFalse(fs.existsSync(path.join(plugins, "removed-plugin")));
			assert.isFalse(fs.existsSync(path.join(plugins, "@acme", "removed")));
			const aggregate = fs.readFileSync(path.join(plugins, "Plugins.props"), "utf8");
			assert.include(aggregate, "kept-plugin\\plugin.props");
		});
	});
});

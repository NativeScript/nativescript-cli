import { assert } from "chai";
import { AppFilesUpdater } from "../lib/services/app-files-updater";
import * as yok from "../lib/common/yok";

require("should");

function createTestInjector(): IInjector {
	const testInjector = new yok.Yok();

	testInjector.register("projectData", { appResourcesDirectoryPath: "App_Resources"});

	return testInjector;
}

describe("App files cleanup", () => {
	class CleanUpAppFilesUpdater extends AppFilesUpdater {
		public deletedDestinationItems: string[] = [];

		constructor(
			public destinationFiles: string[],
			options: any
		) {
			super("<source>", "<destination>", options, null);
		}

		public clean() {
			this.cleanDestinationApp();
		}

		protected readDestinationDir(): string[] {
			return this.destinationFiles;
		}

		protected deleteDestinationItem(directoryItem: string): void {
			this.deletedDestinationItems.push(directoryItem);
		}
	}

	_.each([true, false], bundle => {
		it(`cleans up entire app when bundle is ${bundle}`, () => {
			const updater = new CleanUpAppFilesUpdater([
				"file1", "dir1/file2", "App_Resources/Android/blah.png"
			], { bundle });
			updater.clean();
			assert.deepEqual(["file1", "dir1/file2", "App_Resources/Android/blah.png"], updater.deletedDestinationItems);
		});
	});
});

describe("App files copy", () => {
	class CopyAppFilesUpdater extends AppFilesUpdater {
		public copiedDestinationItems: string[] = [];

		constructor(
			public sourceFiles: string[],
			options: any
		) {
			super("<source>", "<destination>", options, null);
		}

		protected readSourceDir(): string[] {
			return this.sourceFiles;
		}

		public copy(): void {
			const injector = createTestInjector();
			const projectData = <IProjectData>injector.resolve("projectData");
			this.copiedDestinationItems = this.resolveAppSourceFiles(projectData);
		}
	}

	it("copies all app files but app_resources when not bundling", () => {
		const updater = new CopyAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: false });
		updater.copy();
		assert.deepEqual(["file1", "dir1/file2"], updater.copiedDestinationItems);
	});

	it("skips copying files when bundling", () => {
		const updater = new CopyAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: true });
		updater.copy();
		assert.deepEqual([], updater.copiedDestinationItems);
	});
});

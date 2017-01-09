import { assert } from "chai";
import { AppFilesUpdater } from "../lib/services/app-files-updater";

require("should");

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

	it("cleans up entire app when not bundling", () => {
		const updater = new CleanUpAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: false });
		updater.clean();
		assert.deepEqual(["file1", "dir1/file2", "App_Resources/Android/blah.png"], updater.deletedDestinationItems);
	});

	it("does not clean up destination when bundling", () => {
		const updater = new CleanUpAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: true });
		updater.clean();
		assert.deepEqual([], updater.deletedDestinationItems);
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
			this.copiedDestinationItems = this.resolveAppSourceFiles();
		}
	}

	it("copies all app files when not bundling", () => {
		const updater = new CopyAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: false });
		updater.copy();
		assert.deepEqual(["file1", "dir1/file2", "App_Resources/Android/blah.png"], updater.copiedDestinationItems);
	});

	it("skips copying non-App_Resource files when bundling", () => {
		const updater = new CopyAppFilesUpdater([
			"file1", "dir1/file2", "App_Resources/Android/blah.png"
		], { bundle: true });
		updater.copy();
		assert.deepEqual(["App_Resources/Android/blah.png"], updater.copiedDestinationItems);
	});
});

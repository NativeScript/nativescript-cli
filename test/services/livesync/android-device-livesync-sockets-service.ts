import { assert } from "chai";
import { refreshesInPlaceOnSync } from "../../../lib/services/livesync/android-device-livesync-sockets-service";

describe("refreshesInPlaceOnSync", () => {
	it("refreshes an incremental sync", () => {
		assert.isTrue(
			refreshesInPlaceOnSync(
				{ isFullSync: false, useHotModuleReload: true },
				{ bundler: "webpack" },
			),
		);
		assert.isTrue(
			refreshesInPlaceOnSync(
				{ isFullSync: false, useHotModuleReload: false },
				{ bundler: "vite" },
			),
		);
	});

	it("never refreshes a full sync or a Vite HMR session", () => {
		assert.isFalse(
			refreshesInPlaceOnSync(
				{ isFullSync: true, useHotModuleReload: false },
				{ bundler: "webpack" },
			),
		);
		assert.isFalse(
			refreshesInPlaceOnSync(
				{ isFullSync: false, useHotModuleReload: true },
				{ bundler: "vite" },
			),
		);
	});
});

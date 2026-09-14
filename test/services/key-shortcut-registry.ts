import { assert } from "chai";
import { Injector } from "../../lib/common/di/injector";
import { KeyShortcutRegistryService } from "../../lib/services/key-shortcut-registry";
import {
	KeyContextBase,
	KeyShortcut,
	resolveShortcuts,
} from "../../lib/services/key-shortcuts";

const entry = (key: string, description: string): KeyShortcut => ({
	key,
	description,
	action: (): void => undefined,
});

const context = (): KeyContextBase => ({ injector: <Injector>(<any>{}) });

const keysOf = (registry: KeyShortcutRegistryService): string[] =>
	registry.entries().map((shortcut) => shortcut.key);

/** What a reader of the registry ends up dispatching, help entry aside. */
const resolvedDescriptions = (registry: KeyShortcutRegistryService): string[] =>
	resolveShortcuts(registry.entries(), context())
		.filter((shortcut) => shortcut.key !== "?")
		.map((shortcut) => shortcut.description);

describe("KeyShortcutRegistryService", () => {
	let registry: KeyShortcutRegistryService;

	beforeEach(() => {
		registry = new KeyShortcutRegistryService();
	});

	it("hands out every entry in registration order", () => {
		registry.add(entry("r", "Restart"), entry("w", "Watcher"));
		registry.add(entry("c", "Clean"));

		assert.deepEqual(keysOf(registry), ["r", "w", "c"]);
	});

	it("takes a batch out again when its handle is disposed", () => {
		const first = registry.add(entry("r", "Restart"));
		registry.add(entry("w", "Watcher"));

		first.dispose();

		assert.deepEqual(keysOf(registry), ["w"]);
	});

	it("lets a later registration shadow an earlier one for the same key", () => {
		registry.add(entry("r", "Restart"));
		registry.add(entry("r", "Restart with the debugger attached"));

		assert.deepEqual(resolvedDescriptions(registry), [
			"Restart with the debugger attached",
		]);
	});

	it("restores what a batch shadowed when it is disposed", () => {
		registry.add(entry("r", "Restart"));
		const shadowing = registry.add(entry("r", "Restart with the debugger"));

		shadowing.dispose();

		assert.deepEqual(resolvedDescriptions(registry), ["Restart"]);
	});

	it("does nothing on a second dispose", () => {
		const first = registry.add(entry("r", "Restart"));
		registry.add(entry("w", "Watcher"));

		first.dispose();
		first.dispose();

		assert.deepEqual(keysOf(registry), ["w"]);
	});

	it("disposes exactly what was registered, whatever the caller's array does", () => {
		const shortcuts = [entry("r", "Restart")];
		const registration = registry.add(...shortcuts);
		shortcuts.push(entry("w", "Watcher"));

		registration.dispose();

		assert.deepEqual(keysOf(registry), []);
	});
});

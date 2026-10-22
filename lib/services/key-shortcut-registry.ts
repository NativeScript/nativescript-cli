import {
	KeyShortcut,
	KeyShortcutRegistration,
	KeyShortcutRegistry,
} from "../common/contracts/key-shortcuts";
import { injector } from "../common/yok";

/**
 * Ordered storage, nothing more: the replace-by-key rule lives in the
 * resolution the engine runs, so a batch that shadowed a key exposes the entry
 * it shadowed simply by leaving the list.
 */
export class KeyShortcutRegistryService extends KeyShortcutRegistry {
	private batches: KeyShortcut[][] = [];

	public add(...shortcuts: KeyShortcut[]): KeyShortcutRegistration {
		// Copied so the handle disposes exactly what was registered, whatever the
		// caller does with its own array afterwards.
		const batch = shortcuts.slice();
		this.batches.push(batch);

		return {
			dispose: (): void => {
				const at = this.batches.indexOf(batch);
				if (at !== -1) {
					this.batches.splice(at, 1);
				}
			},
		};
	}

	public entries(): KeyShortcut[] {
		const entries: KeyShortcut[] = [];
		for (const batch of this.batches) {
			entries.push(...batch);
		}

		return entries;
	}
}

injector.register("keyShortcutRegistry", KeyShortcutRegistryService);

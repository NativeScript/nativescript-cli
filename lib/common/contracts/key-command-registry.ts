import { Contract } from "../di/contract";
import type { IKeyCommand, IValidKeyName } from "../definitions/key-commands";

/**
 * The key-command face of the injector facade (the `keyCommands.` namespace).
 * Kept separate from CommandRegistry because the two registries are redesigned
 * on different tracks.
 */
@Contract({ name: "keyCommandRegistry" })
export abstract class KeyCommandRegistry {
	abstract requireKeyCommand(name: IValidKeyName, file: string): void;
	abstract registerKeyCommand(name: IValidKeyName, resolver: any): void;
	abstract resolveKeyCommand(name: string): IKeyCommand;
	abstract getRegisteredKeyCommandsNames(): string[];
}

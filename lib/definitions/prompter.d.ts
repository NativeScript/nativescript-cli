import type { Prompter } from "../contracts/prompter";

declare global {
	/** @deprecated Kept so existing annotations compile; use the {@link Prompter} contract. */
	interface IPrompter extends Prompter {}
}

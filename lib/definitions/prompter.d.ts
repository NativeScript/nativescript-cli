import type { Prompter } from "../contracts/prompter";

declare global {
	interface IPrompter extends Prompter {}
}

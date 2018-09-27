import * as prompt from "inquirer";

declare global {
    interface IPrompter extends IDisposable {
        get(schemas: prompt.Question[]): Promise<any>;
        getPassword(prompt: string, options?: IAllowEmpty): Promise<string>;
        getString(prompt: string, options?: IPrompterOptions): Promise<string>;
        promptForChoice(promptMessage: string, choices: any[]): Promise<string>;
        confirm(prompt: string, defaultAction?: () => boolean): Promise<boolean>;
    }
}

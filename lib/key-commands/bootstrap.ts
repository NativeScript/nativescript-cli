import { SpecialKeys } from "../common/definitions/key-commands";
import { registerBuiltInCommand } from "../common/services/command-definition-adapter";
import { injector } from "../common/yok";

const path = "./key-commands/index";

injector.requireKeyCommand("a", path);
injector.requireKeyCommand("A", path);
injector.requireKeyCommand("i", path);
injector.requireKeyCommand("I", path);
injector.requireKeyCommand("v", path);
injector.requireKeyCommand("V", path);
injector.requireKeyCommand("r", path);
injector.requireKeyCommand("R", path);
injector.requireKeyCommand("w", path);
injector.requireKeyCommand("c", path);
injector.requireKeyCommand("n", path);

injector.requireKeyCommand(SpecialKeys.QuestionMark, path);
injector.requireKeyCommand(SpecialKeys.CtrlC, path);

registerBuiltInCommand<typeof import("../commands/open").iosOpenCommand>(
	"open|ios",
	() => require("../commands/open").iosOpenCommand,
);
registerBuiltInCommand<typeof import("../commands/open").androidOpenCommand>(
	"open|android",
	() => require("../commands/open").androidOpenCommand,
);
registerBuiltInCommand<typeof import("../commands/open").visionOpenCommand>(
	"open|visionos",
	() => require("../commands/open").visionOpenCommand,
);
registerBuiltInCommand<typeof import("../commands/open").visionOpenCommand>(
	"open|vision",
	() => require("../commands/open").visionOpenCommand,
);

import { SpecialKeys } from "../common/definitions/key-commands";
import { injector } from "../common/yok";

const path = "./key-commands/index";

injector.requireKeyCommand("a", path);
injector.requireKeyCommand("i", path);
injector.requireKeyCommand("A", path);
injector.requireKeyCommand("I", path);
injector.requireKeyCommand("V", path);
injector.requireKeyCommand("r", path);
injector.requireKeyCommand("R", path);
injector.requireKeyCommand("w", path);
injector.requireKeyCommand("c", path);
injector.requireKeyCommand("n", path);

injector.requireKeyCommand(SpecialKeys.QuestionMark, path);
injector.requireKeyCommand(SpecialKeys.CtrlC, path);
injector.requireCommand("open|ios", path);
injector.requireCommand("open|android", path);
injector.requireCommand("open|visionos", path);
injector.requireCommand("open|vision", path);

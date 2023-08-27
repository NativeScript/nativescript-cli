import { injector } from "../common/yok";

const path = "./key-commands/index";

injector.requireKeyCommand("a", path);
injector.requireKeyCommand("i", path);
injector.requireKeyCommand("A", path);
injector.requireKeyCommand("I", path);
injector.requireKeyCommand("r", path);
injector.requireKeyCommand("R", path);
injector.requireKeyCommand("w", path);
injector.requireKeyCommand("c", path);
injector.requireKeyCommand("n", path);
injector.requireKeyCommand("\u0003" as any, path);

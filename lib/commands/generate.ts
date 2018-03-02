import {
    normalize,
    schema,
    virtualFs,
} from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import {
    FileSystemTree,
    HostSink,
    SchematicEngine,
    Tree,
    formats,
} from '@angular-devkit/schematics';
import {
    NodeModulesEngineHost,
    validateOptionsWithSchema,
} from '@angular-devkit/schematics/tools';
import { of as observableOf } from 'rxjs/observable/of';
import {
    concat,
    concatMap,
    ignoreElements,
    map,
} from 'rxjs/operators';

export class GenerateCommand implements ICommand {
    public allowedParameters: ICommandParameter[] = [];

    constructor(
        private $errors: IErrors,
    ) { }

    public async execute(args: string[]): Promise<void> {
        const [collectionName, schematicName] = args;
        const engineHost = new NodeModulesEngineHost();
        const engine = new SchematicEngine(engineHost);

        const registry = new schema.CoreSchemaRegistry(formats.standardFormats);
        const schemaValidator = validateOptionsWithSchema(registry);
        engineHost.registerOptionsTransform(schemaValidator);

        const collection = engine.createCollection(collectionName);
        if (!collection) {
            console.log("No collection found ..")
            this.$errors.fail(`Cannot find collection ${collectionName}`);
        }
        const schematic = collection.createSchematic(schematicName);

        const fsHost = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(process.cwd()));
        const host = observableOf(new FileSystemTree(fsHost));

        const fsSink = new HostSink(fsHost);

        let error = false;
        await schematic.call(args, host)
        .pipe(
            map((tree: Tree) => Tree.optimize(tree)),
                concatMap((tree: Tree) => {
                return fsSink.commit(tree).pipe(
                    ignoreElements(),
                    concat(observableOf(tree)));
            }),
            concatMap((tree: Tree) => {
                if (error) {
                    return observableOf(tree);
                }

                return fsSink.commit(tree).pipe(
                    ignoreElements(),
                    concat(observableOf(tree)));
            }),
            concatMap(() => engine.executePostTasks()))
            .subscribe({
                error(err: Error) {
                    console.error(err.message)
                    this.$errors.fail(err.message);
                },
            });
    }

    public async canExecute(args: string[]): Promise<boolean> {
        if (!args || args.length < 2) {
            console.error("You need to specify collection and schematic to be used!");
            this.$errors.fail("You need to specify collection and schematic to be used!");
        }

        return true;
    }
}

$injector.registerCommand("generate", GenerateCommand);

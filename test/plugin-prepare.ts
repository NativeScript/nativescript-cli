import { assert } from "chai";
import { NpmPluginPrepare } from "../lib/tools/node-modules/node-modules-dest-copy";

require("should");

class TestNpmPluginPrepare extends NpmPluginPrepare {
	public preparedDependencies: IDictionary<boolean> = {};

	constructor(private previouslyPrepared: IDictionary<boolean>) {
		super(null, null, null, null);
	}

	protected getPreviouslyPreparedDependencies(platform: string): IDictionary<boolean> {
		return this.previouslyPrepared;
	}

	protected async beforePrepare(dependencies: IDependencyData[], platform: string): Promise<void> {
		_.each(dependencies, d => {
			this.preparedDependencies[d.name] = true;
		});
	}

	protected async afterPrepare(dependencies: IDependencyData[], platform: string): Promise<void> {
		// DO NOTHING
	}
}

describe("Plugin preparation", () => {
	it("skips prepare if no plugins", async () => {
		const pluginPrepare = new TestNpmPluginPrepare({});
		await pluginPrepare.preparePlugins([], "android", null, {});
		assert.deepEqual({}, pluginPrepare.preparedDependencies);
	});

	it("skips prepare if every plugin prepared", async () => {
		const pluginPrepare = new TestNpmPluginPrepare({ "tns-core-modules-widgets": true });
		const testDependencies: IDependencyData[] = [
			{
				name: "tns-core-modules-widgets",
				depth: 0,
				directory: "some dir",
				nativescript: null,
			}
		];
		await pluginPrepare.preparePlugins(testDependencies, "android", null, {});
		assert.deepEqual({}, pluginPrepare.preparedDependencies);
	});

	it("saves prepared plugins after preparation", async () => {
		const pluginPrepare = new TestNpmPluginPrepare({ "tns-core-modules-widgets": true });
		const testDependencies: IDependencyData[] = [
			{
				name: "tns-core-modules-widgets",
				depth: 0,
				directory: "some dir",
				nativescript: null,
			},
			{
				name: "nativescript-calendar",
				depth: 0,
				directory: "some dir",
				nativescript: null,
			}
		];
		await pluginPrepare.preparePlugins(testDependencies, "android", null, {});
		const prepareData = { "tns-core-modules-widgets": true, "nativescript-calendar": true };
		assert.deepEqual(prepareData, pluginPrepare.preparedDependencies);
	});
});

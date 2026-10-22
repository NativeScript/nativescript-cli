import { assert } from "chai";
import { Yok } from "../../lib/common/yok";
import { inject } from "../../lib/common/di/inject";
import { defineCommand } from "../../lib/common/define-command";
import { ProjectData } from "../../lib/contracts/project-data";
import { createCommandFromDefinition } from "../../lib/common/services/command-definition-adapter";
import { provideProject } from "../../lib/commands/command-base";

const createTestInjector = (
	initializeProjectData: () => void = (): void => undefined,
): { injector: Yok; initializations: number } => {
	const state = { injector: new Yok(), initializations: 0 };
	state.injector.register("projectData", {
		projectDir: "/project",
		initializeProjectData(): void {
			state.initializations++;
			initializeProjectData();
		},
	});
	return state;
};

describe("provideProject", () => {
	it("resolves the project once per invocation, before setup", async () => {
		const state = createTestInjector();
		const order: string[] = [];

		const command = createCommandFromDefinition(
			defineCommand({
				name: "pptest-needs-project",
				providers: [provideProject()],
				setup: () => {
					order.push(`setup:${state.initializations}`);
				},
				run: (ctx) => {
					order.push(`run:${inject(ProjectData).projectDir}`);
					assert.strictEqual(
						ctx.injector.get(ProjectData),
						inject(ProjectData),
					);
				},
			}),
			<any>state.injector,
		);

		await command.execute([]);
		await command.execute([]);

		assert.deepEqual(order, [
			"setup:1",
			"run:/project",
			"setup:2",
			"run:/project",
		]);
	});

	it("reports a missing project ahead of the arguments policy", async () => {
		const state = createTestInjector(() => {
			throw new Error("No project found at or above '/nowhere'.");
		});
		let ran = false;

		const command = createCommandFromDefinition(
			defineCommand({
				name: "pptest-outside-project",
				params: "none",
				providers: [provideProject()],
				run: () => {
					ran = true;
				},
			}),
			<any>state.injector,
		);

		await assert.isRejected(
			command.canExecute(["stray"]),
			/No project found at or above '\/nowhere'/,
		);
		assert.isFalse(ran);
	});

	it("leaves a command that does not declare it alone", async () => {
		const state = createTestInjector();

		const command = createCommandFromDefinition(
			defineCommand({
				name: "pptest-no-project",
				run: (): void => undefined,
			}),
			<any>state.injector,
		);

		await command.execute([]);

		assert.equal(state.initializations, 0);
	});
});

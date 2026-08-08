import '@valor/nativescript-websockets';
import { Application } from '@nativescript/core';
import {
	NativeScriptVitestCoordinator,
	createWebpackTestRegistry,
} from '@nativescript/unit-test-runner/runtime';
import { createVitestHostPage } from '@nativescript/unit-test-runner/testing';

const coordinator = new NativeScriptVitestCoordinator({
	// Every spec matched by the Vitest `include` patterns must also be matched
	// here, or the device will not be able to load it.
	registry: createWebpackTestRegistry(
		require.context('./', true, /\.spec\.js$/)
	),
});

void coordinator.start();
// The host page keeps the screen free as a mount() surface for UI specs.
Application.run({ create: () => createVitestHostPage(coordinator) });

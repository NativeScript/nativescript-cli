import { EventEmitter } from "events";
import { injector } from "./common/yok";
import { ISharedEventBus } from "./declarations";

/**
 * Event Bus used by different services to emit state changes and
 * allow listening for these state changes without needing a reference
 * to the emitting service.
 */
class SharedEventBus extends EventEmitter implements ISharedEventBus {
	// intentionally blank
}

injector.register("sharedEventBus", SharedEventBus);

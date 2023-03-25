import { IFileSystem } from "../common/declarations";
import { cache } from "../common/decorators";
import { injector } from "../common/yok";
import { IProjectConfigService } from "../definitions/project";
import * as path from "path";
import { originalProcessOn } from "../nativescript-cli";

export interface ITimelineProfilerService {
	processLogData(data: string, deviceIdentifier: string): void;
}

const TIMELINE_LOG_RE = /Timeline:\s*(\d*.?\d*ms:\s*)?([^\:]*\:)?(.*)\((\d*.?\d*)ms\.?\s*-\s*(\d*.\d*)ms\.?\)/;

enum ChromeTraceEventPhase {
	BEGIN = "B",
	END = "E",
	INSTANT = "i",
	COMPLETE = "X",
}

interface ChromeTraceEvent {
	ts: number;
	pid: number;
	tid: number;
	/** event phase */
	ph?: ChromeTraceEventPhase | string;
	[otherData: string]: any;
}

interface DeviceTimeline {
	startPoint: number;
	timeline: ChromeTraceEvent[];
}

export class TimelineProfilerService implements ITimelineProfilerService {
	private timelines: Map<string, DeviceTimeline> = new Map();
	private attachedExitHandler: boolean = false;
	constructor(
		private $projectConfigService: IProjectConfigService,
		private $fs: IFileSystem,
		private $logger: ILogger
	) {}

	private attachExitHanlder() {
		if (!this.attachedExitHandler) {
			this.$logger.info('attached "SIGINT" handler to write timeline data.');
			originalProcessOn("SIGINT", this.writeTimelines.bind(this));
			this.attachedExitHandler = true;
		}
	}

	public processLogData(data: string, deviceIdentifier: string) {
		if (!this.isEnabled()) {
			return;
		}
		this.attachExitHanlder();

		if (!this.timelines.has(deviceIdentifier)) {
			this.timelines.set(deviceIdentifier, {
				startPoint: null,
				timeline: [],
			});
		}

		const deviceTimeline = this.timelines.get(deviceIdentifier);

		data.split("\n").forEach((line) => {
			const trace = this.toTrace(line.trim());
			if (trace) {
				deviceTimeline.startPoint ??= trace.from;
				deviceTimeline.timeline.push(trace);
			}
		});
	}

	@cache()
	private isEnabled() {
		return this.$projectConfigService.getValue("profiling") === "timeline";
	}

	private toTrace(text: string): ChromeTraceEvent | undefined {
		const result = text.match(TIMELINE_LOG_RE);
		if (!result) {
			return;
		}

		const trace = {
			domain: result[2]?.trim().replace(":", ""),
			name: result[3].trim(),
			from: parseFloat(result[4]),
			to: parseFloat(result[5]),
		};

		return {
			pid: 1,
			tid: 1,
			ts: trace.from * 1000,
			dur: (trace.to - trace.from) * 1000,
			name: trace.name,
			cat: trace.domain ?? "default",
			ph: ChromeTraceEventPhase.COMPLETE,
		};
	}

	private writeTimelines() {
		this.$logger.info("\n\nWriting timeline data to json...");
		this.timelines.forEach((deviceTimeline, deviceIdentifier) => {
			const deviceTimelineFileName = `timeline-${deviceIdentifier}.json`;
			this.$fs.writeJson(
				path.resolve(process.cwd(), deviceTimelineFileName),
				deviceTimeline.timeline
			);
			this.$logger.info(
				`Timeline data for device ${deviceIdentifier} written to ${deviceTimelineFileName}`
			);
		});

		process.exit();
	}
}

injector.register("timelineProfilerService", TimelineProfilerService);

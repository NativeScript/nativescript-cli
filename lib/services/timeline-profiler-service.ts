import { IFileSystem } from "../common/declarations";
import { cache } from "../common/decorators";
import { injector } from "../common/yok";
import { IProjectConfigService } from "../definitions/project";
import * as path from "path";

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
	private timelines: Map<string, DeviceTimeline>;
	constructor(
		private $projectConfigService: IProjectConfigService,
		private $fs: IFileSystem,
		private $logger: ILogger
	) {
		this.timelines = new Map();

		process.on("exit", this.writeTimelines.bind(this));
		process.on("SIGINT", this.writeTimelines.bind(this));
	}

	public processLogData(data: string, deviceIdentifier: string) {
		if (!this.isEnabled()) {
			return;
		}

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
		if (this.isEnabled()) {
			this.$logger.info("Writing timeline data to json...");
			this.timelines.forEach((deviceTimeline, deviceIdentifier) => {
				this.$fs.writeJson(
					path.resolve(process.cwd(), `timeline-${deviceIdentifier}.json`),
					deviceTimeline.timeline
				);
			});
		}

		process.exit();
	}
}

injector.register("timelineProfilerService", TimelineProfilerService);

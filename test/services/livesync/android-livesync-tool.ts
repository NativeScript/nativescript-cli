import { Yok } from "../../../lib/common/yok";
import { assert } from "chai";
import * as sinon from "sinon";
import { LoggerStub, ProcessServiceStub } from "../../stubs";
import { AndroidLivesyncTool } from "../../../lib/services/livesync/android-livesync-tool";
import { MobileHelper } from "../../../lib/common/mobile/mobile-helper";
import * as net from "net";
import { Duplex } from "stream";
import { MobilePlatformsCapabilities } from "../../../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";

const createTestInjector = (socket: INetSocket): IInjector => {
	const testInjector = new Yok();

	testInjector.register("fs", {
		createReadStream: (filename: string, encoding?: IReadFileOptions | string): NodeJS.ReadableStream => {
			const fileStream = new Duplex();
			fileStream.write("testContent");
			fileStream.end();
			return fileStream;
		},

		exists: (): boolean => true,

		readJson: (filePath: string): any => null,

		enumerateFilesInDirectorySync: (directoryPath: string,
			filterCallback?: (_file: string, _stat: IFsStats) => boolean,
			opts?: { enumerateDirectories?: boolean, includeEmptyDirectories?: boolean },
			foundFiles?: string[]): string[] => []
	});

	testInjector.register("logger", LoggerStub);
	testInjector.register("processService", ProcessServiceStub);
	testInjector.register("injector", testInjector);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("androidProcessService", {
		forwardFreeTcpToAbstractPort: () => Promise.resolve("")
	});
	testInjector.register("LiveSyncSocket", () => { return socket} );
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("errors", {
		fail: (message: string) => {
			throw new Error(message);
		}
	});

	return testInjector;
};

const getHandshakeBuffer = () => {
	const protocolVersion = "0.2.0";
	const packageName = "org.comp.test";
	const handshakeBuffer = Buffer.alloc(Buffer.byteLength(protocolVersion) + Buffer.byteLength(packageName) + 1);

	let offset = handshakeBuffer.writeUInt8(Buffer.byteLength(protocolVersion), 0);
	offset =+ handshakeBuffer.write(protocolVersion, offset);
	handshakeBuffer.write(packageName, offset);

	return handshakeBuffer;
}

describe.only("AndroidLivesyncTool", () => {
	let testInjector: IInjector = null;
	let livesyncTool: IAndroidLivesyncTool = null;
	let testSocket: INetSocket;
	let sandbox: sinon.SinonSandbox = null;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		testSocket = new net.Socket();
		var stub = sandbox.stub(testSocket, 'write').callsFake(function () {

			var args = stub.args;
			
			// this will echo whatever they wrote
			if (args.length > 0)
			testSocket.emit('data', stub.args[stub.callCount - 1][0]);
		});
		testInjector = createTestInjector(testSocket);
		livesyncTool = testInjector.resolve(AndroidLivesyncTool);
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe("methods", () => {
		describe("connect", () => {
			it("should retry if first connect fails", () => {
				const originalOn = testSocket.on;
				const originalOnce = testSocket.once;
				let dataAttachCount = 0;
				let closeAttachCount = 0;
				sandbox.stub(testSocket, "on").callsFake(function(event: string) {
					originalOn.apply(this, arguments);
					if(event === "close") {
						closeAttachCount++;
						if(closeAttachCount === 1){
							testSocket.emit("close", false);
						}
					}
				});

				sandbox.stub(testSocket, "once").callsFake(function(event: string) {
					originalOnce.apply(this, arguments);
					if(event === "data") {
						dataAttachCount++
						if(dataAttachCount === 2){
							testSocket.write(getHandshakeBuffer());
						}
					}
				});
				const connectStub: sinon.SinonStub = sandbox.stub(testSocket, "connect");
				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test" });

				return connectPromise.then(() => {
						assert(connectStub.calledTwice);
					}
				);
			});

			it("should fail eventually", () => {
				sandbox.stub(testSocket, "connect");
				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test", connectTimeout: 400 });
				
				return connectPromise.should.be.rejected;
			});
		});
	});
});
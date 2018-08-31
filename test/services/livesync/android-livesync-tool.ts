import { Yok } from "../../../lib/common/yok";
import { assert } from "chai";
import * as sinon from "sinon";
import { LoggerStub, ProcessServiceStub } from "../../stubs";
import { AndroidLivesyncTool } from "../../../lib/services/livesync/android-livesync-tool";
import { MobileHelper } from "../../../lib/common/mobile/mobile-helper";
import { FileSystem } from "../../../lib/common/file-system";
import * as net from "net";
import { MobilePlatformsCapabilities } from "../../../lib/mobile-platforms-capabilities";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";
import * as path from "path";
import temp = require("temp");
import * as crypto from "crypto";

temp.track();
const protocolVersion = "0.2.0";

class TestSocket extends net.Socket {
	public accomulatedData: Buffer[] = [];
	public connect () {
		//ignore
	}
	public write(data: Buffer | string, cb?: string | Function, encoding?: Function | string): boolean {
		if (data instanceof Buffer) {
			this.accomulatedData.push(data);
		} else {
			const buffer = Buffer.from(data, 'utf8');
			this.accomulatedData.push(buffer);
		}

		if (cb && cb instanceof Function) {
			cb.call(this);
		}

		return true;
	}
}

const rootTestFileJs = "test.js";
const rootTestFileCss = "test.css";
const dirTestFileJs = path.join("testdir", "testdir.js");
const dirTestFileCss = path.join("testdir", "testdir.css");

const fileContents = {
	[rootTestFileJs]: "Test js content",
	[rootTestFileCss]: "Test css content",
	[dirTestFileJs]: "Test js in dir",
	[dirTestFileCss]: "Test css in dir"
};

const projectCreated = false;
const testAppPath = temp.mkdirSync("testsyncapp");
const testAppPlatformPath = path.join(testAppPath, "platforms", "android", "app", "src", "main", "assets", "app");
const createTestProject = (testInjector: IInjector) => {
	if (!projectCreated) {
		const fs = testInjector.resolve("fs");
		_.forEach(fileContents, (value, key) => {
			fs.writeFile(path.join(testAppPlatformPath, key), value);
		});
	}
};

const createTestInjector = (socket: INetSocket, fileStreams: IDictionary<NodeJS.ReadableStream>): IInjector => {
	const testInjector = new Yok();

	testInjector.register("fs", FileSystem);
	testInjector.register("logger", LoggerStub);
	testInjector.register("processService", ProcessServiceStub);
	testInjector.register("injector", testInjector);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("androidProcessService", {
		forwardFreeTcpToAbstractPort: () => Promise.resolve("")
	});
	testInjector.register("LiveSyncSocket", () => socket);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("errors", {
		fail: (message: string) => {
			throw new Error(message);
		}
	});

	return testInjector;
};

const getFileName = (buffer: Buffer) => {
	const fileNameSizeLength = buffer.readUInt8(1);
	const fileNameSizeEnd = fileNameSizeLength + 2;
	const fileNameSize = buffer.toString("utf8", 2, fileNameSizeEnd);
	const fileNameEnd = fileNameSizeEnd + Number(fileNameSize);
	const fileName = buffer.toString("utf8", fileNameSizeEnd, fileNameEnd);

	return { fileName, fileNameEnd };
};

const getFileContentSize = (buffer: Buffer, offset: number) => {
	const fileContentSizeLength = buffer.readUInt8(offset);
	const fileContentSizeBegin = offset + 1;
	const fileContentSizeEnd = fileContentSizeBegin + fileContentSizeLength;
	const fileContentSize = Number(buffer.toString("utf8", fileContentSizeBegin, fileContentSizeEnd));

	return {fileContentSize, fileContentSizeEnd};
};

const getFileContent = (buffer: Buffer, offset: number, contentLength: number) => {
	const fileContentEnd = offset + Number(contentLength);
	const fileContent = buffer.toString("utf8", offset, fileContentEnd);

	return {fileContent, fileContentEnd};
};

const getOperation = (buffer: Buffer) => {
	const operation = buffer.toString("utf8", 0 , 1);

	return Number(operation);
};

const compareHash = (buffer: Buffer, dataStart: number, dataEnd: number, hashStart: number) => {
	const headerBuffer = buffer.slice(dataStart, dataEnd);
	const hashEnd = hashStart + 16;
	const headerHash = buffer.slice(hashStart, hashEnd);
	const computedHash = crypto.createHash("md5").update(headerBuffer).digest();
	const headerHashMatch = headerHash.equals(computedHash);

	return headerHashMatch;
};

const getSendFileData = (buffers: Buffer[]) => {
	const buffer = Buffer.concat(buffers);
	const operation = getOperation(buffer);
	const { fileName, fileNameEnd } = getFileName(buffer);

	const { fileContentSize, fileContentSizeEnd } = getFileContentSize(buffer, fileNameEnd);
	const headerHashMatch = compareHash(buffer, 0, fileContentSizeEnd, fileContentSizeEnd);
	const headerHashEnd = fileContentSizeEnd + 16;
	const {fileContent, fileContentEnd} = getFileContent(buffer, headerHashEnd, fileContentSize);
	const fileHashMatch = compareHash(buffer, headerHashEnd, fileContentEnd, fileContentEnd);

	return {operation, fileName, fileContent, headerHashMatch, fileHashMatch};
};

const getRemoveFileData = (buffers: Buffer[]) => {
	const buffer = Buffer.concat(buffers);
	const operation = getOperation(buffer);
	const { fileName, fileNameEnd } = getFileName(buffer);
	const headerHashMatch = compareHash(buffer, 0, fileNameEnd, fileNameEnd);

	return { operation, fileName, headerHashMatch};
};

const getSyncData = (buffers: Buffer[]) => {
	const buffer = Buffer.concat(buffers);
	const operation = getOperation(buffer);
	const operationUid = buffer.toString("utf8", 1, 33);
	const doRefresh = buffer.readUInt8(33);

	return {operationUid, doRefresh, operation};
};

const getSyncResponse = (reportCode: number, message: string) => {
	const buffer = Buffer.alloc(1 + Buffer.byteLength(message, "utf8"));

	buffer.writeUInt8(reportCode, 0);
	buffer.write(message, 1);

	return buffer;
};

const getHandshakeBuffer = () => {
	const packageName = "org.comp.test";
	const handshakeBuffer = Buffer.alloc(Buffer.byteLength(protocolVersion) + Buffer.byteLength(packageName) + 1);

	let offset = handshakeBuffer.writeUInt8(Buffer.byteLength(protocolVersion), 0);
	offset = offset + handshakeBuffer.write(protocolVersion, offset);
	handshakeBuffer.write(packageName, offset);

	return handshakeBuffer;
};

describe.only("AndroidLivesyncTool", () => {
	let testInjector: IInjector = null;
	let livesyncTool: IAndroidLivesyncTool = null;
	let testSocket: INetSocket;
	let sandbox: sinon.SinonSandbox = null;
	let fileStreams: IDictionary<NodeJS.ReadableStream> = null;

	beforeEach(() => {
		sandbox = sinon.sandbox.create();
		testSocket = new TestSocket();
		fileStreams = {};
		testInjector = createTestInjector(testSocket, fileStreams);
		createTestProject(testInjector);
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
					if (event === "close") {
						closeAttachCount++;
						if (closeAttachCount === 1) {
							testSocket.emit('close', false);
						}
					}
				});

				sandbox.stub(testSocket, "once").callsFake(function(event: string) {
					originalOnce.apply(this, arguments);
					if (event === "data") {
						dataAttachCount++;
						if (dataAttachCount === 2) {
							testSocket.emit('data', getHandshakeBuffer());
						}
					}
				});
				const connectStub: sinon.SinonStub = sandbox.stub(testSocket, "connect");
				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test" });

				return connectPromise.then(() => {
						assert(connectStub.calledTwice);
						assert.isFulfilled(connectPromise);
						assert.equal(livesyncTool.protocolVersion, protocolVersion);
					}
				);
			});

			it("should reject if appIdentifier missing", () => {
				const connectPromise = livesyncTool.connect({ appIdentifier: "", deviceIdentifier: "test", appPlatformsPath: "test", connectTimeout: 400 });

				return assert.isRejected(connectPromise);
			});

			it("should reject if appPlatformsPath missing", () => {
				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "", connectTimeout: 400 });

				return assert.isRejected(connectPromise);
			});

			it("should fail eventually", () => {
				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test", connectTimeout: 400 });

				return assert.isRejected(connectPromise);
			});

			it("should fail if connection alreday exists", () => {
				const originalOnce = testSocket.once;

				sandbox.stub(testSocket, "once").callsFake(function(event: string) {
					originalOnce.apply(this, arguments);
					if (event === "data") {
						testSocket.emit('data', getHandshakeBuffer());
					}
				});

				const connectPromise = livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test", connectTimeout: 400 }).then(() => {
					return livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: "test", connectTimeout: 400 });
				});

				return assert.isRejected(connectPromise);
			});
		});

		describe("which require connection", () => {
			beforeEach(async () => {
				const originalOnce = testSocket.once;
				let dataAttachCount = 0;
				sandbox.stub(testSocket, "once").callsFake(function(event: string) {
					originalOnce.apply(this, arguments);
					if (event === "data") {
						dataAttachCount++;
						if (dataAttachCount === 1) {
							testSocket.emit('data', getHandshakeBuffer());
						}
					}
				});
				await livesyncTool.connect({ appIdentifier: "test", deviceIdentifier: "test", appPlatformsPath: testAppPlatformPath});
			});

			describe("sendFile", () => {
				it("sends correct information", async () => {
					const filePath = path.join(testAppPlatformPath, rootTestFileJs);

					await livesyncTool.sendFile(filePath);

					const sendFileData = getSendFileData((testSocket as TestSocket).accomulatedData);

					assert.equal(sendFileData.fileContent, fileContents[rootTestFileJs]);
					assert.equal(sendFileData.fileName, rootTestFileJs);
					assert(sendFileData.headerHashMatch);
					assert(sendFileData.fileHashMatch);
					assert.equal(sendFileData.operation, AndroidLivesyncTool.CREATE_FILE_OPERATION);
				});

				it("rejects if file doesn't exist", () => {
					const sendFilePromise = livesyncTool.sendFile("nonexistent.js");

					return assert.isRejected(sendFilePromise);
				});

				it("rejects if no connection", () => {
					livesyncTool.end();
					const filePath = path.join(testAppPlatformPath, rootTestFileJs);
					const sendFilePromise = livesyncTool.sendFile(filePath);

					return assert.isRejected(sendFilePromise);
				});

				it("rejects if socket sends error", () => {
					const errorMessage = "Some error";
					const filePath = path.join(testAppPlatformPath, rootTestFileJs);
					testSocket.emit('error', errorMessage);
					const sendFilePromise = livesyncTool.sendFile(filePath);
					return assert.isRejected(sendFilePromise, errorMessage);
				});

				it("rejects if error received", async () => {
					const filePath = path.join(testAppPlatformPath, rootTestFileJs);
					const errorMessage = "Some error";
					await livesyncTool.sendFile(filePath);
					sandbox.stub(testSocket, "write").callsFake((data) => {
						testSocket.emit('data', getSyncResponse(AndroidLivesyncTool.ERROR_REPORT, errorMessage));
					});

					const sendFilePromise = livesyncTool.sendFile(filePath);
					assert.isRejected(sendFilePromise, errorMessage);
				});
			});

			describe("remove file", () => {
				it("sends correct information", async () => {
					const filePath = path.join(testAppPlatformPath, rootTestFileJs);
					await livesyncTool.removeFile(filePath);

					const removeData = getRemoveFileData((testSocket as TestSocket).accomulatedData);

					assert.equal(removeData.fileName, rootTestFileJs);
					assert.equal(removeData.operation, AndroidLivesyncTool.DELETE_FILE_OPERATION);
					assert(removeData.headerHashMatch);
				});
			});

			describe("sendDoSync", () => {
				it("resolves after received data", () => {
					let doSyncResolved = false;
					const originalWrite = testSocket.write.bind(testSocket);
					const writeStub = sandbox.stub(testSocket, "write").callThrough();
					writeStub.onSecondCall().callsFake((data) => {
						originalWrite(data);
					});

					const doSyncPromise = livesyncTool.sendDoSyncOperation(true);
					const doSyncData = getSyncData((testSocket as TestSocket).accomulatedData);
					doSyncPromise.then(() => {
						doSyncResolved = true;
					});
					assert.isFalse(doSyncResolved);
					testSocket.emit('data', getSyncResponse(AndroidLivesyncTool.OPERATION_END_REPORT, doSyncData.operationUid));

					return doSyncPromise.then(function() {
						assert.isTrue(doSyncResolved);
					});
				});

				it("resolves after received data without refresh", () => {
					let doSyncResolved = false;
					const originalWrite = testSocket.write.bind(testSocket);
					const writeStub = sandbox.stub(testSocket, "write").callThrough();
					writeStub.onSecondCall().callsFake((data) => {
						originalWrite(data);
					});

					const doSyncPromise = livesyncTool.sendDoSyncOperation(true);
					const doSyncData = getSyncData((testSocket as TestSocket).accomulatedData);
					doSyncPromise.then(() => {
						doSyncResolved = true;
					});
					assert.isFalse(doSyncResolved);
					testSocket.emit('data', getSyncResponse(AndroidLivesyncTool.OPERATION_END_NO_REFRESH_REPORT_CODE, doSyncData.operationUid));

					return doSyncPromise.then(function() {
						assert.isTrue(doSyncResolved);
					});
				});

				it("rejects after received error", () => {
					let doSyncRejected = false;
					const errorMessage = "Some error";
					const originalWrite = testSocket.write.bind(testSocket);
					const writeStub = sandbox.stub(testSocket, "write").callThrough();
					writeStub.onSecondCall().callsFake((data) => {
						originalWrite(data);
					});

					const doSyncPromise = livesyncTool.sendDoSyncOperation(true);
					doSyncPromise.then(null, () => {
						doSyncRejected = true;
					});
					assert.isFalse(doSyncRejected);
					testSocket.emit('data', getSyncResponse(AndroidLivesyncTool.ERROR_REPORT, errorMessage));

					return assert.isRejected(doSyncPromise, errorMessage);
				});

				it("rejects after socket closed", () => {
					let doSyncRejected = false;
					const originalWrite = testSocket.write.bind(testSocket);
					const writeStub = sandbox.stub(testSocket, "write").callThrough();
					writeStub.onSecondCall().callsFake((data) => {
						originalWrite(data);
					});

					const doSyncPromise = livesyncTool.sendDoSyncOperation(true);
					doSyncPromise.then(null, () => {
						doSyncRejected = true;
					});
					assert.isFalse(doSyncRejected);
					testSocket.emit('close', true);

					return assert.isRejected(doSyncPromise);
				});

				it("rejects after timeout", () => {
					const doSyncPromise = livesyncTool.sendDoSyncOperation(true, 50);

					return assert.isRejected(doSyncPromise);
				});
			});
		});

		describe("sendFiles", () => {
			it("calls sendFile for each file", async () => {
				const filePaths = _.keys(fileContents).map(filePath => path.join(testAppPlatformPath, filePath));
				const sendFileStub = sandbox.stub(livesyncTool, "sendFile").callsFake(() => Promise.resolve());
				await livesyncTool.sendFiles(filePaths);

				_.forEach(filePaths, (filePath) => {
					assert(sendFileStub.calledWith(filePath));
				});
			});
		});

		describe("sendDirectory", () => {
			it("calls sendFile for each file in directory", async () => {
				const filePaths = _.keys(fileContents).map(filePath => path.join(testAppPlatformPath, filePath));
				const sendFileStub = sandbox.stub(livesyncTool, "sendFile").callsFake(() => Promise.resolve());
				await livesyncTool.sendDirectory(testAppPlatformPath);

				_.forEach(filePaths, (filePath) => {
					assert(sendFileStub.calledWith(filePath));
				});
			});
		});

		describe("removeFiles", () => {
			it("calls sendFile for each file", async () => {
				const filePaths = _.keys(fileContents).map(filePath => path.join(testAppPlatformPath, filePath));
				const removeFileStub = sandbox.stub(livesyncTool, "removeFile").callsFake(() => Promise.resolve());
				await livesyncTool.removeFiles(filePaths);

				_.forEach(filePaths, (filePath) => {
					assert(removeFileStub.calledWith(filePath));
				});
			});
		});
	});
});

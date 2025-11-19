import { Yok } from "../../../lib/common/yok";
import { assert } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { LoggerStub, TempServiceStub } from "../../stubs";
import { AndroidLivesyncTool } from "../../../lib/services/livesync/android-livesync-tool";
import { LiveSyncSocket } from "../../../lib/services/livesync/livesync-socket";
import { MobileHelper } from "../../../lib/common/mobile/mobile-helper";
import { FileSystem } from "../../../lib/common/file-system";
import { DevicePlatformsConstants } from "../../../lib/common/mobile/device-platforms-constants";
import * as path from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as crypto from "crypto";
import { IInjector } from "../../../lib/common/definitions/yok";
import { IDictionary } from "../../../lib/common/declarations";
import { PLATFORMS_DIR_NAME } from "../../../lib/constants";

const protocolVersion = "0.2.0";

class TestSocket extends LiveSyncSocket {
	public accomulatedData: Buffer[] = [];
	public connect() {
		return this;
	}

	public writeAsync(
		data: Buffer | string,
		cb?: string | Function,
		encoding?: Function | string,
	): Promise<Boolean> {
		if (data instanceof Buffer) {
			this.accomulatedData.push(data);
		} else {
			const buffer = Buffer.from(data as any, "utf8");
			this.accomulatedData.push(buffer);
		}

		if (cb && cb instanceof Function) {
			cb.call(this);
		}

		return new Promise((resolve, reject) => {
			setTimeout(() => resolve(true), 0);
		});
	}
}

const rootJsFilePath = "test.js";
const rootCssFilePath = "test.css";
const nestedJsFilePath = path.join("testdir", "testdir.js");
const nestedCssFilePath = path.join("testdir", "testdir.css");

const fileContents = {
	[rootJsFilePath]: "Test js content",
	[rootCssFilePath]: "Test css content",
	[nestedJsFilePath]: "Test js in dir",
	[nestedCssFilePath]: "Test css in dir",
};

const projectCreated = false;
const testAppPath = mkdtempSync(path.join(tmpdir(), "testsyncapp-"));
const testAppPlatformPath = path.join(
	testAppPath,
	PLATFORMS_DIR_NAME,
	"android",
	"app",
	"src",
	"main",
	"assets",
	"app",
);
const createTestProject = (testInjector: IInjector) => {
	if (!projectCreated) {
		const fs = testInjector.resolve("fs");
		_.forEach(fileContents, (value, key) => {
			fs.writeFile(path.join(testAppPlatformPath, key), value);
		});
	}
};

const createTestInjector = (
	socket: INetSocket,
	fileStreams: IDictionary<NodeJS.ReadableStream>,
): IInjector => {
	const testInjector = new Yok();

	testInjector.register("fs", FileSystem);
	testInjector.register("logger", LoggerStub);
	testInjector.register("injector", testInjector);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("androidProcessService", {
		forwardFreeTcpToAbstractPort: () => Promise.resolve(""),
		getAppProcessId: () => Promise.resolve("1234"),
	});
	testInjector.register("LiveSyncSocket", () => socket);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("errors", {
		failWithHelp: (message: string): void => {
			throw new Error(message);
		},
		fail: (message: string) => {
			throw new Error(message);
		},
		failWithoutHelp: (message: string) => {
			throw new Error(message);
		},
	});
	testInjector.register("tempService", TempServiceStub);

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
	const fileContentSize = Number(
		buffer.toString("utf8", fileContentSizeBegin, fileContentSizeEnd),
	);

	return { fileContentSize, fileContentSizeEnd };
};

const getFileContent = (
	buffer: Buffer,
	offset: number,
	contentLength: number,
) => {
	const fileContentEnd = offset + Number(contentLength);
	const fileContent = buffer.toString("utf8", offset, fileContentEnd);

	return { fileContent, fileContentEnd };
};

const getOperation = (buffer: Buffer) => {
	const operation = buffer.toString("utf8", 0, 1);

	return Number(operation);
};

const compareHash = (
	buffer: Buffer,
	dataStart: number,
	dataEnd: number,
	hashStart: number,
) => {
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

	const { fileContentSize, fileContentSizeEnd } = getFileContentSize(
		buffer,
		fileNameEnd,
	);
	const headerHashMatch = compareHash(
		buffer,
		0,
		fileContentSizeEnd,
		fileContentSizeEnd,
	);
	const headerHashEnd = fileContentSizeEnd + 16;
	const { fileContent, fileContentEnd } = getFileContent(
		buffer,
		headerHashEnd,
		fileContentSize,
	);
	const fileHashMatch = compareHash(
		buffer,
		headerHashEnd,
		fileContentEnd,
		fileContentEnd,
	);

	return { operation, fileName, fileContent, headerHashMatch, fileHashMatch };
};

const getRemoveFileData = (buffers: Buffer[]) => {
	const buffer = Buffer.concat(buffers);
	const operation = getOperation(buffer);
	const { fileName, fileNameEnd } = getFileName(buffer);
	const headerHashMatch = compareHash(buffer, 0, fileNameEnd, fileNameEnd);

	return { operation, fileName, headerHashMatch };
};

const getSyncData = (buffers: Buffer[]) => {
	const buffer = Buffer.concat(buffers);
	const operation = getOperation(buffer);
	const operationUid = buffer.toString("utf8", 1, 33);
	const doRefresh = buffer.readUInt8(33);

	return { operationUid, doRefresh, operation };
};

const getSyncResponse = (reportCode: number, message: string) => {
	const buffer = Buffer.alloc(1 + Buffer.byteLength(message, "utf8"));

	buffer.writeUInt8(reportCode, 0);
	buffer.write(message, 1);

	return buffer;
};

const getHandshakeBuffer = () => {
	const packageName = "org.comp.test";
	const handshakeBuffer = Buffer.alloc(
		Buffer.byteLength(protocolVersion) + Buffer.byteLength(packageName) + 1,
	);

	let offset = handshakeBuffer.writeUInt8(
		Buffer.byteLength(protocolVersion),
		0,
	);
	offset = offset + handshakeBuffer.write(protocolVersion, offset);
	handshakeBuffer.write(packageName, offset);

	return handshakeBuffer;
};

const stubSocketEventAttach = (
	socket: any,
	sandbox: sinon.SinonSandbox,
	attachMethod: string,
	eventName: string,
	data: any,
	attachCountForAction: number,
	emitEvent?: string,
) => {
	const originalMethod = socket[attachMethod];
	let attachCount = 0;
	emitEvent = emitEvent || eventName;
	sandbox.stub(socket, attachMethod).callsFake(function (event: string) {
		originalMethod.apply(this, arguments);
		if (eventName === event) {
			attachCount++;
			if (attachCount === attachCountForAction) {
				socket.emit(emitEvent, data);
			}
		}
	});
};

const connectTimeout = 100;

describe("AndroidLivesyncTool", () => {
	let testInjector: IInjector = null;
	let livesyncTool: IAndroidLivesyncTool = null;
	let testSocket: ILiveSyncSocket;
	let sandbox: sinon.SinonSandbox = null;
	let fileStreams: IDictionary<NodeJS.ReadableStream> = null;
	let connectData: IAndroidLivesyncToolConfiguration;

	beforeEach(() => {
		connectData = {
			appIdentifier: "test",
			deviceIdentifier: "test",
			appPlatformsPath: testAppPlatformPath,
			connectTimeout,
		};
		sandbox = sinon.createSandbox();
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
			it("should retry if first socket connect emits close", async () => {
				//arrange
				const connectStub: sinon.SinonStub = sandbox.stub(
					testSocket,
					"connect",
				);
				connectData.connectTimeout = null;

				stubSocketEventAttach(testSocket, sandbox, "on", "close", false, 1);
				stubSocketEventAttach(
					testSocket,
					sandbox,
					"once",
					"data",
					getHandshakeBuffer(),
					2,
				);

				//act
				await livesyncTool.connect(connectData);

				//assert
				assert(connectStub.calledTwice);
				assert.equal(livesyncTool.protocolVersion, protocolVersion);
			});

			it("should retry if first socket connect errors", () => {
				//arrange
				const errorMessage = "Socket error";
				connectData.connectTimeout = null;

				stubSocketEventAttach(
					testSocket,
					sandbox,
					"on",
					"close",
					new Error(errorMessage),
					1,
					"error",
				);
				stubSocketEventAttach(
					testSocket,
					sandbox,
					"once",
					"data",
					getHandshakeBuffer(),
					2,
				);

				//act
				const connectPromise = livesyncTool.connect(connectData);

				//assert
				return assert.isRejected(connectPromise, errorMessage);
			});

			it("should reject if appIdentifier is missing", () => {
				//arrange
				connectData.appIdentifier = "";

				//act
				const connectPromise = livesyncTool.connect(connectData);

				//assert
				return assert.isRejected(
					connectPromise,
					AndroidLivesyncTool.APP_IDENTIFIER_MISSING_ERROR,
				);
			});

			it("should reject if appPlatformsPath is missing", () => {
				//arrange
				connectData.appPlatformsPath = "";

				//act
				const connectPromise = livesyncTool.connect(connectData);

				//assert
				return assert.isRejected(
					connectPromise,
					AndroidLivesyncTool.APP_PLATFORMS_PATH_MISSING_ERROR,
				);
			});

			it("should fail eventually", () => {
				//act
				const connectPromise = livesyncTool.connect(connectData);

				//assert
				return assert.isRejected(
					connectPromise,
					AndroidLivesyncTool.SOCKET_CONNECTION_TIMED_OUT_ERROR,
				);
			});

			it("should fail if connection alreday exists", async () => {
				//arrange
				stubSocketEventAttach(
					testSocket,
					sandbox,
					"once",
					"data",
					getHandshakeBuffer(),
					1,
				);

				await livesyncTool.connect(connectData);

				//act
				const connectPromise = livesyncTool.connect(connectData);

				//assert
				await assert.isRejected(
					connectPromise,
					AndroidLivesyncTool.SOCKET_CONNECTION_ALREADY_EXISTS_ERROR,
				);
			});
		});

		describe("which require connection", () => {
			beforeEach(async () => {
				stubSocketEventAttach(
					testSocket,
					sandbox,
					"once",
					"data",
					getHandshakeBuffer(),
					1,
				);

				await livesyncTool.connect(connectData);
			});

			describe("sendFile", () => {
				it("sends correct information", async () => {
					//arrange
					const filePath = path.join(testAppPlatformPath, rootJsFilePath);

					//act
					await livesyncTool.sendFile(filePath);

					const sendFileData = getSendFileData(
						(testSocket as TestSocket).accomulatedData,
					);

					//assert
					assert.equal(sendFileData.fileContent, fileContents[rootJsFilePath]);
					assert.equal(sendFileData.fileName, rootJsFilePath);
					assert(sendFileData.headerHashMatch);
					assert(sendFileData.fileHashMatch);
					assert.equal(
						sendFileData.operation,
						AndroidLivesyncTool.CREATE_FILE_OPERATION,
					);
				});

				it("rejects if file doesn't exist", () => {
					//act
					const sendFilePromise = livesyncTool.sendFile("nonexistent.js");

					//assert
					return assert.isRejected(sendFilePromise);
				});

				it("rejects if no connection", () => {
					//arrange
					livesyncTool.end();
					const filePath = path.join(testAppPlatformPath, rootJsFilePath);

					//act
					const sendFilePromise = livesyncTool.sendFile(filePath);

					//assert
					return assert.isRejected(
						sendFilePromise,
						AndroidLivesyncTool.NO_SOCKET_CONNECTION_AVAILABLE_ERROR,
					);
				});

				it("rejects if socket sends error", () => {
					//arrange
					const errorMessage = "Some error";
					const filePath = path.join(testAppPlatformPath, rootJsFilePath);
					testSocket.emit("error", errorMessage);

					//act
					const sendFilePromise = livesyncTool.sendFile(filePath);

					//assert
					return assert.isRejected(sendFilePromise, errorMessage);
				});

				it("rejects if error received", async () => {
					//arrange
					const filePath = path.join(testAppPlatformPath, rootJsFilePath);
					const errorMessage = "Some error";
					await livesyncTool.sendFile(filePath);
					sandbox.stub(testSocket, "writeAsync").callsFake((data: Buffer) => {
						testSocket.emit(
							"data",
							getSyncResponse(AndroidLivesyncTool.ERROR_REPORT, errorMessage),
						);
						return Promise.resolve(false);
					});

					//act
					const sendFilePromise = livesyncTool.sendFile(filePath);

					//assert
					assert.isRejected(sendFilePromise, errorMessage);
				});
			});

			describe("remove file", () => {
				it("sends correct information", async () => {
					//arrange
					const filePath = path.join(testAppPlatformPath, rootJsFilePath);
					await livesyncTool.removeFile(filePath);

					//act
					const removeData = getRemoveFileData(
						(testSocket as TestSocket).accomulatedData,
					);

					//assert
					assert.equal(removeData.fileName, rootJsFilePath);
					assert.equal(
						removeData.operation,
						AndroidLivesyncTool.DELETE_FILE_OPERATION,
					);
					assert(removeData.headerHashMatch);
				});
			});

			describe("sendDoSync", () => {
				it("resolves after received data", () => {
					//arrange
					let doSyncResolved = false;

					//act
					const doSyncPromise = livesyncTool.sendDoSyncOperation();
					const doSyncData = getSyncData(
						(testSocket as TestSocket).accomulatedData,
					);
					doSyncPromise
						.then(() => {
							doSyncResolved = true;
						})
						.catch(assert.fail);

					//assert
					assert.isFalse(doSyncResolved);
					testSocket.emit(
						"data",
						getSyncResponse(
							AndroidLivesyncTool.OPERATION_END_REPORT,
							doSyncData.operationUid,
						),
					);

					return doSyncPromise.then(() => {
						assert.isTrue(doSyncResolved);
					});
				});

				it("resolves after received data without refresh", () => {
					//arrange
					let doSyncResolved = false;

					//act
					const doSyncPromise = livesyncTool.sendDoSyncOperation();
					const doSyncData = getSyncData(
						(testSocket as TestSocket).accomulatedData,
					);
					doSyncPromise
						.then(() => {
							doSyncResolved = true;
						})
						.catch(assert.fail);

					//assert
					assert.isFalse(doSyncResolved);
					testSocket.emit(
						"data",
						getSyncResponse(
							AndroidLivesyncTool.OPERATION_END_NO_REFRESH_REPORT_CODE,
							doSyncData.operationUid,
						),
					);

					return doSyncPromise.then(() => {
						assert.isTrue(doSyncResolved);
					});
				});

				it("rejects after received error", () => {
					//arrange
					let doSyncRejected = false;
					const errorMessage = "Some error";

					//act
					const doSyncPromise = livesyncTool.sendDoSyncOperation();
					doSyncPromise.catch(() => {
						doSyncRejected = true;
					});

					//assert
					assert.isFalse(doSyncRejected);
					testSocket.emit(
						"data",
						getSyncResponse(AndroidLivesyncTool.ERROR_REPORT, errorMessage),
					);

					return assert.isRejected(doSyncPromise, errorMessage);
				});

				it("rejects after socket closed", () => {
					//arrange
					let doSyncRejected = false;

					//act
					const doSyncPromise = livesyncTool.sendDoSyncOperation();
					doSyncPromise.catch(() => {
						doSyncRejected = true;
					});

					//assert
					assert.isFalse(doSyncRejected);
					testSocket.emit("close", true);

					return assert.isRejected(doSyncPromise);
				});

				it("rejects after timeout", () => {
					//act
					const doSyncPromise = livesyncTool.sendDoSyncOperation({
						timeout: 50,
					});

					//assert
					return assert.isRejected(doSyncPromise);
				});
			});
		});

		describe("sendFiles", () => {
			it("calls sendFile for each file", async () => {
				//arrange
				const filePaths = _.keys(fileContents).map((filePath) =>
					path.join(testAppPlatformPath, filePath),
				);
				const sendFileStub = sandbox
					.stub(livesyncTool, "sendFile")
					.callsFake(() => Promise.resolve());

				//act
				await livesyncTool.sendFiles(filePaths);

				//assert
				_.forEach(filePaths, (filePath) => {
					assert(sendFileStub.calledWith(filePath));
				});
			});
		});

		describe("sendDirectory", () => {
			it("calls sendFile for each file in directory", async () => {
				//arrange
				const filePaths = _.keys(fileContents).map((filePath) =>
					path.join(testAppPlatformPath, filePath),
				);
				const sendFileStub = sandbox
					.stub(livesyncTool, "sendFile")
					.callsFake(() => Promise.resolve());

				//act
				await livesyncTool.sendDirectory(testAppPlatformPath);

				//assert
				_.forEach(filePaths, (filePath) => {
					assert(sendFileStub.calledWith(filePath));
				});
			});
		});

		describe("removeFiles", () => {
			it("calls removeFile for each file", async () => {
				//arrange
				const filePaths = _.keys(fileContents).map((filePath) =>
					path.join(testAppPlatformPath, filePath),
				);
				const removeFileStub = sandbox
					.stub(livesyncTool, "removeFile")
					.callsFake(() => Promise.resolve());

				//act
				await livesyncTool.removeFiles(filePaths);

				//assert
				_.forEach(filePaths, (filePath) => {
					assert(removeFileStub.calledWith(filePath));
				});
			});
		});
	});
});

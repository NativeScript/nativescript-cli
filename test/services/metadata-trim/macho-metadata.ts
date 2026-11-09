import { assert } from "chai";
import {
	embeddedMetadataVersion,
	metadataFileVersion,
	replaceEmbeddedMetadata,
} from "../../../lib/services/metadata-trim/macho-metadata";

const PAGE = 0x4000;
const SEGMENT_COMMAND_SIZE = 72;
const SECTION_SIZE = 80;

interface FakeBinaryOptions {
	metadataPages?: number;
	gapBeforeLinkedit?: number;
}

function writeName(buffer: Buffer, offset: number, name: string) {
	buffer.write(name, offset, "latin1");
}

function fakeBinary(options: FakeBinaryOptions = {}) {
	const metadataPages = options.metadataPages ?? 4;
	const gap = options.gapBeforeLinkedit ?? 0;
	const metadataOffset = PAGE;
	const metadataSize = metadataPages * PAGE;
	const linkeditOffset = metadataOffset + metadataSize + gap;
	const linkeditPayload = Buffer.from("LINKEDIT-CONTENT".repeat(8));

	const binary = Buffer.alloc(linkeditOffset + linkeditPayload.length);
	binary.writeUInt32LE(0xfeedfacf, 0);
	binary.writeUInt32LE(4, 16);

	let at = 32;
	binary.writeUInt32LE(0x19, at);
	binary.writeUInt32LE(SEGMENT_COMMAND_SIZE + SECTION_SIZE, at + 4);
	writeName(binary, at + 8, "__objc_metadata");
	binary.writeBigUInt64LE(BigInt(0x200000), at + 24);
	binary.writeBigUInt64LE(BigInt(metadataSize), at + 32);
	binary.writeBigUInt64LE(BigInt(metadataOffset), at + 40);
	binary.writeBigUInt64LE(BigInt(metadataSize), at + 48);
	binary.writeUInt32LE(1, at + 64);
	writeName(binary, at + SEGMENT_COMMAND_SIZE, "__objc_metadata");
	binary.writeBigUInt64LE(BigInt(metadataSize), at + SEGMENT_COMMAND_SIZE + 40);
	const metadataCommand = at;
	at += SEGMENT_COMMAND_SIZE + SECTION_SIZE;

	binary.writeUInt32LE(0x19, at);
	binary.writeUInt32LE(SEGMENT_COMMAND_SIZE, at + 4);
	writeName(binary, at + 8, "__LINKEDIT");
	binary.writeBigUInt64LE(BigInt(0x200000 + metadataSize + gap), at + 24);
	binary.writeBigUInt64LE(BigInt(PAGE), at + 32);
	binary.writeBigUInt64LE(BigInt(linkeditOffset), at + 40);
	binary.writeBigUInt64LE(BigInt(linkeditPayload.length), at + 48);
	const linkeditCommand = at;
	at += SEGMENT_COMMAND_SIZE;

	binary.writeUInt32LE(0x2, at);
	binary.writeUInt32LE(24, at + 4);
	binary.writeUInt32LE(linkeditOffset, at + 8);
	binary.writeUInt32LE(linkeditOffset + 16, at + 16);
	const symtabCommand = at;
	at += 24;

	binary.writeUInt32LE(0x80000034, at);
	binary.writeUInt32LE(16, at + 4);
	binary.writeUInt32LE(linkeditOffset + 32, at + 8);
	const fixupsCommand = at;

	binary.write("NSMD", metadataOffset, "latin1");
	binary.writeUInt16LE(1, metadataOffset + 4);
	linkeditPayload.copy(binary, linkeditOffset);

	return {
		binary,
		linkeditOffset,
		linkeditPayload,
		metadataCommand,
		linkeditCommand,
		symtabCommand,
		fixupsCommand,
		metadataSize,
	};
}

function metadataOf(length: number, version = 1): Buffer {
	const metadata = Buffer.alloc(length, 7);
	metadata.write("NSMD", 0, "latin1");
	metadata.writeUInt16LE(version, 4);
	return metadata;
}

describe("macho-metadata", () => {
	it("shrinks the file and moves __LINKEDIT down by the saved pages", () => {
		const fake = fakeBinary();
		const metadata = metadataOf(PAGE + 10);

		const result = replaceEmbeddedMetadata(fake.binary, metadata);

		const saved = fake.metadataSize - 2 * PAGE;
		assert.equal(result.length, fake.binary.length - saved);
		assert.equal(
			Number(result.readBigUInt64LE(fake.linkeditCommand + 40)),
			fake.linkeditOffset - saved,
		);
		assert.equal(
			Number(result.readBigUInt64LE(fake.linkeditCommand + 24)),
			0x200000 + 2 * PAGE,
		);
		assert.deepEqual(
			result.subarray(fake.linkeditOffset - saved),
			fake.linkeditPayload,
		);
	});

	it("updates the segment and section sizes", () => {
		const fake = fakeBinary();
		const result = replaceEmbeddedMetadata(fake.binary, metadataOf(100));

		assert.equal(
			Number(result.readBigUInt64LE(fake.metadataCommand + 48)),
			PAGE,
		);
		assert.equal(
			Number(result.readBigUInt64LE(fake.metadataCommand + 32)),
			PAGE,
		);
		assert.equal(
			Number(
				result.readBigUInt64LE(
					fake.metadataCommand + SEGMENT_COMMAND_SIZE + 40,
				),
			),
			100,
		);
	});

	it("rebases every offset that points into __LINKEDIT", () => {
		const fake = fakeBinary();
		const result = replaceEmbeddedMetadata(fake.binary, metadataOf(100));
		const moved = fake.linkeditOffset - 3 * PAGE;

		assert.equal(result.readUInt32LE(fake.symtabCommand + 8), moved);
		assert.equal(result.readUInt32LE(fake.symtabCommand + 16), moved + 16);
		assert.equal(result.readUInt32LE(fake.fixupsCommand + 8), moved + 32);
	});

	it("writes the new metadata at the segment's offset", () => {
		const metadata = metadataOf(100, 3);
		const result = replaceEmbeddedMetadata(fakeBinary().binary, metadata);

		assert.deepEqual(result.subarray(PAGE, PAGE + 100), metadata);
		assert.equal(embeddedMetadataVersion(result), 3);
	});

	it("refuses metadata larger than the segment", () => {
		assert.throws(
			() =>
				replaceEmbeddedMetadata(
					fakeBinary({ metadataPages: 1 }).binary,
					metadataOf(PAGE + 1),
				),
			/larger than the embedded segment/,
		);
	});

	it("refuses a layout where __LINKEDIT does not follow the segment", () => {
		assert.throws(
			() =>
				replaceEmbeddedMetadata(
					fakeBinary({ gapBeforeLinkedit: PAGE }).binary,
					metadataOf(100),
				),
			/directly before __LINKEDIT/,
		);
	});

	it("refuses fat and non-Mach-O files", () => {
		assert.throws(
			() => replaceEmbeddedMetadata(Buffer.alloc(64), metadataOf(100)),
			/thin 64-bit Mach-O/,
		);
	});

	it("reads the embedded format version", () => {
		assert.equal(embeddedMetadataVersion(fakeBinary().binary), 1);
	});

	it("reads a metadata file's format version and rejects other files", () => {
		assert.equal(metadataFileVersion(metadataOf(10, 2)), 2);
		assert.isUndefined(metadataFileVersion(Buffer.from("not metadata")));
	});
});

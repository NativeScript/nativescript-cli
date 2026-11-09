const MH_MAGIC_64 = 0xfeedfacf;
const LC_SEGMENT_64 = 0x19;
const LC_SYMTAB = 0x2;
const LC_DYSYMTAB = 0xb;
const LC_DYLD_INFO = 0x22;
const LC_DYLD_INFO_ONLY = 0x80000022;
const LINKEDIT_DATA_COMMANDS = new Set([
	0x1d, // LC_CODE_SIGNATURE
	0x1e, // LC_SEGMENT_SPLIT_INFO
	0x26, // LC_FUNCTION_STARTS
	0x29, // LC_DATA_IN_CODE
	0x2b, // LC_DYLIB_CODE_SIGN_DRS
	0x2e, // LC_LINKER_OPTIMIZATION_HINT
	0x36, // LC_ATOM_INFO
	0x80000033, // LC_DYLD_EXPORTS_TRIE
	0x80000034, // LC_DYLD_CHAINED_FIXUPS
]);
const OFFSET_FIELDS: Record<number, number[]> = {
	[LC_SYMTAB]: [8, 16],
	[LC_DYSYMTAB]: [32, 40, 48, 56, 64, 72],
	[LC_DYLD_INFO]: [8, 16, 24, 32, 40],
	[LC_DYLD_INFO_ONLY]: [8, 16, 24, 32, 40],
};

const METADATA_SEGMENT = "__objc_metadata";
const LINKEDIT_SEGMENT = "__LINKEDIT";
const NSMD_MAGIC = "NSMD";
const PAGE_SIZE = 0x4000;
const SECTION_64_SIZE = 80;

interface Segment {
	commandOffset: number;
	vmAddress: bigint;
	vmSize: bigint;
	fileOffset: number;
	fileSize: number;
	sectionCount: number;
}

function segmentName(binary: Buffer, offset: number): string {
	const raw = binary.subarray(offset, offset + 16);
	const end = raw.indexOf(0);
	return raw.toString("latin1", 0, end === -1 ? 16 : end);
}

function forEachCommand(
	binary: Buffer,
	visit: (type: number, offset: number) => void,
): void {
	const commandCount = binary.readUInt32LE(16);
	let offset = 32;
	for (let i = 0; i < commandCount; i++) {
		visit(binary.readUInt32LE(offset), offset);
		offset += binary.readUInt32LE(offset + 4);
	}
}

function findSegments(binary: Buffer): Record<string, Segment> {
	if (binary.length < 32 || binary.readUInt32LE(0) !== MH_MAGIC_64) {
		throw new Error(
			"Expected a thin 64-bit Mach-O binary. Pass the single-architecture slice of the framework.",
		);
	}
	const segments: Record<string, Segment> = {};
	forEachCommand(binary, (type, offset) => {
		if (type === LC_SEGMENT_64) {
			segments[segmentName(binary, offset + 8)] = {
				commandOffset: offset,
				vmAddress: binary.readBigUInt64LE(offset + 24),
				vmSize: binary.readBigUInt64LE(offset + 32),
				fileOffset: Number(binary.readBigUInt64LE(offset + 40)),
				fileSize: Number(binary.readBigUInt64LE(offset + 48)),
				sectionCount: binary.readUInt32LE(offset + 64),
			};
		}
	});
	return segments;
}

function readFormatVersion(data: Buffer): number | undefined {
	if (data.toString("latin1", 0, 4) !== NSMD_MAGIC) {
		return undefined;
	}
	return data.readUInt16LE(4);
}

/** The metadata format version a NativeScript binary embeds, if it has any. */
export function embeddedMetadataVersion(binary: Buffer): number | undefined {
	const segment = findSegments(binary)[METADATA_SEGMENT];
	return segment && readFormatVersion(binary.subarray(segment.fileOffset));
}

export function metadataFileVersion(metadata: Buffer): number | undefined {
	return readFormatVersion(metadata);
}

/**
 * Returns `binary` with its embedded metadata replaced by `metadata` and the
 * segment shrunk to fit, so the file itself gets smaller. The code signature
 * no longer matches and the result has to be signed again.
 */
export function replaceEmbeddedMetadata(
	binary: Buffer,
	metadata: Buffer,
): Buffer {
	const segments = findSegments(binary);
	const target = segments[METADATA_SEGMENT];
	const linkedit = segments[LINKEDIT_SEGMENT];
	if (!target) {
		throw new Error(`This binary has no ${METADATA_SEGMENT} segment.`);
	}
	// Only __LINKEDIT can move: it is addressed by file offsets alone, while
	// every other segment is referenced by absolute addresses in the code.
	if (
		!linkedit ||
		linkedit.fileOffset !== target.fileOffset + target.fileSize ||
		linkedit.vmAddress !== target.vmAddress + target.vmSize
	) {
		throw new Error(
			`${METADATA_SEGMENT} must be directly before ${LINKEDIT_SEGMENT} to be resized.`,
		);
	}

	const newSize = Math.ceil(metadata.length / PAGE_SIZE) * PAGE_SIZE;
	if (newSize > target.fileSize) {
		throw new Error(
			`The new metadata (${metadata.length} bytes) is larger than the embedded segment (${target.fileSize} bytes).`,
		);
	}
	const delta = target.fileSize - newSize;

	const head = Buffer.from(binary.subarray(0, target.fileOffset));

	const moveOffset = (fieldOffset: number) => {
		const value = head.readUInt32LE(fieldOffset);
		if (value >= linkedit.fileOffset) {
			head.writeUInt32LE(value - delta, fieldOffset);
		}
	};
	forEachCommand(head, (type, offset) => {
		for (const field of OFFSET_FIELDS[type] ?? []) {
			moveOffset(offset + field);
		}
		if (LINKEDIT_DATA_COMMANDS.has(type)) {
			moveOffset(offset + 8);
		}
	});

	const shrunk = BigInt(delta);
	head.writeBigUInt64LE(target.vmSize - shrunk, target.commandOffset + 32);
	head.writeBigUInt64LE(BigInt(newSize), target.commandOffset + 48);
	for (let i = 0; i < target.sectionCount; i++) {
		const section = target.commandOffset + 72 + i * SECTION_64_SIZE;
		head.writeBigUInt64LE(BigInt(metadata.length), section + 40);
	}
	head.writeBigUInt64LE(
		linkedit.vmAddress - shrunk,
		linkedit.commandOffset + 24,
	);
	head.writeBigUInt64LE(
		BigInt(linkedit.fileOffset - delta),
		linkedit.commandOffset + 40,
	);

	const payload = Buffer.alloc(newSize);
	metadata.copy(payload);
	return Buffer.concat([head, payload, binary.subarray(linkedit.fileOffset)]);
}

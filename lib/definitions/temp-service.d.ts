import type { TempService } from "../contracts/temp-service";

export type AffixOptions = {
	prefix?: string;
	suffix?: string;
	dir?: string;
};

/**
 * Declares wrapped functions of temp module
 */
/** @deprecated Kept so existing annotations compile; use the {@link TempService} contract. */
export interface ITempService extends TempService {}

import type { TempService } from "../contracts/temp-service";

export type AffixOptions = {
	prefix?: string;
	suffix?: string;
	dir?: string;
};

/**
 * Declares wrapped functions of temp module
 */
export interface ITempService extends TempService {}

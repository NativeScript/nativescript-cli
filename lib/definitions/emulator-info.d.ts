interface IEmulatorInfo {
    name: string;
    version: string;
    platform: string;
    id: string;
    type: string;
}

interface IEmulatorInfoService {
    listAvailableEmulators(platform: string): IFuture<void>;
    containsEmulator(platform: string, emulator: string): boolean;
}
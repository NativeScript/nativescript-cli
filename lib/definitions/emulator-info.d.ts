interface IEmulatorInfo {
    name: string;
    version: string;
    platform: string;
    id: string;
    type: string;
    isRunning?: boolean;
}

interface IEmulatorInfoService {
    listAvailableEmulators(platform: string): IFuture<void>;
    getEmulatorInfo(platform: string, nameOfId: string): IFuture<IEmulatorInfo>;
    getiOSEmulators(): IFuture<IEmulatorInfo[]>;
    getAndroidEmulators(): IFuture<IEmulatorInfo[]>;
    startEmulator(info: IEmulatorInfo): IFuture<void>;
    stopEmulator(platform: string): IFuture<void>;
}
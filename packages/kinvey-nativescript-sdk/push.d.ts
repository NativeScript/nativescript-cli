// PushOptions interface
interface PushOptions {
  android?: {
    senderID: string
  };
  ios?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean
  };
}

// Push class
export class Push {
  private constructor();
  static pathname: string;
  static isSupported(): boolean;
  static onNotification(listener: (notifaction: any) => void);
  static onceNotification(listener: (notifaction: any) => void);
  static register(options: PushOptions): Promise<string>;
  static unregister(): Promise<null>;
}

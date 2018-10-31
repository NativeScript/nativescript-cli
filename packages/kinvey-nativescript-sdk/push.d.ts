declare interface FcmNotificaion {
  getBody(): string;
  getBodyLocalizationArgs(): string[];
  getBodyLocalizationKey(): string;
  getClickAction(): string;
  getColor(): string;
  getIcon(): string;
  getSound(): string;
  getTag(): string;
  getTitle(): string;
  getTitleLocalizationArgs(): string[];
  getTitleLocalizationKey(): string;
}

declare interface IosInteractiveNotificationAction {
  identifier: string;
  title: string;
  activationMode?: string;
  destructive?: boolean;
  authenticationRequired?: boolean;
  behavior?: string;
}

declare interface IosInteractiveNotificationCategory {
  identifier: string;
  actionsForDefaultContext: string[];
  actionsForMinimalContext: string[];
}

interface PushOptions {
  android?: {
    senderID: string,
    notificationCallbackAndroid?: (jsonDataString: string, notification: FcmNotificaion) => void
  };
  ios?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean,
    interactiveSettings: {
      actions: IosInteractiveNotificationAction[],
      categories: IosInteractiveNotificationCategory[]
    },
    notificationCallbackIOS?: (message: any) => void
  };
  notificationCallback?: (message: any) => void;
}

// Push class
export class Push {
  private constructor();
  static pathname: string;
  static isSupported(): boolean;
  static onNotification(listener: (notifaction: any) => void);
  static onceNotification(listener: (notifaction: any) => void);
  static register(options: PushOptions): Promise<string>;
  static unregister(options: PushOptions): Promise<null>;
}

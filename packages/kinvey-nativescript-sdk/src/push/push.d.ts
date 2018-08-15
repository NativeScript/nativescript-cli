export interface AndroidPushConfig {
  senderID: string;
  notificationCallbackAndroid?: any;
}

export interface IOSPushConfig {
  alert?: boolean;
  badge?: boolean;
  sound?: boolean;
  clearBadge?: boolean;
  interactiveSettings?: {
    actions?: Array<{
      identifier: string;
      title: string;
      activationMode?: string;
      destructive?: boolean;
      authenticationRequired?: boolean;
      behavior?: string;
    }>;
    categories?: Array<{
      identifier: string;
      actionsForDefaultContext: string[];
      actionsForMinimalContext: string[];
    }>;
  };
  notificationCallbackIOS?: (message: any) => void;
}

export interface PushConfig {
  android?: AndroidPushConfig;
  ios?: IOSPushConfig;
  timeout?: number;
}

export namespace Push {
  function onNotification(listener: (data: any) => void);
  function onceNotification(listener: (data: any) => void);
  function register(options: PushConfig);
  function unregister(options: PushConfig);
}

export interface AndroidPushConfig {
  senderID: string;
}

export interface IOSPushConfig {
  alert: boolean;
  badge: boolean;
  sound: boolean;
  interactiveSettings?: any;
  notificationCallbackIOS?: any;
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

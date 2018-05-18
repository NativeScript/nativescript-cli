// Type definitions for Kinvey JavaScript SDK
// Definitions by: Kinvey <https://github.com/Kinvey>

import {
  Observable
} from 'rxjs/Observable';

export namespace Kinvey {
  export let appVersion: string;
  export function initialize(config?: ClientConfig): Promise<User> ;
  export function init(config?: ClientConfig): Client;

  interface PingResponse {
    version: string;
    kinvey: string;
    appName: string;
    environmentName: string;
  }

  export function ping(): Promise<PingResponse>;

  // Request Options interface
  interface RequestOptions {
    properties?: Properties;
    timeout?: number;
    useDeltaSet?: boolean;
    version?: string;
    micId?: string;
  }

  // ClientConfig interface
  interface ClientConfig {
    apiHostname?: string;
    micHostname?: string;
    appKey: string;
    appSecret?: string;
    masterSecret?: string;
    encryptionKey?: string;
    defaultTimeout?: number;
  }

  export namespace LiveService {
    type StatusHandler = (status: StatusMessage) => void;
    type MessageHandler = (payload: any) => void;
    type ErrorHandler = (error: KinveyError) => void;

    interface StatusMessage {
      category: string;
      operation: string;
      affectedChannels: string[];
      subscribedChannels: string[];
      affectedChannelGroups: string[];
      lastTimetoken: number;
      currentTimetoken: number;
    }

    interface PlainStreamACLObject {
      _id?: string;
      publish?: string[];
      subscribe?: string[];
      groups?: {
        publish?: string,
        subscribe?: string[]
      }
    }

    interface MessageReceiver {
      onMessage?: MessageHandler;
      onStatus?: StatusHandler;
      onError?: ErrorHandler;
    }

    namespace Stream {
      class StreamACL {
        publishers: string[];
        subscribers: string[];
        publisherGroups: string[];
        subscriberGroups: string[];

        static isValidACLObject: (obj: any) => boolean;

        constructor(obj: StreamACL | PlainStreamACLObject);

        addPublishers(publishers: User | User[] | string | string[]): this;
        addSubscribers(publishers: User | User[] | string | string[]): this;
        addPublisherGroups(groups: string | string[] | {
          _id: string
        } | {
          _id: string
        }[]): this;
        addSubscriberGroups(groups: string | string[] | {
          _id: string
        } | {
          _id: string
        }[]): this;
        isNotEmpty(): boolean;
        toPlainObject(): PlainStreamACLObject;
      }
    }

    class Stream {
      name: string;

      constructor(name: string);

      getSubstreams(): Promise<{
        _id: string
      }>;
      getACL(userId: string): Promise<PlainStreamACLObject>;
      setACL(userId: string, acl: PlainStreamACLObject | Stream.StreamACL): Promise<PlainStreamACLObject>;

      follow(userId: string, receiver: MessageReceiver): Promise<void>;
      unfollow(userId: string): Promise<void>;
      post(message: any): Promise<{
        timetoken: string
      }>;

      listen(receiver: MessageReceiver): Promise<void>;
      stopListening(): Promise<void>;
      send(userId: string, message: any): Promise<{
        timetoken: string
      }>;
    }

    function onConnectionStatusUpdates(handler: StatusHandler): void;

    function offConnectionStatusUpdates(handler?: StatusHandler): void;

    function isInitialized(): boolean;
  }

  // Client class
  export class Client {
    constructor(config: ClientConfig);
    readonly activeUser: {};
    apiProtocol: string;
    apiHost: string;
    readonly apiHostname: string;
    micProtocol: string;
    micHost: string;
    readonly micHostname: string;
    appVersion: string;
    defaultTimeout: number;
    toPlainObject(): {};
    static initialize(config: ClientConfig): Client;
    static sharedInstance(): Client;
  }

  // Acl class
  export class Acl {
    constructor(entity: {})
    readonly creator: string;
    readonly readers: string[];
    readonly writers: string[];
    readonly readerGroups: string[];
    readonly writerGroups: string[];
    globallyReadable: boolean;
    globallyWritable: boolean;
    addReader(user: string): this;
    addReaderGroup(group: string[]): this;
    addWriter(user: string): this;
    adddWriterGroup(group: string[]): this;
    isGloballyReadable(): boolean;
    isGloballyWritable(): boolean;
    removeReader(user: string): this;
    removeReaderGroup(group: string[]): this;
    removeWriter(user: string): this;
    removeWriterGroup(group: string[]): this;
    toPlainObject(): {};
  }

  // Metadata class
  export class Metadata {
    constructor(entity: {});
    isLocal(): boolean;
    toPlainObject(): {};
  }

  // Aggregation class
  export class Aggregation {
    constructor(options?: {
      query?: Query
      initial?: {}
      key?: {}
      reduceFn?: () => any
    })
    by(field: string): this;
    toJSON(): {
      query: {}
      initial: {}
      key: {}
      reduce: () => any
      reduceFn: () => any
      condition: {}
    };
    static count(field: string): Aggregation;
    static sum(field: string): Aggregation;
    static min(field: string): Aggregation;
    static max(field: string): Aggregation;
    static average(field: string): Aggregation;
  }

  // Group class
  export class Group extends Aggregation { }

  // Custom Endpoint class
  export class CustomEndpoint {
    static execute(endpoint: string, args?: {}, options?: RequestOptions): Promise<{}>;
  }

  // Properties class
  export class Properties {
    constructor(properties?: {});
    get(name: string): string | undefined;
    set(name: string, value: any): this;
    has(name: string): boolean;
    add(property: {}): this;
    addAll(properties: {}): this;
    remove(name: string): this;
    clear(): this;
    toPlainObject(): {};
    toString(): string;
  }

  // DataStoreType enum
  export enum DataStoreType {
    Cache,
    Network,
    Sync
  }

  // SyncOperation enum
  export enum SyncOperation {
    Create,
    Update,
    Delete
  }

  // Push Result interface
  interface PushResult<T> {
    _id: string;
    operation: SyncOperation;
    entity?: T;
    error?: BaseError;
  }

  // Entity interface
  export interface Entity {
    _id: string;
    _acl?: Acl;
    _kmd?: any;
  }

  // SyncEntity interface
  interface SyncEntity extends Entity {
    collection: string;
    state: {
      operation: SyncOperation
    };
    entityId: string;
  }

  // DataStore class
  export abstract class DataStore {
    static collection<T extends Entity>(collection: string, type?: DataStoreType, options?: {
      client?: Client;
      ttl?: number;
      useDeltaSet?: boolean;
    }): CacheStore<T>;
    static clearCache(options?: RequestOptions): Promise<{}>;
  }

  // NetworkStore class
  class NetworkStore<T extends Entity = Entity> {
    protected constructor();
    client: Client;
    pathname: string;

    find(query?: Query, options?: RequestOptions): Observable<T[]>;
    findById(id: string, options?: RequestOptions): Observable<T>;
    group(aggregation: Aggregation, options?: RequestOptions): Observable<{}>;
    count(query?: Query, options?: RequestOptions): Observable<{
      count: number
    }>;
    create(entities: {}, options?: RequestOptions): Promise<T>;
    update(entities: {}, options?: RequestOptions): Promise<T>;
    save(entity: {}, options?: RequestOptions): Promise<T>;
    remove(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
    removeById(id: string, options?: RequestOptions): Promise<{
      count: number
    }>;

    subscribe(receiver: LiveService.MessageReceiver): Promise<void>;
    unsubscribe(): Promise<void>;
  }

  // CacheStore class
  class CacheStore<T extends Entity = Entity> extends NetworkStore<T> {
    useDeltaSet: boolean;

    clear(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
    pendingSyncCount(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
    pendingSyncEntities(query?: Query, options?: RequestOptions): Promise<SyncEntity[]>;
    push(query?: Query, options?: RequestOptions): Promise<PushResult<T>[]>;
    pull(query?: Query, options?: PullRequestOptions): Promise<number>;
    sync(query?: Query, options?: PullRequestOptions): Promise<{
      push: PushResult<T>[],
      pull: number
    }>;
    clearSync(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
  }

  // SyncStore class
  class SyncStore<T extends Entity = Entity> extends CacheStore<T> { }

  // File Metadata interface
  interface FileMetadata {
    _id?: string;
    filename?: string;
    mimeType?: string;
    public?: boolean;
    size?: number;
  }

  // File interface
  export interface File extends Entity {
    _filename: string;
    _downloadURL: string;
    _expiresAt: string;
    _public: boolean;
    size: number;
    mimeType: string;
  }

  // Files class
  export class Files {
    static find<T extends File = File>(query?: Query, options?: RequestOptions): Promise<T[]>;
    static findById<T extends File = File>(id: string, options?: RequestOptions): Promise<T>;
    static download<T extends File = File>(name: string, options?: RequestOptions): Promise<T>;
    static downloadByUrl(url: string, options?: RequestOptions): Promise<{}>;
    static stream<T extends File = File>(name: string, options?: RequestOptions): Promise<T>;
    static group(aggregation: Aggregation, options?: RequestOptions): Promise<{}>;
    static count(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
    static upload<T extends File = File>(file: {}, metadata?: FileMetadata, options?: RequestOptions): Promise<T>;
    static remove(query?: Query, options?: RequestOptions): Promise<{
      count: number
    }>;
    static removeById(id: string, options?: RequestOptions): Promise<{
      count: number
    }>;
  }

  // Query class
  export class Query {
    fields: any[];
    filter: {};
    sort: string;
    limit: number;
    skip: number;
    constructor(options?: {
      fields?: any[]
      filter?: {}
      sort?: string
      limit?: number
      skip?: number
    });
    isSupportedOffline(): boolean;
    equalTo(field: string, value: any): this;
    contains(field: string, values: any[]): this;
    containsAll(field: string, values: any[]): this;
    greaterThan(field: string, value: number | string): this;
    greaterThanOrEqualTo(field: string, value: number | string): this;
    lessThan(field: string, value: number | string): this;
    lessThanOrEqualTo(field: string, value: number | string): this;
    notEqualTo(field: string, value: any): this;
    notContainedIn(field: string, values: any[]): this;
    and(queries?: {} | Query | {}[] | Query[]): this;
    nor(queries?: {} | Query | {}[] | Query[]): this;
    or(queries?: {} | Query | {}[] | Query[]): this;
    exists(field: string, flag: boolean): this;
    mod(field: string, divisor: number, remainder: number): this;
    matches(field: string, regExp: string | RegExp, options?: {}): this;
    near(field: string, coord: number[], maxDistance?: number): this;
    withinBox(field: string, bottomLeftCoord: number, upperRightCoord: number): this;
    withinPolygon(field: string, coords: number[]): this;
    size(field: string, size: number): this;
    ascending(field: string): this;
    descending(field: string): this;
    toPlainObject(): {
      fields: any[]
      filter?: {}
      sort?: string
      limit?: number
      skip?: number
    };
    toQueryString(): {};
    toString(): string;
  }

  // Authorization Grant enum
  export enum AuthorizationGrant {
    AuthorizationCodeLoginPage,
    AuthorizationCodeAPI
  }

  // User class
  export class User {
    constructor(data?: {}, options?: {
      client?: Client
    })
    data: {};
    _id: string | undefined;
    _acl: Acl;
    metadata: Metadata;
    _kmd: Metadata;
    _socialIdentity: {} | undefined;
    authtoken: string | undefined;
    username: string | undefined;
    email: string | undefined;
    pathname: string;
    isActive(): boolean;
    isEmailVerified(): boolean;
    login(username: string, password: string): Promise<this>;
    static login(username: string, password: string): Promise<User>;
    loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<this>;
    static loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<User>;
    logout(options?: RequestOptions): Promise<void>;
    static logout(options?: RequestOptions): Promise<void>;
    signup(data?: {}, options?: RequestOptions): Promise<this>;
    static signup(data?: {}, options?: RequestOptions): Promise<User>;
    update(data: {}, options?: RequestOptions): Promise<this>;
    static update(data: {}, options?: RequestOptions): Promise<User>;
    me(options?: RequestOptions): Promise<this>;
    static me(options?: RequestOptions): Promise<User>;
    static verifyEmail(username: string, options?: RequestOptions): Promise<{}>;
    static forgotUsername(email: string, options?: RequestOptions): Promise<{}>;
    static resetPassword(username: string, options?: RequestOptions): Promise<{}>;
    static lookup(query?: Query, options?: RequestOptions): Promise<{}>;
    static exists(username: string, options?: RequestOptions): Promise<{}>;
    static getActiveUser(client?: Client): User | null;
    static registerForLiveService(): Promise<void>;
    static unregisterFromLiveService(): Promise<void>;
    registerForLiveService(): Promise<void>;
    unregisterFromLiveService(): Promise<void>;
  }

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
    static client: Client;
    static isSupported(): boolean;
    static onNotification(listener: (notifaction: any) => void);
    static onceNotification(listener: (notifaction: any) => void);
    static register(options: PushOptions): Promise<string>;
    static unregister(): Promise<null>;
  }

  // Error classes
  export abstract class BaseError {
    name: string;
    message: string;
    debug: string;
    code: number;
    kinveyRequestId: string;
    stack: string;
    constructor(message: string, debug: string, code: number, kinveyRequestId: string);
  }
  export class ActiveUserError extends BaseError { }
  export class ApiVersionNotAvailableError extends BaseError { }
  export class ApiVersionNotImplemented extends BaseError { }
  export class AppPromblemError extends BaseError { }
  export class BadRequestError extends BaseError { }
  export class BusinessLogicError extends BaseError { }
  export class CORSDisabledError extends BaseError { }
  export class DuplicateEndUsersError extends BaseError { }
  export class FeatureUnavailableError extends BaseError { }
  export class IncompleteRequestBodyError extends BaseError { }
  export class IndirectCollectionAccessDisallowedError extends BaseError { }
  export class InsufficientCredentialsError extends BaseError { }
  export class InvalidCredentialsError extends BaseError { }
  export class InvalidIdentifierError extends BaseError { }
  export class InvalidQuerySyntaxError extends BaseError { }
  export class JSONParseError extends BaseError { }
  export class KinveyError extends BaseError { }
  export class KinveyInternalErrorRetry extends BaseError { }
  export class KinveyInternalErrorStop extends BaseError { }
  export class MissingQueryError extends BaseError { }
  export class MissingRequestHeaderError extends BaseError { }
  export class MobileIdentityConnectError extends BaseError { }
  export class NetworkConnectionError extends BaseError { }
  export class NoActiveUserError extends BaseError { }
  export class NoResponseError extends BaseError { }
  export class NotFoundError extends BaseError { }
  export class ParameterValueOutOfRangeError extends BaseError { }
  export class PopupError extends BaseError { }
  export class QueryError extends BaseError { }
  export class ServerError extends BaseError { }
  export class StaleRequestError extends BaseError { }
  export class SyncError extends BaseError { }
  export class TimeoutError extends BaseError { }
  export class UserAlreadyExistsError extends BaseError { }
  export class WritesToCollectionDisallowedError extends BaseError { }
}

export let appVersion: string;

export function initialize(config: ClientConfig): Promise<User>;
export function init(config: ClientConfig): Client;

interface PingResponse {
  version: string;
  kinvey: string;
  appName: string;
  environmentName: string;
}

export function ping(): Promise<PingResponse>;

// Request Options interface
interface RequestOptions {
  properties?: Properties;
  timeout?: number;
  useDeltaSet?: boolean;
  version?: string;
  micId?: string;
}

// ClientConfig interface
interface ClientConfig {
  apiHostname?: string;
  micHostname?: string;
  appKey: string;
  appSecret?: string;
  masterSecret?: string;
  encryptionKey?: string;
  defaultTimeout?: number;
}

export namespace LiveService {
  type StatusHandler = (status: StatusMessage) => void;
  type MessageHandler = (payload: any) => void;
  type ErrorHandler = (error: KinveyError) => void;

  interface StatusMessage {
    category: string;
    operation: string;
    affectedChannels: string[];
    subscribedChannels: string[];
    affectedChannelGroups: string[];
    lastTimetoken: number;
    currentTimetoken: number;
  }

  interface PlainStreamACLObject {
    _id?: string;
    publish?: string[];
    subscribe?: string[];
    groups?: {
      publish?: string,
      subscribe?: string[]
    }
  }

  interface MessageReceiver {
    onMessage?: MessageHandler;
    onStatus?: StatusHandler;
    onError?: ErrorHandler;
  }

  namespace Stream {
    class StreamACL {
      publishers: string[];
      subscribers: string[];
      publisherGroups: string[];
      subscriberGroups: string[];

      static isValidACLObject: (obj: any) => boolean;

      constructor(obj?: StreamACL | PlainStreamACLObject);

      addPublishers(publishers: User | User[] | string | string[]): this;
      addSubscribers(publishers: User | User[] | string | string[]): this;
      addPublisherGroups(groups: string | string[] | {
        _id: string
      } | {
        _id: string
      }[]): this;
      addSubscriberGroups(groups: string | string[] | {
        _id: string
      } | {
        _id: string
      }[]): this;
      isNotEmpty(): boolean;
      toPlainObject(): PlainStreamACLObject;
    }
  }

  class Stream {
    name: string;

    constructor(name: string);

    getSubstreams(): Promise<{ _id: string }[]>;
    getACL(userId: string): Promise<PlainStreamACLObject>;
    setACL(userId: string, acl: PlainStreamACLObject | Stream.StreamACL): Promise<PlainStreamACLObject>;

    follow(userId: string, receiver: MessageReceiver): Promise<void>;
    unfollow(userId: string): Promise<void>;
    post(message: any): Promise<{
      timetoken: string
    }>;

    listen(receiver: MessageReceiver): Promise<void>;
    stopListening(): Promise<void>;
    send(userId: string, message: any): Promise<{
      timetoken: string
    }>;
  }

  function onConnectionStatusUpdates(handler: StatusHandler): void;

  function offConnectionStatusUpdates(handler?: StatusHandler): void;

  function isInitialized(): boolean;
}

// Client class
export class Client {
  constructor(config: ClientConfig);
  readonly activeUser: {};
  apiProtocol: string;
  apiHost: string;
  readonly apiHostname: string;
  micProtocol: string;
  micHost: string;
  readonly micHostname: string;
  appVersion: string;
  defaultTimeout: number;
  toPlainObject(): {};
  static initialize(config: ClientConfig): Client;
  static sharedInstance(): Client;
}

// Acl class
export class Acl {
  constructor(entity: {})
  readonly creator: string;
  readonly readers: string[];
  readonly writers: string[];
  readonly readerGroups: string[];
  readonly writerGroups: string[];
  globallyReadable: boolean;
  globallyWritable: boolean;
  addReader(user: string): this;
  addReaderGroup(group: string[]): this;
  addWriter(user: string): this;
  adddWriterGroup(group: string[]): this;
  isGloballyReadable(): boolean;
  isGloballyWritable(): boolean;
  removeReader(user: string): this;
  removeReaderGroup(group: string[]): this;
  removeWriter(user: string): this;
  removeWriterGroup(group: string[]): this;
  toPlainObject(): {};
}

// Metadata class
export class Metadata {
  constructor(entity: {});
  isLocal(): boolean;
  toPlainObject(): {};
}

// Aggregation class
export class Aggregation {
  constructor(options?: {
    query?: Query
    initial?: {}
    key?: {}
    reduceFn?: () => any
  })
  by(field: string): this;
  toJSON(): {
    query: {}
    initial: {}
    key: {}
    reduce: () => any
    reduceFn: () => any
    condition: {}
  };
  static count(field: string): Aggregation;
  static sum(field: string): Aggregation;
  static min(field: string): Aggregation;
  static max(field: string): Aggregation;
  static average(field: string): Aggregation;
}

// Group class
export class Group extends Aggregation { }

// Custom Endpoint class
export class CustomEndpoint {
  static execute(endpoint: string, args?: {}, options?: RequestOptions): Promise<{}>;
}

// Properties class
export class Properties {
  constructor(properties?: {});
  get(name: string): string | undefined;
  set(name: string, value: any): this;
  has(name: string): boolean;
  add(property: {}): this;
  addAll(properties: {}): this;
  remove(name: string): this;
  clear(): this;
  toPlainObject(): {};
  toString(): string;
}

// DataStoreType enum
export enum DataStoreType {
  Cache,
  Network,
  Sync
}

// SyncOperation enum
export enum SyncOperation {
  Create,
  Update,
  Delete
}

// Push Result interface
interface PushResult<T> {
  _id: string;
  operation: SyncOperation;
  entity?: T;
  error?: BaseError;
}

// Entity interface
export interface Entity {
  _id: string;
  _acl?: Acl;
  _kmd?: any;
}

// SyncEntity interface
interface SyncEntity extends Entity {
  collection: string;
  state: {
    operation: SyncOperation
  };
  entityId: string;
}

interface PullRequestOptions {
  timeout?: number,
  useDeltaSet?: boolean,
  autoPagination?: boolean | { pageSize?: number }
}

// DataStore class
export abstract class DataStore {
  static collection<T extends Entity>(collection: string, type?: DataStoreType, options?: {
    client?: Client;
    ttl?: number;
    useDeltaSet?: boolean;
  }): CacheStore<T>;
  static clearCache(options?: RequestOptions): Promise<{}>;
}

// NetworkStore class
declare class NetworkStore<T extends Entity = Entity> {
  protected constructor();
  client: Client;
  pathname: string;

  find(query?: Query, options?: RequestOptions): Observable<T[]>;
  findById(id: string, options?: RequestOptions): Observable<T>;
  group(aggregation: Aggregation, options?: RequestOptions): Observable<{}>;
  count(query?: Query, options?: RequestOptions): Observable<{ count: number }>;
  create(entity: T, options?: RequestOptions): Promise<T>;
  update(entity: T, options?: RequestOptions): Promise<T>;
  save(entity: T, options?: RequestOptions): Promise<T>;
  remove(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
  removeById(id: string, options?: RequestOptions): Promise<{ count: number }>;

  subscribe(receiver: LiveService.MessageReceiver): Promise<void>;
  unsubscribe(): Promise<void>;
}

// CacheStore class
declare class CacheStore<T extends Entity = Entity> extends NetworkStore<T> {
  useDeltaSet: boolean;

  clear(query?: Query, options?: RequestOptions): Promise<{
    count: number
  }>;
  pendingSyncCount(query?: Query, options?: RequestOptions): Promise<{
    count: number
  }>;
  pendingSyncEntities(query?: Query, options?: RequestOptions): Promise<SyncEntity[]>;
  push(query?: Query, options?: RequestOptions): Promise<PushResult<T>[]>;
  pull(query?: Query, options?: PullRequestOptions): Promise<number>;
  sync(query?: Query, options?: PullRequestOptions): Promise<{
    push: PushResult<T>[],
    pull: number
  }>;
  clearSync(query?: Query, options?: RequestOptions): Promise<{
    count: number
  }>;
}

// SyncStore class
declare class SyncStore<T extends Entity = Entity> extends CacheStore<T> { }

// File Metadata interface
interface FileMetadata {
  _id?: string;
  filename?: string;
  mimeType?: string;
  public?: boolean;
  size?: number;
}

// File interface
export interface File extends Entity {
  _filename: string;
  _downloadURL: string;
  _expiresAt: string;
  _public: boolean;
  size: number;
  mimeType: string;
}

// Files class
export class Files {
  static find<T extends File = File>(query?: Query, options?: RequestOptions): Promise<T[]>;
  static findById<T extends File = File>(id: string, options?: RequestOptions): Promise<T>;
  static download<T extends File = File>(name: string, options?: RequestOptions): Promise<T>;
  static downloadByUrl(url: string, options?: RequestOptions): Promise<{}>;
  static stream<T extends File = File>(name: string, options?: RequestOptions): Promise<T>;
  static group(aggregation: Aggregation, options?: RequestOptions): Promise<{}>;
  static count(query?: Query, options?: RequestOptions): Promise<{
    count: number
  }>;
  static upload<T extends File = File>(file: {}, metadata?: FileMetadata, options?: RequestOptions): Promise<T>;
  static remove(query?: Query, options?: RequestOptions): Promise<{
    count: number
  }>;
  static removeById(id: string, options?: RequestOptions): Promise<{
    count: number
  }>;
}

// Query class
export class Query {
  fields: any[];
  filter: {};
  sort: string;
  limit: number;
  skip: number;
  constructor(options?: {
    fields?: any[]
    filter?: {}
    sort?: string
    limit?: number
    skip?: number
  });
  isSupportedOffline(): boolean;
  equalTo(field: string, value: any): this;
  contains(field: string, values: any[]): this;
  containsAll(field: string, values: any[]): this;
  greaterThan(field: string, value: number | string): this;
  greaterThanOrEqualTo(field: string, value: number | string): this;
  lessThan(field: string, value: number | string): this;
  lessThanOrEqualTo(field: string, value: number | string): this;
  notEqualTo(field: string, value: any): this;
  notContainedIn(field: string, values: any[]): this;
  and(queries?: {} | Query | {}[] | Query[]): this;
  nor(queries?: {} | Query | {}[] | Query[]): this;
  or(queries?: {} | Query | {}[] | Query[]): this;
  exists(field: string, flag: boolean): this;
  mod(field: string, divisor: number, remainder: number): this;
  matches(field: string, regExp: string | RegExp, options?: {}): this;
  near(field: string, coord: number[], maxDistance?: number): this;
  withinBox(field: string, bottomLeftCoord: number, upperRightCoord: number): this;
  withinPolygon(field: string, coords: number[]): this;
  size(field: string, size: number): this;
  ascending(field: string): this;
  descending(field: string): this;
  toPlainObject(): {
    fields: any[]
    filter?: {}
    sort?: string
    limit?: number
    skip?: number
  };
  toQueryString(): {};
  toString(): string;
}

// Authorization Grant enum
export enum AuthorizationGrant {
  AuthorizationCodeLoginPage,
  AuthorizationCodeAPI
}

// User class
export class User {
  constructor(data?: {}, options?: { client?: Client })
  data: any;
  _id: string | undefined;
  _acl: Acl;
  metadata: Metadata;
  _kmd: Metadata;
  _socialIdentity: {} | undefined;
  authtoken: string | undefined;
  username: string | undefined;
  email: string | undefined;
  pathname: string;
  isActive(): boolean;
  isEmailVerified(): boolean;
  login(username: string, password: string): Promise<this>;
  static login(username: string, password: string): Promise<User>;
  loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<this>;
  static loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<User>;
  logout(options?: RequestOptions): Promise<void>;
  static logout(options?: RequestOptions): Promise<void>;
  signup(data?: {}, options?: RequestOptions): Promise<this>;
  static signup(data?: {}, options?: RequestOptions): Promise<User>;
  update(data: {}, options?: RequestOptions): Promise<this>;
  static update(data: {}, options?: RequestOptions): Promise<User>;
  me(options?: RequestOptions): Promise<this>;
  static me(options?: RequestOptions): Promise<User>;
  static verifyEmail(username: string, options?: RequestOptions): Promise<{}>;
  static forgotUsername(email: string, options?: RequestOptions): Promise<{}>;
  static resetPassword(username: string, options?: RequestOptions): Promise<{}>;
  static lookup(query?: Query, options?: RequestOptions): Promise<{}>;
  static exists(username: string, options?: RequestOptions): Promise<{}>;
  static getActiveUser(client?: Client): User | null;
  static registerForLiveService(): Promise<void>;
  static unregisterFromLiveService(): Promise<void>;
  registerForLiveService(): Promise<void>;
  unregisterFromLiveService(): Promise<void>;
}

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
  static client: Client;
  static isSupported(): boolean;
  static onNotification(listener: (notifaction: any) => void);
  static onceNotification(listener: (notifaction: any) => void);
  static register(options: PushOptions): Promise<string>;
  static unregister(): Promise<null>;
}

// Error classes
export abstract class BaseError {
  name: string;
  message: string;
  debug: string;
  code: number;
  kinveyRequestId: string;
  stack: string;
  constructor(message: string, debug: string, code: number, kinveyRequestId: string);
}
export class ActiveUserError extends BaseError { }
export class ApiVersionNotAvailableError extends BaseError { }
export class ApiVersionNotImplemented extends BaseError { }
export class AppPromblemError extends BaseError { }
export class BadRequestError extends BaseError { }
export class BusinessLogicError extends BaseError { }
export class CORSDisabledError extends BaseError { }
export class DuplicateEndUsersError extends BaseError { }
export class FeatureUnavailableError extends BaseError { }
export class IncompleteRequestBodyError extends BaseError { }
export class IndirectCollectionAccessDisallowedError extends BaseError { }
export class InsufficientCredentialsError extends BaseError { }
export class InvalidCredentialsError extends BaseError { }
export class InvalidIdentifierError extends BaseError { }
export class InvalidQuerySyntaxError extends BaseError { }
export class JSONParseError extends BaseError { }
export class KinveyError extends BaseError { }
export class KinveyInternalErrorRetry extends BaseError { }
export class KinveyInternalErrorStop extends BaseError { }
export class MissingQueryError extends BaseError { }
export class MissingRequestHeaderError extends BaseError { }
export class MobileIdentityConnectError extends BaseError { }
export class NetworkConnectionError extends BaseError { }
export class NoActiveUserError extends BaseError { }
export class NoResponseError extends BaseError { }
export class NotFoundError extends BaseError { }
export class ParameterValueOutOfRangeError extends BaseError { }
export class PopupError extends BaseError { }
export class QueryError extends BaseError { }
export class ServerError extends BaseError { }
export class StaleRequestError extends BaseError { }
export class SyncError extends BaseError { }
export class TimeoutError extends BaseError { }
export class UserAlreadyExistsError extends BaseError { }
export class WritesToCollectionDisallowedError extends BaseError { }

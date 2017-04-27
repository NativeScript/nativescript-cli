// Type definitions for Kinvey JavaScript SDK
// Definitions by: Kinvey <https://github.com/Kinvey>

import { Observable } from 'rxjs';

// Kinvey namespace
export namespace Kinvey {
  var appVersion: string;
  function initialize(config: ClientConfig): Promise<User>;

  // Request Options interface
  interface RequestOptions {
    properties: Properties;
    timeout: number;
    useDeltaFetch: boolean;
  }

  // ClientConfig interface
  interface ClientConfig {
    apiHostname?: string,
    micHostname?: string,
    liveServiceHostname?: string,
    appKey: string,
    appSecret?: string,
    masterSecret?: string,
    encryptionKey?: string,
    defaultTimeout?: number
  }

  // Client class
  class Client {
    constructor(config: ClientConfig);
    readonly activeUser: {};
    apiProtocol: string;
    apiHost: string;
    readonly apiHostname: string;
    micProtocol: string;
    micHost: string;
    readonly micHostname: string;
    liveServiceProtocol: string;
    liveServiceHost: string;
    readonly liveServiceHostname: string;
    appVersion: string;
    defaultTimeout: number;
    toPlainObject(): {};
    static initialize(config: ClientConfig): Client;
    static sharedInstance(): Client;
  }

  // Acl class
  class Acl {
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
  class Metadata {
    constructor(entity: {});
    isLocal(): boolean;
    toPlainObject(): {};
  }

  // Aggregation class
  class Aggregation {
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
  class Group extends Aggregation {}

  // Custom Endpoint class
  class CustomEndpoint {
    static execute(endpoint: string, args?: {}, options?: RequestOptions): Promise<{}>;
  }

  // Properties class
  class Properties {
    constructor(properties?: {});
    get(name: string): string|undefined;
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
  enum DataStoreType {
    Cache,
    Network,
    Sync
  }

  // SyncOperation enum
  enum SyncOperation {
    Create,
    Update,
    Delete
  }

  // Push Result interface
  interface PushResult<T> {
    _id: string;
    operation: Kinvey.SyncOperation;
    entity?: T;
    error?: Kinvey.BaseError;
  }

  // Entity interface
  interface Entity {
    _id: string;
    _acl: {};
    _kmd: {};
  }

  // SyncEntity interface
  interface SyncEntity extends Entity {
    collection: string;
    state: { operation: SyncOperation };
    entityId: string;
  }

  // DataStore class
  abstract class DataStore {
    static collection<T extends Entity>(collection: string, type?: DataStoreType, options?: {
      client?: Client;
      ttl?: number;
      useDeltaFetch?: boolean;
    }): CacheStore<T>;
    static clearCache(options?: RequestOptions): Promise<{}>;
  }

  // NetworkStore class
  class NetworkStore<T extends Entity> {
    protected constructor();
    client: Client;
    pathname: string;
    useDeltaFetch: boolean;
    find(query?: Query, options?: RequestOptions): Observable<T[]>;
    findById(id: string, options?: RequestOptions): Observable<T>;
    group(aggregation: Aggregation, options?: RequestOptions): Observable<{}>;
    count(query?: Query, options?: RequestOptions): Observable<{ count: number }>;
    create(entities: {}, options?: RequestOptions): Promise<T>;
    update(entities: {}, options?: RequestOptions): Promise<T>;
    save(entity: {}, options?: RequestOptions): Promise<T>;
    remove(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
    removeById(id: string, options?: RequestOptions): Promise<{ count: number }>;
  }

  // CacheStore class
  class CacheStore<T extends Entity> extends NetworkStore<T> {
    clear(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
    pendingSyncCount(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
    pendingSyncEntities(query?: Query, options?: RequestOptions): Promise<SyncEntity[]>;
    push(query?: Query, options?: RequestOptions): Promise<PushResult<T>[]>;
    pull(query?: Query, options?: RequestOptions): Promise<T[]>;
    sync(query?: Query, options?: RequestOptions): { push: PushResult<T>[], pull: T[] };
    clearSync(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
  }

  // SyncStore class
  class SyncStore<T extends Entity> extends CacheStore<T> {}

  // File Metadata interface
  interface FileMetadata {
    _id: string;
    filename: string;
    mimeType: string;
    public: boolean;
    size: number;
  }

  // File interface
  interface File extends Entity {
    _filename: string;
    _downloadURL: string;
    _expiresAt: string;
    _public: boolean;
    size: number;
    mimeType: string;
  }

  // Files class
  class Files {
    static useDeltaFetch: boolean;
    static find<T extends File>(query?: Query, options?: RequestOptions): Promise<T[]>|Promise<{}[]>;
    static findById<T extends File>(id: string, options?: RequestOptions): Promise<T>|Promise<{}>;
    static download<T extends File>(name: string, options?: RequestOptions): Promise<T>|Promise<{}>;
    static downloadByUrl(url: string, options?: RequestOptions): Promise<{}>;
    static stream<T extends File>(name: string, options?: RequestOptions): Promise<T>;
    static group(aggregation: Aggregation, options?: RequestOptions): Promise<{}>;
    static count(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
    static upload<T extends File>(file: {}, metadata?: FileMetadata, options?: RequestOptions): Promise<T>;
    static remove(query?: Query, options?: RequestOptions): Promise<{ count: number }>;
    static removeById(id: string, options?: RequestOptions): Promise<{ count: number }>;
  }

  // Query class
  class Query {
    constructor(options?: {
      fields?: any[]
      filter?: {}
      sort?: string
      limit?: number
      skip?: number
    })
    isSupportedOffline(): boolean;
    equalTo(field: string, value: any): this;
    contains(field: string, values: any[]): this;
    containsAll(field: string, values: any[]): this;
    greaterThan(field: string, value: number|string): this;
    greaterThanOrEqualTo(field: string, value: number|string): this;
    lessThan(field: string, value: number|string): this;
    lessThanOrEqualTo(field: string, value: number|string): this;
    notEqualTo(field: string, value: any): this;
    notContainedIn(field: string, values: any[]): this;
    and(queries?: {}|Query|{}[]|Query[]): this;
    nor(queries?: {}|Query|{}[]|Query[]): this;
    or(queries?: {}|Query|{}[]|Query[]): this;
    exists(field: string, flag: boolean): this;
    mod(field: string, divisor: number, remainder: number): this;
    matches(field: string, regExp: string|RegExp, options?: {}): this;
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
    }
    toQueryString(): {};
    toString(): string;
  }

  // Authorization Grant enum
  enum AuthorizationGrant {
    AuthorizationCodeLoginPage,
    AuthorizationCodeAPI
  }

  // User class
  class User {
    constructor(data?: {}, options?: { client?: Client })
    data: {};
    _id: string|undefined;
    _acl: Acl;
    metadata: Metadata;
    _kmd: Metadata;
    _socialIdentity: {}|undefined;
    authtoken: string|undefined;
    username: string|undefined;
    email: string|undefined;
    pathname: string;
    isActive(): boolean;
    isEmailVerified(): boolean;
    login(username: string, password: string): Promise<this>;
    static login(username: string, password: string): Promise<User>;
    loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<this>;
    static loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: RequestOptions): Promise<User>;
    logout(options?: RequestOptions): Promise<void>;
    static logout(options?: RequestOptions): Promise<void>;
    signup(data: {}, options?: RequestOptions): Promise<this>;
    static signup(data: {}, options?: RequestOptions): Promise<User>;
    update(data: {}, options?: RequestOptions): Promise<this>;
    static update(data: {}, options?: RequestOptions): Promise<User>;
    me(options?: RequestOptions): Promise<this>;
    static me(options?: RequestOptions): Promise<User>;
    static verifyEmail(username: string, options?: RequestOptions): Promise<{}>;
    static forgotUsername(email: string, options?: RequestOptions): Promise<{}>;
    static resetPassword(username: string, options?: RequestOptions): Promise<{}>;
    static lookup(query?: Query, options?: RequestOptions): Promise<{}>;
    static exists(username: string, options?: RequestOptions): Promise<{}>;
    static getActiveUser(client?: Client): User|null
  }

  // Error classes
  abstract class BaseError {
    name: string;
    message: string;
    debug: string;
    code: number;
    kinveyRequestId: string;
    stack: string;
    constructor(message: string, debug: string, code: number, kinveyRequestId: string);
  }
  class ActiveUserError extends BaseError {}
  class ApiVersionNotAvailableError extends BaseError {}
  class ApiVersionNotImplemented extends BaseError {}
  class AppPromblemError extends BaseError {}
  class BadRequestError extends BaseError {}
  class BusinessLogicError extends BaseError {}
  class CORSDisabledError extends BaseError {}
  class DuplicateEndUsersError extends BaseError {}
  class FeatureUnavailableError extends BaseError {}
  class IncompleteRequestBodyError extends BaseError {}
  class IndirectCollectionAccessDisallowedError extends BaseError {}
  class InsufficientCredentialsError extends BaseError {}
  class InvalidCredentialsError extends BaseError {}
  class InvalidIdentifierError extends BaseError {}
  class InvalidQuerySyntaxError extends BaseError {}
  class JSONParseError extends BaseError {}
  class KinveyError extends BaseError {}
  class KinveyInternalErrorRetry extends BaseError {}
  class KinveyInternalErrorStop extends BaseError {}
  class MissingQueryError extends BaseError {}
  class MissingRequestHeaderError extends BaseError {}
  class MobileIdentityConnectError extends BaseError {}
  class NetworkConnectionError extends BaseError {}
  class NoActiveUserError extends BaseError {}
  class NoResponseError extends BaseError {}
  class NotFoundError extends BaseError {}
  class ParameterValueOutOfRangeError extends BaseError {}
  class PopupError extends BaseError {}
  class QueryError extends BaseError {}
  class ServerError extends BaseError {}
  class StaleRequestError extends BaseError {}
  class SyncError extends BaseError {}
  class TimeoutError extends BaseError {}
  class UserAlreadyExistsError extends BaseError {}
  class WritesToCollectionDisallowedError extends BaseError {}
}

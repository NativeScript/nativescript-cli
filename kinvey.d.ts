// Type definitions for kinvey-angular2-sdk 3.4
// Project: https://github.com/Kinvey/angular2-sdk
// Definitions by: Thomas P. Conner <https://github.com/thomasconner/>

// Client
declare class Client {}

/*~ Kinvey namespace */
export namespace Kinvey {
  var appVersion: string;
  function initialize(config: {}): any;

  // Acl
  class Acl {
    constructor(entity: {})
    readonly creator: string;
    readonly readers: Array<string>;
    readonly writers: Array<string>;
    readonly readerGroups: Array<string>;
    readonly writerGroups: Array<string>;
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

  // Aggregation
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
  class Group extends Aggregation {}

  // CustomEndpoint
  class CustomEndpoint {
    static execute(endpoint: string, args: {}, options?: {}): any;
  }

  // DataStore
  enum DataStoreType {
    Cache,
    Network,
    Sync
  }
  abstract class DataStore {
    static collection(collection: string, type?: DataStoreType, options?: {}): DataStore;
    static clearCache(options?: {}): any;

    useDeltaFetch: boolean;
    find(query?: Query, options?: {}): any;
    findById(id: string, options?: {}): any;
    group(aggregation: Aggregation, options?: {}): any;
    count(query?: Query, options?: {}): any;
    create(entities: {}|Array<{}>, options?: {}): any;
    update(entities: {}|Array<{}>, options?: {}): any;
    save(entity: {}|Array<{}>, options?: {}): any;
    remove(query?: Query, options?: {}): any;
    removeById(id: string, options?: {}): any;

  }
  class NetworkStore extends DataStore {
    protected constructor();
  }
  class CacheStore extends NetworkStore {
    clear(query?: Query, options?: {}): any;
    pendingSyncCount(query?: Query, options?: {}): any;
    pendingSyncEntities(query?: Query, options?: {}): any;
    push(query?: Query, options?: {}): any;
    pull(query?: Query, options?: {}): any;
    sync(query?: Query, options?: {}): any;
    clearSync(query?: Query, options?: {}): any;
  }
  class SyncStore extends CacheStore {}

  // File
  class Files {
    static useDeltaFetch: boolean;
    static find(query?: Query, options?: {}): any;
    static findById(id: string, options?: {}): any;
    static download(name: string, options?: {}): any;
    static downloadByUrl(url: string, options?: {}): any;
    static stream(name: string, options?: {}): any;
    static group(aggregation: Aggregation, options?: {}): any;
    static count(query?: Query, options?: {}): any;
    static upload(file: {}, metadata?: {}, options?: {}): any;
    static remove(query?: Query, options?: {}): any;
    static removeById(id: string, options?: {}): any;
  }

  // Metadata
  class Metadata {
    constructor(entity: {});
    isLocal(): boolean;
    toPlainObject(): {};
  }

  // Push
  class Push {}

  // Query
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
    and(queries?: {}|Query|Array<{}>|Query[]): this;
    nor(queries?: {}|Query|Array<{}>|Query[]): this;
    or(queries?: {}|Query|Array<{}>|Query[]): this;
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

  // User
  enum AuthorizationGrant {
    AuthorizationCodeLoginPage,
    AuthorizationCodeAPI
  }
  class User {
    constructor(data?: {}, options?: {})
    data: {};
    isActive(): boolean;
    isEmailVerified(): boolean;
    static getActiveUser(client?: Client): User|null
    login(username: string, password: string): any;
    static login(username: string, password: string): any;
    loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: {}): any;
    static loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: {}): any;
    logout(options?: {}): any;
    static logout(options?: {}): any;
    signup(data: {}, options?: {}): any;
    static signup(data: {}, options?: {}): any;
    update(data: {}, options?: {}): any;
    static update(data: {}, options?: {}): any;
    me(options?: {}): any;
    static me(options?: {}): any;
    static verifyEmail(username: string, options?: {}): any;
    static forgotUsername(email: string, options?: {}): any;
    static resetPassword(username: string, options?: {}): any;
    static lookup(query?: Query, options?: {}): any;
    static exists(username: string, options?: {}): any;
    static restore(id: string, options?: {}): any;
  }

  // Errors
  abstract class KinveyBaseError {
    name: string;
    message: string;
    debug: string;
    code: number;
    kinveyRequestId: string;
    stack: string;
    constructor(message: string, debug: string, code: number, kinveyRequestId: string);
  }
  class ActiveUserError extends KinveyBaseError {}
  class ApiVersionNotAvailableError extends KinveyBaseError {}
  class ApiVersionNotImplemented extends KinveyBaseError {}
  class AppPromblemError extends KinveyBaseError {}
  class BadRequestError extends KinveyBaseError {}
  class BusinessLogicError extends KinveyBaseError {}
  class CORSDisabledError extends KinveyBaseError {}
  class DuplicateEndUsersError extends KinveyBaseError {}
  class FeatureUnavailableError extends KinveyBaseError {}
  class IncompleteRequestBodyError extends KinveyBaseError {}
  class IndirectCollectionAccessDisallowedError extends KinveyBaseError {}
  class InsufficientCredentialsError extends KinveyBaseError {}
  class InvalidCredentialsError extends KinveyBaseError {}
  class InvalidIdentifierError extends KinveyBaseError {}
  class InvalidQuerySyntaxError extends KinveyBaseError {}
  class JSONParseError extends KinveyBaseError {}
  class KinveyError extends KinveyBaseError {}
  class KinveyInternalErrorRetry extends KinveyBaseError {}
  class KinveyInternalErrorStop extends KinveyBaseError {}
  class MissingQueryError extends KinveyBaseError {}
  class MissingRequestHeaderError extends KinveyBaseError {}
  class MobileIdentityConnectError extends KinveyBaseError {}
  class NoActiveUserError extends KinveyBaseError {}
  class NoNetworkConnectionError extends KinveyBaseError {}
  class NoResponseError extends KinveyBaseError {}
  class NotFoundError extends KinveyBaseError {}
  class ParameterValueOutOfRangeError extends KinveyBaseError {}
  class PopupError extends KinveyBaseError {}
  class QueryError extends KinveyBaseError {}
  class ServerError extends KinveyBaseError {}
  class StaleRequestError extends KinveyBaseError {}
  class SyncError extends KinveyBaseError {}
  class TimeoutError extends KinveyBaseError {}
  class UserAlreadyExistsError extends KinveyBaseError {}
  class WritesToCollectionDisallowedError extends KinveyBaseError {}
}

// Type definitions for kinvey-angular2-sdk 3.4
// Project: https://github.com/Kinvey/angular2-sdk
// Definitions by: Thomas P. Conner <https://github.com/thomasconner/>

// Kinvey namespace
export as namespace Kinvey;

export function initialize(options: any): any;

// Client
declare class Client {}

// Acl
export class Acl {
  constructor(entity: {})
  // get creator(): string;
  // get readers(): Array<string>;
  // get writers(): Array<string>;
  // get readerGroups(): Array<string>;
  // get writerGroups(): Array<string>;
  // set globallyReadable(gr: boolean);
  // set globallyWritable(gw: boolean);
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
export class Group extends Aggregation {}

// CustomEndpoint
export class CustomEndpoint {
  static execute(endpoint: string, args: {}, options?: {}): Promise<any>
}

// DataStore
export enum DataStoreType {
  Cache,
  Network,
  Sync
}
export class DataStore {
  static collection<T>(collection: string, type?: DataStoreType, options?: {}): T;
  static clearCache(options?: {}): Promise<Array<{}>>;
}
declare class NetworkStore {
  find(query?: Query, options?: {}): Rx.Observable<Array<{}>>;
  findById(id: string, options?: {}): Rx.Observable<{}>;
  group(aggregation: Aggregation, options?: {}): Rx.Observable<any>;
  count(query?: Query, options?: {}): Rx.Observable<number>;
  create(entities: {}|Array<{}>, options?: {}): Promise<{}|Array<{}>>;
  update(entities: {}|Array<{}>, options?: {}): Promise<{}|Array<{}>>;
  save(entity: {}|Array<{}>, options?: {}): Promise<{}|Array<{}>>;
  remove(query?: Query, options?: {}): Promise<Array<{}>>;
  removeById(id: string, options?: {}): Promise<{}>;
}
declare class CacheStore extends NetworkStore {
  clear(query?: Query, options?: {}): Promise<Array<{}>>;
  pendingSyncCount(query?: Query, options?: {}): Promise<number>;
  pendingSyncEntities(query?: Query, options?: {}): Promise<Array<{}>>;
  push(query?: Query, options?: {}): Promise<Array<{}>>;
  pull(query?: Query, options?: {}): Promise<Array<{}>>;
  sync(query?: Query, options?: {}): Promise<{}>;
  clearSync(query?: Query, options?: {}): Promise<Array<{}>>;
}
declare class SyncStore extends CacheStore {}

// File
export class Files extends NetworkStore {
  download(name: string, options?: {}): Promise<{}>;
  downloadByUrl(url: string, options?: {}): Promise<{}>;
  stream(name: string, options?: {}): Promise<{}>;
  upload(file: {}, metadata?: {}, options?: {}): Promise<{}>;
}

// Metadata
export class Metadata {
  constructor(entity: {});
  isLocal(): boolean;
  toPlainObject(): {};
}

// Query
export class Query {
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
export enum AuthorizationGrant {
  AuthorizationCodeLoginPage,
  AuthorizationCodeAPI
}
export class User {
  constructor(data?: {}, options?: {})
  isActive(): boolean;
  isEmailVerified(): boolean;
  static getActiveUser(client?: Client): User|null
  login(username: string, password: string): Promise<this>;
  static login(username: string, password: string): Promise<User>;
  loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: {}): Promise<this>;
  static loginWithMIC(redirectUri: string, authorizationGrant?: AuthorizationGrant, options?: {}): Promise<User>;
  logout(options?: {}): Promise<this>;
  static logout(options?: {}): Promise<User|null>;
  signup(data: {}, options?: {}): Promise<this>;
  static signup(data: {}, options?: {}): Promise<User>;
  update(data: {}, options?: {}): Promise<this>;
  static update(data: {}, options?: {}): Promise<User|null>;
  me(options?: {}): Promise<this>;
  static me(options?: {}): Promise<User|null>;
  static verifyEmail(username: string, options?: {}): Promise<{}>;
  static forgotUsername(email: string, options?: {}): Promise<{}>;
  static resetPassword(username: string, options?: {}): Promise<{}>;
  static lookup(query?: Query, options?: {}): Rx.Observable<Array<{}>>;
  static exists(username: string, options?: {}): Promise<boolean>;
  static restore(id: string, options?: {}): Promise<{}>;
}

// Errors
declare class KinveyBaseError {
  name: string;
  message: string;
  debug: string;
  code: number;
  kinveyRequestId: string;
  stack: string;
  constructor(message: string, debug: string, code: number, kinveyRequestId: string);
}
export class ActiveUserError extends KinveyBaseError {}
export class ApiVersionNotAvailableError extends KinveyBaseError {}
export class ApiVersionNotImplemented extends KinveyBaseError {}
export class AppPromblemError extends KinveyBaseError {}
export class BadRequestError extends KinveyBaseError {}
export class BusinessLogicError extends KinveyBaseError {}
export class CORSDisabledError extends KinveyBaseError {}
export class DuplicateEndUsersError extends KinveyBaseError {}
export class FeatureUnavailableError extends KinveyBaseError {}
export class IncompleteRequestBodyError extends KinveyBaseError {}
export class IndirectCollectionAccessDisallowedError extends KinveyBaseError {}
export class InsufficientCredentialsError extends KinveyBaseError {}
export class InvalidCredentialsError extends KinveyBaseError {}
export class InvalidIdentifierError extends KinveyBaseError {}
export class InvalidQuerySyntaxError extends KinveyBaseError {}
export class JSONParseError extends KinveyBaseError {}
export class KinveyError extends KinveyBaseError {}
export class KinveyInternalErrorRetry extends KinveyBaseError {}
export class KinveyInternalErrorStop extends KinveyBaseError {}
export class MissingQueryError extends KinveyBaseError {}
export class MissingRequestHeaderError extends KinveyBaseError {}
export class MobileIdentityConnectError extends KinveyBaseError {}
export class NoActiveUserError extends KinveyBaseError {}
export class NoNetworkConnectionError extends KinveyBaseError {}
export class NoResponseError extends KinveyBaseError {}
export class NotFoundError extends KinveyBaseError {}
export class ParameterValueOutOfRangeError extends KinveyBaseError {}
export class PopupError extends KinveyBaseError {}
export class QueryError extends KinveyBaseError {}
export class ServerError extends KinveyBaseError {}
export class StaleRequestError extends KinveyBaseError {}
export class SyncError extends KinveyBaseError {}
export class TimeoutError extends KinveyBaseError {}
export class UserAlreadyExistsError extends KinveyBaseError {}
export class WritesToCollectionDisallowedError extends KinveyBaseError {}


declare namespace okhttp3 {
    export class Address extends java.lang.Object {
        public proxy(): java.net.Proxy;
        public proxySelector(): java.net.ProxySelector;
        public sslSocketFactory(): javax.net.ssl.SSLSocketFactory;
        public protocols(): java.util.List<any>;
        public url(): okhttp3.HttpUrl;
        public certificatePinner(): okhttp3.CertificatePinner;
        public constructor(param0: string, param1: number, param2: okhttp3.Dns, param3: javax.net.SocketFactory, param4: javax.net.ssl.SSLSocketFactory, param5: javax.net.ssl.HostnameVerifier, param6: okhttp3.CertificatePinner, param7: okhttp3.Authenticator, param8: java.net.Proxy, param9: java.util.List<any>, param10: java.util.List<any>, param11: java.net.ProxySelector);
        public socketFactory(): javax.net.SocketFactory;
        public dns(): okhttp3.Dns;
        public proxyAuthenticator(): okhttp3.Authenticator;
        public hostnameVerifier(): javax.net.ssl.HostnameVerifier;
        public hashCode(): number;
        public connectionSpecs(): java.util.List<any>;
        public equals(param0: java.lang.Object): boolean;
    }
}

declare namespace okhttp3 {
    export class Authenticator extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.Authenticator interface with the provided implementation.
         */
        public constructor(implementation: {
            authenticate(param0: okhttp3.Route, param1: okhttp3.Response): okhttp3.Request;
            <clinit>(): void;
        });
        public static NONE: okhttp3.Authenticator;
        public authenticate(param0: okhttp3.Route, param1: okhttp3.Response): okhttp3.Request;
    }
}

declare namespace okhttp3 {
    export class Cache extends java.lang.Object implements java.io.Closeable, java.io.Flushable {
        public close(): void;
        public directory(): java.io.File;
        public constructor(param0: java.io.File, param1: number);
        public static key(param0: okhttp3.HttpUrl): string;
        public writeAbortCount(): number;
        public evictAll(): void;
        public delete(): void;
        public isClosed(): boolean;
        public urls(): java.util.Iterator;
        public networkCount(): number;
        public requestCount(): number;
        public flush(): void;
        public initialize(): void;
        public size(): number;
        public writeSuccessCount(): number;
        public hitCount(): number;
        public maxSize(): number;
    }
    export namespace Cache {
        export class CacheRequestImpl extends java.lang.Object implements okhttp3.internal.cache.CacheRequest {
            public body(): okio.Sink;
            public abort(): void;
            public constructor(param0: okhttp3.Cache, param1: okhttp3.internal.cache.DiskLruCache.Editor);
        }
        export class CacheResponseBody extends okhttp3.ResponseBody {
            public contentLength(): number;
            public source(): okio.BufferedSource;
            public contentType(): okhttp3.MediaType;
            public constructor();
            public close(): void;
            public constructor(param0: okhttp3.internal.cache.DiskLruCache.Snapshot, param1: string, param2: string);
        }
        export class Entry extends java.lang.Object {
            public matches(param0: okhttp3.Request, param1: okhttp3.Response): boolean;
            public constructor(param0: okhttp3.Response);
            public constructor(param0: okio.Source);
            public response(param0: okhttp3.internal.cache.DiskLruCache.Snapshot): okhttp3.Response;
            public writeTo(param0: okhttp3.internal.cache.DiskLruCache.Editor): void;
        }
    }
}

declare namespace okhttp3 {
    export class CacheControl extends java.lang.Object {
        public static FORCE_NETWORK: okhttp3.CacheControl;
        public static FORCE_CACHE: okhttp3.CacheControl;
        public maxStaleSeconds(): number;
        public mustRevalidate(): boolean;
        public static parse(param0: okhttp3.Headers): okhttp3.CacheControl;
        public toString(): string;
        public minFreshSeconds(): number;
        public onlyIfCached(): boolean;
        public noCache(): boolean;
        public noTransform(): boolean;
        public isPrivate(): boolean;
        public sMaxAgeSeconds(): number;
        public noStore(): boolean;
        public maxAgeSeconds(): number;
        public isPublic(): boolean;
    }
    export namespace CacheControl {
        export class Builder extends java.lang.Object {
            public noCache(): okhttp3.CacheControl.Builder;
            public maxStale(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.CacheControl.Builder;
            public onlyIfCached(): okhttp3.CacheControl.Builder;
            public minFresh(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.CacheControl.Builder;
            public maxAge(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.CacheControl.Builder;
            public constructor();
            public build(): okhttp3.CacheControl;
            public noStore(): okhttp3.CacheControl.Builder;
            public noTransform(): okhttp3.CacheControl.Builder;
        }
    }
}

declare namespace okhttp3 {
    export class Call extends java.lang.Object implements java.lang.Cloneable {
        /**
         * Constructs a new instance of the okhttp3.Call interface with the provided implementation.
         */
        public constructor(implementation: {
            request(): okhttp3.Request;
            execute(): okhttp3.Response;
            enqueue(param0: okhttp3.Callback): void;
            cancel(): void;
            isExecuted(): boolean;
            isCanceled(): boolean;
            clone(): okhttp3.Call;
        });
        public isExecuted(): boolean;
        public clone(): okhttp3.Call;
        public request(): okhttp3.Request;
        public execute(): okhttp3.Response;
        public isCanceled(): boolean;
        public clone(): java.lang.Object;
        public enqueue(param0: okhttp3.Callback): void;
        public cancel(): void;
    }
    export namespace Call {
        export class Factory extends java.lang.Object {
            /**
             * Constructs a new instance of the okhttp3.Call$Factory interface with the provided implementation.
             */
            public constructor(implementation: {
                newCall(param0: okhttp3.Request): okhttp3.Call;
            });
            public newCall(param0: okhttp3.Request): okhttp3.Call;
        }
    }
}

declare namespace okhttp3 {
    export class Callback extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.Callback interface with the provided implementation.
         */
        public constructor(implementation: {
            onFailure(param0: okhttp3.Call, param1: java.io.IOException): void;
            onResponse(param0: okhttp3.Call, param1: okhttp3.Response): void;
        });
        public onResponse(param0: okhttp3.Call, param1: okhttp3.Response): void;
        public onFailure(param0: okhttp3.Call, param1: java.io.IOException): void;
    }
}

declare namespace okhttp3 {
    export class CertificatePinner extends java.lang.Object {
        public static DEFAULT: okhttp3.CertificatePinner;
        public static pin(param0: java.security.cert.Certificate): string;
        public check(param0: string, param1: native.Array<java.security.cert.Certificate>): void;
        public hashCode(): number;
        public check(param0: string, param1: java.util.List<any>): void;
        public equals(param0: java.lang.Object): boolean;
    }
    export namespace CertificatePinner {
        export class Builder extends java.lang.Object {
            public build(): okhttp3.CertificatePinner;
            public add(param0: string, param1: native.Array<string>): okhttp3.CertificatePinner.Builder;
            public constructor();
        }
        export class Pin extends java.lang.Object {
            public toString(): string;
            public equals(param0: java.lang.Object): boolean;
            public hashCode(): number;
        }
    }
}

declare namespace okhttp3 {
    export class Challenge extends java.lang.Object {
        public scheme(): string;
        public hashCode(): number;
        public toString(): string;
        public equals(param0: java.lang.Object): boolean;
        public constructor(param0: string, param1: string);
        public realm(): string;
    }
}

declare namespace okhttp3 {
    export class CipherSuite extends java.lang.Object {
        public static TLS_RSA_WITH_NULL_MD5: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_EXPORT_WITH_RC4_40_MD5: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_RC4_128_MD5: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_EXPORT_WITH_DES40_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_DES_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_EXPORT_WITH_DES40_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_DES_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_DES_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DH_anon_EXPORT_WITH_RC4_40_MD5: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_RC4_128_MD5: okhttp3.CipherSuite;
        public static TLS_DH_anon_EXPORT_WITH_DES40_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_DES_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_DES_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_DES_CBC_MD5: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_3DES_EDE_CBC_MD5: okhttp3.CipherSuite;
        public static TLS_KRB5_WITH_RC4_128_MD5: okhttp3.CipherSuite;
        public static TLS_KRB5_EXPORT_WITH_DES_CBC_40_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_EXPORT_WITH_RC4_40_SHA: okhttp3.CipherSuite;
        public static TLS_KRB5_EXPORT_WITH_DES_CBC_40_MD5: okhttp3.CipherSuite;
        public static TLS_KRB5_EXPORT_WITH_RC4_40_MD5: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_NULL_SHA256: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_256_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_CAMELLIA_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_CAMELLIA_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_256_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_256_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_256_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_CAMELLIA_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_CAMELLIA_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_PSK_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_PSK_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_PSK_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_PSK_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_SEED_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_RSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_DHE_RSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_DHE_DSS_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_DH_anon_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_EMPTY_RENEGOTIATION_INFO_SCSV: okhttp3.CipherSuite;
        public static TLS_FALLBACK_SCSV: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_anon_WITH_NULL_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_anon_WITH_RC4_128_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_anon_WITH_3DES_EDE_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_anon_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDH_anon_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_128_CBC_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_256_CBC_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384: okhttp3.CipherSuite;
        public static TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA: okhttp3.CipherSuite;
        public static TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: okhttp3.CipherSuite;
        public static TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: okhttp3.CipherSuite;
        public javaName(): string;
        public static forJavaName(param0: string): okhttp3.CipherSuite;
        public toString(): string;
    }
}

declare namespace okhttp3 {
    export class Connection extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.Connection interface with the provided implementation.
         */
        public constructor(implementation: {
            route(): okhttp3.Route;
            socket(): java.net.Socket;
            handshake(): okhttp3.Handshake;
            protocol(): okhttp3.Protocol;
        });
        public route(): okhttp3.Route;
        public protocol(): okhttp3.Protocol;
        public handshake(): okhttp3.Handshake;
        public socket(): java.net.Socket;
    }
}

declare namespace okhttp3 {
    export class ConnectionPool extends java.lang.Object {
        public constructor();
        public connectionCount(): number;
        public evictAll(): void;
        public idleConnectionCount(): number;
        public constructor(param0: number, param1: number, param2: java.util.concurrent.TimeUnit);
    }
}

declare namespace okhttp3 {
    export class ConnectionSpec extends java.lang.Object {
        public static MODERN_TLS: okhttp3.ConnectionSpec;
        public static COMPATIBLE_TLS: okhttp3.ConnectionSpec;
        public static CLEARTEXT: okhttp3.ConnectionSpec;
        public cipherSuites(): java.util.List<any>;
        public supportsTlsExtensions(): boolean;
        public hashCode(): number;
        public isCompatible(param0: javax.net.ssl.SSLSocket): boolean;
        public isTls(): boolean;
        public toString(): string;
        public tlsVersions(): java.util.List<any>;
        public equals(param0: java.lang.Object): boolean;
    }
    export namespace ConnectionSpec {
        export class Builder extends java.lang.Object {
            public tlsVersions(param0: native.Array<string>): okhttp3.ConnectionSpec.Builder;
            public cipherSuites(param0: native.Array<string>): okhttp3.ConnectionSpec.Builder;
            public build(): okhttp3.ConnectionSpec;
            public constructor(param0: okhttp3.ConnectionSpec);
            public cipherSuites(param0: native.Array<okhttp3.CipherSuite>): okhttp3.ConnectionSpec.Builder;
            public supportsTlsExtensions(param0: boolean): okhttp3.ConnectionSpec.Builder;
            public allEnabledCipherSuites(): okhttp3.ConnectionSpec.Builder;
            public tlsVersions(param0: native.Array<okhttp3.TlsVersion>): okhttp3.ConnectionSpec.Builder;
            public allEnabledTlsVersions(): okhttp3.ConnectionSpec.Builder;
        }
    }
}

declare namespace okhttp3 {
    export class Cookie extends java.lang.Object {
        public domain(): string;
        public matches(param0: okhttp3.HttpUrl): boolean;
        public static parseAll(param0: okhttp3.HttpUrl, param1: okhttp3.Headers): java.util.List<any>;
        public toString(): string;
        public persistent(): boolean;
        public httpOnly(): boolean;
        public static parse(param0: okhttp3.HttpUrl, param1: string): okhttp3.Cookie;
        public hostOnly(): boolean;
        public expiresAt(): number;
        public hashCode(): number;
        public name(): string;
        public path(): string;
        public secure(): boolean;
        public value(): string;
        public equals(param0: java.lang.Object): boolean;
    }
    export namespace Cookie {
        export class Builder extends java.lang.Object {
            public domain(param0: string): okhttp3.Cookie.Builder;
            public hostOnlyDomain(param0: string): okhttp3.Cookie.Builder;
            public value(param0: string): okhttp3.Cookie.Builder;
            public httpOnly(): okhttp3.Cookie.Builder;
            public secure(): okhttp3.Cookie.Builder;
            public expiresAt(param0: number): okhttp3.Cookie.Builder;
            public build(): okhttp3.Cookie;
            public name(param0: string): okhttp3.Cookie.Builder;
            public constructor();
            public path(param0: string): okhttp3.Cookie.Builder;
        }
    }
}

declare namespace okhttp3 {
    export class CookieJar extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.CookieJar interface with the provided implementation.
         */
        public constructor(implementation: {
            saveFromResponse(param0: okhttp3.HttpUrl, param1: java.util.List<any>): void;
            loadForRequest(param0: okhttp3.HttpUrl): java.util.List<any>;
            <clinit>(): void;
        });
        public static NO_COOKIES: okhttp3.CookieJar;
        public loadForRequest(param0: okhttp3.HttpUrl): java.util.List<any>;
        public saveFromResponse(param0: okhttp3.HttpUrl, param1: java.util.List<any>): void;
    }
}

declare namespace okhttp3 {
    export class Credentials extends java.lang.Object {
        public static basic(param0: string, param1: string): string;
    }
}

declare namespace okhttp3 {
    export class Dispatcher extends java.lang.Object {
        public constructor();
        public setMaxRequestsPerHost(param0: number): void;
        public constructor(param0: java.util.concurrent.ExecutorService);
        public queuedCallsCount(): number;
        public runningCallsCount(): number;
        public queuedCalls(): java.util.List<any>;
        public cancelAll(): void;
        public runningCalls(): java.util.List<any>;
        public setMaxRequests(param0: number): void;
        public getMaxRequestsPerHost(): number;
        public executorService(): java.util.concurrent.ExecutorService;
        public setIdleCallback(param0: java.lang.Runnable): void;
        public getMaxRequests(): number;
    }
}

declare namespace okhttp3 {
    export class Dns extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.Dns interface with the provided implementation.
         */
        public constructor(implementation: {
            lookup(param0: string): java.util.List<any>;
            <clinit>(): void;
        });
        public static SYSTEM: okhttp3.Dns;
        public lookup(param0: string): java.util.List<any>;
    }
}

declare namespace okhttp3 {
    export class FormBody extends okhttp3.RequestBody {
        public value(param0: number): string;
        public encodedValue(param0: number): string;
        public name(param0: number): string;
        public size(): number;
        public encodedName(param0: number): string;
        public contentType(): okhttp3.MediaType;
        public writeTo(param0: okio.BufferedSink): void;
        public contentLength(): number;
    }
    export namespace FormBody {
        export class Builder extends java.lang.Object {
            public addEncoded(param0: string, param1: string): okhttp3.FormBody.Builder;
            public constructor();
            public add(param0: string, param1: string): okhttp3.FormBody.Builder;
            public build(): okhttp3.FormBody;
        }
    }
}

declare namespace okhttp3 {
    export class Handshake extends java.lang.Object {
        public static get(param0: javax.net.ssl.SSLSession): okhttp3.Handshake;
        public peerCertificates(): java.util.List<any>;
        public localCertificates(): java.util.List<any>;
        public hashCode(): number;
        public localPrincipal(): java.security.Principal;
        public tlsVersion(): okhttp3.TlsVersion;
        public peerPrincipal(): java.security.Principal;
        public equals(param0: java.lang.Object): boolean;
        public static get(param0: okhttp3.TlsVersion, param1: okhttp3.CipherSuite, param2: java.util.List<any>, param3: java.util.List<any>): okhttp3.Handshake;
        public cipherSuite(): okhttp3.CipherSuite;
    }
}

declare namespace okhttp3 {
    export class Headers extends java.lang.Object {
        public value(param0: number): string;
        public names(): java.util.Set;
        public newBuilder(): okhttp3.Headers.Builder;
        public static of(param0: java.util.Map): okhttp3.Headers;
        public toMultimap(): java.util.Map;
        public toString(): string;
        public get(param0: string): string;
        public name(param0: number): string;
        public values(param0: string): java.util.List<any>;
        public size(): number;
        public hashCode(): number;
        public getDate(param0: string): java.util.Date;
        public static of(param0: native.Array<string>): okhttp3.Headers;
        public equals(param0: java.lang.Object): boolean;
    }
    export namespace Headers {
        export class Builder extends java.lang.Object {
            public get(param0: string): string;
            public build(): okhttp3.Headers;
            public add(param0: string, param1: string): okhttp3.Headers.Builder;
            public removeAll(param0: string): okhttp3.Headers.Builder;
            public set(param0: string, param1: string): okhttp3.Headers.Builder;
            public constructor();
            public add(param0: string): okhttp3.Headers.Builder;
        }
    }
}

declare namespace okhttp3 {
    export class HttpUrl extends java.lang.Object {
        public static get(param0: java.net.URI): okhttp3.HttpUrl;
        public queryParameterNames(): java.util.Set;
        public queryParameterName(param0: number): string;
        public static defaultPort(param0: string): number;
        public scheme(): string;
        public encodedPassword(): string;
        public queryParameter(param0: string): string;
        public query(): string;
        public password(): string;
        public pathSegments(): java.util.List<any>;
        public encodedPathSegments(): java.util.List<any>;
        public hashCode(): number;
        public resolve(param0: string): okhttp3.HttpUrl;
        public pathSize(): number;
        public equals(param0: java.lang.Object): boolean;
        public isHttps(): boolean;
        public newBuilder(): okhttp3.HttpUrl.Builder;
        public port(): number;
        public encodedQuery(): string;
        public encodedPath(): string;
        public encodedFragment(): string;
        public redact(): string;
        public fragment(): string;
        public toString(): string;
        public uri(): java.net.URI;
        public queryParameterValue(param0: number): string;
        public encodedUsername(): string;
        public newBuilder(param0: string): okhttp3.HttpUrl.Builder;
        public queryParameterValues(param0: string): java.util.List<any>;
        public host(): string;
        public static get(param0: java.net.URL): okhttp3.HttpUrl;
        public static parse(param0: string): okhttp3.HttpUrl;
        public url(): java.net.URL;
        public querySize(): number;
        public username(): string;
    }
    export namespace HttpUrl {
        export class Builder extends java.lang.Object {
            public addPathSegment(param0: string): okhttp3.HttpUrl.Builder;
            public addEncodedPathSegment(param0: string): okhttp3.HttpUrl.Builder;
            public setEncodedQueryParameter(param0: string, param1: string): okhttp3.HttpUrl.Builder;
            public setQueryParameter(param0: string, param1: string): okhttp3.HttpUrl.Builder;
            public encodedFragment(param0: string): okhttp3.HttpUrl.Builder;
            public username(param0: string): okhttp3.HttpUrl.Builder;
            public addPathSegments(param0: string): okhttp3.HttpUrl.Builder;
            public encodedPath(param0: string): okhttp3.HttpUrl.Builder;
            public encodedPassword(param0: string): okhttp3.HttpUrl.Builder;
            public addEncodedPathSegments(param0: string): okhttp3.HttpUrl.Builder;
            public encodedQuery(param0: string): okhttp3.HttpUrl.Builder;
            public host(param0: string): okhttp3.HttpUrl.Builder;
            public removeAllEncodedQueryParameters(param0: string): okhttp3.HttpUrl.Builder;
            public setEncodedPathSegment(param0: number, param1: string): okhttp3.HttpUrl.Builder;
            public constructor();
            public encodedUsername(param0: string): okhttp3.HttpUrl.Builder;
            public password(param0: string): okhttp3.HttpUrl.Builder;
            public port(param0: number): okhttp3.HttpUrl.Builder;
            public toString(): string;
            public addQueryParameter(param0: string, param1: string): okhttp3.HttpUrl.Builder;
            public addEncodedQueryParameter(param0: string, param1: string): okhttp3.HttpUrl.Builder;
            public query(param0: string): okhttp3.HttpUrl.Builder;
            public setPathSegment(param0: number, param1: string): okhttp3.HttpUrl.Builder;
            public removeAllQueryParameters(param0: string): okhttp3.HttpUrl.Builder;
            public scheme(param0: string): okhttp3.HttpUrl.Builder;
            public removePathSegment(param0: number): okhttp3.HttpUrl.Builder;
            public fragment(param0: string): okhttp3.HttpUrl.Builder;
            public build(): okhttp3.HttpUrl;
        }
        export namespace Builder {
            export class ParseResult extends java.lang.Enum {
                public static SUCCESS: okhttp3.HttpUrl.Builder.ParseResult;
                public static MISSING_SCHEME: okhttp3.HttpUrl.Builder.ParseResult;
                public static UNSUPPORTED_SCHEME: okhttp3.HttpUrl.Builder.ParseResult;
                public static INVALID_PORT: okhttp3.HttpUrl.Builder.ParseResult;
                public static INVALID_HOST: okhttp3.HttpUrl.Builder.ParseResult;
                public static values(): native.Array<okhttp3.HttpUrl.Builder.ParseResult>;
                public static valueOf(param0: string): okhttp3.HttpUrl.Builder.ParseResult;
                public static valueOf(param0: java.lang.Class, param1: string): java.lang.Enum;
            }
        }
    }
}

declare namespace okhttp3 {
    export class Interceptor extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.Interceptor interface with the provided implementation.
         */
        public constructor(implementation: {
            intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
        });
        public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
    }
    export namespace Interceptor {
        export class Chain extends java.lang.Object {
            /**
             * Constructs a new instance of the okhttp3.Interceptor$Chain interface with the provided implementation.
             */
            public constructor(implementation: {
                request(): okhttp3.Request;
                proceed(param0: okhttp3.Request): okhttp3.Response;
                connection(): okhttp3.Connection;
            });
            public request(): okhttp3.Request;
            public proceed(param0: okhttp3.Request): okhttp3.Response;
            public connection(): okhttp3.Connection;
        }
    }
}

declare namespace okhttp3 {
    export class MediaType extends java.lang.Object {
        public type(): string;
        public charset(): java.nio.charset.Charset;
        public subtype(): string;
        public charset(param0: java.nio.charset.Charset): java.nio.charset.Charset;
        public hashCode(): number;
        public static parse(param0: string): okhttp3.MediaType;
        public toString(): string;
        public equals(param0: java.lang.Object): boolean;
    }
}

declare namespace okhttp3 {
    export class MultipartBody extends okhttp3.RequestBody {
        public static MIXED: okhttp3.MediaType;
        public static ALTERNATIVE: okhttp3.MediaType;
        public static DIGEST: okhttp3.MediaType;
        public static PARALLEL: okhttp3.MediaType;
        public static FORM: okhttp3.MediaType;
        public boundary(): string;
        public parts(): java.util.List<any>;
        public size(): number;
        public type(): okhttp3.MediaType;
        public contentType(): okhttp3.MediaType;
        public writeTo(param0: okio.BufferedSink): void;
        public part(param0: number): okhttp3.MultipartBody.Part;
        public contentLength(): number;
    }
    export namespace MultipartBody {
        export class Builder extends java.lang.Object {
            public setType(param0: okhttp3.MediaType): okhttp3.MultipartBody.Builder;
            public addPart(param0: okhttp3.MultipartBody.Part): okhttp3.MultipartBody.Builder;
            public build(): okhttp3.MultipartBody;
            public addPart(param0: okhttp3.Headers, param1: okhttp3.RequestBody): okhttp3.MultipartBody.Builder;
            public addPart(param0: okhttp3.RequestBody): okhttp3.MultipartBody.Builder;
            public constructor();
            public addFormDataPart(param0: string, param1: string): okhttp3.MultipartBody.Builder;
            public addFormDataPart(param0: string, param1: string, param2: okhttp3.RequestBody): okhttp3.MultipartBody.Builder;
            public constructor(param0: string);
        }
        export class Part extends java.lang.Object {
            public headers(): okhttp3.Headers;
            public static create(param0: okhttp3.Headers, param1: okhttp3.RequestBody): okhttp3.MultipartBody.Part;
            public static createFormData(param0: string, param1: string, param2: okhttp3.RequestBody): okhttp3.MultipartBody.Part;
            public static create(param0: okhttp3.RequestBody): okhttp3.MultipartBody.Part;
            public static createFormData(param0: string, param1: string): okhttp3.MultipartBody.Part;
            public body(): okhttp3.RequestBody;
        }
    }
}

declare namespace okhttp3 {
    export class OkHttpClient extends java.lang.Object implements java.lang.Cloneable, okhttp3.Call.Factory, okhttp3.WebSocket.Factory {
        public proxy(): java.net.Proxy;
        public sslSocketFactory(): javax.net.ssl.SSLSocketFactory;
        public connectionPool(): okhttp3.ConnectionPool;
        public cache(): okhttp3.Cache;
        public certificatePinner(): okhttp3.CertificatePinner;
        public dispatcher(): okhttp3.Dispatcher;
        public networkInterceptors(): java.util.List<any>;
        public dns(): okhttp3.Dns;
        public proxyAuthenticator(): okhttp3.Authenticator;
        public hostnameVerifier(): javax.net.ssl.HostnameVerifier;
        public connectTimeoutMillis(): number;
        public pingIntervalMillis(): number;
        public cookieJar(): okhttp3.CookieJar;
        public connectionSpecs(): java.util.List<any>;
        public newBuilder(): okhttp3.OkHttpClient.Builder;
        public constructor();
        public proxySelector(): java.net.ProxySelector;
        public protocols(): java.util.List<any>;
        public readTimeoutMillis(): number;
        public authenticator(): okhttp3.Authenticator;
        public followRedirects(): boolean;
        public writeTimeoutMillis(): number;
        public newWebSocket(param0: okhttp3.Request, param1: okhttp3.WebSocketListener): okhttp3.WebSocket;
        public followSslRedirects(): boolean;
        public socketFactory(): javax.net.SocketFactory;
        public interceptors(): java.util.List<any>;
        public retryOnConnectionFailure(): boolean;
        public newCall(param0: okhttp3.Request): okhttp3.Call;
    }
    export namespace OkHttpClient {
        export class Builder extends java.lang.Object {
            public addInterceptor(param0: okhttp3.Interceptor): okhttp3.OkHttpClient.Builder;
            public connectionPool(param0: okhttp3.ConnectionPool): okhttp3.OkHttpClient.Builder;
            public readTimeout(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.OkHttpClient.Builder;
            public dns(param0: okhttp3.Dns): okhttp3.OkHttpClient.Builder;
            public pingInterval(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.OkHttpClient.Builder;
            public networkInterceptors(): java.util.List<any>;
            public build(): okhttp3.OkHttpClient;
            public sslSocketFactory(param0: javax.net.ssl.SSLSocketFactory): okhttp3.OkHttpClient.Builder;
            public interceptors(): java.util.List<any>;
            public proxyAuthenticator(param0: okhttp3.Authenticator): okhttp3.OkHttpClient.Builder;
            public followRedirects(param0: boolean): okhttp3.OkHttpClient.Builder;
            public cache(param0: okhttp3.Cache): okhttp3.OkHttpClient.Builder;
            public sslSocketFactory(param0: javax.net.ssl.SSLSocketFactory, param1: javax.net.ssl.X509TrustManager): okhttp3.OkHttpClient.Builder;
            public connectionSpecs(param0: java.util.List<any>): okhttp3.OkHttpClient.Builder;
            public cookieJar(param0: okhttp3.CookieJar): okhttp3.OkHttpClient.Builder;
            public connectTimeout(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.OkHttpClient.Builder;
            public protocols(param0: java.util.List<any>): okhttp3.OkHttpClient.Builder;
            public followSslRedirects(param0: boolean): okhttp3.OkHttpClient.Builder;
            public constructor();
            public dispatcher(param0: okhttp3.Dispatcher): okhttp3.OkHttpClient.Builder;
            public proxySelector(param0: java.net.ProxySelector): okhttp3.OkHttpClient.Builder;
            public socketFactory(param0: javax.net.SocketFactory): okhttp3.OkHttpClient.Builder;
            public retryOnConnectionFailure(param0: boolean): okhttp3.OkHttpClient.Builder;
            public writeTimeout(param0: number, param1: java.util.concurrent.TimeUnit): okhttp3.OkHttpClient.Builder;
            public addNetworkInterceptor(param0: okhttp3.Interceptor): okhttp3.OkHttpClient.Builder;
            public hostnameVerifier(param0: javax.net.ssl.HostnameVerifier): okhttp3.OkHttpClient.Builder;
            public authenticator(param0: okhttp3.Authenticator): okhttp3.OkHttpClient.Builder;
            public proxy(param0: java.net.Proxy): okhttp3.OkHttpClient.Builder;
            public certificatePinner(param0: okhttp3.CertificatePinner): okhttp3.OkHttpClient.Builder;
        }
    }
}

declare namespace okhttp3 {
    export class Protocol extends java.lang.Enum {
        public static HTTP_1_0: okhttp3.Protocol;
        public static HTTP_1_1: okhttp3.Protocol;
        public static SPDY_3: okhttp3.Protocol;
        public static HTTP_2: okhttp3.Protocol;
        public static valueOf(param0: string): okhttp3.Protocol;
        public static get(param0: string): okhttp3.Protocol;
        public static valueOf(param0: java.lang.Class, param1: string): java.lang.Enum;
        public static values(): native.Array<okhttp3.Protocol>;
        public toString(): string;
    }
}

declare namespace okhttp3 {
    export class RealCall extends java.lang.Object implements okhttp3.Call {
        public clone(): okhttp3.RealCall;
        public isExecuted(): boolean;
        public clone(): okhttp3.Call;
        public request(): okhttp3.Request;
        public execute(): okhttp3.Response;
        public isCanceled(): boolean;
        public clone(): java.lang.Object;
        public enqueue(param0: okhttp3.Callback): void;
        public cancel(): void;
    }
    export namespace RealCall {
        export class AsyncCall extends okhttp3.internal.NamedRunnable {
            public execute(): void;
            public run(): void;
        }
    }
}

declare namespace okhttp3 {
    export class Request extends java.lang.Object {
        public header(param0: string): string;
        public tag(): java.lang.Object;
        public headers(): okhttp3.Headers;
        public newBuilder(): okhttp3.Request.Builder;
        public url(): okhttp3.HttpUrl;
        public cacheControl(): okhttp3.CacheControl;
        public method(): string;
        public toString(): string;
        public body(): okhttp3.RequestBody;
        public headers(param0: string): java.util.List<any>;
        public isHttps(): boolean;
    }
    export namespace Request {
        export class Builder extends java.lang.Object {
            public url(param0: okhttp3.HttpUrl): okhttp3.Request.Builder;
            public url(param0: java.net.URL): okhttp3.Request.Builder;
            public header(param0: string, param1: string): okhttp3.Request.Builder;
            public headers(param0: okhttp3.Headers): okhttp3.Request.Builder;
            public put(param0: okhttp3.RequestBody): okhttp3.Request.Builder;
            public delete(): okhttp3.Request.Builder;
            public get(): okhttp3.Request.Builder;
            public constructor();
            public addHeader(param0: string, param1: string): okhttp3.Request.Builder;
            public post(param0: okhttp3.RequestBody): okhttp3.Request.Builder;
            public delete(param0: okhttp3.RequestBody): okhttp3.Request.Builder;
            public patch(param0: okhttp3.RequestBody): okhttp3.Request.Builder;
            public build(): okhttp3.Request;
            public method(param0: string, param1: okhttp3.RequestBody): okhttp3.Request.Builder;
            public url(param0: string): okhttp3.Request.Builder;
            public removeHeader(param0: string): okhttp3.Request.Builder;
            public cacheControl(param0: okhttp3.CacheControl): okhttp3.Request.Builder;
            public head(): okhttp3.Request.Builder;
            public tag(param0: java.lang.Object): okhttp3.Request.Builder;
        }
    }
}

declare namespace okhttp3 {
    export abstract class RequestBody extends java.lang.Object {
        public constructor();
        public static create(param0: okhttp3.MediaType, param1: okio.ByteString): okhttp3.RequestBody;
        public static create(param0: okhttp3.MediaType, param1: java.io.File): okhttp3.RequestBody;
        public static create(param0: okhttp3.MediaType, param1: string): okhttp3.RequestBody;
        public contentType(): okhttp3.MediaType;
        public writeTo(param0: okio.BufferedSink): void;
        public static create(param0: okhttp3.MediaType, param1: native.Array<number>): okhttp3.RequestBody;
        public contentLength(): number;
        public static create(param0: okhttp3.MediaType, param1: native.Array<number>, param2: number, param3: number): okhttp3.RequestBody;
    }
}

declare namespace okhttp3 {
    export class Response extends java.lang.Object implements java.io.Closeable {
        public headers(): okhttp3.Headers;
        public priorResponse(): okhttp3.Response;
        public close(): void;
        public cacheResponse(): okhttp3.Response;
        public challenges(): java.util.List<any>;
        public sentRequestAtMillis(): number;
        public cacheControl(): okhttp3.CacheControl;
        public toString(): string;
        public handshake(): okhttp3.Handshake;
        public peekBody(param0: number): okhttp3.ResponseBody;
        public isSuccessful(): boolean;
        public header(param0: string): string;
        public header(param0: string, param1: string): string;
        public body(): okhttp3.ResponseBody;
        public networkResponse(): okhttp3.Response;
        public newBuilder(): okhttp3.Response.Builder;
        public request(): okhttp3.Request;
        public code(): number;
        public protocol(): okhttp3.Protocol;
        public message(): string;
        public receivedResponseAtMillis(): number;
        public isRedirect(): boolean;
        public headers(param0: string): java.util.List<any>;
    }
    export namespace Response {
        export class Builder extends java.lang.Object {
            public cacheResponse(param0: okhttp3.Response): okhttp3.Response.Builder;
            public body(param0: okhttp3.ResponseBody): okhttp3.Response.Builder;
            public message(param0: string): okhttp3.Response.Builder;
            public request(param0: okhttp3.Request): okhttp3.Response.Builder;
            public header(param0: string, param1: string): okhttp3.Response.Builder;
            public headers(param0: okhttp3.Headers): okhttp3.Response.Builder;
            public sentRequestAtMillis(param0: number): okhttp3.Response.Builder;
            public priorResponse(param0: okhttp3.Response): okhttp3.Response.Builder;
            public networkResponse(param0: okhttp3.Response): okhttp3.Response.Builder;
            public constructor();
            public removeHeader(param0: string): okhttp3.Response.Builder;
            public handshake(param0: okhttp3.Handshake): okhttp3.Response.Builder;
            public addHeader(param0: string, param1: string): okhttp3.Response.Builder;
            public code(param0: number): okhttp3.Response.Builder;
            public build(): okhttp3.Response;
            public protocol(param0: okhttp3.Protocol): okhttp3.Response.Builder;
            public receivedResponseAtMillis(param0: number): okhttp3.Response.Builder;
        }
    }
}

declare namespace okhttp3 {
    export abstract class ResponseBody extends java.lang.Object implements java.io.Closeable {
        public constructor();
        public byteStream(): java.io.InputStream;
        public bytes(): native.Array<number>;
        public static create(param0: okhttp3.MediaType, param1: native.Array<number>): okhttp3.ResponseBody;
        public static create(param0: okhttp3.MediaType, param1: number, param2: okio.BufferedSource): okhttp3.ResponseBody;
        public close(): void;
        public charStream(): java.io.Reader;
        public contentType(): okhttp3.MediaType;
        public source(): okio.BufferedSource;
        public string(): string;
        public contentLength(): number;
        public static create(param0: okhttp3.MediaType, param1: string): okhttp3.ResponseBody;
    }
    export namespace ResponseBody {
        export class BomAwareReader extends java.io.Reader {
            public read(param0: native.Array<string>): number;
            public read(param0: java.nio.CharBuffer): number;
            public read(param0: native.Array<string>, param1: number, param2: number): number;
            public close(): void;
            public read(): number;
        }
    }
}

declare namespace okhttp3 {
    export class Route extends java.lang.Object {
        public proxy(): java.net.Proxy;
        public constructor(param0: okhttp3.Address, param1: java.net.Proxy, param2: java.net.InetSocketAddress);
        public address(): okhttp3.Address;
        public hashCode(): number;
        public requiresTunnel(): boolean;
        public equals(param0: java.lang.Object): boolean;
        public socketAddress(): java.net.InetSocketAddress;
    }
}

declare namespace okhttp3 {
    export class TlsVersion extends java.lang.Enum {
        public static TLS_1_3: okhttp3.TlsVersion;
        public static TLS_1_2: okhttp3.TlsVersion;
        public static TLS_1_1: okhttp3.TlsVersion;
        public static TLS_1_0: okhttp3.TlsVersion;
        public static SSL_3_0: okhttp3.TlsVersion;
        public javaName(): string;
        public static valueOf(param0: java.lang.Class, param1: string): java.lang.Enum;
        public static values(): native.Array<okhttp3.TlsVersion>;
        public static valueOf(param0: string): okhttp3.TlsVersion;
        public static forJavaName(param0: string): okhttp3.TlsVersion;
    }
}

declare namespace okhttp3 {
    export class WebSocket extends java.lang.Object {
        /**
         * Constructs a new instance of the okhttp3.WebSocket interface with the provided implementation.
         */
        public constructor(implementation: {
            request(): okhttp3.Request;
            queueSize(): number;
            send(param0: string): boolean;
            send(param0: okio.ByteString): boolean;
            close(param0: number, param1: string): boolean;
            cancel(): void;
        });
        public send(param0: string): boolean;
        public send(param0: okio.ByteString): boolean;
        public close(param0: number, param1: string): boolean;
        public request(): okhttp3.Request;
        public queueSize(): number;
        public cancel(): void;
    }
    export namespace WebSocket {
        export class Factory extends java.lang.Object {
            /**
             * Constructs a new instance of the okhttp3.WebSocket$Factory interface with the provided implementation.
             */
            public constructor(implementation: {
                newWebSocket(param0: okhttp3.Request, param1: okhttp3.WebSocketListener): okhttp3.WebSocket;
            });
            public newWebSocket(param0: okhttp3.Request, param1: okhttp3.WebSocketListener): okhttp3.WebSocket;
        }
    }
}

declare namespace okhttp3 {
    export abstract class WebSocketListener extends java.lang.Object {
        public constructor();
        public onClosed(param0: okhttp3.WebSocket, param1: number, param2: string): void;
        public onMessage(param0: okhttp3.WebSocket, param1: okio.ByteString): void;
        public onFailure(param0: okhttp3.WebSocket, param1: java.lang.Throwable, param2: okhttp3.Response): void;
        public onOpen(param0: okhttp3.WebSocket, param1: okhttp3.Response): void;
        public onClosing(param0: okhttp3.WebSocket, param1: number, param2: string): void;
        public onMessage(param0: okhttp3.WebSocket, param1: string): void;
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export abstract class Internal extends java.lang.Object {
            public static instance: okhttp3.internal.Internal;
            public addLenient(param0: okhttp3.Headers.Builder, param1: string): void;
            public connectionBecameIdle(param0: okhttp3.ConnectionPool, param1: okhttp3.internal.connection.RealConnection): boolean;
            public setCache(param0: okhttp3.OkHttpClient.Builder, param1: okhttp3.internal.cache.InternalCache): void;
            public newWebSocketCall(param0: okhttp3.OkHttpClient, param1: okhttp3.Request): okhttp3.Call;
            public constructor();
            public apply(param0: okhttp3.ConnectionSpec, param1: javax.net.ssl.SSLSocket, param2: boolean): void;
            public put(param0: okhttp3.ConnectionPool, param1: okhttp3.internal.connection.RealConnection): void;
            public getHttpUrlChecked(param0: string): okhttp3.HttpUrl;
            public routeDatabase(param0: okhttp3.ConnectionPool): okhttp3.internal.connection.RouteDatabase;
            public static initializeInstanceForTests(): void;
            public addLenient(param0: okhttp3.Headers.Builder, param1: string, param2: string): void;
            public get(param0: okhttp3.ConnectionPool, param1: okhttp3.Address, param2: okhttp3.internal.connection.StreamAllocation): okhttp3.internal.connection.RealConnection;
            public streamAllocation(param0: okhttp3.Call): okhttp3.internal.connection.StreamAllocation;
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export abstract class NamedRunnable extends java.lang.Object implements java.lang.Runnable {
            public name: string;
            public execute(): void;
            public constructor(param0: string, param1: native.Array<java.lang.Object>);
            public run(): void;
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export class Util extends java.lang.Object {
            public static EMPTY_BYTE_ARRAY: native.Array<number>;
            public static EMPTY_STRING_ARRAY: native.Array<string>;
            public static EMPTY_RESPONSE: okhttp3.ResponseBody;
            public static EMPTY_REQUEST: okhttp3.RequestBody;
            public static UTF_8: java.nio.charset.Charset;
            public static UTC: java.util.TimeZone;
            public static checkOffsetAndCount(param0: number, param1: number, param2: number): void;
            public static verifyAsIpAddress(param0: string): boolean;
            public static bomAwareCharset(param0: okio.BufferedSource, param1: java.nio.charset.Charset): java.nio.charset.Charset;
            public static toHumanReadableAscii(param0: string): string;
            public static indexOf(param0: native.Array<java.lang.Object>, param1: java.lang.Object): number;
            public static delimiterOffset(param0: string, param1: number, param2: number, param3: string): number;
            public static closeQuietly(param0: java.io.Closeable): void;
            public static hostHeader(param0: okhttp3.HttpUrl, param1: boolean): string;
            public static trimSubstring(param0: string, param1: number, param2: number): string;
            public static closeQuietly(param0: java.net.Socket): void;
            public static skipTrailingAsciiWhitespace(param0: string, param1: number, param2: number): number;
            public static intersect(param0: java.lang.Class, param1: native.Array<java.lang.Object>, param2: native.Array<java.lang.Object>): native.Array<java.lang.Object>;
            public static format(param0: string, param1: native.Array<java.lang.Object>): string;
            public static concat(param0: native.Array<string>, param1: string): native.Array<string>;
            public static domainToAscii(param0: string): string;
            public static closeQuietly(param0: java.net.ServerSocket): void;
            public static discard(param0: okio.Source, param1: number, param2: java.util.concurrent.TimeUnit): boolean;
            public static throwIfFatal(param0: java.lang.Throwable): void;
            public static threadFactory(param0: string, param1: boolean): java.util.concurrent.ThreadFactory;
            public static skipLeadingAsciiWhitespace(param0: string, param1: number, param2: number): number;
            public static isAndroidGetsocknameError(param0: java.lang.AssertionError): boolean;
            public static equal(param0: java.lang.Object, param1: java.lang.Object): boolean;
            public static skipAll(param0: okio.Source, param1: number, param2: java.util.concurrent.TimeUnit): boolean;
            public static immutableList(param0: java.util.List<any>): java.util.List<any>;
            public static immutableList(param0: native.Array<java.lang.Object>): java.util.List<any>;
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export class Version extends java.lang.Object {
            public static userAgent(): string;
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class CacheInterceptor extends java.lang.Object implements okhttp3.Interceptor {
                public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
                public constructor(param0: okhttp3.internal.cache.InternalCache);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class CacheRequest extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.cache.CacheRequest interface with the provided implementation.
                 */
                public constructor(implementation: {
                    body(): okio.Sink;
                    abort(): void;
                });
                public abort(): void;
                public body(): okio.Sink;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class CacheStrategy extends java.lang.Object {
                public networkRequest: okhttp3.Request;
                public cacheResponse: okhttp3.Response;
                public static isCacheable(param0: okhttp3.Response, param1: okhttp3.Request): boolean;
            }
            export namespace CacheStrategy {
                export class Factory extends java.lang.Object {
                    public constructor(param0: number, param1: okhttp3.Request, param2: okhttp3.Response);
                    public get(): okhttp3.internal.cache.CacheStrategy;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class DiskLruCache extends java.lang.Object implements java.io.Closeable, java.io.Flushable {
                public remove(param0: string): boolean;
                public close(): void;
                public isClosed(): boolean;
                public getDirectory(): java.io.File;
                public snapshots(): java.util.Iterator;
                public static create(param0: okhttp3.internal.io.FileSystem, param1: java.io.File, param2: number, param3: number, param4: number): okhttp3.internal.cache.DiskLruCache;
                public get(param0: string): okhttp3.internal.cache.DiskLruCache.Snapshot;
                public size(): number;
                public flush(): void;
                public setMaxSize(param0: number): void;
                public edit(param0: string): okhttp3.internal.cache.DiskLruCache.Editor;
                public initialize(): void;
                public delete(): void;
                public getMaxSize(): number;
                public evictAll(): void;
            }
            export namespace DiskLruCache {
                export class Editor extends java.lang.Object {
                    public newSource(param0: number): okio.Source;
                    public commit(): void;
                    public newSink(param0: number): okio.Sink;
                    public abortUnlessCommitted(): void;
                    public abort(): void;
                }
                export class Entry extends java.lang.Object {
                }
                export class Snapshot extends java.lang.Object implements java.io.Closeable {
                    public close(): void;
                    public key(): string;
                    public getLength(param0: number): number;
                    public edit(): okhttp3.internal.cache.DiskLruCache.Editor;
                    public getSource(param0: number): okio.Source;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class FaultHidingSink extends okio.ForwardingSink {
                public close(): void;
                public timeout(): okio.Timeout;
                public constructor(param0: okio.Sink);
                public write(param0: okio.Buffer, param1: number): void;
                public flush(): void;
                public onException(param0: java.io.IOException): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache {
            export class InternalCache extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.cache.InternalCache interface with the provided implementation.
                 */
                public constructor(implementation: {
                    get(param0: okhttp3.Request): okhttp3.Response;
                    put(param0: okhttp3.Response): okhttp3.internal.cache.CacheRequest;
                    remove(param0: okhttp3.Request): void;
                    update(param0: okhttp3.Response, param1: okhttp3.Response): void;
                    trackConditionalCacheHit(): void;
                    trackResponse(param0: okhttp3.internal.cache.CacheStrategy): void;
                });
                public put(param0: okhttp3.Response): okhttp3.internal.cache.CacheRequest;
                public get(param0: okhttp3.Request): okhttp3.Response;
                public remove(param0: okhttp3.Request): void;
                public update(param0: okhttp3.Response, param1: okhttp3.Response): void;
                public trackConditionalCacheHit(): void;
                public trackResponse(param0: okhttp3.internal.cache.CacheStrategy): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache2 {
            export class FileOperator extends java.lang.Object {
                public write(param0: number, param1: okio.Buffer, param2: number): void;
                public constructor(param0: java.nio.channels.FileChannel);
                public read(param0: number, param1: okio.Buffer, param2: number): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace cache2 {
            export class Relay extends java.lang.Object {
                public newSource(): okio.Source;
                public metadata(): okio.ByteString;
                public static edit(param0: java.io.File, param1: okio.Source, param2: okio.ByteString, param3: number): okhttp3.internal.cache2.Relay;
                public static read(param0: java.io.File): okhttp3.internal.cache2.Relay;
            }
            export namespace Relay {
                export class RelaySource extends java.lang.Object implements okio.Source {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class ConnectInterceptor extends java.lang.Object implements okhttp3.Interceptor {
                public client: okhttp3.OkHttpClient;
                public constructor(param0: okhttp3.OkHttpClient);
                public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class ConnectionSpecSelector extends java.lang.Object {
                public constructor(param0: java.util.List<any>);
                public configureSecureSocket(param0: javax.net.ssl.SSLSocket): okhttp3.ConnectionSpec;
                public connectionFailed(param0: java.io.IOException): boolean;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class RealConnection extends okhttp3.internal.http2.Http2Connection.Listener implements okhttp3.Connection {
                public http2Connection: okhttp3.internal.http2.Http2Connection;
                public successCount: number;
                public source: okio.BufferedSource;
                public sink: okio.BufferedSink;
                public allocationLimit: number;
                public allocations: java.util.List<any>;
                public noNewStreams: boolean;
                public idleAtNanos: number;
                public connect(param0: number, param1: number, param2: number, param3: java.util.List<any>, param4: boolean): void;
                public constructor(param0: okhttp3.Route);
                public onSettings(param0: okhttp3.internal.http2.Http2Connection): void;
                public protocol(): okhttp3.Protocol;
                public route(): okhttp3.Route;
                public toString(): string;
                public socket(): java.net.Socket;
                public onStream(param0: okhttp3.internal.http2.Http2Stream): void;
                public constructor();
                public isHealthy(param0: boolean): boolean;
                public cancel(): void;
                public isMultiplexed(): boolean;
                public handshake(): okhttp3.Handshake;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class RouteDatabase extends java.lang.Object {
                public shouldPostpone(param0: okhttp3.Route): boolean;
                public connected(param0: okhttp3.Route): void;
                public failed(param0: okhttp3.Route): void;
                public constructor();
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class RouteException extends java.lang.RuntimeException {
                public getLastConnectException(): java.io.IOException;
                public constructor(param0: java.io.IOException);
                public addConnectException(param0: java.io.IOException): void;
                public constructor(param0: string, param1: java.lang.Throwable);
                public constructor(param0: java.lang.Throwable);
                public constructor(param0: string);
                public constructor();
                public constructor(param0: string, param1: java.lang.Throwable, param2: boolean, param3: boolean);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class RouteSelector extends java.lang.Object {
                public next(): okhttp3.Route;
                public constructor(param0: okhttp3.Address, param1: okhttp3.internal.connection.RouteDatabase);
                public hasNext(): boolean;
                public connectFailed(param0: okhttp3.Route, param1: java.io.IOException): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace connection {
            export class StreamAllocation extends java.lang.Object {
                public address: okhttp3.Address;
                public acquire(param0: okhttp3.internal.connection.RealConnection): void;
                public noNewStreams(): void;
                public release(): void;
                public constructor(param0: okhttp3.ConnectionPool, param1: okhttp3.Address, param2: java.lang.Object);
                public newStream(param0: okhttp3.OkHttpClient, param1: boolean): okhttp3.internal.http.HttpCodec;
                public streamFinished(param0: boolean, param1: okhttp3.internal.http.HttpCodec): void;
                public codec(): okhttp3.internal.http.HttpCodec;
                public cancel(): void;
                public connection(): okhttp3.internal.connection.RealConnection;
                public hasMoreRoutes(): boolean;
                public streamFailed(param0: java.io.IOException): void;
                public toString(): string;
            }
            export namespace StreamAllocation {
                export class StreamAllocationReference extends java.lang.ref.WeakReference {
                    public callStackTrace: java.lang.Object;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class BridgeInterceptor extends java.lang.Object implements okhttp3.Interceptor {
                public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
                public constructor(param0: okhttp3.CookieJar);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class CallServerInterceptor extends java.lang.Object implements okhttp3.Interceptor {
                public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
                public constructor(param0: boolean);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class HttpCodec extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.http.HttpCodec interface with the provided implementation.
                 */
                public constructor(implementation: {
                    createRequestBody(param0: okhttp3.Request, param1: number): okio.Sink;
                    writeRequestHeaders(param0: okhttp3.Request): void;
                    finishRequest(): void;
                    readResponseHeaders(): okhttp3.Response.Builder;
                    openResponseBody(param0: okhttp3.Response): okhttp3.ResponseBody;
                    cancel(): void;
                });
                public static DISCARD_STREAM_TIMEOUT_MILLIS: number;
                public finishRequest(): void;
                public openResponseBody(param0: okhttp3.Response): okhttp3.ResponseBody;
                public readResponseHeaders(): okhttp3.Response.Builder;
                public cancel(): void;
                public createRequestBody(param0: okhttp3.Request, param1: number): okio.Sink;
                public writeRequestHeaders(param0: okhttp3.Request): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class HttpDate extends java.lang.Object {
                public static MAX_DATE: number;
                public static parse(param0: string): java.util.Date;
                public static format(param0: java.util.Date): string;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class HttpHeaders extends java.lang.Object {
                public static parseChallenges(param0: okhttp3.Headers, param1: string): java.util.List<any>;
                public static varyHeaders(param0: okhttp3.Headers, param1: okhttp3.Headers): okhttp3.Headers;
                public static hasBody(param0: okhttp3.Response): boolean;
                public static receiveHeaders(param0: okhttp3.CookieJar, param1: okhttp3.HttpUrl, param2: okhttp3.Headers): void;
                public static varyHeaders(param0: okhttp3.Response): okhttp3.Headers;
                public static varyMatches(param0: okhttp3.Response, param1: okhttp3.Headers, param2: okhttp3.Request): boolean;
                public static varyFields(param0: okhttp3.Headers): java.util.Set;
                public static skipWhitespace(param0: string, param1: number): number;
                public static hasVaryAll(param0: okhttp3.Headers): boolean;
                public static contentLength(param0: okhttp3.Response): number;
                public static hasVaryAll(param0: okhttp3.Response): boolean;
                public static skipUntil(param0: string, param1: number, param2: string): number;
                public static contentLength(param0: okhttp3.Headers): number;
                public static parseSeconds(param0: string, param1: number): number;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class HttpMethod extends java.lang.Object {
                public static invalidatesCache(param0: string): boolean;
                public static requiresRequestBody(param0: string): boolean;
                public static permitsRequestBody(param0: string): boolean;
                public static redirectsWithBody(param0: string): boolean;
                public static redirectsToGet(param0: string): boolean;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class RealInterceptorChain extends java.lang.Object implements okhttp3.Interceptor.Chain {
                public request(): okhttp3.Request;
                public proceed(param0: okhttp3.Request, param1: okhttp3.internal.connection.StreamAllocation, param2: okhttp3.internal.http.HttpCodec, param3: okhttp3.Connection): okhttp3.Response;
                public connection(): okhttp3.Connection;
                public constructor(param0: java.util.List<any>, param1: okhttp3.internal.connection.StreamAllocation, param2: okhttp3.internal.http.HttpCodec, param3: okhttp3.Connection, param4: number, param5: okhttp3.Request);
                public httpStream(): okhttp3.internal.http.HttpCodec;
                public proceed(param0: okhttp3.Request): okhttp3.Response;
                public streamAllocation(): okhttp3.internal.connection.StreamAllocation;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class RealResponseBody extends okhttp3.ResponseBody {
                public close(): void;
                public contentLength(): number;
                public constructor(param0: okhttp3.Headers, param1: okio.BufferedSource);
                public source(): okio.BufferedSource;
                public contentType(): okhttp3.MediaType;
                public constructor();
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class RequestLine extends java.lang.Object {
                public static requestPath(param0: okhttp3.HttpUrl): string;
                public static get(param0: okhttp3.Request, param1: java.net.Proxy.Type): string;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class RetryAndFollowUpInterceptor extends java.lang.Object implements okhttp3.Interceptor {
                public isCanceled(): boolean;
                public intercept(param0: okhttp3.Interceptor.Chain): okhttp3.Response;
                public constructor(param0: okhttp3.OkHttpClient, param1: boolean);
                public cancel(): void;
                public streamAllocation(): okhttp3.internal.connection.StreamAllocation;
                public setCallStackTrace(param0: java.lang.Object): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class StatusLine extends java.lang.Object {
                public static HTTP_TEMP_REDIRECT: number;
                public static HTTP_PERM_REDIRECT: number;
                public static HTTP_CONTINUE: number;
                public protocol: okhttp3.Protocol;
                public code: number;
                public message: string;
                public constructor(param0: okhttp3.Protocol, param1: number, param2: string);
                public static parse(param0: string): okhttp3.internal.http.StatusLine;
                public toString(): string;
                public static get(param0: okhttp3.Response): okhttp3.internal.http.StatusLine;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http {
            export class UnrepeatableRequestBody extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.http.UnrepeatableRequestBody interface with the provided implementation.
                 */
                public constructor(implementation: {
                });
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http1 {
            export class Http1Codec extends java.lang.Object implements okhttp3.internal.http.HttpCodec {
                public finishRequest(): void;
                public newFixedLengthSink(param0: number): okio.Sink;
                public newChunkedSink(): okio.Sink;
                public constructor(param0: okhttp3.OkHttpClient, param1: okhttp3.internal.connection.StreamAllocation, param2: okio.BufferedSource, param3: okio.BufferedSink);
                public isClosed(): boolean;
                public writeRequestHeaders(param0: okhttp3.Request): void;
                public writeRequest(param0: okhttp3.Headers, param1: string): void;
                public openResponseBody(param0: okhttp3.Response): okhttp3.ResponseBody;
                public newUnknownLengthSource(): okio.Source;
                public readResponseHeaders(): okhttp3.Response.Builder;
                public readHeaders(): okhttp3.Headers;
                public newChunkedSource(param0: okhttp3.HttpUrl): okio.Source;
                public cancel(): void;
                public readResponse(): okhttp3.Response.Builder;
                public createRequestBody(param0: okhttp3.Request, param1: number): okio.Sink;
                public newFixedLengthSource(param0: number): okio.Source;
            }
            export namespace Http1Codec {
                export abstract class AbstractSource extends java.lang.Object implements okio.Source {
                    public closed: boolean;
                    public endOfInput(param0: boolean): void;
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
                export class ChunkedSink extends java.lang.Object implements okio.Sink {
                    public close(): void;
                    public flush(): void;
                    public write(param0: okio.Buffer, param1: number): void;
                    public timeout(): okio.Timeout;
                }
                export class ChunkedSource extends okhttp3.internal.http1.Http1Codec.AbstractSource {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
                export class FixedLengthSink extends java.lang.Object implements okio.Sink {
                    public close(): void;
                    public flush(): void;
                    public write(param0: okio.Buffer, param1: number): void;
                    public timeout(): okio.Timeout;
                }
                export class FixedLengthSource extends okhttp3.internal.http1.Http1Codec.AbstractSource {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public constructor(param0: okhttp3.internal.http1.Http1Codec, param1: number);
                    public read(param0: okio.Buffer, param1: number): number;
                }
                export class UnknownLengthSource extends okhttp3.internal.http1.Http1Codec.AbstractSource {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class ConnectionShutdownException extends java.io.IOException {
                public constructor(param0: string, param1: java.lang.Throwable);
                public constructor(param0: java.lang.Throwable);
                public constructor(param0: string);
                public constructor(param0: string, param1: java.lang.Throwable, param2: boolean, param3: boolean);
                public constructor();
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class ErrorCode extends java.lang.Enum {
                public static NO_ERROR: okhttp3.internal.http2.ErrorCode;
                public static PROTOCOL_ERROR: okhttp3.internal.http2.ErrorCode;
                public static INTERNAL_ERROR: okhttp3.internal.http2.ErrorCode;
                public static FLOW_CONTROL_ERROR: okhttp3.internal.http2.ErrorCode;
                public static REFUSED_STREAM: okhttp3.internal.http2.ErrorCode;
                public static CANCEL: okhttp3.internal.http2.ErrorCode;
                public httpCode: number;
                public static valueOf(param0: string): okhttp3.internal.http2.ErrorCode;
                public static fromHttp2(param0: number): okhttp3.internal.http2.ErrorCode;
                public static values(): native.Array<okhttp3.internal.http2.ErrorCode>;
                public static valueOf(param0: java.lang.Class, param1: string): java.lang.Enum;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Header extends java.lang.Object {
                public static PSEUDO_PREFIX: okio.ByteString;
                public static RESPONSE_STATUS: okio.ByteString;
                public static TARGET_METHOD: okio.ByteString;
                public static TARGET_PATH: okio.ByteString;
                public static TARGET_SCHEME: okio.ByteString;
                public static TARGET_AUTHORITY: okio.ByteString;
                public name: okio.ByteString;
                public value: okio.ByteString;
                public constructor(param0: okio.ByteString, param1: okio.ByteString);
                public equals(param0: java.lang.Object): boolean;
                public hashCode(): number;
                public constructor(param0: okio.ByteString, param1: string);
                public toString(): string;
                public constructor(param0: string, param1: string);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Hpack extends java.lang.Object {
            }
            export namespace Hpack {
                export class Reader extends java.lang.Object {
                    public getAndResetHeaderList(): java.util.List<any>;
                }
                export class Writer extends java.lang.Object {
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2 extends java.lang.Object {
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2Codec extends java.lang.Object implements okhttp3.internal.http.HttpCodec {
                public finishRequest(): void;
                public openResponseBody(param0: okhttp3.Response): okhttp3.ResponseBody;
                public readResponseHeaders(): okhttp3.Response.Builder;
                public static http2HeadersList(param0: okhttp3.Request): java.util.List<any>;
                public cancel(): void;
                public constructor(param0: okhttp3.OkHttpClient, param1: okhttp3.internal.connection.StreamAllocation, param2: okhttp3.internal.http2.Http2Connection);
                public createRequestBody(param0: okhttp3.Request, param1: number): okio.Sink;
                public writeRequestHeaders(param0: okhttp3.Request): void;
                public static readHttp2HeadersList(param0: java.util.List<any>): okhttp3.Response.Builder;
            }
            export namespace Http2Codec {
                export class StreamFinishingSource extends okio.ForwardingSource {
                    public constructor(param0: okhttp3.internal.http2.Http2Codec, param1: okio.Source);
                    public constructor(param0: okio.Source);
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2Connection extends java.lang.Object implements java.io.Closeable {
                public newStream(param0: java.util.List<any>, param1: boolean): okhttp3.internal.http2.Http2Stream;
                public writeData(param0: number, param1: boolean, param2: okio.Buffer, param3: number): void;
                public close(): void;
                public openStreamCount(): number;
                public shutdown(param0: okhttp3.internal.http2.ErrorCode): void;
                public setSettings(param0: okhttp3.internal.http2.Settings): void;
                public getProtocol(): okhttp3.Protocol;
                public flush(): void;
                public maxConcurrentStreams(): number;
                public pushStream(param0: number, param1: java.util.List<any>, param2: boolean): okhttp3.internal.http2.Http2Stream;
                public start(): void;
                public isShutdown(): boolean;
                public ping(): okhttp3.internal.http2.Ping;
            }
            export namespace Http2Connection {
                export class Builder extends java.lang.Object {
                    public constructor(param0: boolean);
                    public listener(param0: okhttp3.internal.http2.Http2Connection.Listener): okhttp3.internal.http2.Http2Connection.Builder;
                    public build(): okhttp3.internal.http2.Http2Connection;
                    public socket(param0: java.net.Socket, param1: string, param2: okio.BufferedSource, param3: okio.BufferedSink): okhttp3.internal.http2.Http2Connection.Builder;
                    public socket(param0: java.net.Socket): okhttp3.internal.http2.Http2Connection.Builder;
                    public pushObserver(param0: okhttp3.internal.http2.PushObserver): okhttp3.internal.http2.Http2Connection.Builder;
                }
                export abstract class Listener extends java.lang.Object {
                    public static REFUSE_INCOMING_STREAMS: okhttp3.internal.http2.Http2Connection.Listener;
                    public onStream(param0: okhttp3.internal.http2.Http2Stream): void;
                    public constructor();
                    public onSettings(param0: okhttp3.internal.http2.Http2Connection): void;
                }
                export class ReaderRunnable extends okhttp3.internal.NamedRunnable implements okhttp3.internal.http2.Http2Reader.Handler {
                    public ackSettings(): void;
                    public headers(param0: boolean, param1: number, param2: number, param3: java.util.List<any>): void;
                    public priority(param0: number, param1: number, param2: number, param3: boolean): void;
                    public execute(): void;
                    public run(): void;
                    public settings(param0: boolean, param1: okhttp3.internal.http2.Settings): void;
                    public alternateService(param0: number, param1: string, param2: okio.ByteString, param3: string, param4: number, param5: number): void;
                    public data(param0: boolean, param1: number, param2: okio.BufferedSource, param3: number): void;
                    public pushPromise(param0: number, param1: number, param2: java.util.List<any>): void;
                    public rstStream(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
                    public goAway(param0: number, param1: okhttp3.internal.http2.ErrorCode, param2: okio.ByteString): void;
                    public windowUpdate(param0: number, param1: number): void;
                    public ping(param0: boolean, param1: number, param2: number): void;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2Reader extends java.lang.Object implements java.io.Closeable {
                public nextFrame(param0: okhttp3.internal.http2.Http2Reader.Handler): boolean;
                public close(): void;
                public readConnectionPreface(): void;
                public constructor(param0: okio.BufferedSource, param1: boolean);
            }
            export namespace Http2Reader {
                export class ContinuationSource extends java.lang.Object implements okio.Source {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                    public constructor(param0: okio.BufferedSource);
                }
                export class Handler extends java.lang.Object {
                    /**
                     * Constructs a new instance of the okhttp3.internal.http2.Http2Reader$Handler interface with the provided implementation.
                     */
                    public constructor(implementation: {
                        data(param0: boolean, param1: number, param2: okio.BufferedSource, param3: number): void;
                        headers(param0: boolean, param1: number, param2: number, param3: java.util.List<any>): void;
                        rstStream(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
                        settings(param0: boolean, param1: okhttp3.internal.http2.Settings): void;
                        ackSettings(): void;
                        ping(param0: boolean, param1: number, param2: number): void;
                        goAway(param0: number, param1: okhttp3.internal.http2.ErrorCode, param2: okio.ByteString): void;
                        windowUpdate(param0: number, param1: number): void;
                        priority(param0: number, param1: number, param2: number, param3: boolean): void;
                        pushPromise(param0: number, param1: number, param2: java.util.List<any>): void;
                        alternateService(param0: number, param1: string, param2: okio.ByteString, param3: string, param4: number, param5: number): void;
                    });
                    public settings(param0: boolean, param1: okhttp3.internal.http2.Settings): void;
                    public alternateService(param0: number, param1: string, param2: okio.ByteString, param3: string, param4: number, param5: number): void;
                    public ackSettings(): void;
                    public data(param0: boolean, param1: number, param2: okio.BufferedSource, param3: number): void;
                    public headers(param0: boolean, param1: number, param2: number, param3: java.util.List<any>): void;
                    public priority(param0: number, param1: number, param2: number, param3: boolean): void;
                    public pushPromise(param0: number, param1: number, param2: java.util.List<any>): void;
                    public rstStream(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
                    public goAway(param0: number, param1: okhttp3.internal.http2.ErrorCode, param2: okio.ByteString): void;
                    public windowUpdate(param0: number, param1: number): void;
                    public ping(param0: boolean, param1: number, param2: number): void;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2Stream extends java.lang.Object {
                public getSource(): okio.Source;
                public close(param0: okhttp3.internal.http2.ErrorCode): void;
                public closeLater(param0: okhttp3.internal.http2.ErrorCode): void;
                public writeTimeout(): okio.Timeout;
                public getId(): number;
                public getErrorCode(): okhttp3.internal.http2.ErrorCode;
                public getResponseHeaders(): java.util.List<any>;
                public getRequestHeaders(): java.util.List<any>;
                public reply(param0: java.util.List<any>, param1: boolean): void;
                public getConnection(): okhttp3.internal.http2.Http2Connection;
                public isOpen(): boolean;
                public readTimeout(): okio.Timeout;
                public getSink(): okio.Sink;
                public isLocallyInitiated(): boolean;
            }
            export namespace Http2Stream {
                export class FramedDataSink extends java.lang.Object implements okio.Sink {
                    public close(): void;
                    public flush(): void;
                    public write(param0: okio.Buffer, param1: number): void;
                    public timeout(): okio.Timeout;
                }
                export class FramedDataSource extends java.lang.Object implements okio.Source {
                    public close(): void;
                    public timeout(): okio.Timeout;
                    public read(param0: okio.Buffer, param1: number): number;
                }
                export class StreamTimeout extends okio.AsyncTimeout {
                    public timedOut(): void;
                    public newTimeoutException(param0: java.io.IOException): java.io.IOException;
                    public exitAndThrowIfTimedOut(): void;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Http2Writer extends java.lang.Object implements java.io.Closeable {
                public close(): void;
                public pushPromise(param0: number, param1: number, param2: java.util.List<any>): void;
                public settings(param0: okhttp3.internal.http2.Settings): void;
                public ping(param0: boolean, param1: number, param2: number): void;
                public headers(param0: number, param1: java.util.List<any>): void;
                public constructor(param0: okio.BufferedSink, param1: boolean);
                public windowUpdate(param0: number, param1: number): void;
                public frameHeader(param0: number, param1: number, param2: number, param3: number): void;
                public maxDataLength(): number;
                public goAway(param0: number, param1: okhttp3.internal.http2.ErrorCode, param2: native.Array<number>): void;
                public flush(): void;
                public synReply(param0: boolean, param1: number, param2: java.util.List<any>): void;
                public connectionPreface(): void;
                public data(param0: boolean, param1: number, param2: okio.Buffer, param3: number): void;
                public rstStream(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
                public applyAndAckSettings(param0: okhttp3.internal.http2.Settings): void;
                public synStream(param0: boolean, param1: number, param2: number, param3: java.util.List<any>): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Huffman extends java.lang.Object {
                public static get(): okhttp3.internal.http2.Huffman;
            }
            export namespace Huffman {
                export class Node extends java.lang.Object {
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Ping extends java.lang.Object {
                public roundTripTime(param0: number, param1: java.util.concurrent.TimeUnit): number;
                public roundTripTime(): number;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class PushObserver extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.http2.PushObserver interface with the provided implementation.
                 */
                public constructor(implementation: {
                    onRequest(param0: number, param1: java.util.List<any>): boolean;
                    onHeaders(param0: number, param1: java.util.List<any>, param2: boolean): boolean;
                    onData(param0: number, param1: okio.BufferedSource, param2: number, param3: boolean): boolean;
                    onReset(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
                    <clinit>(): void;
                });
                public static CANCEL: okhttp3.internal.http2.PushObserver;
                public onRequest(param0: number, param1: java.util.List<any>): boolean;
                public onHeaders(param0: number, param1: java.util.List<any>, param2: boolean): boolean;
                public onData(param0: number, param1: okio.BufferedSource, param2: number, param3: boolean): boolean;
                public onReset(param0: number, param1: okhttp3.internal.http2.ErrorCode): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class Settings extends java.lang.Object {
                public constructor();
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace http2 {
            export class StreamResetException extends java.io.IOException {
                public errorCode: okhttp3.internal.http2.ErrorCode;
                public constructor(param0: okhttp3.internal.http2.ErrorCode);
                public constructor(param0: string, param1: java.lang.Throwable);
                public constructor(param0: java.lang.Throwable);
                public constructor(param0: string);
                public constructor();
                public constructor(param0: string, param1: java.lang.Throwable, param2: boolean, param3: boolean);
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace io {
            export class FileSystem extends java.lang.Object {
                /**
                 * Constructs a new instance of the okhttp3.internal.io.FileSystem interface with the provided implementation.
                 */
                public constructor(implementation: {
                    source(param0: java.io.File): okio.Source;
                    sink(param0: java.io.File): okio.Sink;
                    appendingSink(param0: java.io.File): okio.Sink;
                    delete(param0: java.io.File): void;
                    exists(param0: java.io.File): boolean;
                    size(param0: java.io.File): number;
                    rename(param0: java.io.File, param1: java.io.File): void;
                    deleteContents(param0: java.io.File): void;
                    <clinit>(): void;
                });
                public static SYSTEM: okhttp3.internal.io.FileSystem;
                public source(param0: java.io.File): okio.Source;
                public size(param0: java.io.File): number;
                public deleteContents(param0: java.io.File): void;
                public appendingSink(param0: java.io.File): okio.Sink;
                public sink(param0: java.io.File): okio.Sink;
                public exists(param0: java.io.File): boolean;
                public rename(param0: java.io.File, param1: java.io.File): void;
                public delete(param0: java.io.File): void;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace platform {
            export class AndroidPlatform extends okhttp3.internal.platform.Platform {
                public constructor(param0: java.lang.Class, param1: okhttp3.internal.platform.OptionalMethod, param2: okhttp3.internal.platform.OptionalMethod, param3: okhttp3.internal.platform.OptionalMethod, param4: okhttp3.internal.platform.OptionalMethod);
                public buildCertificateChainCleaner(param0: javax.net.ssl.X509TrustManager): okhttp3.internal.tls.CertificateChainCleaner;
                public connectSocket(param0: java.net.Socket, param1: java.net.InetSocketAddress, param2: number): void;
                public getSelectedProtocol(param0: javax.net.ssl.SSLSocket): string;
                public trustManager(param0: javax.net.ssl.SSLSocketFactory): javax.net.ssl.X509TrustManager;
                public configureTlsExtensions(param0: javax.net.ssl.SSLSocket, param1: string, param2: java.util.List<any>): void;
                public log(param0: number, param1: string, param2: java.lang.Throwable): void;
                public getStackTraceForCloseable(param0: string): java.lang.Object;
                public logCloseableLeak(param0: string, param1: java.lang.Object): void;
                public isCleartextTrafficPermitted(param0: string): boolean;
                public static buildIfSupported(): okhttp3.internal.platform.Platform;
                public constructor();
            }
            export namespace AndroidPlatform {
                export class AndroidCertificateChainCleaner extends okhttp3.internal.tls.CertificateChainCleaner {
                    public equals(param0: java.lang.Object): boolean;
                    public hashCode(): number;
                    public clean(param0: java.util.List<any>, param1: string): java.util.List<any>;
                }
                export class CloseGuard extends java.lang.Object {
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace platform {
            export class Jdk9Platform extends okhttp3.internal.platform.Platform {
                public constructor(param0: java.lang.reflect.Method, param1: java.lang.reflect.Method);
                public getSelectedProtocol(param0: javax.net.ssl.SSLSocket): string;
                public trustManager(param0: javax.net.ssl.SSLSocketFactory): javax.net.ssl.X509TrustManager;
                public static buildIfSupported(): okhttp3.internal.platform.Jdk9Platform;
                public configureTlsExtensions(param0: javax.net.ssl.SSLSocket, param1: string, param2: java.util.List<any>): void;
                public constructor();
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace platform {
            export class JdkWithJettyBootPlatform extends okhttp3.internal.platform.Platform {
                public getSelectedProtocol(param0: javax.net.ssl.SSLSocket): string;
                public afterHandshake(param0: javax.net.ssl.SSLSocket): void;
                public configureTlsExtensions(param0: javax.net.ssl.SSLSocket, param1: string, param2: java.util.List<any>): void;
                public constructor(param0: java.lang.reflect.Method, param1: java.lang.reflect.Method, param2: java.lang.reflect.Method, param3: java.lang.Class, param4: java.lang.Class);
                public static buildIfSupported(): okhttp3.internal.platform.Platform;
                public constructor();
            }
            export namespace JdkWithJettyBootPlatform {
                export class JettyNegoProvider extends java.lang.Object implements java.lang.reflect.InvocationHandler {
                    public constructor(param0: java.util.List<any>);
                    public invoke(param0: java.lang.Object, param1: java.lang.reflect.Method, param2: native.Array<java.lang.Object>): java.lang.Object;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace platform {
            export class OptionalMethod extends java.lang.Object {
                public invoke(param0: java.lang.Object, param1: native.Array<java.lang.Object>): java.lang.Object;
                public constructor(param0: java.lang.Class, param1: string, param2: native.Array<java.lang.Class>);
                public invokeOptional(param0: java.lang.Object, param1: native.Array<java.lang.Object>): java.lang.Object;
                public isSupported(param0: java.lang.Object): boolean;
                public invokeOptionalWithoutCheckedException(param0: java.lang.Object, param1: native.Array<java.lang.Object>): java.lang.Object;
                public invokeWithoutCheckedException(param0: java.lang.Object, param1: native.Array<java.lang.Object>): java.lang.Object;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace platform {
            export class Platform extends java.lang.Object {
                public static INFO: number;
                public static WARN: number;
                public getPrefix(): string;
                public connectSocket(param0: java.net.Socket, param1: java.net.InetSocketAddress, param2: number): void;
                public log(param0: number, param1: string, param2: java.lang.Throwable): void;
                public isCleartextTrafficPermitted(param0: string): boolean;
                public constructor();
                public buildCertificateChainCleaner(param0: javax.net.ssl.X509TrustManager): okhttp3.internal.tls.CertificateChainCleaner;
                public getSelectedProtocol(param0: javax.net.ssl.SSLSocket): string;
                public trustManager(param0: javax.net.ssl.SSLSocketFactory): javax.net.ssl.X509TrustManager;
                public afterHandshake(param0: javax.net.ssl.SSLSocket): void;
                public configureTlsExtensions(param0: javax.net.ssl.SSLSocket, param1: string, param2: java.util.List<any>): void;
                public getStackTraceForCloseable(param0: string): java.lang.Object;
                public static get(): okhttp3.internal.platform.Platform;
                public logCloseableLeak(param0: string, param1: java.lang.Object): void;
                public static alpnProtocolNames(param0: java.util.List<any>): java.util.List<any>;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace tls {
            export class BasicCertificateChainCleaner extends okhttp3.internal.tls.CertificateChainCleaner {
                public equals(param0: java.lang.Object): boolean;
                public hashCode(): number;
                public constructor(param0: okhttp3.internal.tls.TrustRootIndex);
                public constructor();
                public clean(param0: java.util.List<any>, param1: string): java.util.List<any>;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace tls {
            export abstract class CertificateChainCleaner extends java.lang.Object {
                public static get(param0: javax.net.ssl.X509TrustManager): okhttp3.internal.tls.CertificateChainCleaner;
                public static get(param0: native.Array<java.security.cert.X509Certificate>): okhttp3.internal.tls.CertificateChainCleaner;
                public constructor();
                public clean(param0: java.util.List<any>, param1: string): java.util.List<any>;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace tls {
            export class DistinguishedNameParser extends java.lang.Object {
                public constructor(param0: javax.security.auth.x500.X500Principal);
                public findMostSpecific(param0: string): string;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace tls {
            export class OkHostnameVerifier extends java.lang.Object implements javax.net.ssl.HostnameVerifier {
                public static INSTANCE: okhttp3.internal.tls.OkHostnameVerifier;
                public verify(param0: string, param1: javax.net.ssl.SSLSession): boolean;
                public verify(param0: string, param1: java.security.cert.X509Certificate): boolean;
                public static allSubjectAltNames(param0: java.security.cert.X509Certificate): java.util.List<any>;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace tls {
            export abstract class TrustRootIndex extends java.lang.Object {
                public static get(param0: native.Array<java.security.cert.X509Certificate>): okhttp3.internal.tls.TrustRootIndex;
                public findByIssuerAndSignature(param0: java.security.cert.X509Certificate): java.security.cert.X509Certificate;
                public static get(param0: javax.net.ssl.X509TrustManager): okhttp3.internal.tls.TrustRootIndex;
                public constructor();
            }
            export namespace TrustRootIndex {
                export class AndroidTrustRootIndex extends okhttp3.internal.tls.TrustRootIndex {
                    public findByIssuerAndSignature(param0: java.security.cert.X509Certificate): java.security.cert.X509Certificate;
                    public equals(param0: java.lang.Object): boolean;
                    public hashCode(): number;
                }
                export class BasicTrustRootIndex extends okhttp3.internal.tls.TrustRootIndex {
                    public findByIssuerAndSignature(param0: java.security.cert.X509Certificate): java.security.cert.X509Certificate;
                    public equals(param0: java.lang.Object): boolean;
                    public constructor();
                    public constructor(param0: native.Array<java.security.cert.X509Certificate>);
                    public hashCode(): number;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace ws {
            export class RealWebSocket extends java.lang.Object implements okhttp3.WebSocket, okhttp3.internal.ws.WebSocketReader.FrameCallback {
                public request(): okhttp3.Request;
                public send(param0: string): boolean;
                public onReadPong(param0: okio.ByteString): void;
                public constructor(param0: okhttp3.Request, param1: okhttp3.WebSocketListener, param2: java.util.Random);
                public onReadPing(param0: okio.ByteString): void;
                public queueSize(): number;
                public close(param0: number, param1: string): boolean;
                public loopReader(): void;
                public send(param0: okio.ByteString): boolean;
                public onReadMessage(param0: okio.ByteString): void;
                public initReaderAndWriter(param0: string, param1: number, param2: okhttp3.internal.ws.RealWebSocket.Streams): void;
                public cancel(): void;
                public connect(param0: okhttp3.OkHttpClient): void;
                public onReadClose(param0: number, param1: string): void;
                public onReadMessage(param0: string): void;
            }
            export namespace RealWebSocket {
                export class CancelRunnable extends java.lang.Object implements java.lang.Runnable {
                    public run(): void;
                }
                export class ClientStreams extends okhttp3.internal.ws.RealWebSocket.Streams {
                    public close(): void;
                }
                export class Close extends java.lang.Object {
                }
                export class Message extends java.lang.Object {
                }
                export class PingRunnable extends java.lang.Object implements java.lang.Runnable {
                    public run(): void;
                }
                export abstract class Streams extends java.lang.Object implements java.io.Closeable {
                    public client: boolean;
                    public source: okio.BufferedSource;
                    public sink: okio.BufferedSink;
                    public constructor(param0: boolean, param1: okio.BufferedSource, param2: okio.BufferedSink);
                    public close(): void;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace ws {
            export class WebSocketProtocol extends java.lang.Object {
                public static acceptHeader(param0: string): string;
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace ws {
            export class WebSocketReader extends java.lang.Object {
            }
            export namespace WebSocketReader {
                export class FrameCallback extends java.lang.Object {
                    /**
                     * Constructs a new instance of the okhttp3.internal.ws.WebSocketReader$FrameCallback interface with the provided implementation.
                     */
                    public constructor(implementation: {
                        onReadMessage(param0: string): void;
                        onReadMessage(param0: okio.ByteString): void;
                        onReadPing(param0: okio.ByteString): void;
                        onReadPong(param0: okio.ByteString): void;
                        onReadClose(param0: number, param1: string): void;
                    });
                    public onReadClose(param0: number, param1: string): void;
                    public onReadMessage(param0: string): void;
                    public onReadMessage(param0: okio.ByteString): void;
                    public onReadPing(param0: okio.ByteString): void;
                    public onReadPong(param0: okio.ByteString): void;
                }
            }
        }
    }
}

declare namespace okhttp3 {
    export namespace internal {
        export namespace ws {
            export class WebSocketWriter extends java.lang.Object {
            }
            export namespace WebSocketWriter {
                export class FrameSink extends java.lang.Object implements okio.Sink {
                    public close(): void;
                    public flush(): void;
                    public write(param0: okio.Buffer, param1: number): void;
                    public timeout(): okio.Timeout;
                }
            }
        }
    }
}

declare namespace okio {
    export class AsyncTimeout extends okio.Timeout {
        public constructor();
        public enter(): void;
        public sink(param0: okio.Sink): okio.Sink;
        public timedOut(): void;
        public newTimeoutException(param0: java.io.IOException): java.io.IOException;
        public source(param0: okio.Source): okio.Source;
        public exit(): boolean;
    }
    export namespace AsyncTimeout {
        export class Watchdog extends java.lang.Thread {
            public constructor(param0: java.lang.Runnable);
            public constructor(param0: java.lang.ThreadGroup, param1: java.lang.Runnable, param2: string);
            public constructor(param0: java.lang.Runnable, param1: string);
            public constructor(param0: java.lang.ThreadGroup, param1: java.lang.Runnable, param2: string, param3: number);
            public run(): void;
            public constructor();
            public constructor(param0: java.lang.ThreadGroup, param1: java.lang.Runnable);
            public constructor(param0: java.lang.ThreadGroup, param1: string);
            public constructor(param0: string);
        }
    }
}

declare namespace okio {
    export class Base64 extends java.lang.Object {
        public static encodeUrl(param0: native.Array<number>): string;
        public static decode(param0: string): native.Array<number>;
        public static encode(param0: native.Array<number>): string;
    }
}

declare namespace okio {
    export class Buffer extends java.lang.Object implements okio.BufferedSource, okio.BufferedSink, java.lang.Cloneable {
        public readIntLe(): number;
        public writeUtf8(param0: string): okio.Buffer;
        public writeDecimalLong(param0: number): okio.Buffer;
        public readFrom(param0: java.io.InputStream, param1: number): okio.Buffer;
        public writeUtf8(param0: string, param1: number, param2: number): okio.Buffer;
        public readUtf8(param0: number): string;
        public copyTo(param0: java.io.OutputStream): okio.Buffer;
        public writeUtf8CodePoint(param0: number): okio.BufferedSink;
        public writeUtf8(param0: string, param1: number, param2: number): okio.BufferedSink;
        public indexOf(param0: number): number;
        public readByte(): number;
        public emitCompleteSegments(): okio.BufferedSink;
        public readLong(): number;
        public read(param0: okio.Buffer, param1: number): number;
        public writeIntLe(param0: number): okio.BufferedSink;
        public copyTo(param0: okio.Buffer, param1: number, param2: number): okio.Buffer;
        public indexOfElement(param0: okio.ByteString): number;
        public write(param0: native.Array<number>, param1: number, param2: number): okio.BufferedSink;
        public readAll(param0: okio.Sink): number;
        public readByteArray(param0: number): native.Array<number>;
        public sha1(): okio.ByteString;
        public write(param0: okio.ByteString): okio.BufferedSink;
        public select(param0: okio.Options): number;
        public readFrom(param0: java.io.InputStream): okio.Buffer;
        public writeTo(param0: java.io.OutputStream): okio.Buffer;
        public outputStream(): java.io.OutputStream;
        public clear(): void;
        public require(param0: number): void;
        public request(param0: number): boolean;
        public indexOf(param0: okio.ByteString, param1: number): number;
        public readString(param0: java.nio.charset.Charset): string;
        public writeLongLe(param0: number): okio.Buffer;
        public writeLong(param0: number): okio.BufferedSink;
        public writeString(param0: string, param1: java.nio.charset.Charset): okio.Buffer;
        public writeByte(param0: number): okio.BufferedSink;
        public readUtf8LineStrict(): string;
        public writeUtf8CodePoint(param0: number): okio.Buffer;
        public writeInt(param0: number): okio.BufferedSink;
        public write(param0: native.Array<number>): okio.BufferedSink;
        public writeShort(param0: number): okio.BufferedSink;
        public rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
        public skip(param0: number): void;
        public getByte(param0: number): number;
        public readInt(): number;
        public read(param0: native.Array<number>, param1: number, param2: number): number;
        public writeString(param0: string, param1: number, param2: number, param3: java.nio.charset.Charset): okio.Buffer;
        public copyTo(param0: java.io.OutputStream, param1: number, param2: number): okio.Buffer;
        public writeTo(param0: java.io.OutputStream, param1: number): okio.Buffer;
        public writeAll(param0: okio.Source): number;
        public readFully(param0: native.Array<number>): void;
        public timeout(): okio.Timeout;
        public close(): void;
        public writeDecimalLong(param0: number): okio.BufferedSink;
        public inputStream(): java.io.InputStream;
        public write(param0: okio.ByteString): okio.Buffer;
        public writeHexadecimalUnsignedLong(param0: number): okio.Buffer;
        public writeShortLe(param0: number): okio.BufferedSink;
        public writeUtf8(param0: string): okio.BufferedSink;
        public readUtf8CodePoint(): number;
        public writeShortLe(param0: number): okio.Buffer;
        public snapshot(param0: number): okio.ByteString;
        public writeHexadecimalUnsignedLong(param0: number): okio.BufferedSink;
        public readHexadecimalUnsignedLong(): number;
        public emit(): okio.BufferedSink;
        public writeInt(param0: number): okio.Buffer;
        public constructor();
        public readUtf8(): string;
        public write(param0: okio.Buffer, param1: number): void;
        public readByteString(param0: number): okio.ByteString;
        public writeShort(param0: number): okio.Buffer;
        public completeSegmentByteCount(): number;
        public toString(): string;
        public read(param0: native.Array<number>): number;
        public md5(): okio.ByteString;
        public flush(): void;
        public writeString(param0: string, param1: java.nio.charset.Charset): okio.BufferedSink;
        public writeLongLe(param0: number): okio.BufferedSink;
        public readShort(): number;
        public readShortLe(): number;
        public readUtf8Line(): string;
        public write(param0: native.Array<number>, param1: number, param2: number): okio.Buffer;
        public readByteString(): okio.ByteString;
        public writeString(param0: string, param1: number, param2: number, param3: java.nio.charset.Charset): okio.BufferedSink;
        public writeIntLe(param0: number): okio.Buffer;
        public clone(): java.lang.Object;
        public hmacSha1(param0: okio.ByteString): okio.ByteString;
        public size(): number;
        public hashCode(): number;
        public readString(param0: number, param1: java.nio.charset.Charset): string;
        public readLongLe(): number;
        public equals(param0: java.lang.Object): boolean;
        public readFully(param0: okio.Buffer, param1: number): void;
        public snapshot(): okio.ByteString;
        public write(param0: native.Array<number>): okio.Buffer;
        public clone(): okio.Buffer;
        public emitCompleteSegments(): okio.Buffer;
        public readDecimalLong(): number;
        public sha256(): okio.ByteString;
        public writeByte(param0: number): okio.Buffer;
        public rangeEquals(param0: number, param1: okio.ByteString): boolean;
        public readByteArray(): native.Array<number>;
        public writeLong(param0: number): okio.Buffer;
        public indexOfElement(param0: okio.ByteString, param1: number): number;
        public exhausted(): boolean;
        public write(param0: okio.Source, param1: number): okio.BufferedSink;
        public buffer(): okio.Buffer;
        public hmacSha256(param0: okio.ByteString): okio.ByteString;
        public indexOf(param0: number, param1: number): number;
        public indexOf(param0: okio.ByteString): number;
    }
}

declare namespace okio {
    export class BufferedSink extends java.lang.Object implements okio.Sink {
        /**
         * Constructs a new instance of the okio.BufferedSink interface with the provided implementation.
         */
        public constructor(implementation: {
            buffer(): okio.Buffer;
            write(param0: okio.ByteString): okio.BufferedSink;
            write(param0: native.Array<number>): okio.BufferedSink;
            write(param0: native.Array<number>, param1: number, param2: number): okio.BufferedSink;
            writeAll(param0: okio.Source): number;
            write(param0: okio.Source, param1: number): okio.BufferedSink;
            writeUtf8(param0: string): okio.BufferedSink;
            writeUtf8(param0: string, param1: number, param2: number): okio.BufferedSink;
            writeUtf8CodePoint(param0: number): okio.BufferedSink;
            writeString(param0: string, param1: java.nio.charset.Charset): okio.BufferedSink;
            writeString(param0: string, param1: number, param2: number, param3: java.nio.charset.Charset): okio.BufferedSink;
            writeByte(param0: number): okio.BufferedSink;
            writeShort(param0: number): okio.BufferedSink;
            writeShortLe(param0: number): okio.BufferedSink;
            writeInt(param0: number): okio.BufferedSink;
            writeIntLe(param0: number): okio.BufferedSink;
            writeLong(param0: number): okio.BufferedSink;
            writeLongLe(param0: number): okio.BufferedSink;
            writeDecimalLong(param0: number): okio.BufferedSink;
            writeHexadecimalUnsignedLong(param0: number): okio.BufferedSink;
            flush(): void;
            emit(): okio.BufferedSink;
            emitCompleteSegments(): okio.BufferedSink;
            outputStream(): java.io.OutputStream;
            write(param0: okio.Buffer, param1: number): void;
            flush(): void;
            timeout(): okio.Timeout;
            close(): void;
            close(): void;
            flush(): void;
            close(): void;
        });
        public writeDecimalLong(param0: number): okio.BufferedSink;
        public close(): void;
        public writeByte(param0: number): okio.BufferedSink;
        public writeString(param0: string, param1: number, param2: number, param3: java.nio.charset.Charset): okio.BufferedSink;
        public writeShortLe(param0: number): okio.BufferedSink;
        public writeInt(param0: number): okio.BufferedSink;
        public writeUtf8CodePoint(param0: number): okio.BufferedSink;
        public writeUtf8(param0: string): okio.BufferedSink;
        public write(param0: native.Array<number>): okio.BufferedSink;
        public writeUtf8(param0: string, param1: number, param2: number): okio.BufferedSink;
        public writeShort(param0: number): okio.BufferedSink;
        public writeHexadecimalUnsignedLong(param0: number): okio.BufferedSink;
        public emitCompleteSegments(): okio.BufferedSink;
        public emit(): okio.BufferedSink;
        public writeIntLe(param0: number): okio.BufferedSink;
        public write(param0: okio.Buffer, param1: number): void;
        public write(param0: native.Array<number>, param1: number, param2: number): okio.BufferedSink;
        public flush(): void;
        public write(param0: okio.ByteString): okio.BufferedSink;
        public writeString(param0: string, param1: java.nio.charset.Charset): okio.BufferedSink;
        public writeLongLe(param0: number): okio.BufferedSink;
        public write(param0: okio.Source, param1: number): okio.BufferedSink;
        public buffer(): okio.Buffer;
        public outputStream(): java.io.OutputStream;
        public writeAll(param0: okio.Source): number;
        public writeLong(param0: number): okio.BufferedSink;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class BufferedSource extends java.lang.Object implements okio.Source {
        /**
         * Constructs a new instance of the okio.BufferedSource interface with the provided implementation.
         */
        public constructor(implementation: {
            buffer(): okio.Buffer;
            exhausted(): boolean;
            require(param0: number): void;
            request(param0: number): boolean;
            readByte(): number;
            readShort(): number;
            readShortLe(): number;
            readInt(): number;
            readIntLe(): number;
            readLong(): number;
            readLongLe(): number;
            readDecimalLong(): number;
            readHexadecimalUnsignedLong(): number;
            skip(param0: number): void;
            readByteString(): okio.ByteString;
            readByteString(param0: number): okio.ByteString;
            select(param0: okio.Options): number;
            readByteArray(): native.Array<number>;
            readByteArray(param0: number): native.Array<number>;
            read(param0: native.Array<number>): number;
            readFully(param0: native.Array<number>): void;
            read(param0: native.Array<number>, param1: number, param2: number): number;
            readFully(param0: okio.Buffer, param1: number): void;
            readAll(param0: okio.Sink): number;
            readUtf8(): string;
            readUtf8(param0: number): string;
            readUtf8Line(): string;
            readUtf8LineStrict(): string;
            readUtf8CodePoint(): number;
            readString(param0: java.nio.charset.Charset): string;
            readString(param0: number, param1: java.nio.charset.Charset): string;
            indexOf(param0: number): number;
            indexOf(param0: number, param1: number): number;
            indexOf(param0: okio.ByteString): number;
            indexOf(param0: okio.ByteString, param1: number): number;
            indexOfElement(param0: okio.ByteString): number;
            indexOfElement(param0: okio.ByteString, param1: number): number;
            rangeEquals(param0: number, param1: okio.ByteString): boolean;
            rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
            inputStream(): java.io.InputStream;
            read(param0: okio.Buffer, param1: number): number;
            timeout(): okio.Timeout;
            close(): void;
            close(): void;
            close(): void;
        });
        public close(): void;
        public inputStream(): java.io.InputStream;
        public readIntLe(): number;
        public readByteString(): okio.ByteString;
        public readUtf8LineStrict(): string;
        public readUtf8(param0: number): string;
        public readUtf8CodePoint(): number;
        public indexOf(param0: number): number;
        public readByte(): number;
        public readHexadecimalUnsignedLong(): number;
        public readString(param0: number, param1: java.nio.charset.Charset): string;
        public readLongLe(): number;
        public readFully(param0: okio.Buffer, param1: number): void;
        public readLong(): number;
        public read(param0: okio.Buffer, param1: number): number;
        public rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
        public readUtf8(): string;
        public readByteString(param0: number): okio.ByteString;
        public indexOfElement(param0: okio.ByteString): number;
        public skip(param0: number): void;
        public readDecimalLong(): number;
        public read(param0: native.Array<number>): number;
        public readAll(param0: okio.Sink): number;
        public readInt(): number;
        public readByteArray(param0: number): native.Array<number>;
        public rangeEquals(param0: number, param1: okio.ByteString): boolean;
        public read(param0: native.Array<number>, param1: number, param2: number): number;
        public readByteArray(): native.Array<number>;
        public indexOfElement(param0: okio.ByteString, param1: number): number;
        public select(param0: okio.Options): number;
        public exhausted(): boolean;
        public readShort(): number;
        public buffer(): okio.Buffer;
        public require(param0: number): void;
        public request(param0: number): boolean;
        public indexOf(param0: okio.ByteString, param1: number): number;
        public readString(param0: java.nio.charset.Charset): string;
        public readShortLe(): number;
        public indexOf(param0: number, param1: number): number;
        public readFully(param0: native.Array<number>): void;
        public readUtf8Line(): string;
        public indexOf(param0: okio.ByteString): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class ByteString extends java.lang.Object implements java.io.Serializable {
        public static EMPTY: okio.ByteString;
        public static of(param0: native.Array<number>): okio.ByteString;
        public base64(): string;
        public static encodeString(param0: string, param1: java.nio.charset.Charset): okio.ByteString;
        public substring(param0: number): okio.ByteString;
        public base64Url(): string;
        public hmacSha1(param0: okio.ByteString): okio.ByteString;
        public static read(param0: java.io.InputStream, param1: number): okio.ByteString;
        public asByteBuffer(): java.nio.ByteBuffer;
        public size(): number;
        public lastIndexOf(param0: native.Array<number>): number;
        public hex(): string;
        public hashCode(): number;
        public toAsciiUppercase(): okio.ByteString;
        public indexOf(param0: native.Array<number>, param1: number): number;
        public static decodeBase64(param0: string): okio.ByteString;
        public equals(param0: java.lang.Object): boolean;
        public lastIndexOf(param0: okio.ByteString, param1: number): number;
        public rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
        public lastIndexOf(param0: okio.ByteString): number;
        public static decodeHex(param0: string): okio.ByteString;
        public compareTo(param0: okio.ByteString): number;
        public indexOf(param0: native.Array<number>): number;
        public startsWith(param0: native.Array<number>): boolean;
        public sha256(): okio.ByteString;
        public getByte(param0: number): number;
        public toString(): string;
        public static encodeUtf8(param0: string): okio.ByteString;
        public string(param0: java.nio.charset.Charset): string;
        public md5(): okio.ByteString;
        public startsWith(param0: okio.ByteString): boolean;
        public endsWith(param0: okio.ByteString): boolean;
        public endsWith(param0: native.Array<number>): boolean;
        public toAsciiLowercase(): okio.ByteString;
        public static of(param0: java.nio.ByteBuffer): okio.ByteString;
        public sha1(): okio.ByteString;
        public write(param0: java.io.OutputStream): void;
        public lastIndexOf(param0: native.Array<number>, param1: number): number;
        public static of(param0: native.Array<number>, param1: number, param2: number): okio.ByteString;
        public rangeEquals(param0: number, param1: native.Array<number>, param2: number, param3: number): boolean;
        public utf8(): string;
        public substring(param0: number, param1: number): okio.ByteString;
        public indexOf(param0: okio.ByteString, param1: number): number;
        public toByteArray(): native.Array<number>;
        public hmacSha256(param0: okio.ByteString): okio.ByteString;
        public indexOf(param0: okio.ByteString): number;
    }
}

declare namespace okio {
    export class DeflaterSink extends java.lang.Object implements okio.Sink {
        public close(): void;
        public write(param0: okio.Buffer, param1: number): void;
        public constructor(param0: okio.Sink, param1: java.util.zip.Deflater);
        public toString(): string;
        public flush(): void;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export abstract class ForwardingSink extends java.lang.Object implements okio.Sink {
        public delegate(): okio.Sink;
        public close(): void;
        public constructor(param0: okio.Sink);
        public write(param0: okio.Buffer, param1: number): void;
        public toString(): string;
        public flush(): void;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export abstract class ForwardingSource extends java.lang.Object implements okio.Source {
        public close(): void;
        public constructor(param0: okio.Source);
        public delegate(): okio.Source;
        public toString(): string;
        public read(param0: okio.Buffer, param1: number): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class ForwardingTimeout extends okio.Timeout {
        public constructor();
        public throwIfReached(): void;
        public setDelegate(param0: okio.Timeout): okio.ForwardingTimeout;
        public clearDeadline(): okio.Timeout;
        public hasDeadline(): boolean;
        public delegate(): okio.Timeout;
        public timeout(param0: number, param1: java.util.concurrent.TimeUnit): okio.Timeout;
        public timeoutNanos(): number;
        public deadlineNanoTime(): number;
        public deadlineNanoTime(param0: number): okio.Timeout;
        public constructor(param0: okio.Timeout);
        public clearTimeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class GzipSink extends java.lang.Object implements okio.Sink {
        public deflater(): java.util.zip.Deflater;
        public close(): void;
        public constructor(param0: okio.Sink);
        public write(param0: okio.Buffer, param1: number): void;
        public flush(): void;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class GzipSource extends java.lang.Object implements okio.Source {
        public close(): void;
        public constructor(param0: okio.Source);
        public read(param0: okio.Buffer, param1: number): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class HashingSink extends okio.ForwardingSink {
        public close(): void;
        public static hmacSha256(param0: okio.Sink, param1: okio.ByteString): okio.HashingSink;
        public write(param0: okio.Buffer, param1: number): void;
        public static hmacSha1(param0: okio.Sink, param1: okio.ByteString): okio.HashingSink;
        public static md5(param0: okio.Sink): okio.HashingSink;
        public static sha1(param0: okio.Sink): okio.HashingSink;
        public hash(): okio.ByteString;
        public static sha256(param0: okio.Sink): okio.HashingSink;
        public flush(): void;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class HashingSource extends okio.ForwardingSource {
        public close(): void;
        public static hmacSha256(param0: okio.Source, param1: okio.ByteString): okio.HashingSource;
        public static sha1(param0: okio.Source): okio.HashingSource;
        public static md5(param0: okio.Source): okio.HashingSource;
        public static sha256(param0: okio.Source): okio.HashingSource;
        public static hmacSha1(param0: okio.Source, param1: okio.ByteString): okio.HashingSource;
        public hash(): okio.ByteString;
        public read(param0: okio.Buffer, param1: number): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class InflaterSource extends java.lang.Object implements okio.Source {
        public close(): void;
        public refill(): boolean;
        public constructor(param0: okio.Source, param1: java.util.zip.Inflater);
        public read(param0: okio.Buffer, param1: number): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class Okio extends java.lang.Object {
        public static buffer(param0: okio.Source): okio.BufferedSource;
        public static source(param0: java.io.InputStream): okio.Source;
        public static appendingSink(param0: java.io.File): okio.Sink;
        public static sink(param0: java.io.OutputStream): okio.Sink;
        public static source(param0: java.io.File): okio.Source;
        public static sink(param0: java.io.File): okio.Sink;
        public static blackhole(): okio.Sink;
        public static source(param0: java.net.Socket): okio.Source;
        public static sink(param0: java.nio.file.Path, param1: native.Array<java.nio.file.OpenOption>): okio.Sink;
        public static buffer(param0: okio.Sink): okio.BufferedSink;
        public static sink(param0: java.net.Socket): okio.Sink;
        public static source(param0: java.nio.file.Path, param1: native.Array<java.nio.file.OpenOption>): okio.Source;
    }
}

declare namespace okio {
    export class Options extends java.util.AbstractList implements java.util.RandomAccess {
        public removeAll(param0: java.util.Collection): boolean;
        public static of(param0: native.Array<okio.ByteString>): okio.Options;
        public addAll(param0: java.util.Collection): boolean;
        public removeIf(param0: any /* java.util.function.Predicate*/): boolean;
        public indexOf(param0: java.lang.Object): number;
        public replaceAll(param0: any /* java.util.function.UnaryOperator*/): void;
        public add(param0: java.lang.Object): boolean;
        public remove(param0: java.lang.Object): boolean;
        public iterator(): java.util.Iterator;
        public stream(): java.util.stream.Stream;
        public spliterator(): java.util.Spliterator;
        public size(): number;
        public hashCode(): number;
        public toArray(): native.Array<java.lang.Object>;
        public isEmpty(): boolean;
        public get(param0: number): java.lang.Object;
        public equals(param0: java.lang.Object): boolean;
        public listIterator(param0: number): java.util.ListIterator;
        public toArray(param0: native.Array<java.lang.Object>): native.Array<java.lang.Object>;
        public addAll(param0: number, param1: java.util.Collection): boolean;
        public sort(param0: java.util.Comparator): void;
        public retainAll(param0: java.util.Collection): boolean;
        public set(param0: number, param1: java.lang.Object): java.lang.Object;
        public get(param0: number): okio.ByteString;
        public contains(param0: java.lang.Object): boolean;
        public listIterator(): java.util.ListIterator;
        public parallelStream(): java.util.stream.Stream;
        public add(param0: number, param1: java.lang.Object): void;
        public containsAll(param0: java.util.Collection): boolean;
        public lastIndexOf(param0: java.lang.Object): number;
        public clear(): void;
        public subList(param0: number, param1: number): java.util.List<any>;
        public remove(param0: number): java.lang.Object;
    }
}

declare namespace okio {
    export class Pipe extends java.lang.Object {
        public sink(): okio.Sink;
        public constructor(param0: number);
        public source(): okio.Source;
    }
    export namespace Pipe {
        export class PipeSink extends java.lang.Object implements okio.Sink {
            public write(param0: okio.Buffer, param1: number): void;
            public flush(): void;
            public timeout(): okio.Timeout;
            public close(): void;
        }
        export class PipeSource extends java.lang.Object implements okio.Source {
            public timeout(): okio.Timeout;
            public read(param0: okio.Buffer, param1: number): number;
            public close(): void;
        }
    }
}

declare namespace okio {
    export class RealBufferedSink extends java.lang.Object implements okio.BufferedSink {
        public sink: okio.Sink;
        public writeDecimalLong(param0: number): okio.BufferedSink;
        public close(): void;
        public writeByte(param0: number): okio.BufferedSink;
        public writeString(param0: string, param1: number, param2: number, param3: java.nio.charset.Charset): okio.BufferedSink;
        public writeShortLe(param0: number): okio.BufferedSink;
        public writeInt(param0: number): okio.BufferedSink;
        public writeUtf8CodePoint(param0: number): okio.BufferedSink;
        public writeUtf8(param0: string): okio.BufferedSink;
        public write(param0: native.Array<number>): okio.BufferedSink;
        public writeUtf8(param0: string, param1: number, param2: number): okio.BufferedSink;
        public writeShort(param0: number): okio.BufferedSink;
        public writeHexadecimalUnsignedLong(param0: number): okio.BufferedSink;
        public emitCompleteSegments(): okio.BufferedSink;
        public emit(): okio.BufferedSink;
        public writeIntLe(param0: number): okio.BufferedSink;
        public write(param0: okio.Buffer, param1: number): void;
        public write(param0: native.Array<number>, param1: number, param2: number): okio.BufferedSink;
        public toString(): string;
        public flush(): void;
        public write(param0: okio.ByteString): okio.BufferedSink;
        public writeString(param0: string, param1: java.nio.charset.Charset): okio.BufferedSink;
        public writeLongLe(param0: number): okio.BufferedSink;
        public write(param0: okio.Source, param1: number): okio.BufferedSink;
        public buffer(): okio.Buffer;
        public outputStream(): java.io.OutputStream;
        public writeAll(param0: okio.Source): number;
        public writeLong(param0: number): okio.BufferedSink;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class RealBufferedSource extends java.lang.Object implements okio.BufferedSource {
        public source: okio.Source;
        public close(): void;
        public inputStream(): java.io.InputStream;
        public readByteString(): okio.ByteString;
        public readIntLe(): number;
        public readUtf8LineStrict(): string;
        public readUtf8(param0: number): string;
        public readUtf8CodePoint(): number;
        public indexOf(param0: number): number;
        public readByte(): number;
        public readHexadecimalUnsignedLong(): number;
        public readString(param0: number, param1: java.nio.charset.Charset): string;
        public readLongLe(): number;
        public readFully(param0: okio.Buffer, param1: number): void;
        public read(param0: okio.Buffer, param1: number): number;
        public readLong(): number;
        public rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
        public readUtf8(): string;
        public readByteString(param0: number): okio.ByteString;
        public indexOfElement(param0: okio.ByteString): number;
        public skip(param0: number): void;
        public readDecimalLong(): number;
        public toString(): string;
        public read(param0: native.Array<number>): number;
        public readAll(param0: okio.Sink): number;
        public readInt(): number;
        public readByteArray(param0: number): native.Array<number>;
        public rangeEquals(param0: number, param1: okio.ByteString): boolean;
        public read(param0: native.Array<number>, param1: number, param2: number): number;
        public readByteArray(): native.Array<number>;
        public indexOfElement(param0: okio.ByteString, param1: number): number;
        public select(param0: okio.Options): number;
        public exhausted(): boolean;
        public readShort(): number;
        public buffer(): okio.Buffer;
        public require(param0: number): void;
        public request(param0: number): boolean;
        public indexOf(param0: okio.ByteString, param1: number): number;
        public readString(param0: java.nio.charset.Charset): string;
        public readShortLe(): number;
        public indexOf(param0: number, param1: number): number;
        public readFully(param0: native.Array<number>): void;
        public readUtf8Line(): string;
        public indexOf(param0: okio.ByteString): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class Segment extends java.lang.Object {
        public push(param0: okio.Segment): okio.Segment;
        public writeTo(param0: okio.Segment, param1: number): void;
        public compact(): void;
        public pop(): okio.Segment;
        public split(param0: number): okio.Segment;
    }
}

declare namespace okio {
    export class SegmentPool extends java.lang.Object {
    }
}

declare namespace okio {
    export class SegmentedByteString extends okio.ByteString {
        public base64(): string;
        public substring(param0: number): okio.ByteString;
        public base64Url(): string;
        public hmacSha1(param0: okio.ByteString): okio.ByteString;
        public asByteBuffer(): java.nio.ByteBuffer;
        public size(): number;
        public lastIndexOf(param0: native.Array<number>): number;
        public hex(): string;
        public hashCode(): number;
        public toAsciiUppercase(): okio.ByteString;
        public indexOf(param0: native.Array<number>, param1: number): number;
        public equals(param0: java.lang.Object): boolean;
        public lastIndexOf(param0: okio.ByteString, param1: number): number;
        public rangeEquals(param0: number, param1: okio.ByteString, param2: number, param3: number): boolean;
        public lastIndexOf(param0: okio.ByteString): number;
        public indexOf(param0: native.Array<number>): number;
        public sha256(): okio.ByteString;
        public getByte(param0: number): number;
        public toString(): string;
        public string(param0: java.nio.charset.Charset): string;
        public md5(): okio.ByteString;
        public toAsciiLowercase(): okio.ByteString;
        public sha1(): okio.ByteString;
        public write(param0: java.io.OutputStream): void;
        public lastIndexOf(param0: native.Array<number>, param1: number): number;
        public rangeEquals(param0: number, param1: native.Array<number>, param2: number, param3: number): boolean;
        public utf8(): string;
        public substring(param0: number, param1: number): okio.ByteString;
        public indexOf(param0: okio.ByteString, param1: number): number;
        public toByteArray(): native.Array<number>;
        public hmacSha256(param0: okio.ByteString): okio.ByteString;
        public indexOf(param0: okio.ByteString): number;
    }
}

declare namespace okio {
    export class Sink extends java.lang.Object implements java.io.Closeable, java.io.Flushable {
        /**
         * Constructs a new instance of the okio.Sink interface with the provided implementation.
         */
        public constructor(implementation: {
            write(param0: okio.Buffer, param1: number): void;
            flush(): void;
            timeout(): okio.Timeout;
            close(): void;
            close(): void;
            flush(): void;
            close(): void;
        });
        public close(): void;
        public write(param0: okio.Buffer, param1: number): void;
        public flush(): void;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class Source extends java.lang.Object implements java.io.Closeable {
        /**
         * Constructs a new instance of the okio.Source interface with the provided implementation.
         */
        public constructor(implementation: {
            read(param0: okio.Buffer, param1: number): number;
            timeout(): okio.Timeout;
            close(): void;
            close(): void;
            close(): void;
        });
        public close(): void;
        public read(param0: okio.Buffer, param1: number): number;
        public timeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class Timeout extends java.lang.Object {
        public static NONE: okio.Timeout;
        public constructor();
        public throwIfReached(): void;
        public deadline(param0: number, param1: java.util.concurrent.TimeUnit): okio.Timeout;
        public clearDeadline(): okio.Timeout;
        public hasDeadline(): boolean;
        public waitUntilNotified(param0: java.lang.Object): void;
        public timeout(param0: number, param1: java.util.concurrent.TimeUnit): okio.Timeout;
        public timeoutNanos(): number;
        public deadlineNanoTime(): number;
        public deadlineNanoTime(param0: number): okio.Timeout;
        public clearTimeout(): okio.Timeout;
    }
}

declare namespace okio {
    export class Util extends java.lang.Object {
        public static UTF_8: java.nio.charset.Charset;
        public static reverseBytesShort(param0: number): number;
        public static reverseBytesLong(param0: number): number;
        public static checkOffsetAndCount(param0: number, param1: number, param2: number): void;
        public static reverseBytesInt(param0: number): number;
        public static sneakyRethrow(param0: java.lang.Throwable): void;
        public static arrayRangeEquals(param0: native.Array<number>, param1: number, param2: native.Array<number>, param3: number, param4: number): boolean;
    }
}

declare namespace org {
    export namespace fabiomsr {
        export namespace peercertificate {
            export class HexUtil extends java.lang.Object {
                public static hexStringToByteArray(param0: string): native.Array<number>;
                public constructor();
                public static toHexString(param0: native.Array<number>): string;
            }
        }
    }
}

declare namespace org {
    export namespace fabiomsr {
        export namespace peercertificate {
            export class PeerCertificateExtractor extends java.lang.Object {
                public static extract(param0: java.io.File): string;
                public constructor();
            }
        }
    }
}
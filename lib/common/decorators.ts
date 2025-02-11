import { AnalyticsEventLabelDelimiter } from "../constants";
import { IPerformanceService } from "../declarations";
import { IInjector } from "./definitions/yok";
import { injector } from "./yok";

/**
 * Caches the result of the first execution of the method and returns it whenever it is called instead of executing it again.
 * Works with methods and getters.
 * @example
 * ```
 * class CacheDecoratorsTest {
 *
 * 	@cache()
 * 	public method(num: number): number {
 * 		return num;
 * 	}
 *
 * 	@cache()
 * 	public get property(): any {
 * 		// execute some heavy operation.
 * 		return result;
 * 	}
 * }
 *
 * const instance = new CacheDecoratorsTest();
 * const result = instance.method(1); // returns 1;
 *
 * // all consecutive calls to instance.method will return 1.
 * const result2 = instance.method(2); // returns 1;
 * ```
 */
export function cache(): any {
	return (
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	): TypedPropertyDescriptor<any> => {
		let result: any;
		const propName: string = descriptor.value ? "value" : "get";

		const originalValue = (<any>descriptor)[propName];

		(<any>descriptor)[propName] = function (...args: any[]) {
			const propertyName = `__isCalled_${propertyKey}__`;
			if (this && !this[propertyName]) {
				this[propertyName] = true;
				result = originalValue.apply(this, args);
			}

			return result;
		};

		return descriptor;
	};
}

interface MemoizeOptions {
	hashFn?: (...args: any[]) => any;
	shouldCache?: (result: any) => boolean;
}
let memoizeIDCounter = 0;
export function memoize(options: MemoizeOptions): any {
	return (
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	): TypedPropertyDescriptor<any> => {
		// todo: remove once surely working as intended.
		const DEBUG = false;
		const memoizeID = memoizeIDCounter++;
		const valueOrGet: "value" | "get" = descriptor.value ? "value" : "get";
		const originalMethod = descriptor[valueOrGet];

		descriptor[valueOrGet] = function (...args: any[]) {
			const cacheMapName = `__memoize_cache_map_${memoizeID}`;

			DEBUG && console.log(options);
			let hashKey: any;
			if (options.hashFn) {
				DEBUG && console.log({ args });
				hashKey = options.hashFn.apply(this, args);
			} else {
				hashKey = `__memoize_cache_value_${memoizeID}`;
			}

			DEBUG &&
				console.log({
					cacheMapName,
					hashKey
				});

			// initialize cache map if not exists
			if (!this.hasOwnProperty(cacheMapName)) {
				DEBUG && console.log("NO CACHE MAP YET, CREATING ONE NOW");
				Object.defineProperty(this, cacheMapName, {
					configurable: false,
					enumerable: false,
					writable: false,
					value: new Map<any, any>()
				});
			}
			const cacheMap: Map<any, any> = this[cacheMapName];

			DEBUG &&
				console.log({
					cacheMap
				});

			// check if has memoized value based on hashFn
			if (cacheMap.has(hashKey)) {
				DEBUG && console.log("CACHE HIT");
				// if yes, return cached value
				return cacheMap.get(hashKey);
			}
			DEBUG && console.log("CACHE MISS");

			// if not call original and get result
			const result = originalMethod.apply(this, args);

			// call shouldCache (if passed) with the result or default to true
			let shouldCache: boolean = true;
			if (options.shouldCache) {
				shouldCache = options.shouldCache.call(this, result);
			}

			DEBUG && console.log("GOT BACK SHOULDCACHE", shouldCache);

			if (shouldCache) {
				DEBUG && console.log("CACHING NOW");
				cacheMap.set(hashKey, result);
			}
			// if shouldCache: save result
			DEBUG && console.log("RETURNING", result);
			return result;
		};

		return descriptor;
	};
}

/**
 * Calls specific method of the instance before executing the decorated method.
 * This is usable when some of your methods depend on initialize async method, that cannot be invoked in constructor of the class.
 * IMPORTANT: The decorated method must be async.
 * @param {string} methodName The name of the method that will be invoked before calling the decorated method.
 * @param {any[]} methodArgs Args that will be passed to the method that will be invoked before calling the decorated one.
 * @return {any} Result of the decorated method.
 */
export function invokeBefore(methodName: string, methodArgs?: any[]): any {
	return (
		target: any,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	): TypedPropertyDescriptor<any> => {
		const originalValue = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			await target[methodName].apply(this, methodArgs);
			return originalValue.apply(this, args);
		};

		return descriptor;
	};
}

export function invokeInit(): any {
	return invokeBefore("init");
}

export function exported(moduleName: string): any {
	return (
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	): TypedPropertyDescriptor<any> => {
		injector.publicApi.__modules__[moduleName] =
			injector.publicApi.__modules__[moduleName] || {};
		injector.publicApi.__modules__[moduleName][propertyKey] = (
			...args: any[]
		): any => {
			const originalModule = injector.resolve(moduleName),
				originalMethod: any = originalModule[propertyKey],
				result = originalMethod.apply(originalModule, args);

			return result;
		};

		return descriptor;
	};
}

export function performanceLog(localInjector?: IInjector): any {
	localInjector = localInjector || injector;
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	): any {
		const originalMethod = descriptor.value;
		const className = target.constructor.name;
		const trackName = `${className}${AnalyticsEventLabelDelimiter}${propertyKey}`;
		const performanceService: IPerformanceService =
			localInjector.resolve("performanceService");

		//needed for the returned function to have the same name as the original - used in hooks decorator
		const functionWrapper = {
			[originalMethod.name]: function (...args: Array<any>) {
				const start = performanceService.now();
				const result = originalMethod.apply(this, args);
				const resolvedPromise = Promise.resolve(result);
				let end;

				if (resolvedPromise !== result) {
					end = performanceService.now();
					performanceService.processExecutionData(trackName, start, end, args);
				} else {
					resolvedPromise
						.then(() => {
							end = performanceService.now();
							performanceService.processExecutionData(
								trackName,
								start,
								end,
								args
							);
						})
						.catch((err) => {
							end = performanceService.now();
							performanceService.processExecutionData(
								trackName,
								start,
								end,
								args
							);
						});
				}

				return result;
			}
		};
		descriptor.value = functionWrapper[originalMethod.name];

		// used to get parameter names in hooks decorator
		descriptor.value.toString = () => {
			return originalMethod.toString();
		};

		return descriptor;
	};
}

// inspired by https://github.com/NativeScript/NativeScript/blob/55dfe25938569edbec89255008e5ad9804901305/tns-core-modules/globals/globals.ts#L121-L137
export function deprecated(
	additionalInfo?: string,
	localInjector?: IInjector
): any {
	const isDeprecatedMessage = " is deprecated.";
	return (
		target: Object,
		key: string,
		descriptor: TypedPropertyDescriptor<any>
	): TypedPropertyDescriptor<any> => {
		localInjector = localInjector || injector;
		additionalInfo = additionalInfo || "";
		const $logger = <ILogger>localInjector.resolve("logger");
		if (descriptor) {
			if (descriptor.value) {
				// method
				const originalMethod = descriptor.value;

				descriptor.value = function (...args: any[]) {
					$logger.warn(
						`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`
					);

					return originalMethod.apply(this, args);
				};

				return descriptor;
			} else {
				// property
				if (descriptor.set) {
					const originalSetter = descriptor.set;
					descriptor.set = function (...args: any[]) {
						$logger.warn(
							`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`
						);

						originalSetter.apply(this, args);
					};
				}

				if (descriptor.get) {
					const originalGetter = descriptor.get;
					descriptor.get = function (...args: any[]) {
						$logger.warn(
							`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`
						);

						return originalGetter.apply(this, args);
					};
				}

				return descriptor;
			}
		} else {
			// class
			$logger.warn(
				`${
					(target &&
						((<any>target).name ||
							((<any>target).constructor && (<any>target).constructor.name))) ||
					target
				}${isDeprecatedMessage} ${additionalInfo}`
			);

			return target;
		}
	};
}

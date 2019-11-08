import { AnalyticsEventLabelDelimiter } from "../constants";

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
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
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

/**
 * Calls specific method of the instance before executing the decorated method.
 * This is usable when some of your methods depend on initialize async method, that cannot be invoked in constructor of the class.
 * IMPORTANT: The decorated method must be async.
 * @param {string} methodName The name of the method that will be invoked before calling the decorated method.
 * @param {any[]} methodArgs Args that will be passed to the method that will be invoked before calling the decorated one.
 * @return {any} Result of the decorated method.
 */
export function invokeBefore(methodName: string, methodArgs?: any[]): any {
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
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
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
		$injector.publicApi.__modules__[moduleName] = $injector.publicApi.__modules__[moduleName] || {};
		$injector.publicApi.__modules__[moduleName][propertyKey] = (...args: any[]): any => {
			const originalModule = $injector.resolve(moduleName),
				originalMethod: any = originalModule[propertyKey],
				result = originalMethod.apply(originalModule, args);

			return result;
		};

		return descriptor;
	};
}

export function performanceLog(injector?: IInjector): any {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
		const originalMethod = descriptor.value;
		const className = target.constructor.name;
		const trackName = `${className}${AnalyticsEventLabelDelimiter}${propertyKey}`;

		//needed for the returned function to have the same name as the original - used in hooks decorator
		const functionWrapper = {
			[originalMethod.name]: function (...args: Array<any>) {
				injector = injector || $injector;
				const performanceService: IPerformanceService = injector.resolve("performanceService");
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
							performanceService.processExecutionData(trackName, start, end, args);
						})
						.catch((err) => {
							end = performanceService.now();
							performanceService.processExecutionData(trackName, start, end, args);
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
export function deprecated(additionalInfo?: string, injector?: IInjector): any {
	const isDeprecatedMessage = " is deprecated.";
	return (target: Object, key: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> => {
		injector = injector || $injector;
		additionalInfo = additionalInfo || "";
		const $logger = <ILogger>injector.resolve("logger");
		if (descriptor) {
			if (descriptor.value) {
				// method
				const originalMethod = descriptor.value;

				descriptor.value = function (...args: any[]) {
					$logger.warn(`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`);

					return originalMethod.apply(this, args);
				};

				return descriptor;
			} else {
				// property
				if (descriptor.set) {
					const originalSetter = descriptor.set;
					descriptor.set = function (...args: any[]) {
						$logger.warn(`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`);

						originalSetter.apply(this, args);
					};
				}

				if (descriptor.get) {
					const originalGetter = descriptor.get;
					descriptor.get = function (...args: any[]) {
						$logger.warn(`${key.toString()}${isDeprecatedMessage} ${additionalInfo}`);

						return originalGetter.apply(this, args);
					};
				}

				return descriptor;
			}
		} else {
			// class
			$logger.warn(`${((target && ((<any>target).name || ((<any>target).constructor && (<any>target).constructor.name))) || target)}${isDeprecatedMessage} ${additionalInfo}`);

			return target;
		}
	};
}

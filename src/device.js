import { use } from './utils/object';

/**
 * @private
 */
export class Device {
  toJSON() {
    throw new Error('method unsupported');
  }
}

Device.use = use(['toJSON']);

import { use } from './utils/object';

/**
 * @private
 */
export class Device {
  toJSON() {
    throw new Error('method unsupported');
  }
}

Device.prototype.use = use(['toJSON']);

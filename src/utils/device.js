import { use } from './object';

/**
 * @private
 */
export class Device {
  toJSON() {
    throw new Error('method unsupported');
  }
}

Device.use = use(['toJSON']);

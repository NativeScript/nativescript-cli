import { use } from './object';

/**
 * @private
 */
export const Device = {
  toJSON() {
    throw new Error('method unsupported');
  }
};

Device.use = use(['toJSON']);

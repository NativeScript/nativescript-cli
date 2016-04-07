import { Kinvey } from '../src/kinvey';
import { NetworkRack } from '../src/rack/rack';
import { SerializeMiddleware } from '../src/rack/middleware/serialize';
import { HttpMiddleware } from './mocks/http';
import { DeviceAdapter } from './mocks/device';
import { Device } from '../src/utils/device';
import { User } from '../src/user';
import Benchmark from 'benchmark';
import { randomString } from '../src/utils/string';
import LegacyKinvey from 'kinvey';

export class KinveyBenchmark {
  constructor() {
    // Use the Device Adapter
    Device.use(new DeviceAdapter());

    // Use the Http Middleware
    const networkRack = NetworkRack.sharedInstance();
    networkRack.useAfter(SerializeMiddleware, new HttpMiddleware());

    // Initialize Kinvey
    this.client = Kinvey.init({
      appKey: randomString(),
      appSecret: randomString()
    });

    // Create a new benchmark suite
    this.suite = new Benchmark.Suite;

    // Turn on/off simulated responses
    this.simulateResponse = true;
  }

  createSimulatedResponses() {
    return;
  }

  execute() {
    const promise = LegacyKinvey.init({
      appKey: randomString(),
      appSecret: randomString(),
      sync: {
        enabled: true,
        online: false
      }
    }).then(user => {
      if (!user) {
        const user = {
          _id: randomString(),
          _kmd: {
            authtoken: randomString()
          }
        };
        return LegacyKinvey.setActiveUser(user);
      }

      return user;
    }).then(() => {
      // Set an active user
      const user = new User({
        _id: randomString(),
        _kmd: {
          authtoken: randomString()
        }
      });
      return user.setAsActiveUser();
    }).then(() => {
      if (this.simulateResponse) {
        this.createSimulatedResponses();
      }

      return null;
    });
    return promise;
  }
}

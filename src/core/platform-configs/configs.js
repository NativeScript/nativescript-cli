// These can be spread into more files, if these configs grow
import { platformName } from './platform-name';

const mobilePlatformsConcurrentPulls = 2;

export const platformConfigs = {
  base: {
    maxConcurrentPushRequests: 100,
    maxConcurrentPullRequests: 32
  },

  [platformName.nativeScript]: {
    maxConcurrentPullRequests: mobilePlatformsConcurrentPulls
  },

  [platformName.phoneGap]: {
    maxConcurrentPullRequests: mobilePlatformsConcurrentPulls
  }
};

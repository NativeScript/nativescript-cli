import { User } from 'kinvey-js-sdk';
import { loginWithMIC } from './loginWithMIC';
import { loginWithRedirectUri } from './loginWithRedirectUri';

(User as any).loginWithMIC = loginWithMIC;
(User as any).loginWithRedirectUri = loginWithRedirectUri;

export { User };

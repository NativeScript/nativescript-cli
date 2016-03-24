import { Kinvey } from '../src/kinvey';
import { User } from '../src/user';
import { AuthorizationGrant } from '../src/enums';
import { DataStore, DataStoreType } from '../src/stores/datastore';

Kinvey.init({
  appKey: 'kid_byGoHmnX2',
  appSecret: '9b8431f34279434bbedaceb2fe6b8fb5'
});

User.loginWithMIC('http://www.kinvey.com/', AuthorizationGrant.AuthorizationCodeAPI, {
  username: 'admin',
  password: 'admin'
}).then(() => {
  const booksStore = DataStore.getInstance('books', DataStoreType.Network);
  return booksStore.find();
}).then(books => {
  console.log(books);
}).catch(error => {
  console.log(error);
});

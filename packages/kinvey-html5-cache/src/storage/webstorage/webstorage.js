const masterCollectionName = 'master';

exports.WebStorage = class WebStorage {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  get masterCollectionName() {
    return `${this.name}${masterCollectionName}`;
  }
}

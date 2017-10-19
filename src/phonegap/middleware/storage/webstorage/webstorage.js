const masterCollectionName = 'master';

export class WebStorage {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  get masterCollectionName() {
    return `${this.name}${masterCollectionName}`;
  }
}

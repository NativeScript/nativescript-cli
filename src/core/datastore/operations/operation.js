export class Operation {
  type;
  collection;
  query;
  entityId;

  constructor(type, collection, query, data, entityId) {
    this.type = type;
    this.collection = collection;

    if (query) {
      this.query = query;
    }

    if (data) {
      this.data = data;
    }

    if (entityId) {
      this.entityId = entityId;
    }
  }

  clone() {
    return new Operation(this.type, this.collection, this.query, this.data, this.entityId);
  }
}

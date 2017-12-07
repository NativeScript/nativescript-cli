import { Operation } from './operation';

// TODO: separate classes - necessary?
function getOperationWithQuery(type, collection, query) {
  return new Operation(type, collection, query);
}

function getOperationWithData(type, collection, data) {
  return new Operation(type, collection, null, data);
}

function getByIdOperation(type, collection, id) {
  return new Operation(type, collection, null, null, id);
}

export const operationFactory = {
  getOperationWithQuery,
  getOperationWithData,
  getByIdOperation
};

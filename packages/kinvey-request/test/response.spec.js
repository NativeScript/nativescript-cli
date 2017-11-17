const {
  APIVersionNotAvailableError,
  APIVersionNotImplementedError,
  AppProblemError,
  BadRequestError,
  BLError,
  CORSDisabledError,
  DuplicateEndUsersError,
  FeatureUnavailableError,
  IncompleteRequestBodyError,
  IndirectCollectionAccessDisallowedError,
  InsufficientCredentialsError,
  InvalidCredentialsError,
  InvalidIdentifierError,
  InvalidQuerySyntaxError,
  JSONParseError,
  KinveyError,
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  ServerError,
  StaleRequestError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError
} = require('kinvey-errors');
const { KinveyResponse, Response } = require('../src');
const expect = require('expect');

describe('Response', () => {
  describe('error', () => {
    it('should return null when the response is a success', () => {
      const response = new Response({
        statusCode: 200,
        data: {}
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(true);
      expect(error).toEqual(null);
    });

    it('should throw an InsufficientCredentialsError', () => {
      const apiError = {
        name: 'InsufficientCredentialsError',
        message: 'Insufficient Credentials'
      };
      const response = new Response({
        statusCode: 401,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(InsufficientCredentialsError);
      expect(error.name).toEqual('InsufficientCredentialsError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(401);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'NotFound',
        message: 'Not Found'
      };
      const response = new Response({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a ServerError', () => {
      const apiError = {
        name: 'ServerErrpr',
        message: 'Server Error'
      };
      const response = new Response({
        statusCode: 500,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(ServerError);
      expect(error.name).toEqual('ServerError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(500);
    });

    it('should throw a KinveyError', () => {
      const apiError = {
        name: 'Error',
        message: 'An error occurred.'
      };
      const response = new Response({
        statusCode: 409,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(KinveyError);
      expect(error.name).toEqual('KinveyError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(409);
    });
  });
});

describe('KinveyResponse', () => {
  describe('error', () => {
    it('should return null when the response is a success', () => {
      const response = new KinveyResponse({
        statusCode: 200,
        data: {}
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(true);
      expect(error).toEqual(null);
    });

    it('should throw an APIVersionNotAvailableError', () => {
      const apiError = {
        name: 'APIVersionNotAvailable',
        message: 'This API version is not available for your app. Please retry your request with a supported API version'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(APIVersionNotAvailableError);
      expect(error.name).toEqual('APIVersionNotAvailableError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw an APIVersionNotImplementedError', () => {
      const apiError = {
        name: 'APIVersionNotImplemented',
        message: 'This API version is not implemented. Please retry your request with a supported API version'
      };
      const response = new KinveyResponse({
        statusCode: 501,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(APIVersionNotImplementedError);
      expect(error.name).toEqual('APIVersionNotImplementedError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(501);
    });

    it('should throw an AppProblemError', () => {
      const apiError = {
        name: 'AppProblem',
        message: 'There is a problem with this app backend that prevents execution of this operation. Please contact support@kinvey.com for assistance'
      };
      const response = new KinveyResponse({
        statusCode: 403,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(AppProblemError);
      expect(error.name).toEqual('AppProblemError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(403);
    });

    it('should throw a BadRequestError', () => {
      const apiError = {
        name: 'BadRequest',
        message: 'Unable to understand request'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BadRequestError);
      expect(error.name).toEqual('BadRequestError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a BLError', () => {
      const apiError = {
        name: 'BLRuntimeError',
        message: 'The Business Logic script has a runtime error. See debug message for details',
        debug: 'You have an issue with you BL script.'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BLError);
      expect(error.name).toEqual('BLError');
      expect(error.message).toEqual(apiError.message);
      expect(error.debug).toEqual(apiError.debug);
      expect(error.code).toEqual(400);
    });

    it('should throw a BLError', () => {
      const apiError = {
        name: 'BLSyntaxError',
        message: 'The Business Logic script has a syntax error(s). See debug message for details',
        debug: 'You have an issue with you BL script.'
      };
      const response = new KinveyResponse({
        statusCode: 550,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BLError);
      expect(error.name).toEqual('BLError');
      expect(error.message).toEqual(apiError.message);
      expect(error.debug).toEqual(apiError.debug);
      expect(error.code).toEqual(550);
    });

    it('should throw a BLError', () => {
      const apiError = {
        name: 'BLTimeoutError',
        message: 'The Business Logic script did not complete in time. See debug message for details',
        debug: 'You have an issue with you BL script.'
      };
      const response = new KinveyResponse({
        statusCode: 550,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BLError);
      expect(error.name).toEqual('BLError');
      expect(error.message).toEqual(apiError.message);
      expect(error.debug).toEqual(apiError.debug);
      expect(error.code).toEqual(550);
    });

    it('should throw a BLError', () => {
      const apiError = {
        name: 'BLViolationError',
        message: 'The Business Logic script violated a constraint. See debug message for details',
        debug: 'You have an issue with you BL script.'
      };
      const response = new KinveyResponse({
        statusCode: 550,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BLError);
      expect(error.name).toEqual('BLError');
      expect(error.message).toEqual(apiError.message);
      expect(error.debug).toEqual(apiError.debug);
      expect(error.code).toEqual(550);
    });

    it('should throw a BLError', () => {
      const apiError = {
        name: 'BLInternalError',
        message: 'The Business Logic script did not complete. See debug message for details',
        debug: 'You have an issue with you BL script.'
      };
      const response = new KinveyResponse({
        statusCode: 550,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(BLError);
      expect(error.name).toEqual('BLError');
      expect(error.message).toEqual(apiError.message);
      expect(error.debug).toEqual(apiError.debug);
      expect(error.code).toEqual(550);
    });

    it('should throw a CORSDisabledError', () => {
      const apiError = {
        name: 'CORSDisabled',
        message: 'Cross Origin Support is disabled for this application'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(CORSDisabledError);
      expect(error.name).toEqual('CORSDisabledError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a DuplicateEndUsersError', () => {
      const apiError = {
        name: 'DuplicateEndUsers',
        message: 'More than one user registered with this username for this application. Please contact support@kinvey.com for assistance'
      };
      const response = new KinveyResponse({
        statusCode: 500,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(DuplicateEndUsersError);
      expect(error.name).toEqual('DuplicateEndUsersError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(500);
    });

    it('should throw a FeatureUnavailableError', () => {
      const apiError = {
        name: 'FeatureUnavailable',
        message: 'Requested functionality is unavailable in this API version'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(FeatureUnavailableError);
      expect(error.name).toEqual('FeatureUnavailableError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw an IncompleteRequestBodyError', () => {
      const apiError = {
        name: 'IncompleteRequestBody',
        message: 'The request body is either missing or incomplete'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(IncompleteRequestBodyError);
      expect(error.name).toEqual('IncompleteRequestBodyError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw an IndirectCollectionAccessDisallowedError', () => {
      const apiError = {
        name: 'IndirectCollectionAccessDisallowed',
        message: 'Please use the appropriate API to access this collection for this app backend'
      };
      const response = new KinveyResponse({
        statusCode: 403,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(IndirectCollectionAccessDisallowedError);
      expect(error.name).toEqual('IndirectCollectionAccessDisallowedError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(403);
    });

    it('should throw an InsufficientCredentialsError', () => {
      const apiError = {
        name: 'InsufficientCredentials',
        message: 'The credentials used to authenticate this request are not authorized to run this operation. Please retry your request with appropriate credentials'
      };
      const response = new KinveyResponse({
        statusCode: 401,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(InsufficientCredentialsError);
      expect(error.name).toEqual('InsufficientCredentialsError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(401);
    });

    it('should throw an InvalidCredentialsError', () => {
      const apiError = {
        name: 'InvalidCredentials',
        message: 'Invalid credentials. Please retry your request with correct credentials'
      };
      const response = new KinveyResponse({
        statusCode: 401,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(InvalidCredentialsError);
      expect(error.name).toEqual('InvalidCredentialsError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(401);
    });

    it('should throw an InvalidIdentifierError', () => {
      const apiError = {
        name: 'InvalidIdentifier',
        message: 'One of more identifier names in the request has an invalid format'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(InvalidIdentifierError);
      expect(error.name).toEqual('InvalidIdentifierError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw an InvalidQuerySyntaxError', () => {
      const apiError = {
        name: 'InvalidQuerySyntax',
        message: 'The query string in the request has an invalid syntax'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(InvalidQuerySyntaxError);
      expect(error.name).toEqual('InvalidQuerySyntaxError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a JSONParseError', () => {
      const apiError = {
        name: 'JSONParseError',
        message: 'Unable to parse the JSON in the request'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(JSONParseError);
      expect(error.name).toEqual('JSONParseError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a KinveyInternalErrorRetry', () => {
      const apiError = {
        name: 'KinveyInternalErrorRetry',
        message: 'The Kinvey server encountered an unexpected error. Please retry your request'
      };
      const response = new KinveyResponse({
        statusCode: 500,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(KinveyInternalErrorRetry);
      expect(error.name).toEqual('KinveyInternalErrorRetry');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(500);
    });

    it('should throw a KinveyInternalErrorStop', () => {
      const apiError = {
        name: 'KinveyInternalErrorStop',
        message: 'The Kinvey server encountered an unexpected error. Please contact support@kinvey.com for assistance'
      };
      const response = new KinveyResponse({
        statusCode: 500,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(KinveyInternalErrorStop);
      expect(error.name).toEqual('KinveyInternalErrorStop');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(500);
    });

    it('should throw a MissingQueryError', () => {
      const apiError = {
        name: 'MissingQuery',
        message: 'The request is missing a query string'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(MissingQueryError);
      expect(error.name).toEqual('MissingQueryError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a MissingRequestHeaderError', () => {
      const apiError = {
        name: 'MissingRequestHeader',
        message: 'The request is missing a required header'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(MissingRequestHeaderError);
      expect(error.name).toEqual('MissingRequestHeaderError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a MissingRequestParameterError', () => {
      const apiError = {
        name: 'MissingRequestParameter',
        message: 'A required parameter is missing from the request'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(MissingRequestParameterError);
      expect(error.name).toEqual('MissingRequestParameterError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'EntityNotFound',
        message: 'This entity not found in the collection'
      };
      const response = new KinveyResponse({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'CollectionNotFound',
        message: 'This collection not found for this app backend'
      };
      const response = new KinveyResponse({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'AppNotFound',
        message: 'This app backend not found'
      };
      const response = new KinveyResponse({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'UserNotFound',
        message: 'This user does not exist for this app backend'
      };
      const response = new KinveyResponse({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a NotFoundError', () => {
      const apiError = {
        name: 'BlobNotFound',
        message: 'This blob not found for this app backend'
      };
      const response = new KinveyResponse({
        statusCode: 404,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(NotFoundError);
      expect(error.name).toEqual('NotFoundError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(404);
    });

    it('should throw a ParameterValueOutOfRangeError', () => {
      const apiError = {
        name: 'ParameterValueOutOfRange',
        message: 'The value specified for one of the request parameters is out of range'
      };
      const response = new KinveyResponse({
        statusCode: 400,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(ParameterValueOutOfRangeError);
      expect(error.name).toEqual('ParameterValueOutOfRangeError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(400);
    });

    it('should throw a StaleRequestError', () => {
      const apiError = {
        name: 'StaleRequest',
        message: 'The time window for this request has expired'
      };
      const response = new KinveyResponse({
        statusCode: 409,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(StaleRequestError);
      expect(error.name).toEqual('StaleRequestError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(409);
    });

    it('should throw a UserAlreadyExistsError', () => {
      const apiError = {
        name: 'UserAlreadyExists',
        message: 'This username is already taken. Please retry your request with a different username'
      };
      const response = new KinveyResponse({
        statusCode: 409,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(UserAlreadyExistsError);
      expect(error.name).toEqual('UserAlreadyExistsError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(409);
    });

    it('should throw a WritesToCollectionDisallowedError', () => {
      const apiError = {
        name: 'WritesToCollectionDisallowed',
        message: 'This collection is configured to disallow any modifications to an existing entity or creation of new entities'
      };
      const response = new KinveyResponse({
        statusCode: 403,
        data: apiError
      });
      const error = response.error;
      expect(response.isSuccess()).toEqual(false);
      expect(error).toBeA(WritesToCollectionDisallowedError);
      expect(error.name).toEqual('WritesToCollectionDisallowedError');
      expect(error.message).toEqual(apiError.message);
      expect(error.code).toEqual(403);
    });
  });
});

import {
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
  KinveyInternalErrorRetry,
  KinveyInternalErrorStop,
  MissingQueryError,
  MissingRequestHeaderError,
  MissingRequestParameterError,
  NotFoundError,
  ParameterValueOutOfRangeError,
  StaleRequestError,
  UserAlreadyExistsError,
  WritesToCollectionDisallowedError
} from 'src/errors';
import { KinveyResponse } from 'src/request';
import expect from 'expect';

describe('KinveyResponse', function() {
  describe('error', function() {
    it('should throw an APIVersionNotAvailableError', function() {
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
    });

    it('should throw an APIVersionNotImplementedError', function() {
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
    });

    it('should throw an AppProblemError', function() {
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
    });

    it('should throw an BadRequestError', function() {
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
    });

    it('should throw an BLError', function() {
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
    });

    it('should throw an BLError', function() {
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
    });

    it('should throw an BLError', function() {
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
    });

    it('should throw an BLError', function() {
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
    });

    it('should throw an BLError', function() {
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
    });

    it('should throw an CORSDisabledError', function() {
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
    });

    it('should throw an DuplicateEndUsersError', function() {
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
    });

    it('should throw an FeatureUnavailableError', function() {
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
    });

    it('should throw an IncompleteRequestBodyError', function() {
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
    });

    it('should throw an IndirectCollectionAccessDisallowedError', function() {
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
    });

    it('should throw an InsufficientCredentialsError', function() {
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
    });

    it('should throw an InvalidCredentialsError', function() {
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
    });

    it('should throw an InvalidIdentifierError', function() {
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
    });

    it('should throw an InvalidQuerySyntaxError', function() {
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
    });

    it('should throw an JSONParseError', function() {
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
    });

    it('should throw an KinveyInternalErrorRetry', function() {
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
    });

    it('should throw an KinveyInternalErrorStop', function() {
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
    });

    it('should throw an MissingQueryError', function() {
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
    });

    it('should throw an MissingRequestHeaderError', function() {
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
    });

    it('should throw an MissingRequestParameterError', function() {
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
    });

    it('should throw an NotFoundError', function() {
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
    });

    it('should throw an NotFoundError', function() {
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
    });

    it('should throw an NotFoundError', function() {
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
    });

    it('should throw an NotFoundError', function() {
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
    });

    it('should throw an NotFoundError', function() {
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
    });

    it('should throw an ParameterValueOutOfRangeError', function() {
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
    });

    it('should throw an StaleRequestError', function() {
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
    });

    it('should throw an UserAlreadyExistsError', function() {
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
    });

    it('should throw an WritesToCollectionDisallowedError', function() {
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
    });
  });
});

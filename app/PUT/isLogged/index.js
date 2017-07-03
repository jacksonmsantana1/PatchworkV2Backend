const R = require('ramda');
const Jwt = require('jsonwebtoken');
const Boom = require('boom');
const Either = require('data.either');
const Task = require('data.task');
const H = require('../../plugins/helper/helper');
const KEY = require('../../../key');
const logMessage = require('../../plugins/logger/index');

// ERRORS Messages
const invalidSignature = 'Invalid Token Signature';
const signatureRequired = 'Token Signature is required';
const expired = 'Token Expired';

// getParams :: Request -> Either(String)
const getParams = request => Either.fromNullable(request).chain(H.props('payload')).chain(H.props('token'));

// getToken :: String -> String
const getToken = params => Either.fromNullable(params).map(str => str.split(' ')).chain(H.nth(1));

// validateToken :: String -> Boolean
const validateToken = token => new Task((reject, resolve) => {
  Jwt.verify(token, KEY, (err, decoded) => {
    if (err && err.message === 'invalid signature') {
      return reject(Boom.unauthorized(invalidSignature));
    } else if (err && err.message === 'jwt signature is required') {
      return reject(Boom.unauthorized(signatureRequired));
    } else if (err && err.message === 'jwt expired') {
      return reject(Boom.unauthorized(expired));
    } else if (decoded) {
      return resolve(true);
    }

    return reject(Boom.badImplementation(err.message));
  });
});

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, res) => {
  request.log('PUT /isLogged',
    logMessage(request.id, true, 'no-credentials', request.path, 'OK 200'));

  reply(res);
});

// sendError :: Request -> Response -> Error
const sendError = R.curry((request, reply, err) => {
  request.log('ERROR',
    logMessage(request.id, false, 'no-credentials', request.path, err.message));

  reply(err);
});

module.exports = (request, reply) => {
  request.log('PUT /isLogged',
    logMessage(request.id, true, 'no-credential', request.path, 'Endpoint reached'));

  getParams(request)
    .chain(getToken)
    .chain(validateToken)
    .fork(sendError(request, reply), sendRequest(request, reply));
};

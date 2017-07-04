const Boom = require('boom');
const jwt = require('jsonwebtoken');
const logMessage = require('../logger/');
const KEY = require('../../../key');

// ERROR Messages
const bearerRequired = Boom.unauthorized('Bearer Required');
const tokenRequired = Boom.unauthorized('Token Required');
const invalidSignature = Boom.unauthorized('Invalid Token Signature');
const signatureRequired = Boom.unauthorized('Token Signature is required');
const emailRequired = Boom.unauthorized('Token EMAIL required');
const expired = Boom.unauthorized('Token Expired');

/* eslint consistent-return:1 */
const authenticate = (request, reply) => {
  const req = request.raw.req;
  const authorization = req.headers.authorization;
  const token = authorization && authorization.split(' ')[1];
  const bearer = authorization && authorization.split(' ')[0];

  if (!authorization) {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, tokenRequired.message));
    return reply(tokenRequired, null);
  }

  if (bearer !== 'Bearer') {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, bearerRequired.message));
    return reply(bearerRequired, null);
  }

  jwt.verify(token, KEY, (err, decoded) => {
    if (err && err.message === 'invalid signature') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, invalidSignature.message));
      return reply(invalidSignature, null);
    } else if (err && err.message === 'jwt signature is required') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, signatureRequired.message));
      return reply(signatureRequired, null);
    } else if (err && err.message === 'jwt expired') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, expired.message));
      return reply(expired, null);
    } else if (err) {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, err.message));
      return reply(Boom.badRequest(err.message), null);
    }

    if (!decoded.email) {
      request.log('auth',
        logMessage(request.id, false, 'undefined', req.url, emailRequired));

      return reply(emailRequired, null);
    }

    request.log('AUTH',
      logMessage(request.id, true, decoded.id, req.url, 'Authentication Passed'));
    return reply.continue({ credentials: decoded });
  });
};

const response = (request, reply) => {
  const options = {
    algorithm: 'HS256',
    expiresIn: '5m',
  };

  if (!!request && !!request.auth && request.auth.isAuthenticated) {
    request.response
      .header('authorization', `Bearer ${jwt.sign({ email: request.auth.credentials.email, admin: request.auth.credentials.admin }, KEY, options)}`);
  }

  reply.continue();
};

/* eslint no-unused-vars:1 */
module.exports = (server, options) => ({
  authenticate,
  response,
});

const R = require('ramda');
const Either = require('data.either');
const Task = require('data.task');
const Boom = require('boom');
const Jwt = require('jsonwebtoken');
const H = require('../../plugins/helper/helper');
const HS = require('../../plugins/helper/helper.server');
const Crypto = require('../../plugins/crypto/hash');
const logMessage = require('../../plugins/logger/');
const Mongo = require('../../plugins/mongodb/mongo').user;
const KEY = require('../../../key');


// getEmail :: Request -> Either(String, String)
const getEmail = request => Either.fromNullable(request).chain(H.props('payload')).chain(H.props('email'));

// getPasswor :: Request -> Either(String, String)
const getPassword = request => Either.fromNullable(request).chain(H.props('payload')).chain(H.props('password'));

// comparePassword :: String -> User -> Task(User, Error)
const comparePassword = R.curry((password, user) => Crypto.comparePassword(password, user.password)
  .chain((isValid) => {
    if (isValid) {
      return Task.of(user);
    }

    return Task.rejected(Boom.unauthorized('Invalid Password'));
  }));

// createToken :: User -> Task(String)
const createToken = (user) => {
  const options = {
    algorithm: 'HS256',
    expiresIn: '5m',
  };

  return Task.of(`Bearer ${Jwt.sign({ email: user.email }, KEY, options)}`);
};

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, token) => {
  request.log('/login',
    logMessage(request.id, true, 'no-credential', request.path, 'OK 200'));

  reply(token);
});

// sendError :: Request -> Response -> Error
const sendError = R.curry((request, reply, err) => {
  request.log('ERROR',
    logMessage(request.id, false, 'no-credential', request.path, err.message));

  reply(err);
});

module.exports = (request, reply) => {
  request.log('/login',
    logMessage(request.id, true, 'no-credential', request.path, 'Endpoint reached'));

  const email = getEmail(request);
  const password = getPassword(request);
  const collection = HS.getDB(request).chain(HS.getCollection('users'));

  if (!email.isRight) {
    reply(Boom.badRequest('Missing email payload'));
  }

  if (!password.isRight) {
    reply(Boom.badRequest('Missing password payload'));
  }

  if (!collection.isRight) {
    reply(Boom.badRequest('Collection not found on DB'));
  }

  Mongo.findUserByEmail(collection.get(), email.get())
    .chain(comparePassword(password.get()))
    .chain(createToken)
    .fork(sendError(request, reply), sendRequest(request, reply));
};

const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').user;

// getEmail :: Request -> Either(String)
const getUserEmail = request => Either.fromNullable(request).chain(H.props('params')).chain(H.props('email'));

// removePassword :: User -> User
const removePassword = user => {
  const userWithoutPasss = Object.assign({}, user);
  delete userWithoutPasss.password;
  return userWithoutPasss;
}

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, project) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('DELETE /user/email',
    logMessage(request.id, true, credential, request.path, 'OK 200'));

  reply(project);
});

// sendError :: Request -> Response -> Error
const sendError = R.curry((request, reply, err) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('ERROR',
    logMessage(request.id, false, credential, request.path, err.message));

  reply(err);
});

module.exports = (request, reply) => {
  const credential = HS.getCredential(request).getOrElse('No-credential');
  const email = getUserEmail(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('DELETE /user/email',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (email.isLeft) {
    reply(Boom.badRequest('Missing project email'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }
  Mongo.deleteUserByEmail(collection.get(), email.get())
    .map(removePassword)
    .fork(sendError(request, reply), sendRequest(request, reply));
};

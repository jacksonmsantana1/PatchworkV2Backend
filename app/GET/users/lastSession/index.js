const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').user;

// getUserEmail :: Request -> Either(Project)
const getUserEmail = request => Either.fromNullable(request).chain(H.props('params')).chain(H.props('email'));

// removePassword :: User -> User
const removePassword = (user) => {
  const _user = Object.assign({}, user);
  delete _user.password;
  return _user;
};

// getLastSession :: User -> String
const getLastSession = (user) => {
  if (!user.lastSession) {
    return '';
  }

  return user.lastSession;
};

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, project) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('GET /users/email/lastSession',
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
  const credentials = HS.getCredentials(request).getOrElse('No-credential');
  const userEmail = getUserEmail(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('GET /users/email/lastSession',
    logMessage(request.id, true, credentials.email, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (userEmail.isLeft) {
    reply(Boom.badRequest('Missing project id'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  if (credentials.email !== userEmail.get()) {
    if (!credentials.admin) {
      reply(Boom.unauthorized('Invalid User Email'));
    }
  }

  Mongo.findUserByEmail(collection.get(), userEmail.get())
    .map(removePassword)
    .map(getLastSession)
    .fork(sendError(request, reply), sendRequest(request, reply));
};

const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').user;

// getUserEmail :: Request -> Either(String)
const getUserEmail = request => Either.fromNullable(request).chain(H.props('params')).chain(H.props('email'));

// getProjectSession :: Request -> Either(String)
const getProjectSession = request => Either.fromNullable(request).chain(H.props('params')).chain(H.props('sessionId'));

// getProjectSvg :: Request -> Either(String)
const getProjectSvg = request => Either.fromNullable(request).chain(H.props('payload')).chain(H.props('svg'));

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, project) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('PUT /user/project',
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
  const projectSession = getProjectSession(request);
  const projectSvg = getProjectSvg(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('PUT /users/project',
    logMessage(request.id, true, credentials.email, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (userEmail.isLeft) {
    reply(Boom.badRequest('Missing user email'));
  }

  if (projectSession.isLeft) {
    reply(Boom.badRequest('Missing project session'));
  }

  if (projectSvg.isLeft) {
    reply(Boom.badRequest('Missing project svg'));
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
  } else {
    Mongo.updateProjectBySessionId(collection.get(),
      userEmail.get(), projectSession.get(), projectSvg.get())
      .fork(sendError(request, reply), sendRequest(request, reply));
  }
};

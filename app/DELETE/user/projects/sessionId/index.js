const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../../plugins/helper/helper');
const HS = require('../../../../plugins/helper/helper.server');
const logMessage = require('../../../../plugins/logger/');
const Mongo = require('../../../../plugins/mongodb/mongo').user;

// getSessionId :: Request -> Either(Project)
const getSessionId = request =>
  Either.fromNullable(request).chain(H.props('params')).chain(H.props('sessionId'));

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, project) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('DELETE /user/projects/sessionId',
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
  const sessionId = getSessionId(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('DELETE /user/projects/sessionId',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (sessionId.isLeft) {
    reply(Boom.badRequest('Missing Session ID'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  Mongo.deleteProject(collection.get(), credential, sessionId.get())
    .fork(sendError(request, reply), sendRequest(request, reply));
};


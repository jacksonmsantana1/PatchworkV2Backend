const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../../plugins/helper/helper');
const HS = require('../../../../plugins/helper/helper.server');
const logMessage = require('../../../../plugins/logger/');
const Mongo = require('../../../../plugins/mongodb/mongo').user;

// getProject :: Request -> Either(Project)
const getProject = request => Either.fromNullable(request).chain(H.props('payload'));

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, project) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('POST /user/save/project',
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
  const project = getProject(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('POST /user/save/project',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (project.isLeft) {
    reply(Boom.badRequest('Missing payload'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  Mongo.saveProject(collection.get(), credential, project.get())
    .fork(sendError(request, reply), sendRequest(request, reply));
};


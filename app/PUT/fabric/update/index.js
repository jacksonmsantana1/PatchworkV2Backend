const R = require('ramda');
const Either = require('data.either');
const Boom = require('boom');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').fabric;

// getFabric :: Request -> Either(Fabric)
const getFabric = request => Either.fromNullable(request).chain(H.props('payload')).chain(H.props('fabric'));

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, fabric) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('/fabric/update',
    logMessage(request.id, true, credential, request.path, 'OK 200'));

  reply(fabric);
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
  const fabric = getFabric(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('fabrics', db.get());

  request.log('/fabric/update',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (fabric.isLeft) {
    reply(Boom.badRequest('Missing fabric payload'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  Mongo.updateFabric(collection.get(), fabric.get())
    .fork(sendError(request, reply), sendRequest(request, reply));
};

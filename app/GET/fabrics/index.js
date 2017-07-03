const Boom = require('boom');
const R = require('ramda');
const HS = require('../../plugins/helper/helper.server.js');
const logMessage = require('../../plugins/logger/');
const Mongo = require('../../plugins/mongodb/mongo').fabric;

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, projects) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('/fabrics',
    logMessage(request.id, true, credential, request.path, 'OK 200'));

  reply(projects);
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
  const db = HS.getDB(request);
  const collection = HS.getCollection('fabrics', db.get());

  request.log('/fabrics',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  Mongo.getFabrics(collection.get())
    .fork(sendError(request, reply), sendRequest(request, reply));
};

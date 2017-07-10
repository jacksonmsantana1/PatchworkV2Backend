const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').block;

// getBlock :: Request -> Either(Block)
const getBlock = request => Either.fromNullable(request).chain(H.props('payload'));

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, block) => {
  const credential = HS.getCredential(request).getOrElse('No credentials');

  request.log('POST /block/save',
    logMessage(request.id, true, credential, request.path, 'OK 200'));

  reply(`Saved block: ${block.name}`);
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
  const block = getBlock(request);
  const db = HS.getDB(request);
  const collection = HS.getCollection('blocks', db.get());

  request.log('POST /block/save',
    logMessage(request.id, true, credential, request.path, 'Endpoint reached'));

  if (!HS.isAuthenticated(request).getOrElse(false)) {
    reply(Boom.unauthorized('Unauthorized'));
  }

  if (block.isLeft) {
    reply(Boom.badRequest('Missing payload'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  Mongo.saveBlock(collection.get(), block.get())
    .fork(sendError(request, reply), sendRequest(request, reply));
};

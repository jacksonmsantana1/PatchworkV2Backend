const Boom = require('boom');
const R = require('ramda');
const Either = require('data.either');
const Crypto = require('../../../plugins/crypto/hash');
const H = require('../../../plugins/helper/helper');
const HS = require('../../../plugins/helper/helper.server');
const logMessage = require('../../../plugins/logger/');
const Mongo = require('../../../plugins/mongodb/mongo').user;

// getUser :: Request -> Either(User)
const getUser = request => Either.fromNullable(request).chain(H.props('payload'));

// hashPassword  :: User -> User
const hashPassword = user =>
  Crypto.createHash(user.password).map((hashedPassword) => {
    const userHashedPswd = Object.assign({}, user);
    userHashedPswd.password = hashedPassword;
    return userHashedPswd;
  });

// sendRequest :: Request -> Response -> String
const sendRequest = R.curry((request, reply, user) => {
  request.log('POST /user/save',
    logMessage(request.id, true, 'no-credential', request.path, 'OK 200'));

  reply(`Saved User: ${user.email}`);
});

// sendError :: Request -> Response -> Error
const sendError = R.curry((request, reply, err) => {
  request.log('ERROR',
    logMessage(request.id, false, 'no-credential', request.path, err.message));

  reply(err);
});

module.exports = (request, reply) => {
  const user = getUser(request).chain(hashPassword);
  const db = HS.getDB(request);
  const collection = HS.getCollection('users', db.get());

  request.log('POST /user/save',
    logMessage(request.id, true, 'no-credential', request.path, 'Endpoint reached'));

  if (user.isLeft) {
    reply(Boom.badRequest('Missing payload'));
  }

  if (db.isLeft) {
    reply(Boom.badImplementation('Couldn t connect to the database'));
  }

  if (collection.isLeft) {
    reply(Boom.badImplementation('Collection not found on the DB'));
  }

  user
    .chain(Mongo.saveUser(collection.get()))
    .fork(sendError(request, reply), sendRequest(request, reply));
};

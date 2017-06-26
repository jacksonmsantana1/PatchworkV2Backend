const R = require('ramda');
const Either = require('data.either');
const Boom = require('boom');
const H = require('./helper');

// getCredential :: Request -> Either(String)
const getCredential = request => Either.fromNullable(request)
  .chain(H.props('auth')).chain(H.props('credentials')).chain(H.props('email'));

// getDB :: Request -> Either(MongoDB, String)
const getDB = request => Either.fromNullable(request)
  .chain(H.props('server'))
  .chain(H.props('plugins'))
  .chain(H.props('hapi-mongodb'))
  .chain(H.props('db'));

// getCollection :: String -> Database -> Either
const getCollection = R.curry((collectionName, db) => {
  const collection = db.collection(collectionName);

  if (collection) {
    return Either.Right(collection);
  }

  return Either.Left('Invalid Collection');
});

// isAutheticated :: (Request, String:credential) -> Promise(ID, Error)
const isAuthenticated = request => Either.fromNullable(request)
  .chain(H.props('auth'))
  .chain(H.props('isAuthenticated'))
  .chain((auth) => {
    if (auth) {
      return Either.Right(isAuthenticated);
    }

    return Either.Left(Boom.unauthorized('Unauthorized'));
  });

module.exports = {
  getCredential,
  getDB,
  getCollection,
  isAuthenticated,
};

const Task = require('data.task');
const Boom = require('boom');
const R = require('ramda');
const H = require('../helper/helper');

// findUserByEmail :: MongoCollection -> String -> Task(User, Error)
const findUserByEmail = R.curry((collection, email) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'users') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.findOne({ email }, (err, user) => {
    if (err) {
      return reject(Boom.badImplementation('Internal MongoDB error'));
    }

    if (!user) {
      return reject(Boom.unauthorized('User Not Found'));
    }

    return resolve(user);
  });
}));

// findUserById :: MongoCollection -> String -> Task(User, Error)
const findUserById = R.curry((collection, id) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'users') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.findOne({ _id: H.safeId(id).get() }, (err, user) => {
    if (err) {
      return reject(Boom.badImplementation('Internal MongoDB error'));
    }

    if (!user) {
      return reject(Boom.unauthorized('User Not Found'));
    }

    return resolve(user);
  });
}));

module.exports = {
  findUserByEmail,
  findUserById,
};

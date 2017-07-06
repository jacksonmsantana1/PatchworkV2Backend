const Task = require('data.task');
const Boom = require('boom');
const Joi = require('joi');
const R = require('ramda');
const UserSchema = require('../schemas/user');
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

// insertUser :: Collection -> User -> Task
const insertUser = R.curry((collection, user) => new Task((reject, resolve) => {
  if (collection.collectionName !== 'users') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.insertOne(user, (err, r) => {
    if (err) {
      return reject(Boom.badImplementation('Failed to save the user'));
    } else if (!err && r.insertedCount) {
      return resolve(user);
    }

    return reject(Boom.badImplementation('Something occured...'));
  });
}));

// isUserSaved :: Collection -> User -> Task(true|false, error)
const isUserSaved = R.curry((collection, user) => H.props('email', user)
  .chain(findUserByEmail(collection))
  .chain((usr) => {
    if (usr) {
      return Task.of(true);
    }

    return Task.of(false);
  }).orElse((err) => {
    if (err.output.payload.message === 'User Not Found') {
      return Task.of(false);
    }

    return Task.rejected(err);
  }));

// validateUser :: UserSchema -> Propject -> Task
const validateUser = R.curry((userSchema, user) => new Task((reject, resolve) => {
  Joi.validate(user, userSchema, (err, value) => {
    if (err) {
      return reject(Boom.badRequest(`Schema Validation Error: ${err.message}`));
    }

    return resolve(value);
  });
}));

// saveUser :: Collection -> User -> Task
const saveUser = R.curry((collection, user) => validateUser(UserSchema, user)
  .chain(isUserSaved(collection))
  .chain((isSaved) => {
    if (isSaved) {
      return Task.rejected(Boom.badRequest('User already saved'));
    }

    return Task.of(user);
  })
  .chain(insertUser(collection)));

// deleteUserByEmail :: Collection -> String -> Task
const deleteUserByEmail = R.curry((collection, email) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'users') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!email) {
      return reject(Boom.badRequest('Invalid Email'));
    }

    collection.findOneAndDelete({ email }, (err, r) => {
      if (err) {
        return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
      }

      if (r.ok && r.value) {
        return resolve(r.value);
      }

      return reject(Boom.badRequest('User doesn t exist'));
    });
  }));

const updateUserLastSession = R.curry((collection, email, lastSession) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'users') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!email) {
      return reject(Boom.badRequest('Invalid Email'));
    }

    if (!lastSession) {
      return reject(Boom.badRequest('Invalid Session'));
    }

    collection.updateOne({ email }, { $set: { lastSession } }, (err, res) => {
      if (err) {
        return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
      }

      if (res.result.ok) {
        return resolve(lastSession);
      }

      return reject(Boom.badImplementation('Something occured...'));
    });
  }));

// findProjectBySessionId :: Collection -> String -> String
const findProjectBySessionId = R.curry((collection, email, sessionId) =>
  findUserByEmail(collection, email)
    .chain(H.props('projects'))
    .map(projects => projects.filter(proj => (proj.sessionIs === sessionId)))
    .map(H.nth(0)));

module.exports = {
  findUserByEmail,
  findUserById,
  insertUser,
  isUserSaved,
  saveUser,
  deleteUserByEmail,
  updateUserLastSession,
  findProjectBySessionId,
};

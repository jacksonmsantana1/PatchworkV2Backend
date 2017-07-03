const Task = require('data.task');
const R = require('ramda');
const Boom = require('boom');

// getProjects :: Collection -> Task([])
const getProjects = R.curry(collection => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'projects') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.find().toArray((err, docs) => {
    if (err) {
      return reject(err);
    }

    resolve(docs);
  });
}));

module.exports = {
  getProjects,
};

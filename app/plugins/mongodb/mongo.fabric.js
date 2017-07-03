const Task = require('data.task');
const R = require('ramda');
const Boom = require('boom');
const Joi = require('joi');
const H = require('../helper/helper');
const FabricSchema = require('../schemas/fabric');

// getFabrics :: Collection -> Task([])
const getFabrics = R.curry(collection => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'fabrics') {
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

// insertFabric :: Collection -> Fabric -> Task
const insertFabric = R.curry((collection, fabric) => new Task((reject, resolve) => {
  if (collection.collectionName !== 'fabrics') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.insertOne(fabric, (err, r) => {
    if (err) {
      return reject(Boom.badImplementation('Failed to save the fabric'));
    } else if (!err && r.insertedCount) {
      return resolve(fabric);
    }

    return reject(Boom.badImplementation('Something occured...'));
  });
}));

// getFabricByName :: Collection -> Fabric -> Task
const getFabricByName = R.curry((collection, name) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'fabrics') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.findOne({ name }, (err, doc) => {
    if (err) {
      return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
    }

    if (!doc) {
      return resolve(false); // FIXME Return False if the project doesn't exists
    }

    return resolve(doc);
  });
}));

// fabricExist :: Collection -> Fabric -> Task
const fabricExist = R.curry((collection, fabric) => H.props('name', fabric)
  .chain(getFabricByName(collection))
  .chain((proj) => {
    if (proj) {
      return Task.rejected(Boom.badRequest('Fabric already exists'));
    }

    return Task.of(fabric);
  }));

// validateFabric :: FabricSchema -> Propject -> Task
const validateFabric = R.curry((fabricSchema, fabric) => new Task((reject, resolve) => {
  Joi.validate(fabric, fabricSchema, (err, value) => {
    if (err) {
      return reject(Boom.badRequest(`Schema Validation Error: ${err.message}`));
    }

    return resolve(value);
  });
}));

// saveFabric :: Collection -> Fabric -> Task
const saveFabric = R.curry((collection, fabric) => validateFabric(FabricSchema, fabric)
  .chain(fabricExist(collection))
  .chain(insertFabric(collection)));

module.exports = {
  getFabrics,
  insertFabric,
  fabricExist,
  validateFabric,
  getFabricByName,
  saveFabric,
};

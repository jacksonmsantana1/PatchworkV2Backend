const R = require('ramda');
const Task = require('data.task');
const Boom = require('boom');
const Joi = require('joi');
const H = require('../helper/helper');
const BlockSchema = require('../schemas/block');

// getBlockByName :: Collection -> Block -> Task
const getBlockByName = R.curry((collection, name) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'blocks') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  if (!name) {
    return reject(Boom.badImplementation('Invalid Block name'));
  }

  collection.findOne({ name }, (err, doc) => {
    if (err) {
      return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
    }

    if (!doc) {
      return resolve(false);
    }

    return resolve(doc);
  });
}));

// getBlockById :: Collection -> Block -> Task
const getBlockById = R.curry((collection, id) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'blocks') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  if (H.safeId(id).isLeft) {
    return reject(Boom.badRequest(`Invalid ID: ${id}`));
  }

  collection.findOne({ _id: H.safeId(id).get() }, (err, doc) => {
    if (err) {
      return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
    }

    if (!doc) {
      return resolve(Boom.badRequest(`None block with the id: ${id} was found`));
    }

    return resolve(doc);
  });
}));

// insertBlock :: Collection -> Block -> Task
const insertBlock = R.curry((collection, block) =>
  new Task((reject, resolve) => {
    /* eslint consistent-return:0 */
    if (collection.collectionName !== 'blocks') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!block) {
      return reject(Boom.badImplementation('Invalid Block'));
    }

    collection.insertOne(block, (err, r) => {
      if (err) {
        return reject(Boom.badImplementation('Failed to save the fabric'));
      } else if (!err && r.insertedCount) {
        return resolve(block);
      }

      return reject(Boom.badImplementation('Something occured...'));
    });
  }));


// validateBlock :: BlockSchema -> Block -> Task
const validateBlock = R.curry((blockSchema, block) => new Task((reject, resolve) => {
  Joi.validate(block, blockSchema, (err, value) => {
    if (err) {
      return reject(Boom.badRequest(`Schema Validation Error: ${err.message}`));
    }

    return resolve(value);
  });
}));

// blockExist :: Collection -> Block -> Task
const blockExist = R.curry((collection, block) => H.props('name', block)
  .chain(getBlockByName(collection))
  .chain((proj) => {
    if (proj) {
      return Task.rejected(Boom.badRequest('Block already exists'));
    }

    return Task.of(block);
  }));

// saveBlock :: Collection -> Block -> Task
const saveBlock = R.curry((collection, block) => validateBlock(BlockSchema, block)
  .chain(blockExist(collection))
  .chain(insertBlock(collection)));

// replaceBlock :: Collection -> Block -> Block
const replaceBlock = R.curry((collection, newBlock, oldBlock) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'blocks') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!oldBlock) {
      return reject(Boom.badRequest('Block doesnt exist'));
    }

    collection.replaceOne({ name: oldBlock.name }, newBlock, (err, res) => {
      if (err) {
        return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
      } else if (!res.result.nModified) {
        return reject(Boom.badImplementation('None block were replaced'));
      } else if (res.result.ok && res.result.nModified) {
        return resolve(newBlock);
      }

      return reject(Boom.badImplementation('Something occured...'));
    });
  }));

// updateBlock :: Collection -> Block -> Task
const updateBlock = R.curry((collection, newBlock) => validateBlock(BlockSchema, newBlock)
  .map(R.prop('name'))
  .chain(getBlockByName(collection))
  .chain(replaceBlock(collection, newBlock)));

// deleteBlockById :: Collection -> String -> Task
const deleteBlockById = R.curry((collection, id) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'blocks') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!id) {
      return reject(Boom.badRequest('Invalid Id'));
    }

    collection.findOneAndDelete({ _id: H.safeId(id).get() }, (err, r) => {
      if (err) {
        return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
      }

      if (r.ok && r.value) {
        return resolve(r.value);
      }

      return reject(Boom.badRequest('Block doesn t exist'));
    });
  }));

module.exports = {
  getBlockByName,
  getBlockById,
  insertBlock,
  validateBlock,
  blockExist,
  saveBlock,
  replaceBlock,
  updateBlock,
  deleteBlockById,
};

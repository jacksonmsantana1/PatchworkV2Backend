const Task = require('data.task');
const Boom = require('boom');
const R = require('ramda');
const Joi = require('joi');
const H = require('../helper/helper');
const ProjectSchema = require('../../plugins/schemas/project');

// getProjectByName :: Collection -> Project -> Task
const getProjectByName = R.curry((collection, name) => new Task((reject, resolve) => {
  /* eslint consistent-return:0 */
  if (collection.collectionName !== 'projects') {
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

// insertProject :: Collection -> Project -> Task
const insertProject = R.curry((collection, project) => new Task((reject, resolve) => {
  if (collection.collectionName !== 'projects') {
    return reject(Boom.badImplementation(
      `Trying to access an invalid collection: ${collection.collectionName}`));
  }

  collection.insertOne(project, (err, r) => {
    if (err) {
      return reject(Boom.badImplementation('Failed to save the project'));
    } else if (!err && r.insertedCount) {
      return resolve(project);
    }

    return reject(Boom.badImplementation('Something occured...'));
  });
}));

// projectExit :: Collection -> Project -> Task
const projectExist = R.curry((collection, project) => H.props('name', project)
  .chain(getProjectByName(collection))
  .chain((proj) => {
    if (proj) {
      return Task.rejected(Boom.badRequest('Project already exists'));
    }

    return Task.of(project);
  }));

// validateProject :: ProjectSchema -> Propject -> Task
const validateProject = R.curry((projectSchema, project) => new Task((reject, resolve) => {
  Joi.validate(project, projectSchema, (err, value) => {
    if (err) {
      return reject(Boom.badRequest(`Schema Validation Error: ${err.message}`));
    }

    return resolve(value);
  });
}));

// saveProject :: Collection -> Project -> Task
const saveProject = R.curry((collection, project) => validateProject(ProjectSchema, project)
  .chain(projectExist(collection))
  .chain(insertProject(collection)));

// getProjectById :: Collection -> String -> Task
const getProjectById = R.curry((collection, id) => new Task((reject, resolve) => {
  if (collection.collectionName !== 'projects') {
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
      return reject(Boom.badRequest(`Project wiht id ${id} Not Found`));
    }

    return resolve(doc);
  });
}));

// getProjects :: Collection -> Task([])
const getProjects = R.curry(collection => new Task((reject, resolve) => {
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

// replaceProject :: Collection -> Project -> Project
const replaceProject = R.curry((collection, newProject, oldProject) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'projects') {
      return reject(Boom.badImplementation(
        `Trying to access an invalid collection: ${collection.collectionName}`));
    }

    if (!oldProject) {
      return reject(Boom.badRequest('Project doesnt exist'));
    }

    collection.replaceOne({ name: oldProject.name }, newProject, (err, res) => {
      if (err) {
        return reject(Boom.badImplementation(`Internal MongoDB error: ${err.message}`));
      } else if (!res.result.nModified) {
        return reject(Boom.badImplementation('None project were replaced'));
      } else if (res.result.ok && res.result.nModified) {
        return resolve(newProject);
      }

      return reject(Boom.badImplementation('Something occured...'));
    });
  }));

// updateProject :: Collection -> Project -> Task
const updateProject = R.curry((collection, newProject) => validateProject(ProjectSchema, newProject)
  .map(R.prop('name'))
  .chain(getProjectByName(collection))
  .chain(replaceProject(collection, newProject)));

// deleteProjectById :: Collection -> String -> Task
const deleteProjectById = R.curry((collection, id) =>
  new Task((reject, resolve) => {
    if (collection.collectionName !== 'projects') {
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

      return reject(Boom.badRequest('Project doesn t exist'));
    });
  }));

module.exports = {
  saveProject,
  getProjects,
  getProjectByName,
  getProjectById,
  updateProject,
  deleteProjectById,
};


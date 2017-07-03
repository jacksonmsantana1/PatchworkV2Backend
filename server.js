/* eslint global-require:0 */
const Hapi = require('hapi');
const Joi = require('joi');
const server = module.exports = new Hapi.Server();

/** *************************Server Config**************************** **/

server.connection({
  port: 3000,
});

server.auth.scheme('token', require('./app/plugins/auth/auth'));
server.auth.scheme('admin', require('./app/plugins/auth/admin'));
server.auth.strategy('default', 'token');
server.auth.strategy('admin', 'admin');

const mongoConfig = (process.env.NODE_ENV === 'test') ?
  require('./app/plugins/mongodb/config.js').test :
  (process.env.NODE_ENV === 'dev') ?
    require('./app/plugins/mongodb/config.js').dev :
    require('./app/plugins/mongodb/config').postman;

/** *******************************Plugins******************************** **/
const options = {
  ops: {
    interval: 1000,
  },
  reporters: {
    myConsoleReporter: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{
          log: '*',
          response: '*',
          error: '*',
        }],
      }, {
        module: 'good-console',
      },
      'stdout',
    ],
    myErrorReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{
        error: '*',
      }],
    }, {
      module: 'good-squeeze',
      name: 'SafeJson',
    }, {
      module: 'good-file',
      args: ['./error.log'],
    }],
  },
};

// Good
const GoodPlugin = server.register({
  register: require('good'),
  options,
});

// Blipp
const BlippPlugin = server.register({
  register: require('blipp'),
  options: {
    showStart: true,
    showAuth: true,
  },
});

// Lout
const LoutPlugin = server.register([require('vision'), require('inert'), require('lout')]);

// TV
// FIXME Only in DEVELOPMENT!!!
const TVPlugin = server.register([require('vision'), require('inert'), require('tv')]);

// MongoDB
const MongoPlugin = server.register({
  register: require('hapi-mongodb'),
  options: mongoConfig,
});

// Inert
const InertPlugin = server.register({ register: require('inert') });

/** ************************Routing********************************** **/

const routeStart = () => server.route([{
  method: 'PUT',
  path: '/login',
  config: {
    description: 'Login',
    tags: ['login'],
    notes: 'Validates the user login',
    validate: {
      payload: {
        email: Joi.string().required(),
        password: Joi.string().required(),
      },
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/PUT/login/'),
}, {
  method: 'GET',
  path: '/images/{file*}',
  handler: {
    directory: {
      path: 'public/images',
    },
  },
},
{
  method: 'PUT',
  path: '/project/update',
  config: {
    auth: 'admin',
    description: 'Updates the given project',
    tags: ['update', 'project'],
    notes: 'Updates the project',
    validate: {
      payload: {
        project: {
          name: Joi.string().required(),
          author: Joi.string().required(),
          layout: Joi.string().required(),
          svg: Joi.object(),  // FIXME - Improve Svg scheme
          image: Joi.string().required(),
          description: Joi.string().required(),
        },
      },
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/PUT/project/update/'),
},
{
  method: 'GET',
  path: '/projects',
  config: {
    auth: 'default',
    description: 'Returns the patchwork projects',
    tags: ['projects'],
    notes: 'Return the main information about the patchwork projects',
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/GET/projects/'),
},
{
  method: 'GET',
  path: '/facrics',
  config: {
    auth: 'default',
    description: 'Returns all the fabrics',
    tags: ['fabric'],
    notes: 'All the fabrics object represents a real patchwork fabric',
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/GET/fabrics/'),
},
{
  method: 'GET',
  path: '/projects/{id}',
  config: {
    auth: 'default',
    description: 'Returns a patchwork project with the given id',
    tags: ['projects', 'project', 'id'],
    notes: 'Return the main information about the patchwork project with the given id',
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/GET/projects/id/'),
},
{
  method: 'POST',
  path: '/project/save',
  config: {
    auth: 'admin',
    description: 'Save a new project',
    tags: ['project', 'save', 'admin'],
    notes: 'Only admin users can save a project',
    validate: {
      payload: {
        name: Joi.string().required(),
        author: Joi.string().required(),
        layout: Joi.string().required(),
        svg: Joi.object(), // FIXME - Improve the svg scheme
        image: Joi.string().required(),
        description: Joi.string().required(),
      },
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/POST/project/save'),
},
{
  method: 'POST',
  path: '/fabric/save',
  config: {
    auth: 'admin',
    description: 'Save a new fabric',
    tags: ['fabric', 'save', 'admin'],
    notes: 'Only admin users can save a fabric',
    validate: {
      payload: {
        name: Joi.string().required(),
        company: Joi.string().required(),
        image: Joi.string().required(),
        description: Joi.string().required(),
        colors: Joi.array().items(Joi.string()),
      },
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/POST/fabric/save'),
},
{
  method: 'PUT',
  path: '/isLogged',
  config: {
    description: 'Checks if the user is logged',
    tags: ['logged'],
    notes: 'returns true if the user is logged and false if is not',
    validate: {
      payload: {
        token: Joi.string().required(),
      },
    },
    cors: {
      origin: ['*'],
      additionalHeaders: ['cache-control', 'x-requested-with'],
    },
  },
  handler: require('./app/PUT/isLogged'),
}]);

/** ********************************Start********************************* **/

const start = () => {
  routeStart();

  server.log('INFO', 'Routing Configured');
  return LoutPlugin;
};

const loutStart = (err) => {
  if (err) {
    server.log('ERROR', 'Lout Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Lout Configured');
  return TVPlugin;
};

const tvStart = (err) => {
  if (err) {
    server.log('ERROR', 'Tv Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Tv Configured');
  return BlippPlugin;
};

const mongoStart = (err) => {
  if (err) {
    server.log('ERROR', 'MongoDB Error');
    return Promise.reject(err);
  }

  server.log('INFO', `MongoDB running on ${mongoConfig.url}`);
  return BlippPlugin;
};

const blippStart = (err) => {
  if (err) {
    server.log('ERROR', 'Blipp Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Blipp Configured');
  return GoodPlugin;
};

const inertStart = (err) => {
  if (err) {
    server.log('ERROR', 'Inert Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Inert Configured');
  return GoodPlugin;
};

/* eslint consistent-return:1 */
const serverStart = (err) => {
  if (err) {
    server.log('ERROR', 'Good Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Good Configured');
  server.start(() => {
    server.log('INFO', 'Server running..');
  });
};

const error = (err) => {
  console.log('ERROR');
  server.log('ERROR', 'Server crashed');
  throw err;
};

start()
  .then(loutStart)
  .then(tvStart)
  .then(mongoStart)
  .then(blippStart)
  .then(inertStart)
  .then(serverStart)
  .catch(error);

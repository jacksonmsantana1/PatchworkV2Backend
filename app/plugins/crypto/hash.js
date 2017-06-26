const bcrypt = require('bcryptjs');
const Task = require('data.task');
const R = require('ramda');

const SALT = 10;

// _generateSalt :: Number -> Task(Error, String)
const generateSalt = saltRounds => new Task((reject, resolve) => {
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      return reject(new Error('Error generating the salt'));
    }

    return resolve(salt);
  });
});


// _hashPassword :: String -> String -> Task(Error, String)
const hashPassword = R.curry((password, salt) => new Task((reject, resolve) => {
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      return reject(new Error('Error generating the hash'));
    }

    return resolve(hash);
  });
}));

// _createHash :: String -> Task(Error, String)
const createHash = password => generateSalt(SALT).chain(hashPassword(password));

// _comparePassword :: String -> String -> Task(Error, Boolean)
const comparePassword = R.curry((password, hash) => new Task((reject, resolve) => {
  bcrypt.compare(password, hash, (err, res) => {
    if (err) {
      return reject(new Error('Internal Error'));
    }

    if (res) {
      return resolve(true);
    }

    return resolve(false);
  });
}));

module.exports = {
  generateSalt,
  hashPassword,
  comparePassword,
  createHash,
};

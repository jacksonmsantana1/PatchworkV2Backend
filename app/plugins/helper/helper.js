const R = require('ramda');
const ObjectId = require('mongodb').ObjectId;
const Either = require('data.either');

/* eslint new-cap:0 */

// props :: String -> HTMLELement -> Either
const props = R.curry((prop, elem) => { // TODO Check if the elem variable is not null or undefined
  if (prop in elem) {
    return Either.Right(elem[prop]);
  }

  return Either.Left(`The element ${elem.toString()} doesnt't have the property ${prop}`);
});

// changeProps :: String -> <T> -> HTMLElement
const changeProps = R.curry((prop, value, elem) => {
  /* eslint no-param-reassign:0 */
  elem[prop] = value;
});

// isEmpty :: [] -> Either([])
const isEmpty = (arr) => {
  if (!arr.length) {
    return Either.Left('Empty Array');
  }

  return Either.Right(arr);
};

// logError :: String -> String -> _
const logError = R.curry((componentName, err) => console.error(`<${componentName}>: ${err}`));

// log :: IO
const log = (x) => {
  console.log(x);
  return x;
};

// isNil :: <Element> -> Either(<Element>)
const isNil = (x) => {
  if (R.isNil(x)) {
    return Either.Left('Element is undefined or null');
  }

  return Either.Right(x);
};

// isArray :: Array -> Either(Array)
const isArray = (arr) => {
  if (Array.isArray(arr) || arr.length) {
    return Either.Right(arr);
  }

  return Either.Left(`Element ${arr.toString()} is not an array`);
};

// safeId :: String -> Either(ObjectId, Error)
const safeId = (id) => {
  if (!ObjectId.isValid(id)) {
    return Either.Left(new Error('Invalid Object ID'));
  }

  return Either.Right(new ObjectId(id));
};

// nth :: Number -> Array -> Either
const nth = R.curry((n, arr) => Either.fromNullable(arr)
  .chain(isNil)
  .chain(isArray)
  .map(R.nth(n))
  .chain(isNil));

// equals :: <T> -> <T> -> Boolean
const equals = R.curry((x, y) => {
  if (x === y) {
    return true;
  }

  return false;
});

// diffs :: <T> -> <T> -> Boolean
const diffs = R.curry((x, y) => {
  if (x !== y) {
    return true;
  }

  return false;
});

function splat(fn) {
  return function (list) {
    return Array.prototype.map.call(list, fn);
  };
}

module.exports = {
  changeProps,
  props,
  logError,
  log,
  isNil,
  isEmpty,
  nth,
  equals,
  diffs,
  splat,
  safeId,
};


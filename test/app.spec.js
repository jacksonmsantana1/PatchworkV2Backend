const Lab = require('lab');
const lab = exports.lab = Lab.script();

const sinon = require('sinon');
const expect = require('chai').expect;

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/test';

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;

const server = require('../server.js');

describe('App', () => {
  let projectsDB;
  let database;

  before((done) => {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        done(err);
      }

      console.log('Connected...');
      database = db;
      projectsDB = database.collection('projects');

      done();
    });
  });

  after((done) => {
    projectsDB.remove({}, (err) => {
      if (err) {
        throw err
      }

      sinon.restore();
      done();
    });
  });

  describe('GET /projects', () => {
    it('Should be listening to GET /projects', (done) => {
      let options = {
        method: 'GET',
        url: '/projects',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects');
        done();
      });
    });
  });
});

module.exports = {
  test: {
    url: 'mongodb://127.0.0.1:27017/users',
    settings: {
      db: {
        nativeParser: false,
      },
    },
  },
  postman: {
    url: 'mongodb://postman:postman@ds011429.mlab.com:11429/users',
    settings: {
      db: {
        nativeParser: false,
      },
    },
  },
  dev: {
    url: 'mongodb://127.0.0.1:27017/dev',
    settings: {
      db: {
        nativeParser: false,
      },
    },
  },
};

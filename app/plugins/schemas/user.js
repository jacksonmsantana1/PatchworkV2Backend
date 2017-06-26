const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any().optional(),
  admin: Joi.boolean().required(),
  email: Joi.string().required(),
  password: Joi.string(),
});

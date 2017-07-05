const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any().optional(),
  name: Joi.string().required(),
  admin: Joi.boolean().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  lastSession: Joi.string(),
  projects: Joi.array().items(Joi.object()),
});

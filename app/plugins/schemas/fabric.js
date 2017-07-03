const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any().optional(),
  name: Joi.string().required(),
  company: Joi.string().required(),
  image: Joi.string().required(),
  description: Joi.string().required(),
  colors: Joi.array().items(Joi.string()),
});

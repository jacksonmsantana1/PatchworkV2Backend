const Joi = require('joi');

module.exports = Joi.object().keys({
  _id: Joi.any().optional(),
  name: Joi.string().required(),
  author: Joi.string().required(),
  layout: Joi.string().required(),
  svg: Joi.object().required(), // FIXME Create a better scheme for svg with all the properties
  image: Joi.string().required(),
  description: Joi.string().required(),
});

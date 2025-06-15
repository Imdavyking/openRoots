import Joi from "joi";

export const datasetValidationSchema = Joi.object({
  creator: Joi.string().required(),
  address: Joi.string().required(),
  cid: Joi.string().required(),
  createdAt: Joi.number().required(),
  category: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  preview: Joi.string().required(),
  groupId: Joi.string().required(),
  ipId: Joi.string().required(),
});

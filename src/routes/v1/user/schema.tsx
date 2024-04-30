import Joi from '@hapi/joi';
import { JoiObjectId } from '../../../helpers/validator';


export default {
  userId: Joi.object().keys({
    id: JoiObjectId().required(),
  }),
  profile: Joi.object().keys({
    firstname: Joi.string().optional().min(1).max(200),
    lastname: Joi.string().optional().min(1).max(200),
    email: Joi.string().optional(),
    profilePicUrl: Joi.string().optional().uri(),
    password: Joi.string().optional().min(6),
  }),
};
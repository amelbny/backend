import express from 'express';
import validator from '../../../helpers/validator';
import schema from './schema';
import role from '../../../helpers/role';
import _ from 'lodash';
import authentication from '../../../auth/authentication';
import authorization from '../../../auth/authorization';
import {uploadMiddleware} from '../../../middlewares/multer';
import { getMyProfile, updateProfile,saveProfilePicture } from '../../../controllers/profileController';
import { RoleCode } from '../../../database/model/Role';

const router = express.Router();

//router.use('/', authentication);
router.post('/picture', uploadMiddleware, saveProfilePicture)
router.get(
  '/my',
   getMyProfile
);

router.put(
  '/',
  validator(schema.profile),
  updateProfile
);

//router.use('/', role(RoleCode.USER), authorization);

export default router;
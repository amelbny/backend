import express from 'express';
import validator, { ValidationSource } from '../../../helpers/validator';
import schema from './schema';
import { login, logout, refreshToken, signup,resetPassword } from '../../../controllers/authController';
import authentication from '../../../auth/authentication';

const router = express.Router();

router.post('/login', login);

router.post('/signup', signup);

router.post('/resetPassword/:id', resetPassword);

//router.use('/', authentication);
router.post('/refresh', refreshToken );
router.use('/', authentication);
router.delete('/logout', logout);

export default router;

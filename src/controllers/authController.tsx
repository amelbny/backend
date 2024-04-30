import { ProtectedRequest, RoleRequest, Tokens} from '../types/app-request.d';
import bcryptjs from 'bcryptjs';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import { AuthFailureError, BadRequestError } from '../core/ApiError';
import { SuccessMsgResponse, SuccessResponse} from '../core/ApiResponse';
import { RoleCode } from '../database/model/Role';
import User from '../database/model/User';
import KeystoreRepo from '../database/repository/KeystoreRepo';
import UserRepo from '../database/repository/UserRepos';
import asyncHandler from '../helpers/asyncHandler';
import bcrypt from 'bcrypt';

//login
export const login = asyncHandler(async (req, res) => {
  console.log('req.body?email', req.body.email);
  let user = await UserRepo.findByEmail(req.body.email);
  console.log("user", user);
  if (!user) throw new BadRequestError('User not registered');
  if (!user.password) throw new BadRequestError('Credential not set');

  const match = await bcryptjs.compare(req.body.password, user.password);
  console.log("match", match);
  if (!match) throw new AuthFailureError('Authentication failure');
  
  const accessToken = jwt.sign({ email: user.email, id: user._id.toString(), roles: user.roles }, "jwt-access-token-secret-key", { expiresIn: '1m' });
  const refreshToken = jwt.sign({ email: user.email }, "jwt-refresh-token-secret-key", { expiresIn: '3m' });

  // Décoder et afficher le contenu du token
  //const decodedAccessToken = jwt.decode(accessToken);
  //console.log('Decoded Access Token:', decodedAccessToken);

  await KeystoreRepo.create(user._id, accessToken, refreshToken);

  new SuccessResponse('Login Success', {
    CreateUser: _.pick(user, ['_id', 'firstname', 'email', 'roles']),
    accessToken,
    refreshToken,
  }).send(res);
});

//resetPassword
export const resetPassword =asyncHandler(async(req,res) => {
  const {id}= req.params;
  console.log('id',id);
  const {password}= req.body;

  const hashedPassword = await bcrypt.hash(password, 12); // hacher le mot de passe

  await UserRepo.findByIdAndUpdate(id, hashedPassword );
  return new SuccessResponse(
    ' PasswordUpdated Successfully',
    _.pick( ['firstname','lastname','password']),
  ).send(res);
});

//signup
export const signup = asyncHandler(async (req : RoleRequest, res) => {
  let user = await UserRepo.findByEmail(req.body.email);
  if (user) throw new BadRequestError('User already registered');
  
  let roleCode;
  // Logique pour déterminer le rôle
  if (req.body.email === 'admin@admin.com') {
    roleCode = RoleCode.ADMIN;
  } else {
    roleCode = RoleCode.USER; // Rôle par défaut pour les autres utilisateurs
  }

  const { user: createdUser } = await UserRepo.create(
    {
      ...req.body,
    }as User,
    roleCode );

  new SuccessResponse('Signup Successful', {
    user: _.pick(createdUser, ['_id', 'firstname', 'email', 'roles']),
  }).send(res);
});

// refreshToken
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken;
  console.log('reftoken',refreshToken)
  if (!refreshToken) {
    throw new BadRequestError('Refresh token missing');
  }

  // Vérifiez si le refresh token est valide
  let decodedRefreshToken;
  console.log('deco',decodedRefreshToken)
  try {
    console.log('deco',decodedRefreshToken)
    decodedRefreshToken = jwt.verify(refreshToken, "jwt-refresh-token-secret-key") as { email: string };
    console.log('deco',decodedRefreshToken)
  } catch (error) {
    throw new AuthFailureError('Invalid refresh token');
  }

  // Vérifiez si l'utilisateur associé au refresh token existe
  const user = await UserRepo.findByEmail(decodedRefreshToken.email);
  if (!user) {
    throw new AuthFailureError('User not found');
  }

  // Vérifiez si le keystore contient le refresh token
  const keystore = await KeystoreRepo.find(user._id, refreshToken);
  if (!keystore) {
    throw new AuthFailureError('Invalid refresh token');
  }

  // Générer un nouveau access token
  const newAccessToken = jwt.sign({ email: user.email, id: user._id, roles: user.roles }, "jwt-access-token-secret-key", { expiresIn: '1m' });
  const newRefreshToken = jwt.sign({ email: user.email }, "jwt-refresh-token-secret-key", { expiresIn: '3m' });
  // Mettre à jour le keystore avec le nouveau access token
  await KeystoreRepo.update(keystore._id, { accessToken: newAccessToken, refreshToken:newRefreshToken });

  new SuccessResponse('Token Refreshed', {
    accessToken: newAccessToken,
    refreshToken:newRefreshToken
  }).send(res);
});

//logout
export const logout = asyncHandler(async (req: ProtectedRequest, res) => {
  await KeystoreRepo.remove(req.keystore._id);
  console.log('key',req.keystore._id)
  new SuccessMsgResponse('Logout success').send(res);
  
});

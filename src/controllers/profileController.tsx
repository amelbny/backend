import { ProtectedRequest } from '../types/app-request.d';
import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';
import bcrypt from 'bcrypt';
import bcryptjs from 'bcryptjs';
import { BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import UserRepo from '../database/repository/UserRepos';
import asyncHandler from '../helpers/asyncHandler';
import express from 'express';
import path from 'path';
const app=express();
//app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, '/images/profile')));
export const saveProfilePicture = asyncHandler(async (req: ProtectedRequest, res: Response,next: NextFunction ) => {
  const user = await UserRepo.findProfileById(req.user._id);
  if (!user) throw new BadRequestError('User not registered');

  if (!req.file) {
    throw new BadRequestError('No image file provided');
  }
  const baseUrl = 'http://localhost:3000/images/profile/';
  //const avatarUrl = baseUrl + 'images/' + req.file.filename;
  const avatarUrl = req.file.filename;
  //const baseUrl = 'http://localhost:3000/'; 
  //const avatarUrl = /*baseUrl +*/ req.file.filename;
  
  user.profilePicUrl = baseUrl+avatarUrl;/*req.file?.path*/
  await UserRepo.updateInfo(user);

  return new SuccessResponse('Profile picture updated', _.pick(user, ['firstname', 'lastname', 'profilePicUrl'])).send(res);
});

export const getMyProfile = asyncHandler(async (req: ProtectedRequest, res) => {
  const user = await UserRepo.findProfileById(req.user._id);   
  if (!user) throw new BadRequestError('User not registered');
  return new SuccessResponse('success', _.pick(user, ['firstname','lastname','email', 'profilePicUrl'])).send(res);
});

export const changePassword = asyncHandler(async (req: ProtectedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Please provide both current and new passwords');
  }
  const user = await UserRepo.findProfileById(req.user._id);
  if (!user) throw new BadRequestError('User not registered');
  // Validate the current password
  const match = await bcryptjs.compare(currentPassword, user.password);
  if (!match) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Hash the new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  // Update user's password with the new hashed password
  user.password = hashedNewPassword;
  
  // Save the updated user profile
  await UserRepo.updateInfo(user);
  return new SuccessResponse(
    'Password updated successfully',
    _.pick(user, ['password'])
  ).send(res);
});

export const updateProfile = asyncHandler(async (req: ProtectedRequest, res) => {
  const user = await UserRepo.findProfileById(req.user._id);
  if (!user) throw new BadRequestError('User not registered');

  if (req.body.firstname) user.firstname = req.body.firstname;
  if (req.body.lastname) user.lastname = req.body.lastname;
  if (req.body.email) user.email = req.body.email;
  if (req.body.profilePicUrl) user.profilePicUrl = req.body.profilePicUrl;

  /*if (req.body.password) {
    const hashedPassword = await bcrypt.hash(req.body.password, 12); // hacher le mot de passe

    // Enregistrer le mot de passe haché
    user.password = hashedPassword;
  }*/

  await UserRepo.updateInfo(user);
  return new SuccessResponse(
    'Profile updated',
    _.pick(user, ['firstname','lastname','password', 'profilePicUrl','email' ]),
  ).send(res);
});
 
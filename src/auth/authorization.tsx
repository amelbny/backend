import express from 'express';
import { ProtectedRequest } from '../types/app-request.d';
import { AuthFailureError } from '../core/ApiError';
import RoleRepo from '../database/repository/RoleRepos';
import asyncHandler from '../helpers/asyncHandler';


const router = express.Router();

export default router.use(
  asyncHandler(async (req: ProtectedRequest, res, next) => {
    if (!req.user || !req.user.roles || !req.currentRoleCode)
      throw new AuthFailureError('Permission denied');
    
    const role = await RoleRepo.findByCode(req.currentRoleCode);
    if (!role) throw new AuthFailureError('Permission denied');
    
    const validRoles = req.user.roles.filter(
      (userRole) => userRole._id.toHexString() === role._id.toHexString(),
    );
    
    if (!validRoles || validRoles.length == 0) throw new AuthFailureError('Permission denied');

    return next();
  }),
);
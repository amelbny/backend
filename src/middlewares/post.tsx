import { DataRequest, ProtectedDataRequest } from '../types/app-request.d';
import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { ForbiddenResponse } from '../core/ApiResponse';
import { NotFoundError } from '../core/ApiError';
import PostRepos from '../database/repository/PostRepos';
import asyncHandler from '../helpers/asyncHandler';

export const checkPost = asyncHandler(async (req: DataRequest, res: Response, next) => {
  const isPostExist = await PostRepos.findById(new Types.ObjectId(req.params.id));
  if (!isPostExist) {
    return next(new NotFoundError('Post not found'));
  }
  req.post = isPostExist;
  console.log('postexiste',req.post)
  next();
});


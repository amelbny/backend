import User, { UserModel } from '../model/User';
import Role, { RoleModel } from '../model/Role';
import { InternalError } from '../../core/ApiError';
import { Types } from 'mongoose';
import KeystoreRepo from './KeystoreRepo';
import Keystore from '../model/KeyStore';
import { PaginationModel } from 'mongoose-paginate-ts';
import APIFeatures from '../../helpers/apiFeatures';
import { ApiOptions } from 'app-request.d';
import { PagingObj } from 'pagination';

export default class UserRepo {
  // contains critical information of the user
  public static findById(id: Types.ObjectId): Promise<User | null> {
    return UserModel.findOne({ _id: id })
      .select('+email +password +roles')
      .populate({
        path: 'roles',
        
      })
      .lean<User>()
      .exec();
  }

  public static findByEmail(email: string): Promise<User | null> {
    return UserModel.findOne({ email: email})
      .select('+email +password +roles')
      .populate({
        path: 'roles',
        select: { code: 1 },
      })
      .lean<User>()
      .exec();
  }

  public static findProfileById(id: Types.ObjectId): Promise<User | null> {
    return UserModel.findOne({ _id: id })
      .select('+name +lastname +email +roles')
      .populate({
        path: 'roles',
        select: { code: 1 },
      })
      .lean<User>()
      .exec();
  }

  public static findByObj(obj: object): Promise<User | null> {
    return UserModel.findOne(obj)
      .select('+roles +email')
      .populate({
        path: 'roles',
        select: { code: 1 },
      })
      .lean<User>()
      .exec();
  }

  public static async findAll(
    paging: PagingObj,
    query: object,
    apiOptions: ApiOptions,
  ): Promise<PaginationModel<User>> {
    let findAllQuery = apiOptions.deleted
      ? UserModel.find({ deletedAt: { $ne: null } })
      : UserModel.find({ deletedAt: null });
    const features = new APIFeatures(findAllQuery, query)
      .filter()
      .sort()
      .limitFields()
      .search(['name', 'email']);

    const options = {
      query: features.query,
      limit: paging.limit ? paging.limit : null,
      page: paging.page ? paging.page : null,
    };

    return (await UserModel.paginate(options)) as PaginationModel<User>;
  }

  public static async create(
    user: User,
    roleCode: string,
  ): Promise<{ user: User;  }> {
    const now = new Date();

    const role = await RoleModel.findOne({ code: roleCode }).lean<Role>().exec();
    if (!role) throw new InternalError('Role must be defined');

    user.roles = [role._id];
    user.createdAt = user.updatedAt = now;
    const createdUser = await UserModel.create(user);
    
    return { user: createdUser.toObject() };
  }

  public static async update(
    user: User,
    accessTokenKey: string,
    refreshTokenKey: string,
  ): Promise<{ user: User; keystore: Keystore }> {
    user.updatedAt = new Date();
    await UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
      .lean()
      .exec();
    const keystore = await KeystoreRepo.create(user._id, accessTokenKey, refreshTokenKey);
    return { user: user, keystore: keystore };
  }

  public static updateInfo(user: User): Promise<any> {
    user.updatedAt = new Date();
    return UserModel.updateOne({ _id: user._id }, { $set: { ...user } })
      .lean()
      .exec();
  }
  /*public static async findByIdAndUpdate(user: User): Promise<any> {
    return UserModel.findByIdAndUpdate(user._id,{ $set:{ password: hashedPassword }}).exec();
  }*/
  public static async findByIdAndUpdate(id: string, hashedPassword: string): Promise<any> {
    return UserModel.findByIdAndUpdate(id, { $set:{ password: hashedPassword }}).exec();
  }
  

  public static async deleteUser(user: User): Promise<any> {
    user.updatedAt = new Date();
    let email = user.email as string;
    let regex = '^old[0-9]+' + email;
    const deletedUsers = await UserModel.count({ email: { $regex: regex } });
    return UserModel.findByIdAndUpdate(
      user._id,
      { $set: { email: `old${deletedUsers}${email}`, deletedAt: Date.now() } },
      { new: true },
    ).exec();
  }
}






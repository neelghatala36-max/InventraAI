/* eslint-disable no-unsafe-finally */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Seller from './seller.model';

class SellerServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new seller
   */
  async create(payload: any, userId: string) {
    payload.user = userId;
    return this.model.create(payload);
  }

  /**
   *  Get all sellers
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    const search = query.search ? query.search : '';

    const data = await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { contactNo: { $regex: search, $options: 'i' } }
          ]
        }
      },
      ...sortAndPaginatePipeline(query)
    ]);

    const totalCount = await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    return { data, totalCount };
  }

  // get single seller
  async read(id: string, userId: string) {
    await this._isExists(id);
    return this.model.findOne({ user: new Types.ObjectId(userId), _id: id });
  }
}

const sellerServices = new SellerServices(Seller, 'seller');
export default sellerServices;

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
   * Create new sale and decrease product stock
   */
  async create(payload: any, userId: string) {
    if (mongoose.connection.readyState !== 1) {
      return {
        _id: 'sell_mock_' + Date.now(),
        ...payload,
        user: userId
      };
    }
    payload.user = userId;
    return this.model.create(payload);
  }

  /**
   *  Get all sale
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    if (mongoose.connection.readyState !== 1) {
      const mockSellers = [
        { _id: 'sell_1', name: 'Apex Suppliers', email: 'apex@suppliers.com', contactNo: '+1-555-1234' },
        { _id: 'sell_2', name: 'Mega Store', email: 'mega@store.com', contactNo: '+1-555-5678' }
      ];
      return { data: mockSellers, totalCount: [{ total: mockSellers.length }] };
    }
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

  // get single sale
  async read(id: string, userId: string) {
    await this._isExists(id);
    return this.model.findOne({ user: new Types.ObjectId(userId), _id: id });
  }
}

const sellerServices = new SellerServices(Seller, 'seller');
export default sellerServices;

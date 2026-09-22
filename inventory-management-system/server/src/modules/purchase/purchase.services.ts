/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import BaseServices from '../baseServices';
import { IPurchase } from './purchase.interface';
import Purchase from './purchase.model';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';

class PurchaseServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new sale and decrease product stock
   */
  async create(payload: IPurchase, userId: string) {
    const { unitPrice, quantity } = payload;
    payload.user = new Types.ObjectId(userId);
    payload.totalPrice = unitPrice * quantity;

    if (mongoose.connection.readyState !== 1) {
      return {
        _id: 'pur_mock_' + Date.now(),
        ...payload
      };
    }

    return this.model.create(payload);
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string, query: Record<string, unknown>) {
    if (mongoose.connection.readyState !== 1) {
      const mockPurchases = [
        {
          _id: 'pur_mock_1',
          sellerName: 'Apex Suppliers',
          productName: 'Premium Laptop',
          quantity: 50,
          unitPrice: 65000,
          totalPrice: 3250000,
          createdAt: new Date()
        }
      ];
      return { data: mockPurchases, totalCount: mockPurchases.length };
    }
    const search = query.search ? query.search : '';

    const data = await this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          $or: [{ sellerName: { $regex: search, $options: 'i' } }, { productName: { $regex: search, $options: 'i' } }]
        }
      },
      ...sortAndPaginatePipeline(query)
    ]);

    const totalCount = await this.model.find({ user: userId }).countDocuments();

    return { data, totalCount };
  }
}

const purchaseServices = new PurchaseServices(Purchase, 'Purchase');
export default purchaseServices;

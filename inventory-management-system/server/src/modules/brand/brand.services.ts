/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import BaseServices from '../baseServices';
import Brand from './brand.model';

class BrandServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string) {
    if (mongoose.connection.readyState !== 1) {
      return [
        { _id: 'brand_1', name: 'Dell', user: userId },
        { _id: 'brand_2', name: 'Sony', user: userId },
        { _id: 'brand_3', name: 'Belkin', user: userId },
        { _id: 'brand_4', name: 'JBL', user: userId },
      ];
    }
    return this.model.find({ user: userId });
  }
}

const brandServices = new BrandServices(Brand, 'Brand');
export default brandServices;

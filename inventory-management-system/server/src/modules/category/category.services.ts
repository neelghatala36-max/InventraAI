/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import BaseServices from '../baseServices';
import Category from './category.model';

class CategoryServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Read all category of user
   */
  async getAll(userId: string) {
    if (mongoose.connection.readyState !== 1) {
      return [
        { _id: 'cat_1', name: 'Electronics', user: userId },
        { _id: 'cat_2', name: 'Accessories', user: userId },
      ];
    }
    return this.model.find({ user: userId });
  }
}

const categoryServices = new CategoryServices(Category, 'Category');
export default categoryServices;

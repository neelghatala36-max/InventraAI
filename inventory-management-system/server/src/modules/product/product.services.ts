/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import httpStatus from 'http-status';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Product from './product.model';
import matchStagePipeline from './product.aggregation.pipeline';
import CustomError from '../../errors/customError';
import Purchase from '../purchase/purchase.model';
import Seller from '../seller/seller.model';
import Brand from '../brand/brand.model';
import Category from '../category/category.model';
import { IProduct } from './product.interface';

class ProductServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new product
   */
  async create(payload: IProduct, userId: string) {
    type str = keyof IProduct;
    (Object.keys(payload) as str[]).forEach((key: str) => {
      if (payload[key] === '') {
        delete payload[key];
      }
    });

    payload.user = new Types.ObjectId(userId);

    try {
      const seller = await Seller.findById(payload.seller);
      const product = await this.model.create(payload);

      await Purchase.create({
        user: userId,
        seller: product.seller,
        product: product._id,
        sellerName: seller?.name,
        productName: product.name,
        quantity: product.stock,
        unitPrice: product.price,
        totalPrice: product.stock * product.price
      });

      return product;
    } catch (error) {
      console.error('--- Operation Failed ---');
      console.error('Payload:', JSON.stringify(payload, null, 2));
      console.error('Error Details:', error);
      throw new CustomError(400, `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count Total Product
   */
  async countTotalProduct(userId: string) {
    return this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$stock' }
        }
      },
      {
        $project: {
          totalQuantity: 1,
          _id: 0
        }
      }
    ]);
  }

  /**
   * Get All product of user
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    let data = await this.model.aggregate([...matchStagePipeline(query, userId), ...sortAndPaginatePipeline(query)]);

    const totalCount = await this.model.aggregate([
      ...matchStagePipeline(query, userId),
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

    data = await this.model.populate(data, { path: 'category', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'brand', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'seller', select: '-__v -user -createdAt -updatedAt' });

    return { data, totalCount };
  }

  /**
   * Smart flexible search by skuId, name, brand, or category
   */
  async readBySku(searchTerm: string, userId: string) {
    const term = (searchTerm || '').trim();
    if (!term) {
      throw new CustomError(httpStatus.BAD_REQUEST, 'Search term cannot be empty');
    }

    const regex = new RegExp(term, 'i');

    // Find brand IDs and category IDs matching the regex
    const matchingBrands = await Brand.find({ name: regex }).select('_id');
    const matchingCategories = await Category.find({ name: regex }).select('_id');

    const filter: any = {
      user: new Types.ObjectId(userId),
      $or: [
        { skuId: regex },
        { name: regex },
        { description: regex },
        ...(matchingBrands.length > 0 ? [{ brand: { $in: matchingBrands.map((b) => b._id) } }] : []),
        ...(matchingCategories.length > 0 ? [{ category: { $in: matchingCategories.map((c) => c._id) } }] : [])
      ]
    };

    const products = await this.model
      .find(filter)
      .populate('category', '-__v -user')
      .populate('brand', '-__v -user')
      .populate('seller', '-__v -user -createdAt -updatedAt');

    if (!products || products.length === 0) {
      throw new CustomError(httpStatus.NOT_FOUND, 'Product not found!');
    }

    const primary = products[0].toObject();
    (primary as any).allMatches = products;
    (primary as any).matchCount = products.length;

    return primary;
  }

  /**
   * Get Single product of user
   */
  async read(id: string, userId: string) {
    await this._isExists(id);
    return this.model.findOne({ user: new Types.ObjectId(userId), _id: id });
  }

  /**
   * Multiple delete
   */
  async bulkDelete(payload: string[]) {
    const data = payload.map((item) => new Types.ObjectId(item));

    return this.model.deleteMany({ _id: { $in: data } });
  }

  /**
   * Create new product / add stock
   */
  async addToStock(id: string, payload: Pick<IProduct, 'seller' | 'stock'>, userId: string) {
    try {
      const seller = await Seller.findById(payload.seller);
      const product = await this.model.findByIdAndUpdate(id, { $inc: { stock: payload.stock } });

      await Purchase.create({
        user: userId,
        seller: product.seller,
        product: product._id,
        sellerName: seller?.name,
        productName: product.name,
        quantity: Number(product.stock),
        unitPrice: Number(product.price),
        totalPrice: Number(product.stock) * Number(product.price)
      });

      return product;
    } catch (error) {
      console.error('--- Operation Failed ---');
      console.error('Payload:', JSON.stringify(payload, null, 2));
      console.error('Error Details:', error);
      throw new CustomError(400, `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const productServices = new ProductServices(Product, 'Product');
export default productServices;

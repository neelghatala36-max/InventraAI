import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag, Card, Typography, Space } from 'antd';
import { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import {
  useAddStockMutation,
  useDeleteProductMutation,
  useGetAllProductsQuery,
  useUpdateProductMutation,
} from '../../redux/features/management/productApi';
import { ICategory, IProduct } from '../../types/product.types';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';
import CustomInput from '../../components/CustomInput';
import toastMessage from '../../lib/toastMessage';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../../redux/features/management/sellerApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';
import { formatINR } from '../../utils/currency';
import { SpinnerIcon, User } from '@phosphor-icons/react';

const { Title, Text } = Typography;

const ProductManagePage = () => {
  const [query, setQuery] = useState({
    name: '',
    category: '',
    brand: '',
    page: 1,
    limit: 10,
  });

  const { data: products, isFetching } = useGetAllProductsQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const tableData = products?.data?.map((product: IProduct) => ({
    key: product._id,
    name: product.name,
    category: product.category,
    categoryName: product.category.name,
    price: product.price,
    stock: product.stock,
    seller: product?.seller,
    sellerName: product?.seller?.name || 'DELETED SELLER',
    brand: product.brand,
    size: product.size,
    description: product.description,
  }));

  const columns: TableColumnsType<any> = [
    {
      title: 'Product Details',
      key: 'name',
      render: (record) => (
        <Space direction='vertical' size={0}>
          <Text strong style={{ fontSize: '1rem' }}>{record.name}</Text>
          <Text type='secondary' style={{ fontSize: '0.8rem' }}>{record.categoryName}</Text>
        </Space>
      )
    },
    {
      title: 'Price',
      key: 'price',
      dataIndex: 'price',
      align: 'center',
      render: (price) => <Text strong style={{ color: '#2563EB' }}>{formatINR(price)}</Text>
    },
    {
      title: 'Stock Status',
      key: 'stock',
      dataIndex: 'stock',
      align: 'center',
      render: (stock) => {
        const color = stock > 20 ? 'green' : stock > 0 ? 'orange' : 'red';
        return <Tag color={color} style={{ borderRadius: '4px', fontWeight: 600 }}>{stock} in stock</Tag>
      }
    },
    {
      title: 'Supplier',
      key: 'sellerName',
      dataIndex: 'sellerName',
      align: 'center',
      render: (sellerName: string) => {
        if (sellerName === 'DELETED SELLER') return <Tag color='red'>{sellerName}</Tag>;
        return <Space><User size={14} /><Text>{sellerName}</Text></Space>;
      },
    },
    {
      title: 'Actions',
      key: 'x',
      align: 'right',
      render: (item) => {
        return (
          <Space>
            <SellProductModal product={item} />
            <AddStockModal product={item} />
            <UpdateProductModal product={item} />
            <DeleteProductModal id={item.key} />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Flex justify='space-between' align='center' style={{ marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Inventory Management</Title>
          <Text type='secondary'>Monitor and manage your product stock levels and sales.</Text>
        </div>
      </Flex>

      <ProductManagementFilter query={query} setQuery={setQuery} />

      <Card 
        style={{ borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          loading={isFetching}
          columns={columns}
          dataSource={tableData}
          pagination={false}
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        />
        <Flex justify='flex-end' style={{ padding: '1.5rem' }}>
          <Pagination
            current={query.page}
            onChange={onChange}
            defaultPageSize={query.limit}
            total={products?.meta?.total}
            showSizeChanger={false}
          />
        </Flex>
      </Card>
    </div>
  );
};

/**
 * Sell Product Modal
 */
/**
 * Print Invoice Utility
 */
const printInvoice = (saleData: any, productData: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Invoice - ${saleData._id}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .invoice-title { font-size: 28px; font-weight: 800; text-align: right; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .details div { width: 45%; }
          .details h3 { font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; font-weight: 600; }
          td { border-bottom: 1px solid #f1f5f9; padding: 12px; }
          .totals { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">InventraAI</div>
            <p>Smart Inventory Management</p>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <p>Invoice ID: ${saleData._id}</p>
            <p>Date: ${new Date(saleData.date).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="details">
          <div>
            <h3>Billed To:</h3>
            <p><strong>${saleData.buyerName}</strong></p>
          </div>
          <div>
            <h3>Billed By:</h3>
            <p><strong>InventraAI IMS Team</strong></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product / Description</th>
              <th style="text-align: center;">Price/Unit</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${productData.name}</td>
              <td style="text-align: center;">₹${productData.price.toLocaleString()}</td>
              <td style="text-align: center;">${saleData.quantity}</td>
              <td style="text-align: right;">₹${(saleData.quantity * productData.price).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          Total Amount: ₹${(saleData.quantity * productData.price).toLocaleString()}
        </div>

        <div class="footer">
          Thank you for your business! If you have any questions, please contact support@example.com.
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Sell Product Modal
 */
const SellProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoice, setInvoice] = useState<any | null>(null);
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();
  const [saleProduct, { isLoading }] = useCreateSaleMutation();

  const onSubmit = async (data: FieldValues) => {
    const payload = {
      product: product.key,
      productName: product.name,
      productPrice: product.price,
      quantity: Number(data.quantity),
      buyerName: data.buyerName,
      date: data.date,
    };
    try {
      const res = await saleProduct(payload).unwrap();
      if (res.statusCode === 201 || res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message || 'Sale created successfully!' });
        setInvoice({
          _id: res.data?._id || 'sale_mock_' + Date.now(),
          buyerName: data.buyerName,
          quantity: Number(data.quantity),
          date: data.date,
        });
        reset();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error?.data?.message || 'Sale failed' });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setInvoice(null);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'royalblue' }}
      >
        Sell
      </Button>
      <Modal title={invoice ? 'Invoice Details' : 'Sell Product'} open={isModalOpen} onCancel={handleCancel} footer={null} width={invoice ? 600 : 520}>
        {invoice ? (
          <div style={{ padding: '0.5rem' }}>
            <div id="printable-invoice" style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '8px', background: '#fff', color: '#1e293b' }}>
              <Flex justify="space-between" align="center" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#2563eb' }}>InventraAI</Title>
                  <Text type="secondary" style={{ fontSize: '0.8rem' }}>Smart Inventory Management</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Title level={4} style={{ margin: 0 }}>INVOICE</Title>
                  <Text type="secondary" style={{ fontSize: '0.8rem' }}>ID: {invoice._id}</Text>
                </div>
              </Flex>
              <Row gutter={24} style={{ marginBottom: '1.5rem' }}>
                <Col span={12}>
                  <Text type="secondary">Billed To:</Text><br />
                  <Text strong>{invoice.buyerName}</Text>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Text type="secondary">Date:</Text><br />
                  <Text strong>{new Date(invoice.date).toLocaleDateString()}</Text>
                </Col>
              </Row>
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Row>
                  <Col span={12}>Item Description</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>Price</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>Qty</Col>
                  <Col span={4} style={{ textAlign: 'right' }}>Total</Col>
                </Row>
              </div>
              <div style={{ paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <Row>
                  <Col span={12}>{product.name}</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>{formatINR(product.price)}</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>{invoice.quantity}</Col>
                  <Col span={4} style={{ textAlign: 'right' }}>{formatINR(invoice.quantity * product.price)}</Col>
                </Row>
              </div>
              <Flex justify="flex-end" align="center">
                <Space>
                  <Text strong style={{ fontSize: '1.1rem' }}>Total Amount:</Text>
                  <Text strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{formatINR(invoice.quantity * product.price)}</Text>
                </Space>
              </Flex>
            </div>
            <Flex justify="center" gap="small" style={{ marginTop: '1.5rem' }}>
              <Button type="primary" onClick={() => printInvoice(invoice, product)}>Print / Save PDF</Button>
              <Button onClick={handleCancel}>Close</Button>
            </Flex>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
            <CustomInput
              name='buyerName'
              label='Buyer Name'
              errors={errors}
              required={true}
              register={register}
              type='text'
            />
            <CustomInput
              name='date'
              label='Selling date'
              errors={errors}
              required={true}
              register={register}
              type='date'
            />
            <CustomInput
              name='quantity'
              label='Quantity'
              errors={errors}
              required={true}
              register={register}
              type='number'
            />
            <Flex justify='center' style={{ marginTop: '1rem' }}>
              <Button htmlType='submit' type='primary' disabled={isLoading}>
                {isLoading && <SpinnerIcon className='spin' weight='bold' />}
                Sell Product
              </Button>
            </Flex>
          </form>
        )}
      </Modal>
    </>
  );
};

/**
 * Add Stock Modal
 */
const AddStockModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm();
  const [addToStock, { isLoading }] = useAddStockMutation();

  const onSubmit = async (data: FieldValues) => {
    const payload = {
      stock: Number(data.stock),
      seller: product.seller,
    };

    try {
      const res = await addToStock({ id: product.key, payload }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'blue' }}
      >
        Add Stock
      </Button>
      <Modal title='Add Product to Stock' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ margin: '2rem' }}>
          <CustomInput name='stock' label='Add Stock' register={register} type='number' />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading}>
              {isLoading && <SpinnerIcon className='spin' weight='bold' />}
              Submit
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Update Product Modal
 */
const UpdateProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [updateProduct] = useUpdateProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers, isLoading: isSellerLoading } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: product.name,
      price: product.price,
      seller: product?.seller?._id,
      category: product.category._id,
      brand: product.brand?._id,
      description: product.description,
      size: product.size,
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await updateProduct({ id: product.key, payload: data }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'green' }}
      >
        <EditFilled />
      </Button>
      <Modal title='Update Product Info' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            name='name'
            errors={errors}
            label='Name'
            register={register}
            required={true}
          />
          <CustomInput
            errors={errors}
            label='Price'
            type='number'
            name='price'
            register={register}
            required={true}
          />
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Seller
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                disabled={isSellerLoading}
                {...register('seller', { required: true })}
                className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select Seller*</option>
                {sellers?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Category
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('category', { required: true })}
                className={`input-field ${errors['category'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select Category*</option>
                {categories?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Brand
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('brand')}
                className={`input-field ${errors['brand'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select brand</option>
                {brands?.data.map((item: ICategory) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <CustomInput label='Description' name='description' register={register} />

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Size
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select className={`input-field`} {...register('size')}>
                <option value=''>Select Product Size</option>
                <option value='SMALL'>Small</option>
                <option value='MEDIUM'>Medium</option>
                <option value='LARGE'>Large</option>
              </select>
            </Col>
          </Row>
          <Flex justify='center'>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              Update
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Delete Product Modal
 */
const DeleteProductModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct] = useDeleteProductMutation();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProduct(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'red' }}
      >
        <DeleteFilled />
      </Button>
      <Modal title='Delete Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this product?</h2>
          <h4>You won't be able to revert it.</h4>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}
          >
            <Button
              onClick={handleCancel}
              type='primary'
              style={{ backgroundColor: 'lightseagreen' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(id)}
              type='primary'
              style={{ backgroundColor: 'red' }}
            >
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductManagePage;

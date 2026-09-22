import { DeleteFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Card, Typography, Space, Tag } from 'antd';
import { useState } from 'react';
import SearchInput from '../../components/SearchInput';
import toastMessage from '../../lib/toastMessage';
import { useDeleteSaleMutation, useGetAllSaleQuery } from '../../redux/features/management/saleApi';
import { ITableSale } from '../../types/sale.type';
import formatDate from '../../utils/formatDate';
import { formatINR } from '../../utils/currency';
import { Calendar, User, PencilSimple } from '@phosphor-icons/react';

const { Title, Text } = Typography;

const SaleManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllSaleQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page: page }));
  };

  const tableData = data?.data?.map((sale: ITableSale) => ({
    key: sale._id,
    productName: sale.productName,
    productPrice: sale.productPrice,
    buyerName: sale.buyerName,
    quantity: sale.quantity,
    totalPrice: sale.totalPrice,
    date: formatDate(sale.date),
  }));

  const columns: TableColumnsType<any> = [
    {
      title: 'Product',
      key: 'productName',
      render: (record) => <Text strong>{record.productName}</Text>
    },
    {
      title: 'Price per Unit',
      key: 'productPrice',
      dataIndex: 'productPrice',
      align: 'center',
      render: (price) => <Text>{formatINR(price)}</Text>
    },
    {
      title: 'Buyer',
      key: 'buyerName',
      dataIndex: 'buyerName',
      align: 'center',
      render: (name) => <Space><User size={14} />{name}</Space>
    },
    {
      title: 'Quantity',
      key: 'quantity',
      dataIndex: 'quantity',
      align: 'center',
      render: (q) => <Tag color='blue' style={{ borderRadius: '4px' }}>{q}</Tag>
    },
    {
      title: 'Total',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'center',
      render: (price) => <Text strong>{formatINR(price)}</Text>
    },
    {
      title: 'Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
      render: (date) => <Space><Calendar size={14} />{date}</Space>
    },
    {
      title: 'Action',
      key: 'x',
      align: 'right',
      render: (item) => {
        return (
          <Space>
            <Button type='text' icon={<PencilSimple size={18} />} size='small' />
            <DeleteModal id={item.key} />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Flex justify='space-between' align='center' style={{ marginBottom: '1.5rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Sales Management</Title>
          <Text type='secondary'>Review and manage your sales history.</Text>
        </div>
      </Flex>

      <div style={{ marginBottom: '1.5rem' }}>
        <SearchInput setQuery={setQuery} placeholder='Search by product or buyer...' />
      </div>

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
            total={data?.meta?.total}
            showSizeChanger={false}
          />
        </Flex>
      </Card>
    </div>
  );
};

/**
 * Delete Modal
 */
const DeleteModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteSale] = useDeleteSaleMutation();

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteSale(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
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

export default SaleManagementPage;

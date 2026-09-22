import { DeleteFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Card, Typography, Space } from 'antd';
import { useState } from 'react';
import {
  useDeleteSellerMutation,
  useGetAllSellerQuery,
} from '../../redux/features/management/sellerApi';
import { ISeller } from '../../types/product.types';
import toastMessage from '../../lib/toastMessage';
import SearchInput from '../../components/SearchInput';
import { User, Envelope, Phone, PencilSimple } from '@phosphor-icons/react';

const { Title, Text } = Typography;

const SellerManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllSellerQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page: page }));
  };

  const tableData = data?.data?.map((seller: ISeller) => ({
    key: seller._id,
    name: seller.name,
    email: seller.email,
    contactNo: seller.contactNo,
  }));

  const columns: TableColumnsType<any> = [
    {
      title: 'Seller',
      key: 'name',
      render: (record) => <Space><User size={18} color='#2563EB' /><Text strong>{record.name}</Text></Space>
    },
    {
      title: 'Email',
      key: 'email',
      dataIndex: 'email',
      align: 'center',
      render: (email) => <Space><Envelope size={16} color='#64748B' /><Text type='secondary'>{email}</Text></Space>
    },
    {
      title: 'Contact',
      key: 'contactNo',
      dataIndex: 'contactNo',
      align: 'center',
      render: (phone) => <Space><Phone size={16} color='#64748B' /><Text type='secondary'>{phone}</Text></Space>
    },
    {
      title: 'Actions',
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
          <Title level={2} style={{ margin: 0 }}>Sellers Management</Title>
          <Text type='secondary'>Manage your inventory suppliers and sellers.</Text>
        </div>
      </Flex>

      <div style={{ marginBottom: '1.5rem' }}>
        <SearchInput setQuery={setQuery} placeholder='Search by seller name...' />
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
  const [deleteSeller] = useDeleteSellerMutation();

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteSeller(id).unwrap();
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

export default SellerManagementPage;

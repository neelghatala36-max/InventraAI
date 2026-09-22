import { Col, Flex, Row, Slider, Typography, Select, Input } from 'antd';
import React from 'react';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { MagnifyingGlass } from '@phosphor-icons/react';

const { Text } = Typography;
const { Option } = Select;

export interface ProductFilterState {
  name: string;
  category: string;
  brand: string;
  limit: number;
  page: number;
}

interface ProductManagementFilterProps {
  query: ProductFilterState;
  setQuery: React.Dispatch<React.SetStateAction<ProductFilterState>>;
}

const ProductManagementFilter = ({ query, setQuery }: ProductManagementFilterProps) => {
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  return (
    <div
      className='query-filter'
      style={{
        borderRadius: '16px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <Flex align='center' gap='8px' style={{ marginBottom: '1.5rem' }}>
        <Text strong style={{ fontSize: '1rem' }}>Search & Filters</Text>
      </Flex>
      
      <Row gutter={[24, 24]} align='bottom'>
        <Col xs={24} md={8}>
          <Text className='label' style={{ fontWeight: 600 }}>Product Name</Text>
          <Input
            size='large'
            prefix={<MagnifyingGlass size={18} color='#94A3B8' />}
            placeholder='Search by name...'
            value={query.name}
            onChange={(e) => setQuery((prev) => ({ ...prev, name: e.target.value }))}
            style={{ borderRadius: '8px' }}
          />
        </Col>
        
        <Col xs={24} md={6}>
          <Text className='label' style={{ fontWeight: 600 }}>Category</Text>
          <Select
            size='large'
            style={{ width: '100%' }}
            placeholder='All Categories'
            value={query.category || undefined}
            onChange={(value) => setQuery((prev) => ({ ...prev, category: value || '' }))}
            allowClear
          >
            {categories?.data?.map((category: { _id: string; name: string }) => (
              <Option value={category._id} key={category._id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={6}>
          <Text className='label' style={{ fontWeight: 600 }}>Brand</Text>
          <Select
            size='large'
            style={{ width: '100%' }}
            placeholder='All Brands'
            value={query.brand || undefined}
            onChange={(value) => setQuery((prev) => ({ ...prev, brand: value || '' }))}
            allowClear
          >
            {brands?.data?.map((brand: { _id: string; name: string }) => (
              <Option value={brand._id} key={brand._id}>
                {brand.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} md={4}>
          <Text className='label' style={{ fontWeight: 600 }}>Price Range</Text>
          <Slider
            range
            step={100}
            max={20000}
            defaultValue={[0, 20000]}
            onChange={(value) => {
              setQuery((prev: any) => ({
                ...prev,
                minPrice: value[0],
                maxPrice: value[1],
              }));
            }}
            trackStyle={[{ backgroundColor: '#2563EB' }]}
            handleStyle={[
              { borderColor: '#2563EB', backgroundColor: '#fff' },
              { borderColor: '#2563EB', backgroundColor: '#fff' }
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ProductManagementFilter;

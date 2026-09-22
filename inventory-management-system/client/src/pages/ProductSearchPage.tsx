import React, { useState } from 'react';
import {
  Card,
  Typography,
  Spin,
  Descriptions,
  Input,
  Button,
  Flex,
  Tag,
  Row,
  Col,
  Badge,
  Space,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useGetProductBySkuQuery } from '../redux/features/management/productApi';
import { formatINR } from '../utils/currency';
import { useAppSelector } from '../redux/hooks';
import { selectCurrentTheme } from '../redux/services/themeSlice';
import { Package } from '@phosphor-icons/react';

const { Title, Text } = Typography;

const SUGGESTED_SEARCHES = [
  'Dell',
  'Logitech',
  'Monitor',
  'MON-HP27',
  'LAP-XPS15',
  'Sony',
  'Headset',
];

const ProductSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [triggered, setTriggered] = useState(false);

  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDark = currentTheme === 'dark';

  const { data, isLoading, isError } = useGetProductBySkuQuery(activeQuery, {
    skip: !triggered || !activeQuery,
  });

  const handleSearch = (termToSearch?: string) => {
    const term = (termToSearch !== undefined ? termToSearch : searchTerm).trim();
    if (term) {
      setActiveQuery(term);
      setSearchTerm(term);
      setTriggered(true);
    }
  };

  const productData = data?.data;
  const allMatches: any[] = productData?.allMatches || (productData ? [productData] : []);

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Title level={2} style={{ margin: 0 }}>
          🔍 Smart Product Search
        </Title>
        <Text type='secondary'>
          Instantly search products by Name, Brand, SKU Code, or Category.
        </Text>
      </div>

      {/* Search Input Box */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Flex gap='small' style={{ maxWidth: '600px' }}>
          <Input
            size='large'
            placeholder="Search by Name, Brand, or SKU (e.g. 'Dell', 'Mouse', 'MON-HP27')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={() => handleSearch()}
            prefix={<SearchOutlined style={{ color: '#6366F1' }} />}
            allowClear
            style={{
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
          <Button
            size='large'
            type='primary'
            onClick={() => handleSearch()}
            style={{
              borderRadius: '12px',
              fontWeight: 600,
              padding: '0 24px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              border: 'none',
            }}
          >
            Search
          </Button>
        </Flex>
      </div>

      {/* Quick Search Tags */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Text type='secondary' style={{ fontSize: '13px', fontWeight: 500 }}>
          Quick Searches:
        </Text>
        {SUGGESTED_SEARCHES.map((tag) => (
          <Tag
            key={tag}
            color='blue'
            style={{
              cursor: 'pointer',
              borderRadius: '12px',
              padding: '3px 10px',
              fontWeight: 500,
              fontSize: '12px',
            }}
            onClick={() => handleSearch(tag)}
          >
            {tag}
          </Tag>
        ))}
      </div>

      {/* Search Results Area */}
      {!triggered ? (
        <Card
          style={{
            borderRadius: '16px',
            border: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9',
            textAlign: 'center',
            padding: '3rem 1rem',
          }}
        >
          <Package size={48} color='#94A3B8' weight='duotone' style={{ marginBottom: '12px' }} />
          <Title level={4} style={{ color: isDark ? '#F1F5F9' : '#334155', margin: 0 }}>
            Enter a product name, brand, or SKU to begin search
          </Title>
          <Text type='secondary'>
            Try searching for "Dell", "HP", "Logitech", "Sony", or an exact SKU like "MON-HP27"
          </Text>
        </Card>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Spin size='large' />
          <div style={{ marginTop: '16px', color: '#6366F1', fontWeight: 600 }}>
            Searching inventory catalog...
          </div>
        </div>
      ) : isError || allMatches.length === 0 ? (
        <Card
          style={{
            borderRadius: '16px',
            border: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9',
            textAlign: 'center',
            padding: '3rem 1rem',
          }}
        >
          <Title level={4} style={{ color: '#EF4444', margin: '0 0 8px 0' }}>
            No products found matching "{activeQuery}"
          </Title>
          <Text type='secondary'>
            Check your spelling or try searching by Brand (e.g. Dell, Logitech) or SKU Code.
          </Text>
        </Card>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '15px' }}>
              Found {allMatches.length} matching product{allMatches.length > 1 ? 's' : ''} for "{activeQuery}":
            </Text>
          </div>

          <Row gutter={[20, 20]}>
            {allMatches.map((item: any) => (
              <Col xs={24} sm={12} lg={allMatches.length === 1 ? 24 : 12} key={item._id || item.skuId}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '16px',
                    border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
                    boxShadow: isDark
                      ? '0 4px 20px rgba(0,0,0,0.4)'
                      : '0 4px 15px rgba(0,0,0,0.04)',
                  }}
                >
                  <Flex justify='space-between' align='flex-start' style={{ marginBottom: '12px' }}>
                    <div>
                      <Title level={4} style={{ margin: '0 0 4px 0' }}>
                        {item.name}
                      </Title>
                      <Space size='small'>
                        <Tag color='geekblue' style={{ fontWeight: 600 }}>
                          SKU: {item.skuId}
                        </Tag>
                        {item.brand?.name && (
                          <Tag color='purple' style={{ fontWeight: 600 }}>
                            {item.brand.name}
                          </Tag>
                        )}
                        {item.category?.name && (
                          <Tag color='cyan' style={{ fontWeight: 500 }}>
                            {item.category.name}
                          </Tag>
                        )}
                      </Space>
                    </div>
                    <Badge
                      count={`${item.stock} in stock`}
                      style={{
                        backgroundColor: item.stock < 10 ? '#EF4444' : item.stock < 20 ? '#F59E0B' : '#10B981',
                        fontWeight: 600,
                        fontSize: '12px',
                        padding: '0 8px',
                      }}
                    />
                  </Flex>

                  <Descriptions
                    bordered
                    size='small'
                    column={1}
                    style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden' }}
                  >
                    <Descriptions.Item label='Selling Price'>
                      <Text strong style={{ color: '#10B981', fontSize: '15px' }}>
                        {formatINR(item.price)}
                      </Text>
                    </Descriptions.Item>
                    {item.size && (
                      <Descriptions.Item label='Size / Variant'>{item.size}</Descriptions.Item>
                    )}
                    {item.seller?.name && (
                      <Descriptions.Item label='Supplier / Seller'>
                        {item.seller.name}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label='Description'>
                      {item.description || 'No description provided.'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default ProductSearchPage;

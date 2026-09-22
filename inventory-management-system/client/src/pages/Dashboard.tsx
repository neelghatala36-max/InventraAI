import { Col, Row, Card, Typography, Space, Tag, Flex, Spin, Table, Button } from 'antd';
import Loader from '../components/Loader';
import { useGetDashboardAnalyticsQuery, useLazyGetDemandPredictionQuery, useGetRestockRecommendationsQuery, useGetBusinessInsightsQuery } from '../redux/features/analytics/analyticsApi';
import DailyChart from '../components/Charts/DailyChart';
import { formatINR } from '../utils/currency';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Sparkle,
  WarningCircle,
  ChartPie,
  Buildings,
  Truck,
  Briefcase,
  TrendUp
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../redux/hooks';
import { selectCurrentTheme } from '../redux/services/themeSlice';
import { useAddStockMutation } from '../redux/features/management/productApi';
import toastMessage from '../lib/toastMessage';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { data: analyticsData, isLoading } = useGetDashboardAnalyticsQuery(undefined);
  const { data: restockData, isLoading: isRestockLoading } = useGetRestockRecommendationsQuery(undefined);
  const { data: insightsData, isLoading: isInsightsLoading } = useGetBusinessInsightsQuery(undefined);
  const [triggerPrediction, { data: predictionData, isLoading: isPredicting }] = useLazyGetDemandPredictionQuery();
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDark = currentTheme === 'dark';

  const [quickReorder, { isLoading: isReordering }] = useAddStockMutation();

  const handleQuickReorder = async (productId: string, sellerId: string) => {
    try {
      const res = await quickReorder({
        id: productId,
        payload: {
          stock: 50, // Default quick reorder quantity
          seller: sellerId || 'sell_1'
        }
      }).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: 'Reorder successful! Added 50 units to stock.' });
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error?.data?.message || 'Failed to reorder' });
    }
  };

  const { salesTrends, topProducts, inventoryStatus } = analyticsData?.data || { salesTrends: [], topProducts: [], inventoryStatus: { lowStock: [], totalValue: 0 } };
  const recommendations = restockData?.data || [];
  const { categoryTrends, customerSegments } = insightsData?.data || { categoryTrends: [], customerSegments: [] };

  useEffect(() => {
    if (topProducts && topProducts.length > 0 && !selectedSku) {
      setSelectedSku(topProducts[0]._id);
      triggerPrediction(topProducts[0]._id);
    }
  }, [topProducts, selectedSku, triggerPrediction]);

  const totalItemsSold = salesTrends.reduce((acc: number, cur: any) => acc + cur.totalSales, 0);
  const totalRevenue = salesTrends.reduce((acc: number, cur: any) => acc + cur.totalRevenue, 0);

  if (isLoading) return <Loader />;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Flex justify='space-between' align='center' style={{ marginBottom: '2rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
          <Text type='secondary'>Welcome back! Here's what's happening with your inventory today.</Text>
        </div>
        <Tag color='blue' icon={<Sparkle weight='fill' />} style={{ padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>
          Inventra AI Active
        </Tag>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <div className='number-card' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: isDark ? '#1E3A8A' : '#EFF6FF', padding: '12px', borderRadius: '12px' }}>
              <Package size={32} color={isDark ? '#3B82F6' : '#2563EB'} weight='duotone' />
            </div>
            <div>
              <h3>Inventory Value</h3>
              <h1>{formatINR(inventoryStatus.totalValue)}</h1>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className='number-card' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: isDark ? '#064E3B' : '#ECFDF5', padding: '12px', borderRadius: '12px' }}>
              <ShoppingCart size={32} color={isDark ? '#10B981' : '#10B981'} weight='duotone' />
            </div>
            <div>
              <h3>Total Items Sold</h3>
              <h1>{totalItemsSold.toLocaleString()}</h1>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <div className='number-card' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
            <div style={{ background: isDark ? '#78350F' : '#FFF7ED', padding: '12px', borderRadius: '12px' }}>
              <Buildings size={32} color={isDark ? '#F59E0B' : '#F59E0B'} weight='duotone' />
            </div>
            <div>
              <h3>Total Revenue</h3>
              <h1>{formatINR(totalRevenue)}</h1>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Space><ChartPie size={20} /><span>Sales & Revenue Trends</span></Space>}
            style={{ borderRadius: '16px', border: isDark ? '1px solid #334155' : '1px solid #F1F5F9' }}
          >
            <div style={{ height: '350px' }}>
              <DailyChart />
            </div>
          </Card>
          
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24} lg={12}>
              <Card title={<Space><Briefcase size={20}/><span>Category Performance</span></Space>} style={{ borderRadius: '16px', border: isDark ? '1px solid #334155' : '1px solid #F1F5F9' }}>
                 {isInsightsLoading ? <Spin/> : <Table dataSource={categoryTrends} rowKey="_id" pagination={false} columns={[{title: 'Category', dataIndex: '_id', key: '_id'}, {title: 'Revenue', dataIndex: 'totalRevenue', key: 'totalRevenue', render: (r) => formatINR(r)}]}/>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<Space><Buildings size={20}/><span>Top Customers</span></Space>} style={{ borderRadius: '16px', border: isDark ? '1px solid #334155' : '1px solid #F1F5F9' }}>
                 {isInsightsLoading ? <Spin/> : <Table dataSource={customerSegments} rowKey="_id" pagination={false} columns={[{title: 'Customer', dataIndex: '_id', key: '_id'}, {title: 'Spent', dataIndex: 'totalSpent', key: 'totalSpent', render: (r) => formatINR(r)}]}/>}
              </Card>
            </Col>
          </Row>

          <Card 
            title={<Space><Truck size={20} /><span>Restock Recommendations</span></Space>}
            style={{ borderRadius: '16px', border: isDark ? '1px solid #334155' : '1px solid #F1F5F9', marginTop: '24px' }}
          >
            {isRestockLoading ? <Spin /> : <Table dataSource={recommendations} rowKey="skuId" pagination={false} columns={[
                { title: 'SKU', dataIndex: 'skuId', key: 'skuId' },
                { title: 'Stock', dataIndex: 'currentStock', key: 'currentStock' },
                { title: 'Reorder', dataIndex: 'reorderQuantity', key: 'reorderQuantity', render: (q) => <Tag color='green'>{q} units</Tag> }
            ]}/>}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <div style={{ background: '#2563EB', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Sparkle size={16} color='#fff' weight='fill' />
                </div>
                <span>AI Insights</span>
              </Space>
            }
            style={{ 
              borderRadius: '16px', 
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
              background: isDark ? 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
              height: '100%'
            }}
          >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <Title level={5}>Demand Forecast</Title>
              {isPredicting ? <Spin /> : predictionData?.data ? (
                <div style={{ textAlign: 'left', marginTop: '10px', padding: '10px', background: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '8px', border: isDark ? '1px solid #334155' : 'none' }}>
                    <Text>Product: <Text strong>{predictionData.data.skuId}</Text></Text><br/>
                    <Text>Forecasted Demand: <Text strong style={{ fontSize: '1.2rem', color: isDark ? '#60A5FA' : '#2563EB' }}>{predictionData.data.prediction} units</Text></Text><br/>
                    <Text type='secondary'>({predictionData.data.period})</Text>
                </div>
              ) : <Text type='secondary'>Select a product to see prediction</Text>}

              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <Text strong>Low Stock Alerts</Text>
                  {inventoryStatus.lowStock.map((p: any) => (
                    <div key={p._id} style={{ background: isDark ? '#1E293B' : '#fff', padding: '12px', borderRadius: '10px', border: '1px dashed #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <Flex align='center' gap='12px'>
                          <WarningCircle size={20} color='#EF4444' />
                          <Text style={{ color: '#EF4444' }}>Low stock: {p.name} ({p.stock} left)</Text>
                        </Flex>
                        <Button 
                          size='small' 
                          type='primary' 
                          onClick={() => handleQuickReorder(p._id, p.seller)}
                          disabled={isReordering}
                          style={{ fontSize: '0.8rem', borderRadius: '4px' }}
                        >
                          Quick Reorder
                        </Button>
                    </div>
                  ))}
                  {inventoryStatus.lowStock.length === 0 && <Text type='secondary'>No low stock alerts.</Text>}
                </Space>
              </div>

              <div style={{ marginTop: '24px' }}>
                <Link to='/demand-forecast'>
                  <Button
                    type='primary'
                    block
                    icon={<TrendUp size={16} weight='bold' />}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      border: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    Open AI Forecast Hub →
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Flex,
  Spin,
  Modal,
  Tooltip,
  Alert,
  Badge,
} from 'antd';
import {
  useGetDemandForecastQuery,
  useLazyGetAiForecastDeepDiveQuery,
} from '../redux/features/analytics/analyticsApi';
import { useAddStockMutation } from '../redux/features/management/productApi';
import { formatINR } from '../utils/currency';
import toastMessage from '../lib/toastMessage';
import Loader from '../components/Loader';
import {
  TrendUp,
  WarningCircle,
  Package,
  CurrencyInr,
  Sparkle,
  Truck,
  ClockCountdown,
} from '@phosphor-icons/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAppSelector } from '../redux/hooks';
import { selectCurrentTheme } from '../redux/services/themeSlice';

const { Title, Text } = Typography;

export const DemandForecastPage: React.FC = () => {
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDark = currentTheme === 'dark';

  const { data: forecastResponse, isLoading, refetch } = useGetDemandForecastQuery(undefined);
  const [triggerDeepDive, { data: deepDiveData, isFetching: isDeepDiveLoading }] =
    useLazyGetAiForecastDeepDiveQuery();
  const [quickReorder, { isLoading: isReordering }] = useAddStockMutation();

  const [deepDiveModalVisible, setDeepDiveModalVisible] = useState(false);
  const [selectedProductForDive, setSelectedProductForDive] = useState<any>(null);

  const summary = forecastResponse?.data?.summary || {
    totalProducts: 0,
    criticalCount: 0,
    warningCount: 0,
    optimalCount: 0,
    totalForecastedDemand30d: 0,
    totalReorderUnits: 0,
    totalReorderCapitalNeeded: 0,
  };

  const forecasts = forecastResponse?.data?.forecasts || [];

  const handleQuickReorder = async (record: any) => {
    try {
      const qty = record.recommendedReorderQty > 0 ? record.recommendedReorderQty : 25;
      const res = await quickReorder({
        id: record.productId,
        payload: {
          stock: qty,
          seller: record.sellerId,
        },
      }).unwrap();

      if (res.statusCode === 200) {
        toastMessage({
          icon: 'success',
          text: `Reorder successful! Added ${qty} units to ${record.name}.`,
        });
        refetch();
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error?.data?.message || 'Failed to reorder' });
    }
  };

  const handleOpenDeepDive = (record: any) => {
    setSelectedProductForDive(record);
    setDeepDiveModalVisible(true);
    triggerDeepDive(record.productId);
  };

  if (isLoading) return <Loader />;

  // Prepare chart data (Top 7 urgent products)
  const chartData = forecasts.slice(0, 8).map((f: any) => ({
    name: f.name.length > 14 ? `${f.name.substring(0, 14)}...` : f.name,
    'Current Stock': f.currentStock,
    '30-Day Forecast': f.predictedDemand30d,
  }));

  const columns = [
    {
      title: 'Product & SKU',
      key: 'product',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>
            {record.name}
          </Text>
          <div style={{ marginTop: '2px', display: 'flex', gap: '6px' }}>
            <Tag color='geekblue' style={{ fontSize: '11px' }}>
              {record.skuId}
            </Tag>
            <Tag color='default' style={{ fontSize: '11px' }}>
              {record.brand}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      sorter: (a: any, b: any) => a.currentStock - b.currentStock,
      render: (stock: number, record: any) => {
        let badgeColor = 'green';
        if (record.riskLevel === 'CRITICAL') badgeColor = 'red';
        else if (record.riskLevel === 'WARNING') badgeColor = 'orange';

        return (
          <Badge
            count={`${stock} units`}
            style={{
              backgroundColor:
                badgeColor === 'red' ? '#EF4444' : badgeColor === 'orange' ? '#F59E0B' : '#10B981',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      title: 'Daily Velocity',
      dataIndex: 'dailySalesVelocity',
      key: 'dailySalesVelocity',
      sorter: (a: any, b: any) => a.dailySalesVelocity - b.dailySalesVelocity,
      render: (velocity: number) => (
        <Space>
          <TrendUp size={16} color='#6366F1' />
          <Text strong>{velocity} / day</Text>
        </Space>
      ),
    },
    {
      title: 'Stockout Countdown',
      key: 'countdown',
      sorter: (a: any, b: any) => a.daysUntilStockout - b.daysUntilStockout,
      render: (_: any, record: any) => {
        if (record.riskLevel === 'CRITICAL') {
          return (
            <Tooltip title={record.riskMessage}>
              <Tag
                color='error'
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                🔴 Runs out in {record.daysUntilStockout} days!
              </Tag>
            </Tooltip>
          );
        }
        if (record.riskLevel === 'WARNING') {
          return (
            <Tooltip title={record.riskMessage}>
              <Tag
                color='warning'
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                🟡 Runs out in {record.daysUntilStockout} days
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag
            color='success'
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 500,
              fontSize: '12px',
            }}
          >
            🟢 {record.daysUntilStockout} days buffer
          </Tag>
        );
      },
    },
    {
      title: '30-Day Demand',
      dataIndex: 'predictedDemand30d',
      key: 'predictedDemand30d',
      sorter: (a: any, b: any) => a.predictedDemand30d - b.predictedDemand30d,
      render: (demand: number) => <Text strong>{demand} units</Text>,
    },
    {
      title: 'Recommended Reorder',
      key: 'reorder',
      render: (_: any, record: any) =>
        record.recommendedReorderQty > 0 ? (
          <div>
            <Tag color='purple' style={{ fontWeight: 700 }}>
              +{record.recommendedReorderQty} units
            </Tag>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Est. {formatINR(record.estimatedReorderCost)}
            </div>
          </div>
        ) : (
          <Tag color='default'>Buffer Sufficient</Tag>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size='small'>
          <Button
            type='primary'
            size='small'
            icon={<Truck size={14} />}
            onClick={() => handleQuickReorder(record)}
            disabled={isReordering}
            style={{
              background: record.riskLevel === 'CRITICAL' ? '#EF4444' : undefined,
              borderColor: record.riskLevel === 'CRITICAL' ? '#EF4444' : undefined,
              fontWeight: 600,
            }}
          >
            {record.riskLevel === 'CRITICAL' ? 'Urgent Restock' : 'Restock'}
          </Button>
          <Button
            size='small'
            icon={<Sparkle size={14} color='#8B5CF6' weight='fill' />}
            onClick={() => handleOpenDeepDive(record)}
            style={{ fontWeight: 500 }}
          >
            AI Deep Dive
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingBottom: '2.5rem' }}>
      {/* Header */}
      <Flex justify='space-between' align='center' style={{ marginBottom: '1.75rem' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            📈 AI Demand Forecasting & Reorder Predictions
          </Title>
          <Text type='secondary'>
            Predictive machine learning models and Google Gemini 2.5 Flash forecasting upcoming demand velocity.
          </Text>
        </div>
        <Tag
          color='purple'
          icon={<Sparkle weight='fill' />}
          style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '12px' }}
        >
          Gemini 2.5 Flash Active ⚡
        </Tag>
      </Flex>

      {/* Critical Stockout Banner if any critical items */}
      {summary.criticalCount > 0 && (
        <Alert
          message={
            <Space>
              <strong>Immediate Attention Required:</strong>
              <span>
                {summary.criticalCount} product(s) will run out of stock in under 7 days! Immediate replenishment is advised to protect revenue.
              </span>
            </Space>
          }
          type='error'
          showIcon
          icon={<WarningCircle size={22} color='#EF4444' weight='fill' />}
          style={{ marginBottom: '1.5rem', borderRadius: '12px' }}
        />
      )}

      {/* 4 Top KPI Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: '1.75rem' }}>
        <Col xs={24} sm={12} lg={6}>
          <div
            className='number-card'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderLeft: '4px solid #EF4444',
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                padding: '12px',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            >
              <ClockCountdown size={28} color='#EF4444' weight='duotone' />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <Text type='secondary' style={{ fontSize: '13px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Critical Stockouts (&lt; 7 Days)
              </Text>
              <h1 style={{ color: '#EF4444', margin: '4px 0 0 0', fontSize: 'clamp(1.4rem, 1.6vw, 2rem)', lineHeight: 1.2 }}>{summary.criticalCount}</h1>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            className='number-card'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderLeft: '4px solid #F59E0B',
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                padding: '12px',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            >
              <WarningCircle size={28} color='#F59E0B' weight='duotone' />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <Text type='secondary' style={{ fontSize: '13px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Restock Warnings (7-14 Days)
              </Text>
              <h1 style={{ color: '#F59E0B', margin: '4px 0 0 0', fontSize: 'clamp(1.4rem, 1.6vw, 2rem)', lineHeight: 1.2 }}>{summary.warningCount}</h1>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            className='number-card'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderLeft: '4px solid #6366F1',
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
                padding: '12px',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            >
              <TrendUp size={28} color='#6366F1' weight='duotone' />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <Text type='secondary' style={{ fontSize: '13px', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                30-Day Forecast Demand
              </Text>
              <h1 style={{ margin: '4px 0 0 0', fontSize: 'clamp(1.2rem, 1.4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{summary.totalForecastedDemand30d} units</h1>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div
            className='number-card'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderLeft: '4px solid #10B981',
              minWidth: 0,
            }}
          >
            <div
              style={{
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                padding: '12px',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            >
              <CurrencyInr size={28} color='#10B981' weight='duotone' />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <Text
                type='secondary'
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title='Capital Needed to Restock'
              >
                Capital Needed to Restock
              </Text>
              <h1
                style={{
                  margin: '4px 0 0 0',
                  color: isDark ? '#34D399' : '#059669',
                  fontSize: 'clamp(1.1rem, 1.3vw, 1.55rem)',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
                title={formatINR(summary.totalReorderCapitalNeeded)}
              >
                {formatINR(summary.totalReorderCapitalNeeded)}
              </h1>
            </div>
          </div>
        </Col>
      </Row>

      {/* Visual Chart Section: Current Stock vs 30-Day Forecast Demand */}
      <Card
        title={
          <Space>
            <TrendUp size={20} color='#6366F1' />
            <span>Velocity Comparison: Current Warehouse Stock vs 30-Day Predicted Demand</span>
          </Space>
        }
        style={{
          borderRadius: '16px',
          marginBottom: '1.75rem',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        }}
      >
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray='3 3' stroke={isDark ? '#1E293B' : '#F1F5F9'} />
              <XAxis dataKey='name' stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={12} orientation="bottom" />
              <YAxis stroke={isDark ? '#94A3B8' : '#64748B'} fontSize={12} orientation="left" />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0B0F19' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '8px',
                  color: isDark ? '#f8fafc' : '#1e293b',
                }}
              />
              <Legend />
              <Bar dataKey='Current Stock' fill='#3B82F6' radius={[6, 6, 0, 0]} />
              <Bar dataKey='30-Day Forecast' fill='#8B5CF6' radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Smart Demand & Reorder Table */}
      <Card
        title={
          <Space>
            <Package size={20} />
            <span>Product Demand Velocity & Stockout Timelines</span>
          </Space>
        }
        style={{
          borderRadius: '16px',
          border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0',
        }}
      >
        <Table
          dataSource={forecasts}
          columns={columns}
          rowKey='productId'
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* AI Deep Dive Modal powered by Google Gemini 2.5 Flash */}
      <Modal
        title={
          <Space>
            <div
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              <Sparkle size={18} color='#fff' weight='fill' />
            </div>
            <span>
              Google Gemini 2.5 Flash — Strategic AI Forecast: {selectedProductForDive?.name}
            </span>
          </Space>
        }
        open={deepDiveModalVisible}
        onCancel={() => setDeepDiveModalVisible(false)}
        footer={[
          <Button key='close' onClick={() => setDeepDiveModalVisible(false)}>
            Close
          </Button>,
          <Button
            key='reorder'
            type='primary'
            icon={<Truck size={16} />}
            onClick={() => {
              setDeepDiveModalVisible(false);
              handleQuickReorder(selectedProductForDive);
            }}
          >
            Execute Restock (+{selectedProductForDive?.recommendedReorderQty} units)
          </Button>,
        ]}
        width={720}
      >
        {isDeepDiveLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size='large' />
            <div style={{ marginTop: '16px', color: '#8B5CF6', fontWeight: 600 }}>
              Google Gemini 2.5 Flash is analyzing sales velocity and generating supply chain recommendations...
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 0' }}>
            {/* Quick Metrics Strip */}
            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col span={6}>
                <Card size='small' style={{ textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <Text type='secondary' style={{ fontSize: '11px' }}>Current Stock</Text>
                  <Title level={4} style={{ margin: '4px 0 0 0' }}>
                    {selectedProductForDive?.currentStock}
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size='small' style={{ textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <Text type='secondary' style={{ fontSize: '11px' }}>Daily Velocity</Text>
                  <Title level={4} style={{ margin: '4px 0 0 0', color: '#6366F1' }}>
                    {selectedProductForDive?.dailySalesVelocity}/d
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size='small' style={{ textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <Text type='secondary' style={{ fontSize: '11px' }}>Stockout in</Text>
                  <Title
                    level={4}
                    style={{
                      margin: '4px 0 0 0',
                      color: selectedProductForDive?.riskLevel === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    {selectedProductForDive?.daysUntilStockout} days
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size='small' style={{ textAlign: 'center', background: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <Text type='secondary' style={{ fontSize: '11px' }}>30d Demand</Text>
                  <Title level={4} style={{ margin: '4px 0 0 0', color: '#10B981' }}>
                    {selectedProductForDive?.predictedDemand30d}
                  </Title>
                </Card>
              </Col>
            </Row>

            {/* AI Narrative */}
            <div
              style={{
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F8FAFC',
                padding: '20px',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                lineHeight: 1.6,
                maxHeight: '400px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}
            >
              {deepDiveData?.data?.aiReport || 'No report generated.'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DemandForecastPage;

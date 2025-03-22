import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, Space, Typography, Divider, message, Alert, Input, Row, Col } from 'antd';
import { CalculatorOutlined, ThunderboltOutlined, CarOutlined, ShopOutlined } from '@ant-design/icons';
import { calculateEmissions, getTransportationEmissions, getShippingEmissions, getFlightEmissions } from '../api/carbonInterface';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const EmissionCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transportationType, setTransportationType] = useState(null);

  // Green theme colors
  const primaryColor = '#52c41a';
  const secondaryColor = '#95de64';
  const tertiaryColor = '#f6ffed';

  // Common styles for input fields
  const fieldStyle = {
    width: '100%',
    height: '40px',
    borderRadius: '6px',
    border: '1px solid #d9d9d9',
    backgroundColor: 'white'
  };

  const selectStyle = {
    width: '100%',
    borderRadius: '6px',
  };

  // Watch transportation type changes
  useEffect(() => {
    const subscription = form.getFieldValue('transportationType');
    if (subscription) {
      setTransportationType(subscription);
    }
  }, [form]);

  const calculateTotalEmissions = async (values) => {
    let totalEmissions = 0;
    const calculations = [];
    setError(null);

    try {
      // Electricity emissions
      if (values.electricity) {
        const electricityData = await calculateEmissions({
          electricity: values.electricity,
          country: values.country || 'us'
        });
        totalEmissions += electricityData.data.attributes.carbon_mt * 1000; // Convert to kg
        calculations.push({
          type: 'Electricity',
          amount: values.electricity,
          unit: 'kWh',
          emissions: electricityData.data.attributes.carbon_mt * 1000
        });
      }

      // Transportation emissions
      if (values.transportationType && values.transportationDistance) {
        let transportData;
        if (values.transportationType === 'flight') {
          if (!values.departureAirport || !values.destinationAirport) {
            throw new Error('Please provide both departure and destination airports for flight calculations');
          }
          transportData = await getFlightEmissions({
            passengers: values.passengers || 1,
            legs: [{
              departure_airport: values.departureAirport,
              destination_airport: values.destinationAirport
            }]
          });
        } else {
          transportData = await getTransportationEmissions({
            transportationType: values.transportationType,
            transportationDistance: values.transportationDistance,
            vehicleModelId: values.vehicleModelId
          });
        }
        totalEmissions += transportData.data.attributes.carbon_mt * 1000;
        calculations.push({
          type: `Transportation (${values.transportationType})`,
          amount: values.transportationDistance,
          unit: 'km',
          emissions: transportData.data.attributes.carbon_mt * 1000
        });
      }

      // Shipping emissions
      if (values.shippingWeight && values.shippingDistance) {
        const shippingData = await getShippingEmissions({
          weight: values.shippingWeight,
          transportMethod: values.shippingMethod,
          distance: values.shippingDistance
        });
        totalEmissions += shippingData.data.attributes.carbon_mt * 1000;
        calculations.push({
          type: `Shipping (${values.shippingMethod})`,
          amount: values.shippingWeight,
          unit: 'kg',
          emissions: shippingData.data.attributes.carbon_mt * 1000
        });
      }

      setResult({
        total: totalEmissions,
        calculations
      });
    } catch (error) {
      console.error('Error calculating emissions:', error);
      setError(error.message || 'Failed to calculate emissions. Please check your internet connection and try again.');
      message.error(error.message || 'Failed to calculate emissions');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await calculateTotalEmissions(values);
    } finally {
      setLoading(false);
    }
  };

  const handleTransportationTypeChange = (value) => {
    setTransportationType(value);
    form.setFieldsValue({
      departureAirport: undefined,
      destinationAirport: undefined
    });
  };

  return (
    <div className="emission-calculator">
      <Card 
        className="calc-card"
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
          borderRadius: '12px',
          border: 'none',
          backgroundColor: tertiaryColor
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ color: '#135200', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              <CalculatorOutlined style={{ marginRight: 12, color: primaryColor }} /> 
              Emission Calculator
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#666' }}>
              Calculate your carbon emissions using real-time data from different sources.
            </Paragraph>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ borderRadius: '8px' }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              electricity: 0,
              country: 'us',
              transportationDistance: 0,
              passengers: 1,
              shippingWeight: 0,
              shippingDistance: 0
            }}
            className="green-theme-form"
          >
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ThunderboltOutlined style={{ color: primaryColor, marginRight: 8 }} />
                  <span style={{ color: '#135200' }}>Electricity</span>
                </div>
              }
              style={{ 
                marginBottom: 24, 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}
              headStyle={{ backgroundColor: '#f6ffed', borderBottom: '1px solid #b7eb8f' }}
              bodyStyle={{ padding: '24px', backgroundColor: 'white' }}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Electricity Consumption (kWh)</span>}
                    name="electricity"
                    rules={[{ required: true, message: 'Please input electricity consumption' }]}
                  >
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      placeholder="Enter electricity consumption"
                      controls={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Country</span>}
                    name="country"
                    rules={[{ required: true, message: 'Please select country' }]}
                  >
                    <Select 
                      placeholder="Select country"
                      style={selectStyle}
                      dropdownStyle={{ 
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                      listHeight={250}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      dropdownMatchSelectWidth={false}
                      optionLabelProp="label"
                      showAction={['click']}
                      onClick={e => e.stopPropagation()}
                    >
                      <Option value="us" label="United States">United States</Option>
                      <Option value="gb" label="United Kingdom">United Kingdom</Option>
                      <Option value="ca" label="Canada">Canada</Option>
                      <Option value="au" label="Australia">Australia</Option>
                      <Option value="de" label="Germany">Germany</Option>
                      <Option value="fr" label="France">France</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CarOutlined style={{ color: primaryColor, marginRight: 8 }} />
                  <span style={{ color: '#135200' }}>Transportation</span>
                </div>
              }
              style={{ 
                marginBottom: 24, 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}
              headStyle={{ backgroundColor: '#f6ffed', borderBottom: '1px solid #b7eb8f' }}
              bodyStyle={{ padding: '24px', backgroundColor: 'white' }}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Transportation Type</span>}
                    name="transportationType"
                    rules={[{ required: true, message: 'Please select transportation type' }]}
                  >
                    <Select 
                      placeholder="Select transportation type"
                      onChange={handleTransportationTypeChange}
                      style={selectStyle}
                      dropdownStyle={{ 
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                      listHeight={200}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      dropdownMatchSelectWidth={false}
                      optionLabelProp="label"
                      showAction={['click']}
                      onClick={e => e.stopPropagation()}
                    >
                      <Option value="car" label="Car">Car</Option>
                      <Option value="bus" label="Bus">Bus</Option>
                      <Option value="train" label="Train">Train</Option>
                      <Option value="flight" label="Flight">Flight</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Distance (km)</span>}
                    name="transportationDistance"
                    rules={[{ required: true, message: 'Please input distance' }]}
                  >
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      placeholder="Enter distance"
                      controls={false}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Number of Passengers</span>}
                    name="passengers"
                    rules={[{ required: true, message: 'Please input number of passengers' }]}
                  >
                    <InputNumber
                      style={fieldStyle}
                      min={1}
                      placeholder="Enter number of passengers"
                      controls={false}
                    />
                  </Form.Item>
                </Col>

                {transportationType === 'flight' && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span style={{ color: '#237804' }}>Departure Airport (IATA code)</span>}
                      name="departureAirport"
                      rules={[{ required: true, message: 'Please input departure airport code' }]}
                    >
                      <Input placeholder="e.g., JFK" style={fieldStyle} />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              {transportationType === 'flight' && (
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={<span style={{ color: '#237804' }}>Destination Airport (IATA code)</span>}
                      name="destinationAirport"
                      rules={[{ required: true, message: 'Please input destination airport code' }]}
                    >
                      <Input placeholder="e.g., LAX" style={fieldStyle} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Card>

            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ShopOutlined style={{ color: primaryColor, marginRight: 8 }} />
                  <span style={{ color: '#135200' }}>Shipping</span>
                </div>
              }
              style={{ 
                marginBottom: 24, 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}
              headStyle={{ backgroundColor: '#f6ffed', borderBottom: '1px solid #b7eb8f' }}
              bodyStyle={{ padding: '24px', backgroundColor: 'white' }}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Shipping Method</span>}
                    name="shippingMethod"
                    rules={[{ required: true, message: 'Please select shipping method' }]}
                  >
                    <Select 
                      placeholder="Select shipping method" 
                      style={selectStyle}
                      dropdownStyle={{ 
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                      listHeight={200}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      dropdownMatchSelectWidth={false}
                      optionLabelProp="label"
                      showAction={['click']}
                      onClick={e => e.stopPropagation()}
                    >
                      <Option value="ship" label="Ship">Ship</Option>
                      <Option value="train" label="Train">Train</Option>
                      <Option value="truck" label="Truck">Truck</Option>
                      <Option value="plane" label="Plane">Plane</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Weight (kg)</span>}
                    name="shippingWeight"
                    rules={[{ required: true, message: 'Please input weight' }]}
                  >
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      placeholder="Enter weight"
                      controls={false}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ color: '#237804' }}>Distance (km)</span>}
                    name="shippingDistance"
                    rules={[{ required: true, message: 'Please input distance' }]}
                  >
                    <InputNumber
                      style={fieldStyle}
                      min={0}
                      placeholder="Enter distance"
                      controls={false}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block
                style={{ 
                  height: '46px', 
                  fontSize: '16px', 
                  background: primaryColor, 
                  borderColor: primaryColor 
                }}
              >
                Calculate Emissions
              </Button>
            </Form.Item>
          </Form>

          {result && (
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CalculatorOutlined style={{ color: primaryColor, marginRight: 8 }} />
                  <span style={{ color: '#135200' }}>Results</span>
                </div>
              }
              style={{ 
                marginTop: 24, 
                borderRadius: '8px',
                border: '1px solid #b7eb8f',
                backgroundColor: '#f6ffed'
              }}
              headStyle={{ backgroundColor: '#d9f7be', borderBottom: '1px solid #b7eb8f' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #b7eb8f',
                  textAlign: 'center'
                }}>
                  <Title level={3} style={{ color: '#389e0d', margin: 0 }}>
                    Total Emissions: {result.total.toFixed(2)} kg CO2
                  </Title>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  border: '1px solid #b7eb8f' 
                }}>
                  <Title level={4} style={{ color: '#135200', marginTop: 0 }}>Breakdown:</Title>
                  {result.calculations.map((calc, index) => (
                    <div key={index} style={{ 
                      marginBottom: 12, 
                      padding: '12px', 
                      borderRadius: '6px', 
                      backgroundColor: index % 2 === 0 ? '#f6ffed' : 'white',
                      border: '1px solid #d9f7be'
                    }}>
                      <Text strong style={{ color: '#237804' }}>{calc.type}:</Text>{' '}
                      <Text>{calc.amount} {calc.unit} = </Text>{' '}
                      <Text style={{ 
                        fontWeight: 600, 
                        color: calc.emissions > 100 ? '#ff4d4f' : calc.emissions > 50 ? '#faad14' : '#52c41a' 
                      }}>
                        {calc.emissions.toFixed(2)} kg CO2
                      </Text>
                    </div>
                  ))}
                </div>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EmissionCalculator; 
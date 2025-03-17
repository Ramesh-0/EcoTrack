import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, Space, Typography, Divider, message, Alert, Input } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { calculateEmissions, getTransportationEmissions, getShippingEmissions, getFlightEmissions } from '../api/carbonInterface';

const { Title, Text } = Typography;
const { Option } = Select;

const EmissionCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transportationType, setTransportationType] = useState(null);

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>
              <CalculatorOutlined /> Emission Calculator
            </Title>
            <Text type="secondary">
              Calculate your carbon emissions using real-time data from Carbon Interface
            </Text>
          </div>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
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
          >
            <Form.Item
              label="Electricity Consumption (kWh)"
              name="electricity"
              rules={[{ required: true, message: 'Please input electricity consumption' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter electricity consumption"
              />
            </Form.Item>

            <Form.Item
              label="Country"
              name="country"
              rules={[{ required: true, message: 'Please select country' }]}
            >
              <Select placeholder="Select country">
                <Option value="us">United States</Option>
                <Option value="gb">United Kingdom</Option>
                <Option value="ca">Canada</Option>
                <Option value="au">Australia</Option>
                <Option value="de">Germany</Option>
                <Option value="fr">France</Option>
              </Select>
            </Form.Item>

            <Divider>Transportation</Divider>

            <Form.Item
              label="Transportation Type"
              name="transportationType"
              rules={[{ required: true, message: 'Please select transportation type' }]}
            >
              <Select 
                placeholder="Select transportation type"
                onChange={handleTransportationTypeChange}
              >
                <Option value="car">Car</Option>
                <Option value="bus">Bus</Option>
                <Option value="train">Train</Option>
                <Option value="flight">Flight</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Distance (km)"
              name="transportationDistance"
              rules={[{ required: true, message: 'Please input distance' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter distance"
              />
            </Form.Item>

            <Form.Item
              label="Number of Passengers"
              name="passengers"
              rules={[{ required: true, message: 'Please input number of passengers' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="Enter number of passengers"
              />
            </Form.Item>

            {transportationType === 'flight' && (
              <>
                <Form.Item
                  label="Departure Airport (IATA code)"
                  name="departureAirport"
                  rules={[{ required: true, message: 'Please input departure airport code' }]}
                >
                  <Input placeholder="e.g., JFK" />
                </Form.Item>

                <Form.Item
                  label="Destination Airport (IATA code)"
                  name="destinationAirport"
                  rules={[{ required: true, message: 'Please input destination airport code' }]}
                >
                  <Input placeholder="e.g., LAX" />
                </Form.Item>
              </>
            )}

            <Divider>Shipping</Divider>

            <Form.Item
              label="Shipping Method"
              name="shippingMethod"
              rules={[{ required: true, message: 'Please select shipping method' }]}
            >
              <Select placeholder="Select shipping method">
                <Option value="ship">Ship</Option>
                <Option value="truck">Truck</Option>
                <Option value="plane">Air Freight</Option>
                <Option value="train">Train</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Weight (kg)"
              name="shippingWeight"
              rules={[{ required: true, message: 'Please input weight' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter weight"
              />
            </Form.Item>

            <Form.Item
              label="Distance (km)"
              name="shippingDistance"
              rules={[{ required: true, message: 'Please input distance' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter distance"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Calculate Emissions
              </Button>
            </Form.Item>
          </Form>

          {result && (
            <Card title="Results" style={{ marginTop: 24 }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={3}>Total Emissions: {result.total.toFixed(2)} kg CO2</Title>
                </div>

                <div>
                  <Title level={4}>Breakdown:</Title>
                  {result.calculations.map((calc, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Text strong>{calc.type}:</Text> {calc.amount} {calc.unit} = {calc.emissions.toFixed(2)} kg CO2
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
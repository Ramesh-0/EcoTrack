import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, message, Space, Alert, Tooltip, Row, Col, Divider, Typography, Statistic } from 'antd';
import { SaveOutlined, ReloadOutlined, InfoCircleOutlined, CalculatorOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const EmissionEntryForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedEmission, setCalculatedEmission] = useState(0);

  // Define emission types with descriptions
  const emissionTypes = [
    { value: 'electricity', label: 'Electricity', description: 'Power consumption in offices or facilities', defaultUnit: 'kWh', defaultFactor: 0.5 },
    { value: 'natural_gas', label: 'Natural Gas', description: 'Heating or cooking in facilities', defaultUnit: 'm³', defaultFactor: 2.1 },
    { value: 'water', label: 'Water', description: 'Water usage in facilities', defaultUnit: 'm³', defaultFactor: 0.3 },
    { value: 'waste', label: 'Waste', description: 'Garbage, recyclables, or other waste', defaultUnit: 'kg', defaultFactor: 0.2 },
    { value: 'transportation', label: 'Transportation', description: 'Company vehicles or business travel', defaultUnit: 'km', defaultFactor: 0.14 },
    { value: 'fuel', label: 'Fuel', description: 'Gasoline, diesel, or other fuels', defaultUnit: 'L', defaultFactor: 2.3 },
    { value: 'manufacturing', label: 'Manufacturing', description: 'Production processes', defaultUnit: 'kg', defaultFactor: 1.8 },
    { value: 'other', label: 'Other', description: 'Other emissions sources not listed above', defaultUnit: 'kg CO2e', defaultFactor: 1.0 }
  ];

  // Define units with descriptions
  const units = [
    { value: 'kWh', label: 'kWh', description: 'Kilowatt Hours (electricity)' },
    { value: 'm³', label: 'm³', description: 'Cubic Meters (gas, water)' },
    { value: 'kg', label: 'kg', description: 'Kilograms (waste, materials)' },
    { value: 'km', label: 'km', description: 'Kilometers (transportation)' },
    { value: 'L', label: 'L', description: 'Liters (fuel)' },
    { value: 'kg CO2e', label: 'kg CO2e', description: 'Direct CO2 equivalent' },
    { value: 'unit', label: 'unit', description: 'Generic units' }
  ];

  // Calculate emission whenever amount or CO2 per unit changes
  useEffect(() => {
    const values = form.getFieldsValue(['amount', 'co2_per_unit']);
    if (values.amount && values.co2_per_unit) {
      setCalculatedEmission(parseFloat(values.amount) * parseFloat(values.co2_per_unit));
    } else {
      setCalculatedEmission(0);
    }
  }, [form.getFieldValue('amount'), form.getFieldValue('co2_per_unit')]);

  // Handle emission type change to set appropriate default unit and CO2 factor
  const handleTypeChange = (value) => {
    const selectedType = emissionTypes.find(type => type.value === value);
    if (selectedType) {
      form.setFieldsValue({
        unit: selectedType.defaultUnit,
        co2_per_unit: selectedType.defaultFactor
      });
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format the data for the API
      const formattedData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        amount: parseFloat(values.amount),
        co2_per_unit: parseFloat(values.co2_per_unit)
      };
      
      const response = await api.post('/emissions', formattedData);
      
      // Success message and form reset
      message.success('Emission data added successfully');
      form.resetFields();
      
      // Reset the calculated emission
      setCalculatedEmission(0);
      
      // Call any onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error submitting emission data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit emission data');
      message.error('Failed to submit emission data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError(null);
    setCalculatedEmission(0);
  };

  // Initialize form with default values
  const initialValues = {
    date: dayjs(),
    type: 'electricity',
    amount: null,
    unit: 'kWh',
    co2_per_unit: 0.5,
    description: ''
  };

  return (
    <div className="emission-entry-form">
      {error && (
        <Alert
          message="Error Submitting Data"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setError(null)}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
        requiredMark="optional"
        onValuesChange={(changedValues) => {
          if (changedValues.type) {
            handleTypeChange(changedValues.type);
          }
        }}
      >
        <Row gutter={[24, 0]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CalculatorOutlined style={{ fontSize: '18px', marginRight: '8px' }} />
                  <span>Emission Data Entry</span>
                </div>
              } 
              className="form-card"
              bordered={false}
              style={{ 
                boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)', 
                borderRadius: '8px',
                height: '100%'
              }}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="type"
                    label={
                      <span>
                        Emission Type
                        <Tooltip title="Select the category of emission source">
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select emission type' }]}
                  >
                    <Select placeholder="Select emission type">
                      {emissionTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                          <div>
                            <div>{type.label}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                              {type.description}
                            </div>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Quantity Information</Divider>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="amount"
                    label={
                      <span>
                        Amount
                        <Tooltip title="The quantity of resource consumed">
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      placeholder="Enter amount"
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="unit"
                    label={
                      <span>
                        Unit
                        <Tooltip title="The measurement unit for the amount">
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please select unit' }]}
                  >
                    <Select placeholder="Select unit">
                      {units.map(unit => (
                        <Option key={unit.value} value={unit.value}>
                          <Tooltip title={unit.description}>
                            {unit.label}
                          </Tooltip>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24}>
                  <Form.Item
                    name="co2_per_unit"
                    label={
                      <span>
                        CO2 Emission Factor (kg CO2e per unit)
                        <Tooltip title="The amount of CO2 equivalent produced per unit. Default values are provided based on emission type.">
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please enter CO2 per unit' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                      placeholder="Enter CO2 equivalent per unit"
                      precision={3}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Additional Information</Divider>

              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea 
                  placeholder="Additional notes about this emission (optional)"
                  rows={3}
                />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ fontSize: '18px', marginRight: '8px' }} />
                  <span>Emission Summary</span>
                </div>
              }
              bordered={false}
              style={{ 
                boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)', 
                borderRadius: '8px',
                height: '100%'
              }}
            >
              <Statistic 
                title="Total CO2 Emission" 
                value={calculatedEmission} 
                precision={2}
                suffix="kg CO2e"
                valueStyle={{ color: '#3f8600' }}
              />
              
              <Divider />
              
              <Title level={5}>Helpful Tips</Title>
              <ul style={{ paddingLeft: '20px' }}>
                <li>
                  <Text>Choose the correct emission type for accurate tracking</Text>
                </li>
                <li>
                  <Text>Default emission factors are pre-filled but can be adjusted for your specific scenario</Text>
                </li>
                <li>
                  <Text>Include detailed descriptions for better record keeping</Text>
                </li>
              </ul>
              
              <div style={{ marginTop: '24px' }}>
                <Text type="secondary">
                  Your emission data will be used to calculate your carbon footprint and provide insights on reduction opportunities.
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space size="middle">
            <Button 
              onClick={handleReset}
              icon={<ReloadOutlined />}
            >
              Reset Form
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              Submit Record
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default EmissionEntryForm; 
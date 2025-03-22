import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, Alert, message, Typography, Space, Divider } from 'antd';
import { SaveOutlined, CalculatorOutlined, CloseOutlined, InfoCircleTwoTone, LineChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { saveEmissionCalculation } from '../utils/emissionsStorage';
import './EmissionsCalculator.css';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const EmissionsCalculator = () => {
  const [form] = Form.useForm();
  const [calculatedValue, setCalculatedValue] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Emission factors for different categories
  const emissionFactors = {
    electricity: 0.5, // kg CO2 per kWh
    naturalGas: 0.2, // kg CO2 per kWh
    transportation: {
      car: 0.12, // kg CO2 per km
      bus: 0.05, // kg CO2 per km
      train: 0.04, // kg CO2 per km
      plane: 0.25, // kg CO2 per km
    },
    waste: 0.5, // kg CO2 per kg of waste
    water: 0.3, // kg CO2 per cubic meter
  };

  const handleCalculate = (values) => {
    setCalculating(true);
    setSaveSuccess(false);
    setSaveError(null);
    let result = 0;

    try {
      const { category, amount, subcategory } = values;

      switch (category) {
        case 'electricity':
          result = amount * emissionFactors.electricity;
          break;
        case 'natural_gas':
          result = amount * emissionFactors.naturalGas;
          break;
        case 'transportation':
          result = amount * emissionFactors.transportation[subcategory];
          break;
        case 'waste':
          result = amount * emissionFactors.waste;
          break;
        case 'water':
          result = amount * emissionFactors.water;
          break;
        default:
          result = 0;
      }

      // Convert to tons for consistency with supply chain data
      const resultInTons = result / 1000;
      setCalculatedValue(resultInTons);
      message.success('Emissions calculated successfully');
    } catch (error) {
      console.error('Error calculating emissions:', error);
      message.error('Error calculating emissions');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = () => {
    const values = form.getFieldsValue();
    
    if (!calculatedValue) {
      message.error('Please calculate emissions first');
      return;
    }

    try {
      setSaveSuccess(false);
      setSaveError(null);
      
      const calculationData = {
        category: values.category,
        subcategory: values.subcategory,
        value: calculatedValue,
        amount: values.amount,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        description: values.description || `${values.category} emissions`,
        unit: getCategoryUnit(values.category),
        label: getCategoryLabel(values.category, values.subcategory)
      };
      
      const success = saveEmissionCalculation(calculationData);
      
      if (success) {
        setSaveSuccess(true);
        message.success('Emissions saved successfully to dashboard');
        form.resetFields();
        setCalculatedValue(null);
      } else {
        setSaveError('Failed to save emission calculation');
        message.error('Failed to save emission calculation');
      }
    } catch (error) {
      console.error('Error saving emission calculation:', error);
      setSaveError(error.message || 'Error saving emission calculation');
      message.error('Error saving emission calculation');
    }
  };

  const handleReset = () => {
    form.resetFields();
    setCalculatedValue(null);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const getCategoryUnit = (category) => {
    switch (category) {
      case 'electricity':
        return 'kWh';
      case 'natural_gas':
        return 'kWh';
      case 'transportation':
        return 'km';
      case 'waste':
        return 'kg';
      case 'water':
        return 'm³';
      default:
        return 'units';
    }
  };

  const getCategoryLabel = (category, subcategory) => {
    switch (category) {
      case 'electricity':
        return 'Electricity Usage';
      case 'natural_gas':
        return 'Natural Gas Usage';
      case 'transportation':
        return `${subcategory ? subcategory.charAt(0).toUpperCase() + subcategory.slice(1) : 'Transportation'} Emissions`;
      case 'waste':
        return 'Waste Management';
      case 'water':
        return 'Water Usage';
      default:
        return 'Carbon Emissions';
    }
  };

  return (
    <div className="emissions-calculator">
      <div className="page-header">
        <Typography.Title level={2}>
          <CalculatorOutlined /> Carbon Emissions Calculator
        </Typography.Title>
        <Typography.Paragraph>
          Calculate and track your carbon emissions from various sources. Save results to view in the dashboard.
        </Typography.Paragraph>
      </div>
      
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalculatorOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
            <span>Carbon Emissions Calculator</span>
          </div>
        }
        bordered={false}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
      >
        {saveSuccess && (
          <Alert
            message="Success"
            description="Emission calculation saved successfully. It will now appear in the dashboard graph."
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setSaveSuccess(false)}
          />
        )}
        
        {saveError && (
          <Alert
            message="Error"
            description={saveError}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setSaveError(null)}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCalculate}
          initialValues={{
            category: 'electricity',
            subcategory: 'car',
            date: dayjs(),
          }}
        >
          <Form.Item
            name="category"
            label="Emission Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select>
              <Option value="electricity">Electricity</Option>
              <Option value="natural_gas">Natural Gas</Option>
              <Option value="transportation">Transportation</Option>
              <Option value="waste">Waste</Option>
              <Option value="water">Water</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.category !== currentValues.category}
          >
            {({ getFieldValue }) => 
              getFieldValue('category') === 'transportation' ? (
                <Form.Item
                  name="subcategory"
                  label="Transportation Type"
                  rules={[{ required: true, message: 'Please select a transportation type' }]}
                >
                  <Select>
                    <Option value="car">Car</Option>
                    <Option value="bus">Bus</Option>
                    <Option value="train">Train</Option>
                    <Option value="plane">Plane</Option>
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
          
          <Form.Item
            label={
              <span>
                Amount 
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  ({
                    {
                      'electricity': 'kWh',
                      'natural_gas': 'kWh',
                      'transportation': 'km',
                      'waste': 'kg',
                      'water': 'm³'
                    }[form.getFieldValue('category')] || 'units'
                  })
                </Text>
              </span>
            }
            name="amount"
            rules={[{ required: true, message: 'Please enter the amount' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              step={0.1} 
              placeholder={`Enter amount in ${
                {
                  'electricity': 'kWh',
                  'natural_gas': 'kWh',
                  'transportation': 'km',
                  'waste': 'kg',
                  'water': 'm³'
                }[form.getFieldValue('category')] || 'units'
              }`}
            />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              placeholder="Optional description of this emission calculation"
              rows={2}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={calculating}
                icon={<CalculatorOutlined />}
              >
                Calculate
              </Button>
              <Button 
                onClick={handleReset}
                icon={<CloseOutlined />}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        {calculatedValue !== null && (
          <>
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>Calculated Emissions</Title>
              <Card 
                style={{ 
                  background: '#f6ffed', 
                  borderRadius: '8px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                  {calculatedValue.toFixed(4)} <Text style={{ fontSize: '16px' }}>tons CO₂e</Text>
                </Title>
              </Card>
              <Paragraph type="secondary">
                <InfoCircleTwoTone /> The calculation is based on standard emission factors and may vary based on regional differences.
              </Paragraph>
              <Space>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                >
                  Save to Dashboard
                </Button>
                <Link to="/supply-chain-emissions">
                  <Button 
                    type="default" 
                    size="large"
                    icon={<LineChartOutlined />}
                  >
                    View in Dashboard
                  </Button>
                </Link>
              </Space>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default EmissionsCalculator; 
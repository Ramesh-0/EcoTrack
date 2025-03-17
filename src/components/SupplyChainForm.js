import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, message, Space, Alert, Typography, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const SupplyChainForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const transportationTypes = [
    'Road',
    'Rail',
    'Air',
    'Sea',
    'Mixed'
  ];

  const materialTypes = [
    'Raw Materials',
    'Components',
    'Finished Goods',
    'Packaging',
    'Other'
  ];

  const formatError = (errorDetail) => {
    if (!errorDetail) return 'An error occurred';
    
    if (Array.isArray(errorDetail)) {
      return errorDetail.map(error => {
        if (typeof error === 'object' && error.msg) {
          const field = Array.isArray(error.loc) ? error.loc.join('.') : 'unknown';
          return `${field}: ${error.msg}`;
        }
        return String(error);
      }).join('\n');
    }
    
    if (typeof errorDetail === 'object' && errorDetail.msg) {
      return errorDetail.msg;
    }
    
    return String(errorDetail);
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      // Format the data before sending
      const formattedData = {
        supplier_name: values.supplierName,
        date: values.date.format('YYYY-MM-DD'),
        materials: values.materials.map(material => ({
          material_type: material.materialType,
          quantity: material.quantity,
          transportation_type: material.transportationType,
          transportation_distance: material.transportationDistance,
          transportation_date: material.transportationDate.format('YYYY-MM-DD'),
          notes: material.notes || ''
        }))
      };

      await api.post('/supply-chain', formattedData);
      message.success('Supply chain record added successfully');
      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting supply chain data:', err);
      
      if (err.response?.data?.detail) {
        const formattedError = formatError(err.response.data.detail);
        setError(formattedError);
      } else {
        setError('Failed to submit supply chain data. Please try again.');
      }
      message.error('Failed to submit supply chain data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setError(null);
  };

  // Initialize form with default values
  const initialValues = {
    materials: [{}],
    date: dayjs(),
  };

  return (
    <div className="supply-chain-form">
      {error && (
        <Alert
          message="Error"
          description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>}
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
      >
        <Card title="Basic Information" className="form-card">
          <Form.Item
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Record Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Card>

        <Form.List name="materials">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 24 }}>
              <Card 
                title="Materials" 
                className="form-card"
                extra={
                  <Button
                    type="primary"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    Add Material
                  </Button>
                }
              >
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`Material ${name + 1}`}
                    className="material-card"
                    extra={
                      fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      )
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'materialType']}
                          label="Material Type"
                          rules={[{ required: true, message: 'Please select material type' }]}
                        >
                          <Select placeholder="Select material type">
                            {materialTypes.map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity (units)"
                          rules={[{ required: true, message: 'Please enter quantity' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="Enter quantity"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationType']}
                          label="Transportation Type"
                          rules={[{ required: true, message: 'Please select transportation type' }]}
                        >
                          <Select placeholder="Select transportation type">
                            {transportationTypes.map(type => (
                              <Option key={type} value={type}>{type}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationDistance']}
                          label="Transportation Distance (km)"
                          rules={[{ required: true, message: 'Please enter distance' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            placeholder="Enter distance in kilometers"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'transportationDate']}
                          label="Transportation Date"
                          rules={[{ required: true, message: 'Please select transportation date' }]}
                        >
                          <DatePicker 
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'notes']}
                          label="Notes"
                        >
                          <TextArea 
                            placeholder="Additional notes about this material"
                            rows={3}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Card>
            </div>
          )}
        </Form.List>

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

export default SupplyChainForm; 
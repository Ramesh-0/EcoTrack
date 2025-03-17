import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import api from '../api/axios';

const AddSupplierForm = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await api.post('/suppliers', {
        name: values.name,
        emission_ratings: values.emission_ratings,
        location: values.location
      });

      message.success('Supplier added successfully');
      form.resetFields();
      onSuccess();
      onCancel();
    } catch (error) {
      console.error('Error adding supplier:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Failed to add supplier');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Supplier"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          emission_ratings: 0
        }}
      >
        <Form.Item
          name="name"
          label="Supplier Name"
          rules={[{ required: true, message: 'Please enter supplier name' }]}
        >
          <Input placeholder="Enter supplier name" />
        </Form.Item>

        <Form.Item
          name="emission_ratings"
          label="Emission Ratings"
          rules={[
            { required: true, message: 'Please enter emission ratings' },
            { type: 'number', min: 0, message: 'Emission ratings must be positive' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter emission ratings"
            min={0}
          />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true, message: 'Please enter location' }]}
        >
          <Input placeholder="Enter location" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSupplierForm; 
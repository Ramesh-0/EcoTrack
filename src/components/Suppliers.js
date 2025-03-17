import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Row, Col, Modal, Form, Input, Rate, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axios from '../utils/api';

const { Title } = Typography;
const { TextArea } = Input;

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Add effect to monitor modal visibility
  useEffect(() => {
    console.log('Modal visibility changed:', modalVisible);
  }, [modalVisible]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = async (values) => {
    try {
      setSubmitting(true);
      console.log('Form values:', values); // Debug log

      const formattedValues = {
        name: values.name.trim(),
        location: values.location.trim(),
        emission_ratings: parseFloat(values.emission_ratings) * 20, // Convert 1-5 scale to 0-100 scale
        description: values.description ? values.description.trim() : null
      };

      console.log('Formatted values to send:', formattedValues); // Debug log

      let response;
      if (editingSupplier) {
        response = await axios.put(`/suppliers/${editingSupplier.id}`, formattedValues);
        message.success('Supplier updated successfully');
      } else {
        response = await axios.post('/suppliers', formattedValues);
        message.success('Supplier added successfully');
      }

      console.log('Server response:', response.data); // Debug log
      await fetchSuppliers(); // Refresh the suppliers list
      setModalVisible(false);
      form.resetFields();
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      console.error('Error response:', error.response?.data); // Debug log
      message.error(error.response?.data?.detail || 'Error saving supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/suppliers/${id}`);
      message.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      message.error('Failed to delete supplier');
    }
  };

  const showModal = (supplier = null) => {
    console.log('showModal called', { supplier }); // Debug log
    setEditingSupplier(supplier);
    if (supplier) {
      form.setFieldsValue({
        ...supplier,
        emission_ratings: Math.round(supplier.emission_ratings / 20), // Convert 0-100 to 1-5 scale
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ emission_ratings: 3 }); // Set default rating
    }
    setModalVisible(true);
    console.log('modalVisible set to true'); // Debug log
  };

  const getEmissionColor = (rating) => {
    // Convert 0-100 scale to 1-5 scale for color determination
    const scaledRating = rating / 20;
    if (scaledRating <= 2) return '#52c41a';
    if (scaledRating <= 3) return '#faad14';
    return '#f5222d';
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text) => (
        <Tag className="location-badge" color="blue">
          <EnvironmentOutlined /> {text}
        </Tag>
      ),
    },
    {
      title: 'Emission Rating',
      dataIndex: 'emission_ratings',
      key: 'emission_ratings',
      render: (rating) => {
        const starRating = Math.round(rating / 20); // Convert 0-100 to 0-5 scale
        return (
          <div className="supplier-rating">
            <Rate 
              disabled 
              value={starRating}
              style={{ color: getEmissionColor(rating) }}
            />
            <span style={{ marginLeft: 8 }}>({rating}%)</span>
          </div>
        );
      },
      sorter: (a, b) => a.emission_ratings - b.emission_ratings,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '30%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space className="action-buttons">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Supplier"
            description="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[24, 24]} align="middle" justify="space-between">
        <Col>
          <Title level={2}>
            <TeamOutlined /> Suppliers Management
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            size="large"
          >
            Add Supplier
          </Button>
        </Col>
      </Row>

      <div className="suppliers-table">
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} suppliers`,
          }}
        />
      </div>

      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={modalVisible}
        visible={modalVisible}
        destroyOnClose={true}
        maskClosable={false}
        onCancel={() => {
          setModalVisible(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        footer={null}
        className="supplier-modal"
        width={600}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEdit}
          initialValues={{ emission_ratings: 3 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter supplier location' }]}
          >
            <Input 
              placeholder="Enter supplier location" 
              prefix={<EnvironmentOutlined className="site-form-item-icon" />}
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="emission_ratings"
            label="Emission Rating"
            rules={[{ required: true, message: 'Please rate emissions' }]}
            tooltip="Rate from 1 (best) to 5 (worst) based on environmental impact. This will be converted to a percentage."
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={4} 
              placeholder="Enter supplier description (optional)"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={submitting}
              >
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </Button>
              <Button 
                size="large"
                onClick={() => {
                  setModalVisible(false);
                  setEditingSupplier(null);
                  form.resetFields();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Suppliers; 
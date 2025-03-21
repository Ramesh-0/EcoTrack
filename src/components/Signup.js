// components/Signup.js
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Select, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

const { Title, Text, Paragraph } = Typography;

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('Attempting signup with:', { 
        username: values.username,
        email: values.email,
        companyName: values.companyName
      });
      
      const response = await api.post('/auth/signup', {
        username: values.username,
        email: values.email,
        password: values.password,
        confirm_password: values.confirmPassword,
        company_name: values.companyName,
        phone: values.phone
      });
      
      console.log('Signup response:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        message.success('Account created successfully! Please sign in.');
        navigate('/login');
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create account. Please try again.';
      if (typeof errorMessage === 'object') {
        // Handle validation error object
        message.error(errorMessage.msg || 'Failed to create account. Please try again.');
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <div className="login-logo">
            <EnvironmentOutlined style={{ fontSize: '44px', color: '#2ecc71' }} />
          </div>
          <Title level={2} className="login-title">Create Account</Title>
          <Text className="login-subtitle">Join us to track and reduce your carbon footprint</Text>
        </div>
        
        <div className="login-card">
          <Form
            form={form}
            name="signup"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            disabled={loading}
            scrollToFirstError
          >
            <Paragraph strong style={{ fontSize: '18px', marginBottom: '20px' }}>Personal Information</Paragraph>
            
            <Form.Item
              name="username"
              label="Full Name"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your name' },
                { min: 3, message: 'Name must be at least 3 characters' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Enter your work email"
                autoComplete="email"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your phone number' },
                { pattern: /^[0-9+\-\s()]+$/, message: 'Please enter a valid phone number' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="Enter your phone number"
                autoComplete="tel"
                disabled={loading}
              />
            </Form.Item>

            <Divider />
            <Paragraph strong style={{ fontSize: '18px', marginBottom: '20px' }}>Company Information</Paragraph>

            <Form.Item
              name="companyName"
              label="Company Name"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your company name' },
                { min: 2, message: 'Company name must be at least 2 characters' }
              ]}
            >
              <Input 
                prefix={<BankOutlined />} 
                placeholder="Enter your company name"
                disabled={loading}
              />
            </Form.Item>

            <Divider />
            <Paragraph strong style={{ fontSize: '18px', marginBottom: '20px' }}>Account Security</Paragraph>

            <Form.Item
              name="password"
              label="Password"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please create a password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Password must include uppercase, lowercase, number and special character'
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a secure password"
                autoComplete="new-password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-links">
            <Text>Already have an account?</Text>
            <Link to="/login" style={{ pointerEvents: loading ? 'none' : 'auto' }}>Sign in</Link>
          </div>
        </div>

        <div className="login-footer">
          <Text type="secondary">
            &copy; {new Date().getFullYear()} Carbon Footprint Tracker. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Signup;

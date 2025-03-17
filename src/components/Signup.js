// components/Signup.js
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

const { Title, Text } = Typography;

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('Attempting signup with:', { 
        username: values.username,
        email: values.email 
      });
      
      const response = await api.post('/auth/signup', {
        username: values.username,
        email: values.email,
        password: values.password,
        confirm_password: values.confirmPassword
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
          <Title level={2} className="login-title">Create Account</Title>
          <Text className="login-subtitle">Join us to track your carbon footprint</Text>
        </div>
        
        <div className="login-card">
          <Form
            name="signup"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            disabled={loading}
          >
            <Form.Item
              name="username"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your username' },
                { min: 3, message: 'Username must be at least 3 characters' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="email"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email"
                autoComplete="email"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="new-password"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
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
                placeholder="Confirm Password"
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
      </div>
    </div>
  );
};

export default Signup;

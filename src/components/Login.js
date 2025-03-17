// components/Login.js
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email: values.email });
      
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('Welcome back!');
        navigate(response.data.redirect_url || '/dashboard');
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.';
      if (typeof errorMessage === 'object') {
        // Handle validation error object
        message.error(errorMessage.msg || 'Login failed. Please try again.');
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
          <Title level={2} className="login-title">Login</Title>
          <Text className="login-subtitle">Welcome back! Please login to your account</Text>
        </div>
        
        <div className="login-card">
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            disabled={loading}
          >
            <Form.Item
              name="email"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
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
                autoComplete="current-password"
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
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-links">
            <Text>Don't have an account?</Text>
            <Link to="/signup" style={{ pointerEvents: loading ? 'none' : 'auto' }}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

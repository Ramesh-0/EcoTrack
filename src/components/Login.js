// components/Login.js
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './Login.css';

const { Title, Text, Paragraph } = Typography;

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
          <div className="login-logo">
            <EnvironmentOutlined style={{ fontSize: '44px', color: '#2ecc71' }} />
          </div>
          <Title level={2} className="login-title">Welcome Back</Title>
          <Text className="login-subtitle">Sign in to your Carbon Footprint Tracker account</Text>
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
              label="Email Address"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <div className="form-divider">
            <span>OR</span>
          </div>

          <Paragraph style={{ textAlign: 'center', marginBottom: '24px' }}>
            Don't have an account yet?
          </Paragraph>

          <Link to="/signup">
            <Button block size="large" className="signup-button">
              Create Account
            </Button>
          </Link>
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

export default Login;

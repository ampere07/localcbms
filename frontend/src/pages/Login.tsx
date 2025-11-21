import React, { useState } from 'react';
import { login, forgotPassword } from '../services/api';
import { UserData } from '../types/api';

interface LoginProps {
  onLogin: (userData: UserData) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Check if using demo credentials
      const demoEmail = process.env.REACT_APP_DEMO_EMAIL;
      const demoPassword = process.env.REACT_APP_DEMO_PASSWORD;
      
      if (email === demoEmail && password === demoPassword) {
        // Mock successful login for demo credentials
        const mockUserData: UserData = {
          id: 1,
          username: 'admin',
          email: email,
          full_name: 'Admin User',
          role: 'administrator'
        };
        onLogin(mockUserData);
        return;
      }
      
      // Try actual API login for other credentials
      const response = await login(email, password);
      if (response.status === 'success') {
        const userData: UserData = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          full_name: response.data.user.full_name,
          role: response.data.user.role,
          organization: response.data.user.organization
        };
        onLogin(userData);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await forgotPassword(forgotEmail);
      if (response.status === 'success') {
        setForgotMessage(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#282c34',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1e1e1e',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid #444',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            color: '#61dafb',
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '24px'
          }}>
            Reset Password
          </h2>
          
          {forgotMessage ? (
            <div>
              <div style={{
                color: '#4CAF50',
                textAlign: 'center',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#1a4a3a',
                borderRadius: '8px',
                border: '1px solid #4CAF50'
              }}>
                {forgotMessage}
              </div>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotMessage('');
                  setForgotEmail('');
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#61dafb',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#fff',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                  placeholder="Enter your email address"
                />
              </div>
              
              {error && (
                <div style={{
                  color: '#f44336',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: isLoading ? '#666' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  marginBottom: '15px'
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#61dafb',
                  border: '1px solid #61dafb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#282c34',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid #444',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: '#61dafb',
            fontSize: '28px',
            marginBottom: '10px'
          }}>
            Business Management
          </h1>
          <p style={{
            color: '#aaa',
            fontSize: '16px'
          }}>
            Sign in to your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px'
              }}
              placeholder="Enter your email"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#fff',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px'
              }}
              placeholder="Enter your password"
            />
          </div>
          
          {error && (
            <div style={{
              color: '#f44336',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#666' : '#61dafb',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div style={{
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#61dafb',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

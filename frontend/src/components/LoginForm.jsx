import { useState } from 'react';
import { Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Error Alert */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError('')}
          className="mb-4"
          style={{
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(220, 53, 69, 0.1)',
            color: '#dc3545',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {/* Email Field */}
      <Form.Group className="mb-4" controlId="formEmail">
        <Form.Label 
          className="fw-semibold mb-2" 
          style={{ color: '#2c3e50', fontSize: '0.95rem' }}
        >
          Email Address
        </Form.Label>
        <InputGroup>
          <InputGroup.Text 
            style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '2px solid #e0e0e0',
              borderRight: 'none',
              borderRadius: '12px 0 0 12px',
              transition: 'all 0.3s ease'
            }}
            className="input-icon-email"
          >
            <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease' }}>📧</span>
          </InputGroup.Text>
          <Form.Control
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="modern-input"
            style={{
              padding: '0.85rem 1rem',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'white'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
              e.target.style.transform = 'translateY(-1px)';
              
              const iconContainer = e.target.previousSibling;
              iconContainer.style.borderColor = '#667eea';
              iconContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              
              // ✅ FIXED: Scale icon instead of inverting color
              const icon = iconContainer.querySelector('span');
              icon.style.transform = 'scale(1.2)';
              icon.style.filter = 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
              
              const iconContainer = e.target.previousSibling;
              iconContainer.style.borderColor = '#e0e0e0';
              iconContainer.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
              
              // ✅ FIXED: Reset icon transform
              const icon = iconContainer.querySelector('span');
              icon.style.transform = 'scale(1)';
              icon.style.filter = 'none';
            }}
          />
        </InputGroup>
      </Form.Group>

      {/* Password Field */}
      <Form.Group className="mb-4" controlId="formPassword">
        <Form.Label 
          className="fw-semibold mb-2" 
          style={{ color: '#2c3e50', fontSize: '0.95rem' }}
        >
          Password
        </Form.Label>
        <InputGroup>
          <InputGroup.Text 
            style={{
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '2px solid #e0e0e0',
              borderRight: 'none',
              borderRadius: '12px 0 0 12px',
              transition: 'all 0.3s ease'
            }}
            className="input-icon-password"
          >
            <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s ease' }}>🔒</span>
          </InputGroup.Text>
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="modern-input"
            style={{
              padding: '0.85rem 1rem',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderLeft: 'none',
              borderRight: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'white'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
              e.target.style.transform = 'translateY(-1px)';
              
              const iconContainer = e.target.previousSibling;
              iconContainer.style.borderColor = '#667eea';
              iconContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              
              // ✅ FIXED: Scale icon instead of inverting color
              const icon = iconContainer.querySelector('span');
              icon.style.transform = 'scale(1.2)';
              icon.style.filter = 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))';
              
              e.target.nextSibling.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
              
              const iconContainer = e.target.previousSibling;
              iconContainer.style.borderColor = '#e0e0e0';
              iconContainer.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
              
              // ✅ FIXED: Reset icon transform
              const icon = iconContainer.querySelector('span');
              icon.style.transform = 'scale(1)';
              icon.style.filter = 'none';
              
              e.target.nextSibling.style.borderColor = '#e0e0e0';
            }}
          />
          <InputGroup.Text 
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102, 126, 234, 0.05)';
              e.target.querySelector('span').style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.querySelector('span').style.transform = 'scale(1)';
            }}
          >
            <span style={{ 
              fontSize: '1.2rem',
              transition: 'transform 0.3s ease'
            }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </InputGroup.Text>
        </InputGroup>
      </Form.Group>

      {/* Remember Me & Forgot Password */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Form.Check 
          type="checkbox"
          id="remember-me"
          label="Remember me"
          style={{
            fontSize: '0.9rem',
            color: '#6c757d'
          }}
          className="custom-checkbox"
        />
        <a 
          href="#" 
          style={{
            fontSize: '0.9rem',
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#764ba2';
            e.target.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#667eea';
            e.target.style.textDecoration = 'none';
          }}
        >
          Forgot password?
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-100 fw-semibold login-submit-btn"
        style={{
          padding: '1rem',
          fontSize: '1.05rem',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
        onMouseDown={(e) => {
          e.target.style.transform = 'translateY(0) scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.target.style.transform = 'translateY(-2px) scale(1)';
        }}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Signing in...
          </>
        ) : (
          <>
            <span className="me-2">🔐</span>
            Sign In
          </>
        )}
      </Button>

      {/* Additional Styles */}
      <style>{`
        .custom-checkbox input[type="checkbox"]:checked {
          background-color: #667eea;
          border-color: #667eea;
        }

        .custom-checkbox input[type="checkbox"]:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .login-submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .login-submit-btn:hover::before {
          left: 100%;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Smooth transition for all icons */
        .input-icon-email span,
        .input-icon-password span {
          display: inline-block;
        }
      `}</style>
    </Form>
  );
}
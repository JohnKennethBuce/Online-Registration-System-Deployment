import { Container, Row, Col, Card } from 'react-bootstrap';
import LoginForm from '../components/LoginForm';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LoginPage() {
  return (
    <div 
      className="gradient-bg d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', padding: '20px' }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card className="shadow-lg border-0 overflow-hidden" style={{ animation: 'fadeIn 0.6s ease-out' }}>
              {/* Header Section */}
              <div 
                className="text-white text-center py-5"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '-50%', 
                  right: '-10%', 
                  width: '200px', 
                  height: '200px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '50%',
                  animation: 'float 6s ease-in-out infinite'
                }}></div>
                
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-30%', 
                  left: '-5%', 
                  width: '150px', 
                  height: '150px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '50%',
                  animation: 'float 4s ease-in-out infinite'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
                  <h2 className="fw-bold mb-2">Welcome Back!</h2>
                  <p className="mb-0 opacity-90">
                    Online Registration System
                  </p>
                </div>
              </div>

              {/* Login Form Section */}
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h4 className="fw-semibold mb-2" style={{ color: '#2c3e50' }}>
                    Sign In to Your Account
                  </h4>
                  <p className="text-muted small">
                    Enter your credentials to access the dashboard
                  </p>
                </div>

                <LoginForm />

                {/* Footer Links */}
                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted small mb-0">
                    Having trouble? <a href="#" className="text-primary fw-semibold">Contact Support</a>
                  </p>
                </div>
              </Card.Body>

              {/* Bottom Accent */}
              <div 
                style={{ 
                  height: '5px', 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' 
                }}
              ></div>
            </Card>

            {/* Version Info */}
            <div className="text-center mt-4">
              <p className="text-white small mb-0" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                v1.0.0 • © 2024 Registration System
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Floating Particles Background (Optional) */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .gradient-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
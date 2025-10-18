import { Container, Row, Col, Card } from 'react-bootstrap';
import LoginForm from '../components/LoginForm';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LoginPage() {
  return (
    <div 
      className="gradient-bg d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', padding: '20px', position: 'relative' }}
    >
      {/* Animated Background Elements */}
      <div className="floating-particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card 
              className="login-card shadow-lg border-0 overflow-hidden" 
              style={{ 
                animation: 'fadeIn 0.6s ease-out',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)'
              }}
            >
              
              {/* Header Section with Enhanced Design */}
              <div 
                className="login-header text-white d-flex flex-column align-items-center justify-content-center py-5 text-center"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '240px'
                }}
              >
                {/* Animated Floating Circles */}
                <div className="floating-circle circle-1" style={{ 
                  position: 'absolute', 
                  top: '-50%', 
                  right: '-10%', 
                  width: '200px', 
                  height: '200px', 
                  background: 'rgba(255,255,255,0.15)', 
                  borderRadius: '50%',
                  animation: 'float 6s ease-in-out infinite',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
                }}></div>
                
                <div className="floating-circle circle-2" style={{ 
                  position: 'absolute', 
                  bottom: '-30%', 
                  left: '-5%', 
                  width: '150px', 
                  height: '150px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '50%',
                  animation: 'float 4s ease-in-out infinite 1s',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
                }}></div>

                <div className="floating-circle circle-3" style={{ 
                  position: 'absolute', 
                  top: '20%', 
                  left: '10%', 
                  width: '80px', 
                  height: '80px', 
                  background: 'rgba(255,255,255,0.08)', 
                  borderRadius: '50%',
                  animation: 'float 5s ease-in-out infinite 0.5s'
                }}></div>

                {/* Icon with Pulse Animation */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div 
                    className="login-icon"
                    style={{ 
                      fontSize: '4.5rem', 
                      marginBottom: '1.25rem',
                      animation: 'iconPulse 2s ease-in-out infinite',
                      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))'
                    }}
                  >
                    🎫
                  </div>
                  <h2 className="fw-bold mb-2" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
                    Welcome Back!
                  </h2>
                  <p className="mb-0" style={{ opacity: 0.95, fontSize: '1.05rem' }}>
                    Online Registration System
                  </p>
                </div>
              </div>

              {/* Login Form Section with Better Spacing */}
              <Card.Body className="p-5" style={{ padding: '3rem 3rem 2.5rem !important' }}>
                <div className="text-center mb-4">
                  <h4 className="fw-bold mb-2" style={{ color: '#2c3e50', fontSize: '1.5rem' }}>
                    Sign In to Your Account
                  </h4>
                  <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
                    Enter your credentials to access the dashboard
                  </p>
                </div>

                {/* Login Form Component */}
                <LoginForm />

                {/* Footer Links with Hover Effect */}
                <div className="text-center mt-4 pt-4 border-top">
                  <p className="text-muted small mb-0">
                    Having trouble? {' '}
                    <a 
                      href="#" 
                      className="support-link fw-semibold"
                      style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        position: 'relative',
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
                      Contact Support
                    </a>
                  </p>
                </div>
              </Card.Body>

              {/* Bottom Accent with Gradient */}
              <div 
                style={{ 
                  height: '6px', 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'gradientSlide 3s ease infinite'
                }}
              ></div>
            </Card>

            {/* Version Info with Hover */}
            <div className="text-center mt-4">
              <p 
                className="text-white small mb-0 version-info" 
                style={{ 
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.textShadow = '0 4px 12px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.textShadow = '0 2px 8px rgba(0,0,0,0.3)';
                }}
              >
                v1.0.0 • © 2024 Registration System
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Enhanced Styles */}
      <style>{`
        /* Float Animation */
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }

        /* Icon Pulse */
        @keyframes iconPulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.1); 
          }
        }

        /* Gradient Slide */
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Particle Animation */
        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(-5px, -20px); }
          75% { transform: translate(-10px, -10px); }
        }

        /* Gradient Background with Radial Gradients */
        .gradient-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 40%);
          pointer-events: none;
          animation: gradientMove 20s ease infinite;
        }

        @keyframes gradientMove {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        /* Floating Particles */
        .floating-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          animation: particleFloat 15s infinite ease-in-out;
        }

        .particle-1 {
          width: 8px;
          height: 8px;
          top: 20%;
          left: 20%;
          animation-delay: 0s;
          animation-duration: 12s;
        }

        .particle-2 {
          width: 6px;
          height: 6px;
          top: 60%;
          left: 80%;
          animation-delay: 2s;
          animation-duration: 15s;
        }

        .particle-3 {
          width: 10px;
          height: 10px;
          top: 40%;
          left: 60%;
          animation-delay: 4s;
          animation-duration: 18s;
        }

        .particle-4 {
          width: 5px;
          height: 5px;
          top: 80%;
          left: 30%;
          animation-delay: 6s;
          animation-duration: 14s;
        }

        /* Card Hover Effect */
        .login-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3) !important;
        }

        /* Header Hover Effect */
        .login-header {
          transition: all 0.3s ease;
        }

        .login-card:hover .login-header {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        /* Version Info */
        .version-info {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
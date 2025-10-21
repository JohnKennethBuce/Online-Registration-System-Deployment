import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, ListGroup, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS IMPORT
import api from "../api/axios";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth(); // ✅ Get user from auth context
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reportsCounts, setReportsCounts] = useState(null);
  const [serverMode, setServerMode] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [summaryRes, countsRes, modeRes, userRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/reports-counts'),
        api.get('/server-mode'),
        api.get('/auth/me')
      ]);
      
      setSummary(summaryRes.data);
      setReportsCounts(countsRes.data);
      setServerMode(modeRes.data.current_mode);
      setUser(userRes.data);
      
      // Extract recent scans from summary if available
      if (summaryRes.data.scans_per_user) {
        setRecentScans(summaryRes.data.scans_per_user.slice(0, 5));
      }
      
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper function to check permissions
  const hasPermission = (permission) => {
    if (!permission) return true;
    return authUser?.role?.permissions?.includes(permission) || user?.role?.permissions?.includes(permission);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchDashboardData}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  // Calculate percentages for progress bars
  const totalRegistrations = reportsCounts?.total || 0;
  const paidPercentage = totalRegistrations > 0 ? (reportsCounts.paid / totalRegistrations * 100) : 0;
  const printedPercentage = totalRegistrations > 0 ? (reportsCounts.printed / totalRegistrations * 100) : 0;

  // Get registration type breakdown
  const regByType = summary?.registrations_by_type || [];
  const confirmedVsPending = summary?.confirmed_vs_pending || [];
  const confirmedCount = confirmedVsPending.find(item => item.confirmed === 1)?.total || 0;
  const pendingCount = confirmedVsPending.find(item => item.confirmed === 0)?.total || 0;

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
            🏠 Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-muted mb-0">
            Online Registration System Dashboard
          </p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={fetchDashboardData}>
            🔄 Refresh
          </Button>
        </Col>
      </Row>

      {/* Server Mode Alert */}
      {serverMode && (
        <Row className="mb-4">
          <Col>
            <Alert 
              variant={
                serverMode.mode === 'both' ? 'success' :
                serverMode.mode === 'deactivate' ? 'danger' : 'info'
              }
              className="d-flex justify-content-between align-items-center mb-0"
            >
              <div>
                <strong>Server Mode:</strong> {serverMode.mode?.toUpperCase() || 'Unknown'}
                <span className="ms-2">•</span>
                <small className="ms-2">
                  Last updated by {serverMode.activated_by?.name || 'System'}
                </small>
              </div>
              {hasPermission('edit-server-mode') && (
                <Button 
                  variant="outline-dark" 
                  size="sm"
                  onClick={() => navigate('/dashboard/server-mode')}
                >
                  Manage Mode
                </Button>
              )}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Key Metrics Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Total Registrants</p>
                  <h2 className="mb-0 fw-bold text-primary">{totalRegistrations}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '2rem' }}>👥</span>
                </div>
              </div>
              <div className="mt-3">
                {hasPermission('view-reports') && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100"
                    onClick={() => navigate('/dashboard/reports')}
                  >
                    View Reports
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Confirmed</p>
                  <h2 className="mb-0 fw-bold text-success">{confirmedCount}</h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '2rem' }}>✅</span>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  {pendingCount} pending confirmation
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Badges Printed</p>
                  <h2 className="mb-0 fw-bold text-info">{reportsCounts?.printed || 0}</h2>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '2rem' }}>🎫</span>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar 
                  now={printedPercentage} 
                  variant="info"
                  style={{ height: '6px' }}
                />
                <small className="text-muted">{printedPercentage.toFixed(1)}% printed</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Payments Received</p>
                  <h2 className="mb-0 fw-bold text-success">{reportsCounts?.paid || 0}</h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <span style={{ fontSize: '2rem' }}>💰</span>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar 
                  now={paidPercentage} 
                  variant="success"
                  style={{ height: '6px' }}
                />
                <small className="text-muted">{paidPercentage.toFixed(1)}% paid</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Left Column */}
        <Col xs={12} lg={8}>
          {/* ✅ UPDATED QUICK ACTIONS WITH CORRECT ROUTES */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">⚡ Quick Actions</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {/* QR Scanner */}
                {hasPermission('scan-registration') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-primary text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/scanner')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>📷</div>
                        <h6 className="mt-2 mb-0">Scan QR Code</h6>
                        <small className="text-muted">Check-in attendees</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Reports */}
                {hasPermission('view-reports') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-success text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/reports')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>📊</div>
                        <h6 className="mt-2 mb-0">View Reports</h6>
                        <small className="text-muted">Export & analyze data</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Badge Settings */}
                {hasPermission('edit-settings') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-info text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/settings')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>⚙️</div>
                        <h6 className="mt-2 mb-0">Badge Settings</h6>
                        <small className="text-muted">Configure badges</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Server Mode */}
                {hasPermission('edit-server-mode') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-warning text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/server-mode')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>🖥️</div>
                        <h6 className="mt-2 mb-0">Server Mode</h6>
                        <small className="text-muted">Manage registration mode</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Registrations */}
                {hasPermission('view-registrations') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-danger text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/registrations')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>📈</div>
                        <h6 className="mt-2 mb-0">Registrations</h6>
                        <small className="text-muted">Print & Edit Information</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* New Registration */}
                {hasPermission('create-registration') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-success text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/register-new')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>➕</div>
                        <h6 className="mt-2 mb-0">New Registration</h6>
                        <small className="text-muted">Add new attendee</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* User Management */}
                {(user?.role?.name === 'superadmin' || hasPermission('view-users')) && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-dark text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/user-management')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>👨‍💼</div>
                        <h6 className="mt-2 mb-0">User Management</h6>
                        <small className="text-muted">Manage users & roles</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Role Management */}
                {(user?.role?.name === 'superadmin' || hasPermission('manage-roles')) && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-secondary text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/role-management')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>🔐</div>
                        <h6 className="mt-2 mb-0">Role Management</h6>
                        <small className="text-muted">Manage permissions</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Registration Type Breakdown */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">📝 Registration Types</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                {regByType.map((type, index) => {
                  const percentage = totalRegistrations > 0 ? (type.total / totalRegistrations * 100) : 0;
                  const colors = ['primary', 'info', 'success'];
                  const icons = ['🏢', '🌐', '📋'];
                  
                  return (
                    <Col xs={12} md={4} key={index}>
                      <div className="text-center">
                        <div style={{ fontSize: '2.5rem' }}>{icons[index % 3]}</div>
                        <h4 className="mt-2 mb-1 fw-bold">{type.total}</h4>
                        <p className="text-muted mb-2 text-capitalize">{type.registration_type}</p>
                        <ProgressBar 
                          now={percentage} 
                          variant={colors[index % 3]}
                          style={{ height: '8px' }}
                        />
                        <small className="text-muted">{percentage.toFixed(1)}%</small>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">🕒 Recent Scans Activity</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {recentScans && recentScans.length > 0 ? (
                <ListGroup variant="flush">
                  {recentScans.map((scanUser, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{scanUser.name}</strong>
                        <br />
                        <small className="text-muted">{scanUser.email}</small>
                      </div>
                      <Badge bg="primary" pill>
                        {scanUser.scans_count || 0} scans
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center p-5 text-muted">
                  <p className="mb-0">No recent scan activity</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Sidebar */}
        <Col xs={12} lg={4}>
          {/* User Info Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4 text-center">
              <div 
                className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '80px', height: '80px' }}
              >
                <span style={{ fontSize: '2.5rem' }}>👤</span>
              </div>
              <h5 className="mb-1 fw-bold">{user?.name}</h5>
              <p className="text-muted mb-2">{user?.email}</p>
              <Badge bg="primary" className="mb-3">{user?.role?.name || 'User'}</Badge>
              <div className="d-grid">
                <Button variant="outline-primary" size="sm">
                  Edit Profile
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* System Status */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">📊 System Status</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Total Registrations</span>
                  <strong>{totalRegistrations}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Confirmed</span>
                  <Badge bg="success">{confirmedCount}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Pending</span>
                  <Badge bg="warning" text="dark">{pendingCount}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Badges Printed</span>
                  <Badge bg="info">{reportsCounts?.printed || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Reprinted</span>
                  <Badge bg="warning" text="dark">{reportsCounts?.reprinted || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Paid</span>
                  <Badge bg="success">{reportsCounts?.paid || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Unpaid</span>
                  <Badge bg="danger">{reportsCounts?.unpaid || 0}</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Payment Status */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">💳 Payment Overview</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-success fw-semibold">Paid</span>
                  <span className="fw-bold">{reportsCounts?.paid || 0}</span>
                </div>
                <ProgressBar 
                  now={paidPercentage} 
                  variant="success"
                  style={{ height: '10px' }}
                  label={`${paidPercentage.toFixed(0)}%`}
                />
              </div>

              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-danger fw-semibold">Unpaid</span>
                  <span className="fw-bold">{reportsCounts?.unpaid || 0}</span>
                </div>
                <ProgressBar 
                  now={100 - paidPercentage} 
                  variant="danger"
                  style={{ height: '10px' }}
                  label={`${(100 - paidPercentage).toFixed(0)}%`}
                />
              </div>

              <div className="text-center mt-4">
                <h3 className="mb-0 fw-bold text-success">
                  {paidPercentage.toFixed(1)}%
                </h3>
                <small className="text-muted">Collection Rate</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add hover effect styles */}
      <style>{`
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </Container>
  );
}
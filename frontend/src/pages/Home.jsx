import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Badge, ListGroup, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Use auth context directly
  
  const [summary, setSummary] = useState(null);
  const [reportsCounts, setReportsCounts] = useState(null);
  const [serverMode, setServerMode] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [partialLoad, setPartialLoad] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Helper function to check permissions
  const hasPermission = (permission) => {
    if (!permission) return true;
    return user?.role?.permissions?.includes(permission);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrors({});
      
      const fetchPromises = [];
      const errorTracker = {};

      // ✅ Always fetch server mode (public endpoint)
      fetchPromises.push(
        api.get('/server-mode')
          .then(res => ({ type: 'serverMode', data: res.data }))
          .catch(err => {
            errorTracker.serverMode = err.message;
            return { type: 'serverMode', data: null };
          })
      );

      // ✅ Fetch summary if user has dashboard permission
      if (hasPermission('view-dashboard')) {
        fetchPromises.push(
          api.get('/dashboard/summary')
            .then(res => ({ type: 'summary', data: res.data }))
            .catch(err => {
              errorTracker.summary = err.message;
              return { type: 'summary', data: null };
            })
        );
      }

      // ✅ Fetch reports counts if user has reports permission
      if (hasPermission('view-reports')) {
        fetchPromises.push(
          api.get('/dashboard/reports-counts')
            .then(res => ({ type: 'reportsCounts', data: res.data }))
            .catch(err => {
              errorTracker.reportsCounts = err.message;
              return { type: 'reportsCounts', data: null };
            })
        );
      }

      // Execute all fetches in parallel
      const results = await Promise.all(fetchPromises);

      // Process results
      results.forEach(result => {
        if (result.data) {
          switch (result.type) {
            case 'serverMode':
              setServerMode(result.data.current_mode || result.data);
              break;
            case 'summary':
              setSummary(result.data);
              // Extract recent scans
              if (result.data.scans_per_user) {
                setRecentScans(result.data.scans_per_user.slice(0, 5));
              }
              break;
            case 'reportsCounts':
              setReportsCounts(result.data);
              break;
          }
        }
      });

      // Check if we had any errors
      if (Object.keys(errorTracker).length > 0) {
        setErrors(errorTracker);
        setPartialLoad(true);
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      setErrors({ global: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loading spinner
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-semibold">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  // ✅ Show error if complete failure
  if (errors.global && !partialLoad) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>⚠️ Error Loading Dashboard</Alert.Heading>
          <p>{errors.global}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={fetchDashboardData}>
              🔄 Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // ✅ Calculate metrics safely
  // ✅ CORRECTED: Calculate metrics safely with proper data structure
const totalRegistrations = reportsCounts?.total || summary?.total_registrations || 0;

// ✅ FIX: Access payment_status correctly (nested object)
const paidCount = reportsCounts?.payment_status?.paid || 0;
const unpaidCount = reportsCounts?.payment_status?.unpaid || 0;
const complimentaryCount = reportsCounts?.payment_status?.complimentary || 0;

// ✅ FIX: Access badge_status correctly (nested object)
const notPrintedCount = reportsCounts?.badge_status?.not_printed || 0;
const printedCount = reportsCounts?.badge_status?.printed || 0;
const reprintedCount = reportsCounts?.badge_status?.reprinted || 0;

const paidPercentage = totalRegistrations > 0 ? (paidCount / totalRegistrations * 100) : 0;
const printedPercentage = totalRegistrations > 0 ? (printedCount / totalRegistrations * 100) : 0;

// ✅ Get breakdown data
const regByType = summary?.registrations_by_type || [];
const confirmedVsPending = summary?.confirmed_vs_pending || [];
const confirmedCount = confirmedVsPending.find(item => item.confirmed === 1)?.total || 
                       reportsCounts?.confirmed || 
                       summary?.confirmed_count || 0;
const pendingCount = confirmedVsPending.find(item => item.confirmed === 0)?.total || 
                     reportsCounts?.unconfirmed || 
                     (totalRegistrations - confirmedCount);

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
            🏠 Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-muted mb-0">
            ICEGEX 2025 - Online Registration System Dashboard
          </p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={fetchDashboardData} disabled={loading}>
            🔄 Refresh
          </Button>
        </Col>
      </Row>

      {/* ✅ Partial Load Warning */}
      {partialLoad && Object.keys(errors).length > 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" dismissible onClose={() => setPartialLoad(false)}>
              <Alert.Heading>⚠️ Partial Data Load</Alert.Heading>
              <p className="mb-0">Some dashboard components couldn't be loaded. Showing available data.</p>
              <small className="text-muted">
                Failed: {Object.keys(errors).join(', ')}
              </small>
            </Alert>
          </Col>
        </Row>
      )}

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
                <strong>🖥️ Server Mode:</strong> 
                <Badge 
                  bg={serverMode.mode === 'both' ? 'success' : serverMode.mode === 'deactivate' ? 'danger' : 'info'}
                  className="ms-2"
                >
                  {serverMode.mode?.toUpperCase() || 'Unknown'}
                </Badge>
                {serverMode.activated_by && (
                  <>
                    <span className="mx-2">•</span>
                    <small>
                      Set by {serverMode.activated_by?.name || 'System'} 
                      {serverMode.activated_at && ` on ${new Date(serverMode.activated_at).toLocaleString()}`}
                    </small>
                  </>
                )}
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
        <Card className="border-0 shadow-sm h-100 hover-card">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted mb-1 small">Badges Printed</p>
                <h2 className="mb-0 fw-bold text-info">{printedCount}</h2>
                {reprintedCount > 0 && (
                  <small className="text-muted d-block mt-1">
                    +{reprintedCount} reprinted
                  </small>
                )}
                {notPrintedCount > 0 && (
                  <small className="text-warning d-block mt-1">
                    {notPrintedCount} pending
                  </small>
                )}
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
              <small className="text-muted">
                {printedPercentage.toFixed(1)}% printed
              </small>
            </div>
          </Card.Body>
        </Card>
      </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100 hover-card">
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
          <Card className="border-0 shadow-sm h-100 hover-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Badges Printed</p>
                  <h2 className="mb-0 fw-bold text-info">{printedCount}</h2>
                  {reprintedCount > 0 && (
                    <small className="text-muted">+{reprintedCount} reprinted</small>
                  )}
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
          <Card className="border-0 shadow-sm h-100 hover-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Payments Received</p>
                  <h2 className="mb-0 fw-bold text-success">{paidCount}</h2>
                  {complimentaryCount > 0 && (
                    <small className="text-info">+{complimentaryCount} complimentary</small>
                  )}
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
          {/* Quick Actions */}
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

                {/* Registrations */}
                {hasPermission('view-registrations') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-info text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/registrations')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>📋</div>
                        <h6 className="mt-2 mb-0">Registrations</h6>
                        <small className="text-muted">View & manage all</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Reports */}
                {hasPermission('view-reports') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-warning text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/reports')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>📊</div>
                        <h6 className="mt-2 mb-0">Reports</h6>
                        <small className="text-muted">Analytics & export</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Server Mode */}
                {hasPermission('edit-server-mode') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-danger text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/server-mode')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>🖥️</div>
                        <h6 className="mt-2 mb-0">Server Mode</h6>
                        <small className="text-muted">Manage mode</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Badge Settings */}
                {hasPermission('edit-settings') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-secondary text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/settings')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>⚙️</div>
                        <h6 className="mt-2 mb-0">Settings</h6>
                        <small className="text-muted">Badge & system config</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* User Management */}
                {hasPermission('view-users') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-dark text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/user-management')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>👨‍💼</div>
                        <h6 className="mt-2 mb-0">User Management</h6>
                        <small className="text-muted">Manage users</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Role Management */}
                {hasPermission('manage-roles') && (
                  <Col xs={12} sm={6} md={4}>
                    <Card 
                      className="h-100 border-primary text-center cursor-pointer hover-shadow"
                      onClick={() => navigate('/dashboard/role-management')}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '3rem' }}>🔐</div>
                        <h6 className="mt-2 mb-0">Roles & Permissions</h6>
                        <small className="text-muted">Manage access</small>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Registration Type Breakdown */}
          {regByType.length > 0 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-primary">📝 Registration Types</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  {regByType.map((type, index) => {
                    const percentage = totalRegistrations > 0 ? (type.total / totalRegistrations * 100) : 0;
                    const typeConfig = {
                      'onsite': { color: 'primary', icon: '🏢' },
                      'online': { color: 'info', icon: '🌐' },
                      'pre-registered': { color: 'secondary', icon: '📋' },
                      'complimentary': { color: 'success', icon: '🎁' }
                    };
                    const config = typeConfig[type.registration_type] || typeConfig['onsite'];
                    
                    return (
                      <Col xs={12} sm={6} md={4} lg={3} key={index}>
                        <div className="text-center">
                          <div style={{ fontSize: '2.5rem' }}>{config.icon}</div>
                          <h4 className="mt-2 mb-1 fw-bold">{type.total}</h4>
                          <p className="text-muted mb-2 text-capitalize">
                            {type.registration_type.replace('-', ' ')}
                          </p>
                          <ProgressBar 
                            now={percentage} 
                            variant={config.color}
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
          )}

          {/* Recent Activity */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-semibold text-primary">🕒 Recent Scan Activity</h5>
              {hasPermission('view-dashboard') && recentScans.length > 0 && (
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  View All
                </Button>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {recentScans && recentScans.length > 0 ? (
                <ListGroup variant="flush">
                  {recentScans.map((scanUser, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center py-3">
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <span>👤</span>
                        </div>
                        <div>
                          <strong className="d-block">{scanUser.name}</strong>
                          <small className="text-muted">{scanUser.email}</small>
                        </div>
                      </div>
                      <Badge bg="primary" pill style={{ fontSize: '0.9rem' }}>
                        {scanUser.scans_count || 0} scans
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center p-5 text-muted">
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>📊</div>
                  <p className="mb-0 mt-2">No recent scan activity</p>
                  <small>Scans will appear here once attendees check in</small>
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
              <Badge bg="primary" className="mb-3 px-3 py-2">
                {user?.role?.name?.toUpperCase() || 'USER'}
              </Badge>
              <div className="d-grid gap-2">
                <small className="text-muted">
                  Last login: {new Date().toLocaleDateString()}
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* System Status */}
          {reportsCounts && (
            <Card className="shadow-sm border-0 mb-4">
    <Card.Header className="bg-white border-bottom">
      <h5 className="mb-0 fw-semibold text-primary">📊 System Status</h5>
    </Card.Header>
    <Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
          <span className="text-muted">Total Registrations</span>
          <strong className="text-dark">{totalRegistrations}</strong>
        </ListGroup.Item>
        <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
          <span className="text-muted">Confirmed</span>
          <Badge bg="success">{confirmedCount}</Badge>
        </ListGroup.Item>
        <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
          <span className="text-muted">Pending</span>
          <Badge bg="warning" text="dark">{pendingCount}</Badge>
        </ListGroup.Item>
        
        {/* ✅ ADDED: Badge Status Details */}
        <ListGroup.Item className="px-0">
          <div className="text-muted mb-2 fw-semibold">Badge Status:</div>
        </ListGroup.Item>
        <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center" style={{ paddingTop: 0 }}>
          <span className="text-muted small ps-3">📄 Not Printed</span>
          <Badge bg="secondary">{notPrintedCount}</Badge>
        </ListGroup.Item>
        <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
          <span className="text-muted small ps-3">✅ Printed</span>
          <Badge bg="success">{printedCount}</Badge>
        </ListGroup.Item>
        {reprintedCount > 0 && (
          <ListGroup.Item className="px-0 d-flex justify-content-between align-items-center">
            <span className="text-muted small ps-3">🔄 Reprinted</span>
            <Badge bg="warning" text="dark">{reprintedCount}</Badge>
          </ListGroup.Item>
        )}
      </ListGroup>
    </Card.Body>
            </Card>
          )}

          {/* Payment Overview */}
          {reportsCounts && (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-primary">💳 Payment Overview</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-success fw-semibold">✅ Paid</span>
                    <span className="fw-bold">{paidCount}</span>
                  </div>
                  <ProgressBar 
                    now={paidPercentage} 
                    variant="success"
                    style={{ height: '10px' }}
                  />
                </div>

                {complimentaryCount > 0 && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-info fw-semibold">🎁 Complimentary</span>
                      <span className="fw-bold">{complimentaryCount}</span>
                    </div>
                    <ProgressBar 
                      now={totalRegistrations > 0 ? (complimentaryCount / totalRegistrations * 100) : 0} 
                      variant="info"
                      style={{ height: '10px' }}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-danger fw-semibold">❌ Unpaid</span>
                    <span className="fw-bold">{unpaidCount}</span>
                  </div>
                  <ProgressBar 
                    now={totalRegistrations > 0 ? (unpaidCount / totalRegistrations * 100) : 0} 
                    variant="danger"
                    style={{ height: '10px' }}
                  />
                </div>

                <div className="text-center mt-4 pt-4 border-top">
                  <h3 className="mb-0 fw-bold text-success">
                    {paidPercentage.toFixed(1)}%
                  </h3>
                  <small className="text-muted">Collection Rate</small>
                </div>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    {paidCount} of {totalRegistrations} paid
                  </small>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* ✅ Enhanced hover effect styles */}
      <style>{`
        .hover-shadow {
          transition: all 0.3s ease !important;
        }
        .hover-shadow:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1.5rem rgba(0,0,0,0.15) !important;
        }
        .hover-card {
          transition: all 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.25rem 1rem rgba(0,0,0,0.1) !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </Container>
  );
}
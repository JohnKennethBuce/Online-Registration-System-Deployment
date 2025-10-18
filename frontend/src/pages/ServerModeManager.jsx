import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, ButtonGroup } from 'react-bootstrap';
import api from "../api/axios";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ServerModeManager() {
  const [currentMode, setCurrentMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCurrentMode = async () => {
    setLoading(true);
    try {
      const res = await api.get("/server-mode");
      setCurrentMode(res.data.current_mode);
      setError(null);
    } catch (err) {
      setError("Failed to fetch server mode.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/server-mode/history");
      setHistory(res.data.history || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchCurrentMode();
    fetchHistory();
  }, []);

  const handleSetMode = async (mode) => {
    setIsUpdating(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.post("/server-mode", { mode });
      setMessage({ 
        type: 'success', 
        text: `Server mode successfully changed to: ${mode.toUpperCase()}` 
      });
      
      // Refetch both mode and history
      await fetchCurrentMode();
      await fetchHistory();
      
      // Auto-hide success message
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Failed to update server mode' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Mode configuration with colors and icons
  const modeConfig = {
    onsite: {
      label: 'Onsite Only',
      icon: '🏢',
      color: 'primary',
      description: 'Only on-site registrations are allowed',
      variant: 'primary'
    },
    online: {
      label: 'Online Only',
      icon: '🌐',
      color: 'info',
      description: 'Only online registrations are allowed',
      variant: 'info'
    },
    both: {
      label: 'Hybrid Mode',
      icon: '🔄',
      color: 'success',
      description: 'Both onsite and online registrations are allowed',
      variant: 'success'
    },
    deactivate: {
      label: 'Deactivated',
      icon: '🚫',
      color: 'danger',
      description: 'All registrations are disabled',
      variant: 'danger'
    }
  };

  const getCurrentModeConfig = () => {
    const mode = currentMode?.mode?.toLowerCase() || 'deactivate';
    return modeConfig[mode] || modeConfig.deactivate;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading server status...</p>
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
          <Button variant="outline-danger" onClick={fetchCurrentMode}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  const activeModeConfig = getCurrentModeConfig();

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
            ⚙️ Server Mode Management
          </h2>
          <p className="text-muted mb-0">
            Control registration availability across different channels
          </p>
        </Col>
      </Row>

      {/* Messages */}
      {message.text && (
        <Row className="mb-3">
          <Col>
            <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="g-4">
        {/* Current Status Card */}
        <Col xs={12} lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header 
              className="text-white border-0"
              style={{ 
                background: `linear-gradient(135deg, ${
                  activeModeConfig.color === 'primary' ? '#667eea 0%, #764ba2' :
                  activeModeConfig.color === 'info' ? '#4facfe 0%, #00f2fe' :
                  activeModeConfig.color === 'success' ? '#43e97b 0%, #38f9d7' :
                  '#f093fb 0%, #f5576c'
                } 100%)` 
              }}
            >
              <h5 className="mb-0 fw-semibold">📊 Current Server Mode</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center py-4">
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                  {activeModeConfig.icon}
                </div>
                <h3 className="fw-bold mb-3">
                  <Badge bg={activeModeConfig.variant} className="px-4 py-2" style={{ fontSize: '1.2rem' }}>
                    {activeModeConfig.label}
                  </Badge>
                </h3>
                <p className="text-muted mb-0">
                  {activeModeConfig.description}
                </p>
              </div>

              {currentMode && (
                <div className="mt-4 pt-3 border-top">
                  <Row className="text-center">
                    <Col>
                      <small className="text-muted d-block mb-1">Last Updated By</small>
                      <strong>{currentMode.activated_by?.name || 'System'}</strong>
                    </Col>
                    <Col>
                      <small className="text-muted d-block mb-1">Updated At</small>
                      <strong>{new Date(currentMode.created_at).toLocaleString()}</strong>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Mode Selector Card */}
        <Col xs={12} lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">🎛️ Change Server Mode</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted mb-4">
                Select a new mode to control which registration types are allowed
              </p>

              <div className="d-grid gap-3">
                {/* Onsite Button */}
                <Button
                  variant={currentMode?.mode === 'onsite' ? 'primary' : 'outline-primary'}
                  size="lg"
                  onClick={() => handleSetMode('onsite')}
                  disabled={isUpdating || currentMode?.mode === 'onsite'}
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <span className="me-2">🏢</span>
                    <strong>Onsite Only</strong>
                  </span>
                  {currentMode?.mode === 'onsite' && (
                    <Badge bg="light" text="primary">Active</Badge>
                  )}
                </Button>

                {/* Online Button */}
                <Button
                  variant={currentMode?.mode === 'online' ? 'info' : 'outline-info'}
                  size="lg"
                  onClick={() => handleSetMode('online')}
                  disabled={isUpdating || currentMode?.mode === 'online'}
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <span className="me-2">🌐</span>
                    <strong>Online Only</strong>
                  </span>
                  {currentMode?.mode === 'online' && (
                    <Badge bg="light" text="info">Active</Badge>
                  )}
                </Button>

                {/* Both Button */}
                <Button
                  variant={currentMode?.mode === 'both' ? 'success' : 'outline-success'}
                  size="lg"
                  onClick={() => handleSetMode('both')}
                  disabled={isUpdating || currentMode?.mode === 'both'}
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <span className="me-2">🔄</span>
                    <strong>Hybrid Mode (Both)</strong>
                  </span>
                  {currentMode?.mode === 'both' && (
                    <Badge bg="light" text="success">Active</Badge>
                  )}
                </Button>

                {/* Deactivate Button */}
                <Button
                  variant={currentMode?.mode === 'deactivate' ? 'danger' : 'outline-danger'}
                  size="lg"
                  onClick={() => handleSetMode('deactivate')}
                  disabled={isUpdating || currentMode?.mode === 'deactivate'}
                  className="d-flex align-items-center justify-content-between"
                >
                  <span>
                    <span className="me-2">🚫</span>
                    <strong>Deactivate All</strong>
                  </span>
                  {currentMode?.mode === 'deactivate' && (
                    <Badge bg="light" text="danger">Active</Badge>
                  )}
                </Button>
              </div>

              {isUpdating && (
                <div className="text-center mt-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span className="text-muted">Updating server mode...</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* History Card */}
        <Col xs={12}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold text-primary">📜 Mode Change History</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Loading...
                    </>
                  ) : (
                    '🔄 Refresh'
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loadingHistory ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : history.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">Mode</th>
                        <th>Changed By</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 10).map((entry, index) => {
                        const config = modeConfig[entry.mode?.toLowerCase()] || modeConfig.deactivate;
                        return (
                          <tr key={index}>
                            <td className="px-4">
                              <Badge bg={config.variant} className="px-3 py-2">
                                {config.icon} {config.label}
                              </Badge>
                            </td>
                            <td>{entry.activated_by?.name || 'System'}</td>
                            <td className="text-muted">
                              {new Date(entry.created_at).toLocaleString()}
                            </td>
                            <td>
                              {index === 0 ? (
                                <Badge bg="success">Current</Badge>
                              ) : (
                                <Badge bg="secondary">Previous</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-5 text-muted">
                  <p className="mb-0">No history available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Info Cards */}
      <Row className="mt-4">
        <Col xs={12} md={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div style={{ fontSize: '32px' }}>🏢</div>
              <h6 className="mt-2 mb-1 fw-semibold">Onsite Mode</h6>
              <small className="text-muted">Physical registration desk only</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div style={{ fontSize: '32px' }}>🌐</div>
              <h6 className="mt-2 mb-1 fw-semibold">Online Mode</h6>
              <small className="text-muted">Web-based registration only</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div style={{ fontSize: '32px' }}>🔄</div>
              <h6 className="mt-2 mb-1 fw-semibold">Hybrid Mode</h6>
              <small className="text-muted">Both channels active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div style={{ fontSize: '32px' }}>🚫</div>
              <h6 className="mt-2 mb-1 fw-semibold">Deactivated</h6>
              <small className="text-muted">All registrations disabled</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
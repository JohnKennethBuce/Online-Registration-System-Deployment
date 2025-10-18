import { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, ListGroup, Spinner } from 'react-bootstrap';
import api from '../api/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ScannerPage() {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [lastScanned, setLastScanned] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const t = setInterval(focus, 1000); // keep focus for HID scanners
    return () => clearInterval(t);
  }, []);

  // Play sound feedback
  const playSound = (success) => {
    const audio = new Audio(success 
      ? 'data:audio/wav;base64,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' 
      : 'data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YfgAAACAgICAgICAgICAgICAgICAgIA=');
    audio.play().catch(() => {}); // Ignore errors if sound fails
  };

  const extractTicket = (text) => {
    if (!text) return null;
    const s = String(text).trim();
    const match = s.toUpperCase().match(/TICKET-[A-Z0-9]+/);
    return match ? match[0] : null;
  };

  const handleProcess = async (ticket) => {
    setError('');
    setStatus('');
    setIsProcessing(true);

    const printWin = window.open('', '_blank');

    try {
      // 1) Update statuses and log scan
      await api.post(`/registrations/${ticket}/scan`);

      // 2) Navigate to badge print page
      const badgeUrl = `/print-badge/${ticket}`;
      if (printWin) {
        printWin.location = badgeUrl;
        printWin.focus();
      } else {
        window.open(badgeUrl, '_blank');
      }

      // Success feedback
      setStatus(`✅ Success! Badge printing for ${ticket}`);
      setLastScanned({ ticket, status: 'success', time: new Date() });
      playSound(true);

      // Update stats and history
      setStats(prev => ({ 
        ...prev, 
        total: prev.total + 1, 
        success: prev.success + 1 
      }));
      
      setScanHistory(prev => [
        { ticket, status: 'success', time: new Date() },
        ...prev.slice(0, 9) // Keep last 10
      ]);

      // Clear input after 2 seconds
      setTimeout(() => {
        setRaw('');
        setStatus('');
        inputRef.current?.focus();
      }, 2000);

    } catch (err) {
      if (printWin) try { printWin.close(); } catch (_) {}

      const statusCode = err.response?.status;
      const msg =
        statusCode === 404 ? '❌ Ticket not found in system' :
        statusCode === 403 ? '❌ Scan not allowed (check server mode or permissions)' :
        statusCode === 409 ? '⚠️ Reprint limit reached for this badge' :
        err.response?.data?.error || err.response?.data?.message || '❌ Scan/print failed';
      
      setError(msg);
      setLastScanned({ ticket, status: 'error', time: new Date(), message: msg });
      playSound(false);

      // Update stats
      setStats(prev => ({ 
        ...prev, 
        total: prev.total + 1, 
        failed: prev.failed + 1 
      }));

      setScanHistory(prev => [
        { ticket, status: 'error', time: new Date(), message: msg },
        ...prev.slice(0, 9)
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const ticket = extractTicket(raw);
    if (!ticket) {
      setError('❌ Invalid scan. Could not find a ticket number.');
      playSound(false);
      return;
    }
    handleProcess(ticket);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const ticket = extractTicket(raw);
      if (!ticket) {
        setError('❌ Invalid scan. Could not find a ticket number.');
        playSound(false);
        return;
      }
      handleProcess(ticket);
    }
  };

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
            📷 QR Code Scanner & Badge Printer
          </h2>
          <p className="text-muted mb-0">
            Scan attendee QR codes to verify registration and print badges
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Left Column: Scanner */}
        <Col xs={12} lg={8}>
          {/* Status Messages */}
          {status && (
            <Alert variant="success" className="mb-3 shadow-sm" dismissible onClose={() => setStatus('')}>
              <div className="d-flex align-items-center">
                <div style={{ fontSize: '24px', marginRight: '15px' }}>✅</div>
                <div>
                  <strong>{status}</strong>
                </div>
              </div>
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="mb-3 shadow-sm" dismissible onClose={() => setError('')}>
              <div className="d-flex align-items-center">
                <div style={{ fontSize: '24px', marginRight: '15px' }}>❌</div>
                <div>
                  <strong>{error}</strong>
                </div>
              </div>
            </Alert>
          )}

          {/* Main Scanner Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header 
              className="text-white border-0"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <h5 className="mb-0 fw-semibold">🎯 Scan Area</h5>
            </Card.Header>
            <Card.Body className="p-5" style={{ backgroundColor: isProcessing ? '#e3f2fd' : '#fff' }}>
              <Form onSubmit={onSubmit}>
                <Form.Group>
                  <div className="text-center mb-3">
                    <div style={{ fontSize: '64px', marginBottom: '15px' }}>
                      {isProcessing ? '⏳' : '📷'}
                    </div>
                    <p className="text-muted mb-3">
                      {isProcessing ? 'Processing scan...' : 'Focus the field below and scan the QR code'}
                    </p>
                  </div>

                  <Form.Control
                    ref={inputRef}
                    type="text"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Click here and scan QR code..."
                    disabled={isProcessing}
                    autoFocus
                    size="lg"
                    style={{ 
                      fontSize: '20px', 
                      textAlign: 'center',
                      padding: '20px',
                      border: isProcessing ? '3px solid #2196F3' : '3px dashed #ccc',
                      backgroundColor: isProcessing ? '#e3f2fd' : '#fff'
                    }}
                  />
                </Form.Group>

                <div className="d-grid mt-3">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={isProcessing || !raw.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      <>🖨️ Print Badge</>
                    )}
                  </Button>
                </div>
              </Form>

              {/* Last Scanned Info */}
              {lastScanned && (
                <div className="mt-4 pt-3 border-top">
                  <Row>
                    <Col xs={6}>
                      <small className="text-muted d-block">Last Scanned</small>
                      <strong>{lastScanned.ticket}</strong>
                    </Col>
                    <Col xs={6} className="text-end">
                      <small className="text-muted d-block">Status</small>
                      <Badge bg={lastScanned.status === 'success' ? 'success' : 'danger'}>
                        {lastScanned.status === 'success' ? '✅ Success' : '❌ Failed'}
                      </Badge>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-light border-top-0">
              <small className="text-muted">
                💡 <strong>Tip:</strong> Enable "Enter/Newline suffix" in your scanner settings for auto-submit
              </small>
            </Card.Footer>
          </Card>

          {/* Scan History */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">📜 Recent Scans</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {scanHistory.length > 0 ? (
                <ListGroup variant="flush">
                  {scanHistory.map((scan, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{scan.ticket}</strong>
                        <br />
                        <small className="text-muted">{scan.time.toLocaleTimeString()}</small>
                      </div>
                      <div>
                        <Badge bg={scan.status === 'success' ? 'success' : 'danger'}>
                          {scan.status === 'success' ? '✅ Success' : '❌ Failed'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center p-5 text-muted">
                  <p className="mb-0">No scans yet. Start scanning QR codes!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Stats & Info */}
        <Col xs={12} lg={4}>
          <div style={{ position: 'sticky', top: '20px' }}>
            {/* Statistics Card */}
            <Card className="shadow-sm border-0 mb-3">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-primary">📊 Session Statistics</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col xs={12}>
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                      <h1 className="mb-0 fw-bold text-primary">{stats.total}</h1>
                      <small className="text-muted">Total Scans</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                      <h2 className="mb-0 fw-bold text-success">{stats.success}</h2>
                      <small className="text-muted">Successful</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center p-3 rounded" style={{ backgroundColor: '#ffebee' }}>
                      <h2 className="mb-0 fw-bold text-danger">{stats.failed}</h2>
                      <small className="text-muted">Failed</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Instructions Card */}
            <Card className="shadow-sm border-0 mb-3">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-primary">📖 How to Use</h5>
              </Card.Header>
              <Card.Body>
                <ol className="ps-3 mb-0">
                  <li className="mb-2">Click the scan field to focus it</li>
                  <li className="mb-2">Scan the attendee's QR code</li>
                  <li className="mb-2">Badge will auto-print in new window</li>
                  <li className="mb-0">Repeat for next attendee</li>
                </ol>
              </Card.Body>
            </Card>

            {/* Status Codes Card */}
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-semibold text-primary">ℹ️ Error Codes</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0 py-2">
                    <Badge bg="danger" className="me-2">404</Badge>
                    <small>Ticket not found</small>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2">
                    <Badge bg="warning" text="dark" className="me-2">403</Badge>
                    <small>Scan not allowed</small>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2">
                    <Badge bg="warning" text="dark" className="me-2">409</Badge>
                    <small>Reprint limit reached</small>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
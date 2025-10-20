import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from "../api/axios";
import ImageUploadField from '../components/ImageUploadField';
import BadgePreview from '../components/BadgePreview';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    event_location: '',
    event_datetime: '',
    event_name: '',
    main_logo_path: '',
    organizer_logo_path: '',
    manager_logo_path: '',
    registration_logo_path: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState(null);

  const sampleRegistration = {
    firstName: "John",
    lastName: "Doe",
    companyName: "Sample Company Inc."
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      setError('Could not load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const res = await api.post('/settings', {
        event_location: settings.event_location,
        event_datetime: settings.event_datetime,
        event_name: settings.event_name,
      });
      setMessage({ type: 'success', text: res.data.message || 'Settings saved successfully!' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading settings...</p>
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
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-3 px-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold mb-2" style={{ color: '#2c3e50' }}>
            ⚙️ Badge Settings
          </h2>
          <p className="text-muted mb-0">
            Customize your event details and manage logos for printable badges
          </p>
        </Col>
      </Row>

      {/* Success/Error Messages */}
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
        {/* Left Column: Settings Form */}
        <Col xs={12} lg={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">📝 Event Details</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    📍 Event Location
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="event_location"
                    value={settings.event_location}
                    onChange={handleChange}
                    placeholder="e.g., Convention Center Hall A"
                    size="lg"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    📅 Date & Time
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="event_datetime"
                    value={settings.event_datetime}
                    onChange={handleChange}
                    placeholder="e.g., January 15, 2024 - 9:00 AM"
                    size="lg"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    ⌛ Event Duration Day
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="event_name"
                    value={settings.event_name}
                    onChange={handleChange}
                    placeholder="e.g., DAY 1, Opening Ceremony"
                    size="lg"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isSaving}
                    size="lg"
                    className="fw-semibold"
                  >
                    {isSaving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>💾 Save Event Details</>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Logo Management Card */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-semibold text-primary">🖼️ Logo Management</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-grid gap-3">
                <ImageUploadField 
                  label="Main Event Logo" 
                  logoType="event" 
                  currentImagePath={settings.main_logo_path} 
                  onUploadSuccess={fetchSettings} 
                />
                
                <ImageUploadField 
                  label="Organizer Logo" 
                  logoType="organizer" 
                  currentImagePath={settings.organizer_logo_path} 
                  onUploadSuccess={fetchSettings} 
                />
                
                <ImageUploadField 
                  label="Event Manager Logo" 
                  logoType="manager" 
                  currentImagePath={settings.manager_logo_path} 
                  onUploadSuccess={fetchSettings} 
                />
                
                <ImageUploadField 
                  label="Registration Logo" 
                  logoType="registration" 
                  currentImagePath={settings.registration_logo_path} 
                  onUploadSuccess={fetchSettings} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Live Preview - Sticky on desktop */}
        <Col xs={12} lg={5}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-gradient text-gray text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h5 className="mb-0 fw-semibold">👁️ Live Preview</h5>
              </Card.Header>
              <Card.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="text-center mb-3">
                  <small className="text-muted">Preview updates automatically as you make changes</small>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '400px'
                }}>
                  <BadgePreview 
                    settings={settings} 
                    registration={sampleRegistration} 
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Sample Data Info */}
            <Card className="shadow-sm border-0 mt-3">
              <Card.Body className="p-3">
                <small className="text-muted">
                  <strong>Preview Data:</strong>
                  <ul className="mb-0 mt-2" style={{ fontSize: '0.875rem' }}>
                    <li>Name: {sampleRegistration.firstName} {sampleRegistration.lastName}</li>
                    <li>Company: {sampleRegistration.companyName}</li>
                  </ul>
                </small>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
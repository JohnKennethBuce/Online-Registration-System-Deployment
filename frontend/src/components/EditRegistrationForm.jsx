import { useState, useEffect } from "react";
import { Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';

export default function EditRegistrationForm({ registration, onSave, onCancel }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (registration) {
      setFormData({
        first_name: registration.first_name || '',
        last_name: registration.last_name || '',
        email: registration.email || '',
        phone: registration.phone || '',
        address: registration.address || '',
        company_name: registration.company_name || '',
        registration_type: registration.registration_type || 'onsite',
      });
    }
  }, [registration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // The onSave function (from the parent) will handle the API call
    // We pass the form data along with the original ID.
    try {
        await onSave({ ...formData, id: registration.id });
    } catch(err) {
        // This allows the parent component to pass back an error message
        setError(err.message || "An unknown error occurred.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="g-3">
        <Col md={6}>
          <Form.Group controlId="formFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="formLastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="formPhone">
            <Form.Label>Phone</Form.Label>
            <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group controlId="formCompany">
            <Form.Label>Company Name</Form.Label>
            <Form.Control type="text" name="company_name" value={formData.company_name} onChange={handleChange} />
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group controlId="formAddress">
            <Form.Label>Address</Form.Label>
            <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} />
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group controlId="formRegType">
            <Form.Label>Registration Type</Form.Label>
            <Form.Select name="registration_type" value={formData.registration_type} onChange={handleChange}>
              <option value="onsite">Onsite</option>
              <option value="online">Online</option>
              <option value="pre-registered">Pre-Registered</option>
              <option value="complimentary">Complimentary</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Save Changes'}
        </Button>
      </div>
    </Form>
  );
}
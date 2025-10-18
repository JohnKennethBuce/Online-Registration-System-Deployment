import { useState } from 'react';
import { Form, Button, Image, Spinner, Alert } from 'react-bootstrap';
import api from '../api/axios';

export default function ImageUploadField({ label, logoType, currentImagePath, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage({ type: '', text: '' });
    
    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'warning', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('logo_type', logoType);
    formData.append('logo_file', file);

    try {
      const res = await api.post('/dashboard/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      setFile(null);
      setPreview(null);
      
      // Reset file input
      e.target.reset();
      
      // Refresh parent settings
      if (onUploadSuccess) onUploadSuccess();
      
      // Auto-hide success message
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ 
        type: 'danger', 
        text: err.response?.data?.message || 'Upload failed. Please try again.' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Build current image URL
  const currentImageUrl = currentImagePath 
    ? `${api.defaults.baseURL}/storage/${currentImagePath.replace(/^storage\//, '')}`
    : null;

  return (
    <div className="p-3 border rounded" style={{ backgroundColor: '#fff' }}>
      <h6 className="fw-semibold mb-3">{label}</h6>
      
      {/* Current Image Display */}
      {currentImageUrl && !preview && (
        <div className="mb-3 text-center">
          <p className="text-muted small mb-2">Current Logo:</p>
          <Image 
            src={currentImageUrl} 
            alt={label} 
            thumbnail 
            style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Preview New Image */}
      {preview && (
        <div className="mb-3 text-center">
          <p className="text-success small mb-2">New Logo Preview:</p>
          <Image 
            src={preview} 
            alt="Preview" 
            thumbnail 
            style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Upload Form */}
      <Form onSubmit={handleUpload}>
        <Form.Group className="mb-2">
          <Form.Control 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={uploading}
            size="sm"
          />
          <Form.Text className="text-muted">
            Max 2MB. JPG, PNG, SVG supported.
          </Form.Text>
        </Form.Group>

        {message.text && (
          <Alert variant={message.type} className="py-2 px-3 small mb-2">
            {message.text}
          </Alert>
        )}

        <Button 
          type="submit" 
          variant="outline-primary" 
          size="sm" 
          disabled={!file || uploading}
          className="w-100"
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Uploading...
            </>
          ) : (
            <>📤 Upload {label}</>
          )}
        </Button>
      </Form>
    </div>
  );
}
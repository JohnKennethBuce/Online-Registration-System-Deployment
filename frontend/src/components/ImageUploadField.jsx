import { useState } from 'react';
import { Form, Button, Image, Spinner, Alert } from 'react-bootstrap';
import api from '../api/axios';

export default function ImageUploadField({ label, logoType, currentImagePath, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [preview, setPreview] = useState(null);

  const backendUrl = api.defaults.baseURL.replace('/api', '');

  const getImageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = String(path)
      .replace(/\\/g, '/')
      .replace(/^\/?storage\/?/i, '');
    return `${backendUrl}/storage/${normalized}`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage({ type: '', text: '' });
    
    // Create preview for newly selected file
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
      const fileInput = document.querySelector(`input[type="file"][data-logo-type="${logoType}"]`);
      if (fileInput) fileInput.value = '';
      
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

  const currentImageUrl = getImageUrl(currentImagePath);

  return (
    <div className="p-3 border rounded" style={{ backgroundColor: '#fff' }}>
      <h6 className="fw-semibold mb-3">{label}</h6>
      
      {/* Current Logo Display */}
      {!preview && currentImageUrl && (
        <div className="mb-3 text-center p-3 bg-light rounded">
          <p className="text-muted small mb-2">
            <strong>Current Logo:</strong>
          </p>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '100px',
              maxHeight: '150px',
              overflow: 'hidden'
            }}
          >
            <Image 
              src={currentImageUrl} 
              alt={label} 
              thumbnail 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '150px', 
                objectFit: 'contain'
              }}
              key={currentImagePath}
              onLoad={() => console.log(`✅ ${label} loaded`)}
              onError={(e) => {
                console.error(`❌ ${label} failed to load`);
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect width="200" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="12"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>
      )}

      {/* New Logo Preview (before upload) */}
      {preview && (
        <div className="mb-3 text-center p-3 rounded" style={{ backgroundColor: '#d4edda', border: '2px solid #28a745' }}>
          <p className="text-success small mb-2">
            <strong>New Logo Preview:</strong>
          </p>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '100px',
              maxHeight: '150px',
              overflow: 'hidden'
            }}
          >
            <Image 
              src={preview} 
              alt="Preview" 
              thumbnail 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '150px', 
                objectFit: 'contain',
                border: '2px solid #28a745'
              }}
            />
          </div>
          <div className="mt-2">
            <small className="text-success">
              ✅ Ready to upload
            </small>
          </div>
        </div>
      )}

      {/* No Logo Message */}
      {!preview && !currentImageUrl && (
        <div className="mb-3 text-center p-4 bg-light rounded">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
          <p className="text-muted small mb-0">No logo uploaded yet</p>
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
            data-logo-type={logoType}
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
import { useState } from 'react';
import api from '../api/axios';

export default function ImageUploadField({ label, logoType, currentImagePath, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const backendUrl = api.defaults.baseURL.replace('/api', '');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('logo_file', file);
    formData.append('logo_type', logoType);

    try {
      const res = await api.post('/dashboard/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Upload successful!');
      onUploadSuccess(); // This will refresh the settings page
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
      setFile(null); // Clear the file input
    }
  };

  return (
    <div style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px' }}>
      <label><strong>{label}</strong></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '5px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px' }}>Current:</p>
          <img 
            src={`${backendUrl}/storage/${currentImagePath}`} 
            alt="Current logo" 
            style={{ height: '40px', border: '1px solid #ccc', background: '#f0f0f0' }} 
            // Add a simple cache-buster to show the new image after upload
            key={currentImagePath} 
          />
        </div>
        <div>
          <input type="file" onChange={handleFileChange} accept="image/jpeg, image/png" />
          <button type="button" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload New'}
          </button>
          {error && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
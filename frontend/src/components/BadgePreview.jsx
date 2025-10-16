import api from '../api/axios';

export default function BadgePreview({ settings, registration }) {
  const backendUrl = api.defaults.baseURL.replace('/api', '');
  const placeholderQr = "https://www.qr-code-generator.com/wp-content/themes/qr/new_structure/markets/core_market/generator/dist/generator/assets/images/websiteQRCode_noFrame.png";

  const getImageUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = String(path)
      .replace(/\\/g, '/')
      .replace(/^\/?storage\/?/i, '');
    return `${backendUrl}/storage/${normalized}`;
  };

  return (
    <div style={{
      width: '340px', 
      height: '245px',
      border: '1px solid #ccc',
      padding: '15px',
      boxSizing: 'border-box',
      position: 'relative',
      textAlign: 'center',
      fontFamily: 'sans-serif',
    }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
        <img 
          src={getImageUrl(settings.main_logo_path)} 
          alt="Main Logo" 
          style={{ maxWidth: '80px', maxHeight: '40px' }}
          key={settings.main_logo_path}
        />
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '10px', margin: 0, lineHeight: 1.2 }}>
            {settings.event_location}<br/>
            {settings.event_datetime}
          </p>
        </div>
      </div>

      {/* MAIN CONTENT - 🔽 FIXED HERE 🔽 */}
      <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '0', marginBottom: '2px', whiteSpace: 'nowrap' }}>
        {registration.firstName || registration.first_name} {registration.lastName || registration.last_name}
      </p>
      <p style={{ fontSize: '14px', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '5px', minHeight: '16px' }}>
        {registration.companyName || registration.company_name || 'N/A'}
      </p>
      {/* 🔼 FIXED HERE 🔼 */}

      <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
        {settings.event_name}
      </p>

      <img src={placeholderQr} alt="QR Code Preview" style={{ width: '70px', height: '70px', margin: '0 auto' }} />

      {/* FOOTER SECTION */}
      <div style={{ position: 'absolute', bottom: '10px', width: '100%', left: 0, padding: '0 15px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8px' }}>
        <div style={{ textAlign: 'left' }}>
          <strong>Organized By:</strong><br/>
          <img src={getImageUrl(settings.organizer_logo_path)} alt="Organizer" style={{ maxHeight: '15px', maxWidth: '60px' }} key={settings.organizer_logo_path} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <strong>Event Manager:</strong><br/>
          <img src={getImageUrl(settings.manager_logo_path)} alt="Manager" style={{ maxHeight: '15px', maxWidth: '60px' }} key={settings.manager_logo_path} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <strong>Registration:</strong><br/>
          <img src={getImageUrl(settings.registration_logo_path)} alt="Registration" style={{ maxHeight: '15px', maxWidth: '60px' }} key={settings.registration_logo_path} />
        </div>
      </div>
    </div>
  );
}
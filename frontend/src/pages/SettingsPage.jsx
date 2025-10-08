import { useEffect, useState } from "react";
import api from "../api/axios";
import ImageUploadField from '../components/ImageUploadField';
import BadgePreview from '../components/BadgePreview';

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
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    const sampleRegistration = {
        firstName: "John",
        lastName: "Doe",
        companyName: "Sample Company Inc."
    };

    const fetchSettings = async () => {
        // No need to set loading to true here, as it's only called once
        // or after an upload, where the uploader has its own loading state.
        try {
            const res = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            setError('Error: Could not load initial settings.');
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
        setMessage('');
        try {
            const res = await api.post('/settings', {
                event_location: settings.event_location,
                event_datetime: settings.event_datetime,
                event_name: settings.event_name,
            });
            setMessage('✅ ' + res.data.message);
        } catch (err) {
            setMessage('❌ Error saving settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p>Loading settings...</p>;
    if (error) return <p style={{ color: "red" }}>❌ {error}</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>⚙️ Badge Settings</h2>
            <p>Update the text and logos that appear on the printable badge.</p>
            {message && <p>{message}</p>}

            <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                
                {/* Column 1: The Form */}
                <div style={{ flex: 2 }}>
                    <form onSubmit={handleSubmit}>
                        <fieldset style={{ border: '1px solid #ccc', padding: '15px' }}>
                            <legend>Event Details</legend>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="event_location">Location</label><br/>
                                <input id="event_location" name="event_location" type="text" value={settings.event_location} onChange={handleChange} style={{ width: '400px' }} />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="event_datetime">Date & Time</label><br/>
                                <input id="event_datetime" name="event_datetime" type="text" value={settings.event_datetime} onChange={handleChange} style={{ width: '400px' }} />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="event_name">Event Name (e.g., "DAY 1")</label><br/>
                                <input id="event_name" name="event_name" type="text" value={settings.event_name} onChange={handleChange} style={{ width: '400px' }} />
                            </div>
                        </fieldset>
                        
                        <button type="submit" disabled={isSaving} style={{ marginTop: '20px' }}>
                            {isSaving ? 'Saving Text...' : 'Save Text Settings'}
                        </button>
                    </form>
                    
                    <fieldset style={{ marginTop: '30px', border: '1px solid #ccc', padding: '15px' }}>
                        <legend>Logo Management</legend>
                        <ImageUploadField label="Main Logo" logoType="event" currentImagePath={settings.main_logo_path} onUploadSuccess={fetchSettings} />
                        <ImageUploadField label="Organizer Logo" logoType="organizer" currentImagePath={settings.organizer_logo_path} onUploadSuccess={fetchSettings} />
                        <ImageUploadField label="Event Manager Logo" logoType="manager" currentImagePath={settings.manager_logo_path} onUploadSuccess={fetchSettings} />
                        <ImageUploadField label="Registration Logo" logoType="registration" currentImagePath={settings.registration_logo_path} onUploadSuccess={fetchSettings} />
                    </fieldset>
                </div>
                
                {/* Column 2: The Live Preview */}
                <div style={{ flex: 1 }}>
                    <h3>Live Preview</h3>
                    <BadgePreview settings={settings} registration={sampleRegistration} />
                </div>
            </div>
        </div>
    );
}
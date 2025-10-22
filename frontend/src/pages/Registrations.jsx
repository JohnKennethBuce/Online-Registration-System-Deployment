import { useEffect, useState } from "react";
import api from "../api/axios";
import EditRegistrationForm from "../components/EditRegistrationForm";
import { useAuth } from "../context/AuthContext";
import * as XLSX from 'xlsx';
// ===========================
// MODAL COMPONENTS
// ===========================
// Inline Modal Component with improved styling
const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  if (!isOpen) return null;
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const sizeStyles = {
    small: { width: '90%', maxWidth: '400px' },
    medium: { width: '90%', maxWidth: '600px' },
    large: { width: '90%', maxWidth: '900px' }
  };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={handleBackdropClick}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        ...sizeStyles[size],
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out',
        margin: '20px'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              lineHeight: 1,
              color: '#999',
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.color = '#333';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#999';
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
// Payment Status Modal Component
const PaymentStatusModal = ({ isOpen, onClose, registration, onConfirm, isUpdating }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
 
  if (!registration) return null;
  const currentStatus = registration.payment_status || 'unpaid';
  const handleConfirm = () => {
    if (!selectedStatus) {
      alert('Please select a payment status');
      return;
    }
    if (selectedStatus === currentStatus) {
      alert('Please select a different status than the current one');
      return;
    }
    onConfirm(selectedStatus);
  };
  const paymentOptions = [
    { value: 'paid', label: 'Paid', color: '#28a745', icon: '✅' },
    { value: 'unpaid', label: 'Unpaid', color: '#dc3545', icon: '❌' },
    { value: 'complimentary', label: 'Complimentary', color: '#17a2b8', icon: '🎁' },
  ];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Payment Status" size="small">
      <div style={{ padding: '10px 0' }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Registration Details</h4>
          <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
            <div><strong>Name:</strong> {registration.first_name} {registration.last_name}</div>
            <div><strong>Company:</strong> {registration.company_name || 'N/A'}</div>
            <div><strong>Ticket:</strong> {registration.ticket_number}</div>
            <div style={{ marginTop: '10px' }}>
              <strong>Current Status:</strong>{' '}
              <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: currentStatus === 'paid' ? '#28a745' :
                               currentStatus === 'unpaid' ? '#dc3545' : '#17a2b8',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                {currentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>Select New Status</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {paymentOptions.map(option => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `2px solid ${selectedStatus === option.value ? option.color : '#dee2e6'}`,
                  backgroundColor: selectedStatus === option.value ? `${option.color}15` : 'white',
                  cursor: option.value === currentStatus ? 'not-allowed' : 'pointer',
                  opacity: option.value === currentStatus ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name="paymentStatus"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={option.value === currentStatus}
                  style={{ marginRight: '12px' }}
                />
                <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>{option.icon}</span>
                <span style={{
                  fontWeight: selectedStatus === option.value ? 'bold' : 'normal',
                  color: option.value === currentStatus ? '#6c757d' : '#212529'
                }}>
                  {option.label}
                  {option.value === currentStatus && ' (Current)'}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '1px solid #dee2e6'
        }}>
          <button
            onClick={onClose}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              color: '#6c757d',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!isUpdating) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus || isUpdating}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              backgroundColor: selectedStatus ?
                (selectedStatus === 'paid' ? '#28a745' :
                 selectedStatus === 'unpaid' ? '#dc3545' : '#17a2b8') : '#6c757d',
              color: 'white',
              borderRadius: '6px',
              cursor: !selectedStatus || isUpdating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: !selectedStatus || isUpdating ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isUpdating ? 'Updating...' : 'Confirm Update'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
// Confirm Delete Modal
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", danger = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div>
        <p style={{ fontSize: '1rem', color: '#495057', marginBottom: '20px', whiteSpace: 'pre-line' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              color: '#6c757d',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: danger ? '#dc3545' : '#007bff',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
// ✅ FAST Import Modal
const ImportModal = ({ isOpen, onClose, onImport, isImporting, importResult }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  const validateAndSetFile = (selectedFile) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
   
    if (!validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      alert('❌ Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('❌ File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
   
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  const handleImport = () => {
    if (!file) {
      alert('Please select an Excel file');
      return;
    }
    onImport(file);
  };
  const handleClose = () => {
    if (isImporting) {
      const confirmClose = window.confirm('Import is in progress. Are you sure you want to cancel?');
      if (!confirmClose) return;
    }
    setFile(null);
    onClose();
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📥 Import Pre-Registrations"
      size="medium"
    >
      <div style={{ padding: '10px 0' }}>
        {/* Instructions */}
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderLeft: '4px solid #007bff',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>📋 Required Columns</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <li><strong>first_name</strong> - Required</li>
            <li><strong>last_name</strong> - Required</li>
            <li><strong>company_name</strong> - Optional</li>
            <li><strong>address</strong> - Optional</li>
            <li><strong>email</strong> - Optional</li>
            <li><strong>phone</strong> - Optional</li>
            <li><strong>payment_status</strong> - Optional (paid/unpaid/complimentary)</li>
            <li><strong>registration_type</strong> - Optional (onsite/online/pre-registered)</li>
          </ul>
        </div>
        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#007bff' : '#dee2e6'}`,
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            backgroundColor: isDragging ? '#e7f3ff' : '#f8f9fa',
            transition: 'all 0.3s',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
          onClick={() => !isImporting && document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={isImporting}
            style={{ display: 'none' }}
          />
         
          {file ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📄</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#28a745', marginBottom: '5px' }}>
                ✓ {file.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                {(file.size / 1024).toFixed(2)} KB
              </div>
              {!isImporting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '5px 15px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Remove File
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📁</div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#495057', marginBottom: '5px' }}>
                {isDragging ? 'Drop file here' : 'Drag & drop Excel file here'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '10px' }}>
                or click to browse
              </div>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                Supported: .xlsx, .xls (Max 10MB)
              </div>
            </div>
          )}
        </div>
        {/* Progress Indicator */}
        {isImporting && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1s linear infinite' }}>⏳</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#007bff', marginBottom: '5px' }}>
              Processing Excel File...
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
              Please wait, this may take a moment
            </div>
          </div>
        )}
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleClose}
            disabled={isImporting}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              color: '#6c757d',
              borderRadius: '6px',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              opacity: isImporting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !file}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '6px',
              cursor: isImporting || !file ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: isImporting || !file ? 0.6 : 1
            }}
          >
            {isImporting ? '⏳ Importing...' : '📥 Start Import'}
          </button>
        </div>
        {/* Import Report */}
        {importResult && !isImporting && (
          <div style={{
            padding: '15px',
            backgroundColor: importResult.hasErrors ? '#fff3cd' : '#d4edda',
            borderRadius: '8px',
            border: `1px solid ${importResult.hasErrors ? '#ffc107' : '#28a745'}`
          }}>
            <h4 style={{
              margin: '0 0 10px 0',
              color: importResult.hasErrors ? '#856404' : '#155724'
            }}>
              ✅ Import Complete
            </h4>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem',
              color: '#212529',
              margin: 0,
              maxHeight: '300px',
              overflowY: 'auto',
              fontFamily: 'monospace'
            }}>
              {importResult.report}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
// ===========================
// MAIN COMPONENT
// ===========================
export default function Registrations() {
  const { user, loading: authLoading } = useAuth();
 
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [togglingPaymentId, setTogglingPaymentId] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
 
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(15);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [filters, setFilters] = useState({
    registrationType: 'all',
    paymentStatus: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const backendBase = api.defaults.baseURL;
  const isAuthorized =
    user &&
    ["admin", "superadmin"].includes(user.role?.name) &&
    user.role?.permissions?.includes("view-registrations");
  const canEdit = user?.role?.permissions?.includes("edit-registration");
  const canDelete = user?.role?.permissions?.includes("delete-registration");
  // ===========================
  // HELPER FUNCTIONS
  // ===========================
  const formatRegistrationType = (type) => {
    if (!type) return 'N/A';
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('-');
  };
  const getTypeColor = (type) => {
    switch (type) {
      case 'onsite': return '#007bff';
      case 'online': return '#17a2b8';
      case 'pre-registered': return '#6c757d';
      case 'complimentary': return '#28a745';
      default: return '#343a40';
    }
  };
  const getPaymentColor = (status) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'unpaid': return '#dc3545';
      case 'complimentary': return '#17a2b8';
      default: return '#6c757d';
    }
  };
  const getBadgeStatusColor = (statusName) => {
    switch (statusName) {
      case 'not_printed': return '#6c757d';
      case 'queued': return '#ffc107';
      case 'printing': return '#007bff';
      case 'printed': return '#28a745';
      case 'reprinted': return '#fd7e14';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // ===========================
  // DATA FETCHING
  // ===========================
  const fetchAllRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      let allData = [];
      let currentPageNum = 1;
      let lastPage = 1;
      do {
        const res = await api.get("/registrations", {
          params: { per_page: 500, page: currentPageNum }
        });
       
        const responseData = res.data;
       
        if (responseData.data) {
          allData = [...allData, ...responseData.data];
          lastPage = responseData.last_page || 1;
          currentPageNum++;
        } else {
          allData = Array.isArray(responseData) ? responseData : [];
          break;
        }
      } while (currentPageNum <= lastPage);
      console.log('✅ Loaded all registrations:', allData.length);
     
      setAllRegistrations(allData);
      setFilteredRegistrations(allData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load registrations");
      setAllRegistrations([]);
      setFilteredRegistrations([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isAuthorized) {
      fetchAllRegistrations();
    }
  }, [isAuthorized]);
  // ===========================
  // FILTER & SORT
  // ===========================
  const filterAndSortData = () => {
    let filtered = [...allRegistrations];
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(reg => {
        const firstName = (reg.first_name || '').toLowerCase();
        const lastName = (reg.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        const email = (reg.email || '').toLowerCase();
        const company = (reg.company_name || '').toLowerCase();
        const ticket = (reg.ticket_number || '').toLowerCase();
       
        return firstName.includes(searchLower)
          || lastName.includes(searchLower)
          || fullName.includes(searchLower)
          || email.includes(searchLower)
          || company.includes(searchLower)
          || ticket.includes(searchLower);
      });
    }
    if (filters.registrationType !== 'all') {
      filtered = filtered.filter(reg => reg.registration_type === filters.registrationType);
    }
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === filters.paymentStatus);
    }
    filtered.sort((a, b) => {
      const aVal = a.id || 0;
      const bVal = b.id || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    console.log(`🔍 Filtered: ${filtered.length} from ${allRegistrations.length}`);
    setFilteredRegistrations(filtered);
  };
  useEffect(() => {
    filterAndSortData();
    setCurrentPage(1);
  }, [search, sortOrder, filters, allRegistrations]);
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  const handleClearSearch = () => {
    setSearch('');
  };
  const handleToggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  const handleResetFilters = () => {
    setFilters({
      registrationType: 'all',
      paymentStatus: 'all',
    });
    setSearch('');
  };
  const toggleExpandRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };
  // ===========================
  // ACTION HANDLERS
  // ===========================
  const handlePaymentStatusChange = (registration) => {
    if (!canEdit) {
      alert("You don't have permission to change payment status.");
      return;
    }
    setSelectedRegistration(registration);
    setPaymentModalOpen(true);
  };
  const handlePaymentStatusUpdate = async (newStatus) => {
    if (!selectedRegistration) return;
   
    setTogglingPaymentId(selectedRegistration.id);
    setError(null);
    try {
      const response = await api.put(`/registrations/${selectedRegistration.id}/payment-status`, {
        payment_status: newStatus
      });
     
      const updatedData = response.data;
      setAllRegistrations(prevRegs =>
        prevRegs.map(reg => reg.id === selectedRegistration.id ? updatedData : reg)
      );
      setFilteredRegistrations(prevRegs =>
        prevRegs.map(reg => reg.id === selectedRegistration.id ? updatedData : reg)
      );
      setPaymentModalOpen(false);
      setSelectedRegistration(null);
     
      alert(`✅ Payment status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to update payment status";
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setTogglingPaymentId(null);
    }
  };
  const handleEditClick = (reg) => {
    setEditingRegistration(reg);
    setIsModalOpen(true);
  };
  const handleUpdateSave = async (updatedReg) => {
    try {
      await api.put(`/registrations/${updatedReg.id}`, updatedReg);
      setIsModalOpen(false);
      setEditingRegistration(null);
      fetchAllRegistrations();
      alert("✅ Registration updated successfully");
    } catch (error) {
      if (error.response?.status === 409) {
        alert(`❌ Update Failed:\n\n${error.response.data.error}\n\nPlease use a different name.`);
      } else {
        alert("❌ Failed to update registration. See console for details.");
      }
      console.error("Update failed:", error.response || error);
    }
  };
  const handleDelete = (reg) => {
    setRegistrationToDelete(reg);
    setDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (!registrationToDelete) return;
    try {
      const response = await api.delete(`/registrations/${registrationToDelete.id}`);
      if (response.status === 204) {
        setAllRegistrations(prev => prev.filter(reg => reg.id !== registrationToDelete.id));
        setFilteredRegistrations(prev => prev.filter(reg => reg.id !== registrationToDelete.id));
       
        if (currentRecords.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
       
        alert("✅ Registration deleted successfully");
      }
    } catch (error) {
      alert("❌ Failed to delete registration. See console for details.");
      console.error("Delete failed:", error.response || error);
    } finally {
      setRegistrationToDelete(null);
    }
  };
  const handlePrintBadge = async (reg) => {
    setError("");
    const ticket = reg.ticket_number;
    const printWin = window.open("", "_blank");
    setPrintingId(reg.id);
    try {
      await api.post(`/registrations/${ticket}/scan`);
      const badgeUrl = `/print-badge/${ticket}`;
      if (printWin) {
        printWin.location = badgeUrl;
        printWin.focus();
      } else {
        window.open(badgeUrl, "_blank");
      }
      fetchAllRegistrations();
    } catch (err) {
      if (printWin) {
        try { printWin.close(); } catch (_) {}
      }
      const code = err.response?.status;
      const msg =
        code === 404 ? "Ticket not found." :
        code === 403 ? "Scan not allowed in current mode or permission denied." :
        code === 409 ? "Reprint limit reached for this badge." :
        err.response?.data?.error || err.response?.data?.message || "Scan/print failed.";
      setError(msg);
      if (code && code !== 401) {
        const proceed = window.confirm(`${msg}\n\nOpen badge page anyway?`);
        if (proceed) {
          const badgeUrl = `${backendBase}/registrations/${ticket}/badge?show_qr=false&print=true`;
          window.open(badgeUrl, "_blank");
        }
      }
    } finally {
      setPrintingId(null);
    }
  };
    // ✅ FAST Import Handler
    // ✅ SIMPLIFIED Import Handler (now that backend batch is reliable)
    const handleImport = async (file) => {
      setIsImporting(true);
      setImportResult(null);
      setError(null);

      try {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Parse Excel
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setImportResult({
            report: '❌ Error: Excel file is empty or has no data rows',
            hasErrors: true
          });
          setIsImporting(false);
          return;
        }

        // Get headers
        const headers = jsonData[0].map(h => h.toString().toLowerCase().trim());
        const requiredHeaders = ['first_name', 'last_name'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setImportResult({
            report: `❌ Missing Required Columns: ${missingHeaders.join(', ')}\n\nFound: ${headers.join(', ')}`,
            hasErrors: true
          });
          setIsImporting(false);
          return;
        }

        // Parse rows
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
        const registrations = [];
        const clientErrors = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2;
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });

          const first_name = rowData.first_name?.toString().trim();
          const last_name = rowData.last_name?.toString().trim();

          if (!first_name || !last_name) {
            clientErrors.push(`Row ${rowNum}: Missing first_name or last_name`);
            return;
          }

          const normalizedType = rowData.registration_type
            ? rowData.registration_type.toString().toLowerCase().replace(/\s+/g, '-')
            : 'pre-registered';

          registrations.push({
            first_name,
            last_name,
            company_name: rowData.company_name?.toString().trim() || null,
            address: rowData.address?.toString().trim() || null,
            email: rowData.email?.toString().trim() || null,
            phone: rowData.phone?.toString().trim() || null,
            payment_status: rowData.payment_status?.toString().toLowerCase().trim() || 'unpaid',
            registration_type: normalizedType,
          });
        });

        if (registrations.length === 0) {
          setImportResult({
            report: `❌ No valid registrations to import\n\nValidation Errors:\n${clientErrors.join('\n')}`,
            hasErrors: true
          });
          setIsImporting(false);
          return;
        }

        // 🚀 SEND TO BACKEND BATCH ENDPOINT
        const response = await api.post('/registrations/batch', {
          registrations: registrations
        });

        const { successful, failed, errors: serverErrors, message } = response.data;

        // Combine client-side and server-side errors
        const allErrors = [...clientErrors, ...(serverErrors || [])];

        // Create final report
        const finalReport = `
        ╔════════════════════════════════════╗
        ║      IMPORT COMPLETE ✅             ║
        ╚════════════════════════════════════╝

        📊 Summary:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ✅ Successfully Imported:  ${successful}
        ❌ Failed:                 ${failed + clientErrors.length}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📝 Total Rows Processed:   ${rows.length}

        ${allErrors.length > 0 ? `\n⚠️ Errors (showing first 15):\n${allErrors.slice(0, 15).join('\n')}${allErrors.length > 15 ? `\n\n... and ${allErrors.length - 15} more errors` : ''}` : '\n🎉 All registrations imported successfully!'}
        `;

        setImportResult({
          report: finalReport.trim(),
          hasErrors: allErrors.length > 0
        });

        // Refresh registrations list if any were successful
        if (successful > 0) {
          await fetchAllRegistrations();
        }

      } catch (err) {
        console.error('Import error:', err);
        
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Unknown error occurred';

        setImportResult({
          report: `❌ Import Failed\n\n${errorMessage}\n\nPlease check your file format and try again.`,
          hasErrors: true
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setImportResult({
        report: '❌ Error: Failed to read file\n\nPlease ensure the file is not corrupted.',
        hasErrors: true
      });
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(file);

  } catch (err) {
    setError('Failed to process Excel file: ' + err.message);
    setIsImporting(false);
  }
};
  // ===========================
  // PAGINATION
  // ===========================
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    return (
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
          Showing <strong>{indexOfFirstRecord + 1}</strong> to{' '}
          <strong>{Math.min(indexOfLastRecord, filteredRegistrations.length)}</strong> of{' '}
          <strong>{filteredRegistrations.length}</strong> registrations
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              ...paginationButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            ⏮ First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              ...paginationButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            ← Previous
          </button>
          {startPage > 1 && (
            <>
              <button onClick={() => setCurrentPage(1)} style={paginationButtonStyle}>1</button>
              {startPage > 2 && <span style={{ padding: "0 8px", color: "#6c757d" }}>...</span>}
            </>
          )}
          {Array.from({ length: endPage - startPage + 1 }, (_, idx) => {
            const pageNum = startPage + idx;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  ...paginationButtonStyle,
                  ...(pageNum === currentPage ? activePaginationButtonStyle : {})
                }}
              >
                {pageNum}
              </button>
            );
          })}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span style={{ padding: "0 8px", color: "#6c757d" }}>...</span>}
              <button onClick={() => setCurrentPage(totalPages)} style={paginationButtonStyle}>{totalPages}</button>
            </>
          )}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              ...paginationButtonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next →
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              ...paginationButtonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Last ⏭
          </button>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>
      </div>
    );
  };
  // ===========================
  // RENDER HELPERS
  // ===========================
  const renderExpandedRow = (reg) => {
    return (
      <tr style={{ backgroundColor: '#f8f9fa' }}>
        <td colSpan="9" style={{ padding: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            fontSize: '0.9rem'
          }}>
            <div style={detailBoxStyle}>
              <h4 style={detailTitleStyle}>👤 Personal Information</h4>
              <div style={detailRowStyle}><strong>Email:</strong> {reg.email || 'Not provided'}</div>
              <div style={detailRowStyle}><strong>Phone:</strong> {reg.phone || 'Not provided'}</div>
              <div style={detailRowStyle}><strong>Address:</strong> {reg.address || 'Not provided'}</div>
              <div style={detailRowStyle}><strong>Designation:</strong> {reg.designation || 'Not provided'}</div>
            </div>
            <div style={detailBoxStyle}>
              <h4 style={detailTitleStyle}>📊 Demographics</h4>
              <div style={detailRowStyle}><strong>Age Range:</strong> {reg.age_range || 'Not provided'}</div>
              <div style={detailRowStyle}><strong>Gender:</strong> {reg.gender || 'Not provided'}</div>
              {reg.gender === 'Others' && reg.gender_other && (
                <div style={detailRowStyle}><strong>Gender (Other):</strong> {reg.gender_other}</div>
              )}
            </div>
            <div style={detailBoxStyle}>
              <h4 style={detailTitleStyle}>📝 Survey - ICEGEX 2025</h4>
              <div style={detailRowStyle}><strong>Industry Sector:</strong> {reg.industry_sector || 'Not provided'}</div>
              {reg.industry_sector === 'Others' && reg.industry_sector_other && (
                <div style={{ ...detailRowStyle, fontSize: '0.85rem', color: '#666', marginLeft: '15px' }}>
                  Specified: {reg.industry_sector_other}
                </div>
              )}
              <div style={detailRowStyle}><strong>Reason for Attending:</strong> {reg.reason_for_attending || 'Not provided'}</div>
              {reg.reason_for_attending === 'Others' && reg.reason_for_attending_other && (
                <div style={{ ...detailRowStyle, fontSize: '0.85rem', color: '#666', marginLeft: '15px' }}>
                  Specified: {reg.reason_for_attending_other}
                </div>
              )}
            </div>
            <div style={detailBoxStyle}>
              <h4 style={detailTitleStyle}>💡 Additional Information</h4>
              <div style={detailRowStyle}><strong>Areas of Interest:</strong> {reg.specific_areas_of_interest || 'Not provided'}</div>
              {reg.specific_areas_of_interest === 'Others' && reg.specific_areas_of_interest_other && (
                <div style={{ ...detailRowStyle, fontSize: '0.85rem', color: '#666', marginLeft: '15px' }}>
                  Other: {reg.specific_areas_of_interest_other}
                </div>
              )}
              <div style={detailRowStyle}><strong>How did you learn:</strong> {reg.how_did_you_learn_about || 'Not provided'}</div>
              {reg.how_did_you_learn_about === 'Others' && reg.how_did_you_learn_about_other && (
                <div style={{ ...detailRowStyle, fontSize: '0.85rem', color: '#666', marginLeft: '15px' }}>
                  Other: {reg.how_did_you_learn_about_other}
                </div>
              )}
            </div>
            <div style={detailBoxStyle}>
              <h4 style={detailTitleStyle}>⚙️ System Information</h4>
              <div style={detailRowStyle}><strong>Registered:</strong> {formatDate(reg.created_at)}</div>
              <div style={detailRowStyle}><strong>Registered By:</strong> {reg.registered_by?.name || 'System'}</div>
              <div style={detailRowStyle}><strong>Confirmed:</strong> {reg.confirmed ? `Yes (${formatDate(reg.confirmed_at)})` : 'No'}</div>
              <div style={detailRowStyle}><strong>Server Mode:</strong> {reg.server_mode || 'N/A'}</div>
            </div>
          </div>
        </td>
      </tr>
    );
  };
  // ===========================
  // STYLES
  // ===========================
  const paginationButtonStyle = {
    padding: "8px 12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.3s"
  };
  const activePaginationButtonStyle = {
    backgroundColor: "#0056b3",
    fontWeight: "bold",
    boxShadow: "0 2px 8px rgba(0,91,187,0.4)"
  };
  const detailBoxStyle = {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6'
  };
  const detailTitleStyle = {
    marginTop: 0,
    color: '#007bff',
    borderBottom: '2px solid #007bff',
    paddingBottom: '8px',
    marginBottom: '10px',
    fontSize: '1rem'
  };
  const detailRowStyle = {
    padding: '6px 0',
    borderBottom: '1px solid #e9ecef',
    fontSize: '0.9rem'
  };
  // ===========================
  // RENDER GUARDS
  // ===========================
  if (authLoading) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555", padding: "40px" }}>⏳ Checking authorization...</p>;
  if (!user) return <p style={{ color: "red", padding: "20px", textAlign: "center", fontSize: "1.2rem" }}>🔒 You must be logged in to view this page.</p>;
  if (!isAuthorized)
    return (
      <div style={{ padding: "40px", color: "#721c24", backgroundColor: "#f8d7da", textAlign: "center", fontSize: "1.2rem", borderRadius: "8px", margin: "20px" }}>
        ❌ Access Denied. You do not have permission to view registrations.
      </div>
    );
  if (loading && allRegistrations.length === 0) return <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#555", padding: "40px" }}>⏳ Loading registrations...</p>;
  // ===========================
  // MAIN RENDER
  // ===========================
  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: "1.8rem", margin: 0, color: "#333" }}>📋 Registrations - ICEGEX 2025</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canEdit && (
            <button
              onClick={() => setImportModalOpen(true)}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1
              }}
            >
              📥 Import Excel
            </button>
          )}
          <button onClick={fetchAllRegistrations} disabled={loading} style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            opacity: loading ? 0.6 : 1
          }}>
            🔄 Refresh
          </button>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div style={{
          padding: "12px 15px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          borderRadius: "4px",
          marginBottom: "15px",
          border: "1px solid #f5c6cb",
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#721c24'
          }}>✕</button>
        </div>
      )}
      {/* Search and Filters */}
      <div style={{
        padding: "15px",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #ddd",
      }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.9rem" }}>
              🔍 Search
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Search by name, email, company, ticket..."
                value={search}
                onChange={handleSearchChange}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.9rem" }}>
              📊 Sort
            </label>
            <button
              onClick={handleToggleSort}
              style={{
                padding: "10px 20px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600"
              }}
            >
              {sortOrder === 'asc' ? '↑ Oldest First' : '↓ Newest First'}
            </button>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.9rem", opacity: 0 }}>_</label>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: "10px 20px",
                backgroundColor: showFilters ? '#138496' : '#17a2b8',
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600"
              }}
            >
              🔍 {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>
        {showFilters && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.9rem" }}>
                  Registration Type
                </label>
                <select
                  value={filters.registrationType}
                  onChange={(e) => setFilters(prev => ({ ...prev, registrationType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="onsite">Onsite</option>
                  <option value="online">Online</option>
                  <option value="pre-registered">Pre-Registered</option>
                  <option value="complimentary">Complimentary</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "0.9rem" }}>
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "0.95rem",
                    backgroundColor: 'white'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="complimentary">Complimentary</option>
                </select>
              </div>
              <div>
                <button
                  onClick={handleResetFilters}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#ffc107",
                    color: "#212529",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: "600"
                  }}
                >
                  ↺ Reset
                </button>
              </div>
            </div>
            {(filters.registrationType !== 'all' || filters.paymentStatus !== 'all') && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', fontSize: '0.9rem', color: '#0c5460' }}>
                <strong>🔍 Active Filters:</strong>
                {filters.registrationType !== 'all' && <span style={{ marginLeft: '10px', padding: '2px 8px', backgroundColor: '#17a2b8', color: 'white', borderRadius: '12px', fontSize: '0.85rem' }}>Type: {formatRegistrationType(filters.registrationType)}</span>}
                {filters.paymentStatus !== 'all' && <span style={{ marginLeft: '10px', padding: '2px 8px', backgroundColor: '#17a2b8', color: 'white', borderRadius: '12px', fontSize: '0.85rem' }}>Payment: {filters.paymentStatus.toUpperCase()}</span>}
              </div>
            )}
          </div>
        )}
        {search && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', fontSize: '0.9rem', color: '#0c5460' }}>
            <strong>🔍 Search Results:</strong> Found <strong>{filteredRegistrations.length}</strong> of <strong>{allRegistrations.length}</strong> total registrations
          </div>
        )}
      </div>
      {/* Legend */}
      <div style={{
        padding: "10px 15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        marginBottom: "20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        alignItems: "center",
        border: "1px solid #ddd"
      }}>
        <h4 style={{ margin: 0, marginRight: "10px", fontSize: "1rem" }}>Legend:</h4>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "15px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#007bff", borderRadius: "3px" }}></span> Onsite
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#17a2b8", borderRadius: "3px" }}></span> Online
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#6c757d", borderRadius: "3px" }}></span> Pre-Registered
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#28a745", borderRadius: "3px" }}></span> Complimentary
          </span>
          <span style={{ margin: "0 10px", color: "#ddd" }}>|</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#28a745", borderRadius: "3px" }}></span> Paid
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#dc3545", borderRadius: "3px" }}></span> Unpaid
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "14px", height: "14px", backgroundColor: "#17a2b8", borderRadius: "3px" }}></span> Complimentary Payment
          </span>
          {canEdit && (
            <span style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#666" }}>
              (Click payment badge to toggle)
            </span>
          )}
        </div>
      </div>
      {/* Table - Keep your existing table code here */}
      <div style={{ overflowX: "auto", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px", backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: "#343a40", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>⋮</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                ID {sortOrder === 'asc' ? '↑' : '↓'}
              </th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Company</th>
              <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Ticket #</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Type</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Payment</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Badge</th>
              <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((reg, index) => (
                <>
                  <tr
                    key={reg.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                      transition: "background-color 0.3s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e6ea"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                  >
                    <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                      <button
                        onClick={() => toggleExpandRow(reg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          color: '#007bff',
                          padding: '4px 8px'
                        }}
                        title="View full details"
                      >
                        {expandedRowId === reg.id ? '▼' : '▶'}
                      </button>
                    </td>
                   
                    <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{reg.id}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                      {reg.first_name} {reg.last_name}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>{reg.company_name || "N/A"}</td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #ddd", fontSize: "0.85rem", fontFamily: 'monospace' }}>{reg.ticket_number}</td>
                   
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          color: "white",
                          backgroundColor: getTypeColor(reg.registration_type),
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                        }}
                      >
                        {formatRegistrationType(reg.registration_type)}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                      <span
                        onClick={() => canEdit && handlePaymentStatusChange(reg)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          color: "white",
                          backgroundColor: getPaymentColor(reg.payment_status),
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          cursor: canEdit ? "pointer" : "default",
                          opacity: togglingPaymentId === reg.id ? 0.6 : 1,
                          transition: "all 0.3s",
                          display: "inline-block",
                          userSelect: "none",
                          border: canEdit ? "2px solid transparent" : "none",
                        }}
                        onMouseOver={(e) => {
                          if (canEdit && togglingPaymentId !== reg.id) {
                            e.target.style.border = "2px solid #fff";
                            e.target.style.transform = "scale(1.05)";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (canEdit) {
                            e.target.style.border = "2px solid transparent";
                            e.target.style.transform = "scale(1)";
                          }
                        }}
                        title={canEdit ? `Click to change payment status (Current: ${reg.payment_status?.toUpperCase() || "UNPAID"})` : reg.payment_status?.toUpperCase() || "UNPAID"}
                      >
                        {togglingPaymentId === reg.id
                          ? "..."
                          : (reg.payment_status?.toUpperCase() || "UNPAID")
                        }
                      </span>
                    </td>
                   
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                      <span
                        style={{
                          color: getBadgeStatusColor(reg.badge_status?.name),
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          textTransform: 'uppercase'
                        }}
                      >
                        {reg.badge_status?.name?.replace('_', ' ') || 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handlePrintBadge(reg)}
                          disabled={printingId === reg.id}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            opacity: printingId === reg.id ? 0.5 : 1,
                            transition: "background-color 0.3s",
                            fontSize: "0.85rem"
                          }}
                          title="Print Badge"
                        >
                          {printingId === reg.id ? "⏳" : "🖨️"}
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEditClick(reg)}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "#ffc107",
                              color: "#212529",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "background-color 0.3s",
                              fontSize: "0.85rem"
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(reg)}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transition: "background-color 0.3s",
                              fontSize: "0.85rem"
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                 
                  {expandedRowId === reg.id && renderExpandedRow(reg)}
                </>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>
                  {search || filters.registrationType !== 'all' || filters.paymentStatus !== 'all' ? (
                    <>
                      🔍 No registrations found matching your filters
                      <br />
                      <button
                        onClick={handleResetFilters}
                        style={{
                          marginTop: "10px",
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Clear All Filters
                      </button>
                    </>
                  ) : (
                    "No registrations found"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {renderPagination()}
      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRegistration(null);
        }}
        title="Edit Registration"
        size="large"
      >
        {editingRegistration && (
          <EditRegistrationForm
            registration={editingRegistration}
            onSave={handleUpdateSave}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingRegistration(null);
            }}
          />
        )}
      </Modal>
      <PaymentStatusModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedRegistration(null);
        }}
        registration={selectedRegistration}
        onConfirm={handlePaymentStatusUpdate}
        isUpdating={togglingPaymentId === selectedRegistration?.id}
      />
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRegistrationToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Registration"
        message={`Are you sure you want to permanently delete this registration?
         
Name: ${registrationToDelete?.first_name} ${registrationToDelete?.last_name}
Company: ${registrationToDelete?.company_name || 'N/A'}
         
This action CANNOT be undone!`}
        confirmText="Delete"
        danger={true}
      />
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => {
          if (!isImporting) {
            setImportModalOpen(false);
            setImportResult(null);
          }
        }}
        onImport={handleImport}
        isImporting={isImporting}
        importResult={importResult}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Table, Form, Button, Container, Row, Col, InputGroup, Spinner, Badge, Card, Pagination, Tabs, Tab, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  // State for counts - Updated structure
  const [counts, setCounts] = useState({
    badge_status: { not_printed: 0, printed: 0, reprinted: 0 },
    payment_status: { paid: 0, unpaid: 0, complimentary: 0 },
    registration_type: { onsite: 0, online: 0, pre_registered: 0, complimentary: 0 },
    demographics: { age_ranges: {}, gender: {}, total_with_demographics: 0 },
    survey: { 
      industry_sector: {}, 
      reason_for_attending: {}, 
      areas_of_interest: {}, 
      how_did_you_learn: {},
      total_with_survey: 0 
    },
    total: 0,
    confirmed: 0,
    unconfirmed: 0
  });

  const [allRegistrations, setAllRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('all');
  const [ageRangeFilter, setAgeRangeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  // Column visibility - Updated with new fields
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    phone: false,
    address: false,
    company: true,
    designation: false,
    type: true,
    payment: true,
    badge: true,
    age_range: false,
    gender: false,
    industry: false,
    date: true
  });

  // Active tab for switching between overview and detailed views
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCounts();
    fetchAllData();
  }, []);

  useEffect(() => {
    filterAndSortData();
    setCurrentPage(1);
  }, [search, allRegistrations, dateFrom, dateTo, paymentFilter, registrationTypeFilter, 
      ageRangeFilter, genderFilter, industryFilter, sortField, sortOrder]);

  const fetchCounts = async () => {
    try {
      setError(null);
      const res = await api.get('/dashboard/reports-counts');
      console.log('✅ Reports counts:', res.data);
      setCounts(res.data);
    } catch (err) {
      console.error('❌ Error fetching counts:', err);
      setError(err.response?.data?.message || 'Failed to fetch counts');
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get('/dashboard/reports-list', { 
        params: { all: true } 
      });
      
      const data = res.data.data || [];
      console.log('✅ Loaded all registrations:', data.length);
      
      setAllRegistrations(data);
      setFilteredRegistrations(data);
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch registrations');
      setAllRegistrations([]);
      setFilteredRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = [...allRegistrations];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(reg => {
        const firstName = (reg.first_name || '').toLowerCase();
        const lastName = (reg.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        const email = (reg.email || '').toLowerCase();
        const phone = (reg.phone || '').toLowerCase();
        const ticketNumber = (reg.ticket_number || '').toLowerCase();
        const companyName = (reg.company_name || '').toLowerCase();
        const designation = (reg.designation || '').toLowerCase();
        
        return firstName.includes(searchLower)
          || lastName.includes(searchLower)
          || fullName.includes(searchLower)
          || email.includes(searchLower)
          || phone.includes(searchLower)
          || ticketNumber.includes(searchLower)
          || companyName.includes(searchLower)
          || designation.includes(searchLower);
      });
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(reg => {
        const regDate = new Date(reg.created_at);
        return regDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(reg => {
        const regDate = new Date(reg.created_at);
        return regDate <= toDate;
      });
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter);
    }

    // Registration type filter
    if (registrationTypeFilter !== 'all') {
      filtered = filtered.filter(reg => reg.registration_type === registrationTypeFilter);
    }

    // Age range filter
    if (ageRangeFilter !== 'all') {
      filtered = filtered.filter(reg => reg.age_range === ageRangeFilter);
    }

    // Gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(reg => reg.gender === genderFilter);
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(reg => reg.industry_sector === industryFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'id':
          aVal = a.id || 0;
          bVal = b.id || 0;
          break;
        case 'name':
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case 'payment':
          aVal = a.payment_status || '';
          bVal = b.payment_status || '';
          break;
        case 'company':
          aVal = (a.company_name || '').toLowerCase();
          bVal = (b.company_name || '').toLowerCase();
          break;
        default:
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    console.log(`🔍 Filtered: ${filtered.length} from ${allRegistrations.length} total`);
    setFilteredRegistrations(filtered);
  };

  const formatRegistrationType = (type) => {
    if (!type) return 'N/A';
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('-');
  };

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleClearSearch = () => setSearch('');
  const handleRefresh = () => {
    fetchAllData();
    fetchCounts();
  };

  const handleColumnToggle = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPaymentFilter('all');
    setRegistrationTypeFilter('all');
    setAgeRangeFilter('all');
    setGenderFilter('all');
    setIndustryFilter('all');
    setSortField('id');
    setSortOrder('desc');
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);

  const hasActiveFilters = search || dateFrom || dateTo || paymentFilter !== 'all' || 
    registrationTypeFilter !== 'all' || ageRangeFilter !== 'all' || 
    genderFilter !== 'all' || industryFilter !== 'all';

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return (
      <Pagination className="mb-0">
        <Pagination.First 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => setCurrentPage(currentPage - 1)} 
          disabled={currentPage === 1}
        />

        {startPage > 1 && (
          <>
            <Pagination.Item onClick={() => setCurrentPage(1)}>1</Pagination.Item>
            {startPage > 2 && <Pagination.Ellipsis disabled />}
          </>
        )}

        {[...Array(endPage - startPage + 1)].map((_, idx) => {
          const pageNum = startPage + idx;
          return (
            <Pagination.Item
              key={pageNum}
              active={pageNum === currentPage}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </Pagination.Item>
          );
        })}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Pagination.Ellipsis disabled />}
            <Pagination.Item onClick={() => setCurrentPage(totalPages)}>
              {totalPages}
            </Pagination.Item>
          </>
        )}

        <Pagination.Next 
          onClick={() => setCurrentPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // ✅ Helper function to render survey data bars
  const renderSurveyDataBar = (label, count, total, variant = 'primary') => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <small className="text-muted" style={{ fontSize: '0.85rem' }}>
            {label.length > 50 ? label.substring(0, 50) + '...' : label}
          </small>
          <div>
            <Badge bg={variant} className="me-2">{count}</Badge>
            <small className="text-muted">{percentage}%</small>
          </div>
        </div>
        <ProgressBar 
          now={percentage} 
          variant={variant}
          style={{ height: '8px' }}
        />
      </div>
    );
  };

  // Enhanced PDF Export with new fields
  const exportToPDF = async () => {
    try {
      setExporting(true);
      console.log('🚀 Starting PDF export...');

      const dataToExport = filteredRegistrations;

      if (dataToExport.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('ICEGEX 2025 - Registration Reports', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      let yPos = 27;

      if (hasActiveFilters) {
        doc.setFontSize(9);
        doc.setTextColor(255, 0, 0);
        doc.text('FILTERED REPORT', 14, yPos);
        yPos += 4;
        if (search) doc.text(`Search: "${search}"`, 14, yPos+=4);
        if (dateFrom) doc.text(`From: ${dateFrom}`, 14, yPos+=4);
        if (dateTo) doc.text(`To: ${dateTo}`, 14, yPos+=4);
        if (paymentFilter !== 'all') doc.text(`Payment: ${paymentFilter}`, 14, yPos+=4);
        if (registrationTypeFilter !== 'all') doc.text(`Type: ${registrationTypeFilter}`, 14, yPos+=4);
        yPos += 3;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics:', 14, yPos);

      doc.setFontSize(8);
      yPos += 5;
      
      // Badge Status
      doc.text('Badge Status:', 14, yPos);
      doc.text(`Not Printed: ${counts.badge_status.not_printed}`, 24, yPos+=4);
      doc.text(`Printed: ${counts.badge_status.printed}`, 24, yPos+=4);
      doc.text(`Re-Printed: ${counts.badge_status.reprinted}`, 24, yPos+=4);
      
      yPos += 2;
      // Payment Status
      doc.text('Payment Status:', 14, yPos+=4);
      doc.text(`Paid: ${counts.payment_status.paid}`, 24, yPos+=4);
      doc.text(`Unpaid: ${counts.payment_status.unpaid}`, 24, yPos+=4);
      doc.text(`Complimentary: ${counts.payment_status.complimentary}`, 24, yPos+=4);
      
      yPos += 2;
      // Registration Type
      doc.text('Registration Type:', 14, yPos+=4);
      doc.text(`Onsite: ${counts.registration_type.onsite}`, 24, yPos+=4);
      doc.text(`Online: ${counts.registration_type.online}`, 24, yPos+=4);
      doc.text(`Pre-Registered: ${counts.registration_type.pre_registered}`, 24, yPos+=4);
      doc.text(`Complimentary: ${counts.registration_type.complimentary}`, 24, yPos+=4);

      yPos += 2;
      doc.text(`Total Registrations: ${counts.total}`, 14, yPos+=4);
      doc.text(`Confirmed: ${counts.confirmed} | Unconfirmed: ${counts.unconfirmed}`, 14, yPos+=4);

      if (hasActiveFilters) {
        yPos += 2;
        doc.setTextColor(255, 0, 0);
        doc.text(`🔍 Filtered Results: ${dataToExport.length} records`, 14, yPos+=4);
      }

      yPos += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, 283, yPos);

      const headers = [];
      const columnIndices = [];

      if (visibleColumns.id) { headers.push('ID'); columnIndices.push('id'); }
      if (visibleColumns.name) { headers.push('Name'); columnIndices.push('name'); }
      if (visibleColumns.email) { headers.push('Email'); columnIndices.push('email'); }
      if (visibleColumns.phone) { headers.push('Phone'); columnIndices.push('phone'); }
      if (visibleColumns.company) { headers.push('Company'); columnIndices.push('company'); }
      if (visibleColumns.designation) { headers.push('Designation'); columnIndices.push('designation'); }
      if (visibleColumns.type) { headers.push('Type'); columnIndices.push('type'); }
      if (visibleColumns.payment) { headers.push('Payment'); columnIndices.push('payment'); }
      if (visibleColumns.age_range) { headers.push('Age'); columnIndices.push('age_range'); }
      if (visibleColumns.gender) { headers.push('Gender'); columnIndices.push('gender'); }
      if (visibleColumns.industry) { headers.push('Industry'); columnIndices.push('industry'); }
      if (visibleColumns.date) { headers.push('Date'); columnIndices.push('date'); }

      const tableData = dataToExport.map(reg => {
        const row = [];
        columnIndices.forEach(col => {
          switch(col) {
            case 'id': row.push(String(reg.id || '')); break;
            case 'name': row.push(`${reg.first_name || ''} ${reg.last_name || ''}`.trim()); break;
            case 'email': row.push(reg.email || 'N/A'); break;
            case 'phone': row.push(reg.phone || 'N/A'); break;
            case 'company': row.push(reg.company_name || 'N/A'); break;
            case 'designation': row.push(reg.designation || 'N/A'); break;
            case 'type': row.push(formatRegistrationType(reg.registration_type)); break;
            case 'payment': row.push((reg.payment_status || 'unpaid').toUpperCase()); break;
            case 'age_range': row.push(reg.age_range || 'N/A'); break;
            case 'gender': row.push(reg.gender || 'N/A'); break;
            case 'industry': row.push((reg.industry_sector || 'N/A').substring(0, 30)); break;
            case 'date': row.push(new Date(reg.created_at).toLocaleDateString()); break;
            default: row.push('');
          }
        });
        return row;
      });

      autoTable(doc, {
        startY: yPos + 4,
        head: [headers],
        body: tableData,
        theme: 'striped',
        styles: { 
          fontSize: 7,
          cellPadding: 1.5,
        },
        headStyles: { 
          fillColor: [0, 123, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          const pageText = `Page ${data.pageNumber} of ${pageCount}`;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });

      const filename = `ICEGEX_2025_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      console.log('✅ PDF saved:', filename);
      alert(`✅ PDF exported successfully!\nRecords: ${dataToExport.length}\nFile: ${filename}`);
    } catch (err) {
      console.error('❌ PDF export error:', err);
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Enhanced CSV Export with new fields
  const exportToCSV = async () => {
    try {
      setExporting(true);

      const dataToExport = filteredRegistrations;
      
      if (dataToExport.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      const summaryRows = [
        ['ICEGEX 2025 - Registration Reports'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [''],
        ['Summary Statistics'],
        ['Badge Status'],
        ['Not Printed', counts.badge_status.not_printed],
        ['Printed', counts.badge_status.printed],
        ['Re-Printed', counts.badge_status.reprinted],
        [''],
        ['Payment Status'],
        ['Paid', counts.payment_status.paid],
        ['Unpaid', counts.payment_status.unpaid],
        ['Complimentary', counts.payment_status.complimentary],
        [''],
        ['Registration Type'],
        ['Onsite', counts.registration_type.onsite],
        ['Online', counts.registration_type.online],
        ['Pre-Registered', counts.registration_type.pre_registered],
        ['Complimentary Type', counts.registration_type.complimentary],
        [''],
        ['Overall Totals'],
        ['Total Registrations', counts.total],
        ['Confirmed', counts.confirmed],
        ['Unconfirmed', counts.unconfirmed],
        ...(hasActiveFilters ? [[''], ['🔍 Filtered Results', dataToExport.length]] : []),
        [''],
        ['Registration Details']
      ];

      const headers = [];
      if (visibleColumns.id) headers.push('ID');
      if (visibleColumns.name) headers.push('First Name', 'Last Name');
      if (visibleColumns.email) headers.push('Email');
      if (visibleColumns.phone) headers.push('Phone');
      if (visibleColumns.address) headers.push('Address');
      if (visibleColumns.company) headers.push('Company');
      if (visibleColumns.designation) headers.push('Designation');
      if (visibleColumns.type) headers.push('Registration Type');
      if (visibleColumns.payment) headers.push('Payment Status');
      if (visibleColumns.badge) headers.push('Badge Status');
      if (visibleColumns.age_range) headers.push('Age Range');
      if (visibleColumns.gender) headers.push('Gender');
      if (visibleColumns.industry) headers.push('Industry Sector');
      if (visibleColumns.date) headers.push('Registration Date');

      const dataRows = dataToExport.map(reg => {
        const row = [];
        if (visibleColumns.id) row.push(reg.id);
        if (visibleColumns.name) row.push(`"${reg.first_name || ''}"`, `"${reg.last_name || ''}"`);
        if (visibleColumns.email) row.push(`"${reg.email || 'N/A'}"`);
        if (visibleColumns.phone) row.push(`"${reg.phone || 'N/A'}"`);
        if (visibleColumns.address) row.push(`"${(reg.address || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.company) row.push(`"${(reg.company_name || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.designation) row.push(`"${(reg.designation || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.type) row.push(formatRegistrationType(reg.registration_type));
        if (visibleColumns.payment) row.push(reg.payment_status?.toUpperCase() || 'UNPAID');
        if (visibleColumns.badge) row.push(`"${reg.badge_status?.name || 'not_printed'}"`);
        if (visibleColumns.age_range) row.push(`"${reg.age_range || 'N/A'}"`);
        if (visibleColumns.gender) row.push(`"${reg.gender || 'N/A'}"`);
        if (visibleColumns.industry) row.push(`"${(reg.industry_sector || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.date) row.push(new Date(reg.created_at).toLocaleString());
        return row;
      });

      const csvRows = [
        ...summaryRows.map(row => row.join(',')),
        headers.join(','),
        ...dataRows.map(row => row.join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      const filename = `ICEGEX_2025_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV exported successfully');
      alert(`✅ CSV exported successfully!\nRecords: ${dataToExport.length}\nFile: ${filename}`);
    } catch (err) {
      console.error('❌ CSV export error:', err);
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'onsite': return 'primary';
      case 'online': return 'info';
      case 'pre-registered': return 'secondary';
      case 'complimentary': return 'success';
      default: return 'light';
    }
  };

  const getPaymentBadgeColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'danger';
      case 'complimentary': return 'info';
      default: return 'secondary';
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Get unique values for filters
  const uniqueAgeRanges = [...new Set(allRegistrations.map(r => r.age_range).filter(Boolean))];
  const uniqueGenders = [...new Set(allRegistrations.map(r => r.gender).filter(Boolean))];
  const uniqueIndustries = [...new Set(allRegistrations.map(r => r.industry_sector).filter(Boolean))];

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📊 ICEGEX 2025 - Reports & Analytics</h2>
        <Button variant="outline-primary" size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Loading...
            </>
          ) : (
            <>🔄 Refresh Data</>
          )}
        </Button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          ❌ {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* TABS FOR DIFFERENT VIEWS */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        
        {/* OVERVIEW TAB */}
        <Tab eventKey="overview" title="📊 Overview">
          
          {/* SUMMARY STATISTICS */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">📈 Summary Statistics</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center g-3">
                {/* Badge Status */}
                <Col md={12}>
                  <h6 className="text-muted mb-3">Badge Status</h6>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-secondary mb-1">{counts.badge_status.not_printed}</h3>
                    <small className="text-muted">📄 Not Printed</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-success mb-1">{counts.badge_status.printed}</h3>
                    <small className="text-muted">✅ Printed</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-warning mb-1">{counts.badge_status.reprinted}</h3>
                    <small className="text-muted">🔄 Re-Printed</small>
                  </div>
                </Col>

                {/* Payment Status */}
                <Col md={12} className="mt-4">
                  <h6 className="text-muted mb-3">Payment Status</h6>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-success mb-1">{counts.payment_status.paid}</h3>
                    <small className="text-muted">💰 Paid</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-danger mb-1">{counts.payment_status.unpaid}</h3>
                    <small className="text-muted">❌ Unpaid</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-info mb-1">{counts.payment_status.complimentary}</h3>
                    <small className="text-muted">🎁 Complimentary</small>
                  </div>
                </Col>

                {/* Registration Type */}
                <Col md={12} className="mt-4">
                  <h6 className="text-muted mb-3">Registration Type</h6>
                </Col>
                <Col md={3}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-primary mb-1">{counts.registration_type.onsite}</h3>
                    <small className="text-muted">🏢 Onsite</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-info mb-1">{counts.registration_type.online}</h3>
                    <small className="text-muted">💻 Online</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-secondary mb-1">{counts.registration_type.pre_registered}</h3>
                    <small className="text-muted">📋 Pre-Registered</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="p-3 border rounded bg-light">
                    <h3 className="text-success mb-1">{counts.registration_type.complimentary}</h3>
                    <small className="text-muted">🎁 Complimentary</small>
                  </div>
                </Col>

                {/* Overall Totals */}
                <Col md={12} className="mt-4">
                  <h6 className="text-muted mb-3">Overall</h6>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-primary text-white">
                    <h3 className="mb-1">{counts.total}</h3>
                    <small>👥 Total Registrations</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-success text-white">
                    <h3 className="mb-1">{counts.confirmed}</h3>
                    <small>✅ Confirmed</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 border rounded bg-warning text-dark">
                    <h3 className="mb-1">{counts.unconfirmed}</h3>
                    <small>⏳ Unconfirmed</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* DEMOGRAPHICS BREAKDOWN */}
          {counts.demographics.total_with_demographics > 0 && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">👥 Demographics Breakdown</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">Age Distribution</h6>
                    <div className="list-group">
                      {Object.entries(counts.demographics.age_ranges || {}).map(([range, count]) => (
                        <div key={range} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{range}</span>
                          <Badge bg="primary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6 className="mb-3">Gender Distribution</h6>
                    <div className="list-group">
                      {Object.entries(counts.demographics.gender || {}).map(([gender, count]) => (
                        <div key={gender} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>{gender}</span>
                          <Badge bg="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
                <div className="mt-3 text-center">
                  <small className="text-muted">
                    {counts.demographics.total_with_demographics} registrants provided demographic information
                  </small>
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>

        {/* ✅ NEW: EVENT SURVEY TAB */}
        <Tab eventKey="survey" title="📝 Event Survey - ICEGEX 2025">
          {counts.survey.total_with_survey > 0 ? (
            <>
              {/* Survey Response Rate */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">📊 Survey Response Overview</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center">
                    <Col md={4}>
                      <div className="p-3 border rounded">
                        <h2 className="text-success mb-1">{counts.survey.total_with_survey}</h2>
                        <small className="text-muted">Survey Responses</small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 border rounded">
                        <h2 className="text-primary mb-1">{counts.total}</h2>
                        <small className="text-muted">Total Registrations</small>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 border rounded">
                        <h2 className="text-info mb-1">
                          {Math.round((counts.survey.total_with_survey / counts.total) * 100)}%
                        </h2>
                        <small className="text-muted">Response Rate</small>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Industry Sector Analysis */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">🏭 Industry Sector Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    <small>Understanding which industries our attendees represent</small>
                  </p>
                  {Object.entries(counts.survey.industry_sector || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([industry, count]) => 
                      renderSurveyDataBar(industry, count, counts.survey.total_with_survey, 'primary')
                    )}
                  {Object.keys(counts.survey.industry_sector || {}).length === 0 && (
                    <p className="text-center text-muted">No industry data available</p>
                  )}
                </Card.Body>
              </Card>

              {/* Reason for Attending */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">🎯 Reasons for Attending</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    <small>What motivates attendees to join ICEGEX 2025</small>
                  </p>
                  {Object.entries(counts.survey.reason_for_attending || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => 
                      renderSurveyDataBar(reason, count, counts.survey.total_with_survey, 'info')
                    )}
                  {Object.keys(counts.survey.reason_for_attending || {}).length === 0 && (
                    <p className="text-center text-muted">No reason data available</p>
                  )}
                </Card.Body>
              </Card>

              {/* Areas of Interest */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <h5 className="mb-0">💡 Specific Areas of Interest</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    <small>What topics and areas attendees are most interested in</small>
                  </p>
                  {Object.entries(counts.survey.areas_of_interest || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([interest, count]) => 
                      renderSurveyDataBar(interest, count, counts.survey.total_with_survey, 'warning')
                    )}
                  {Object.keys(counts.survey.areas_of_interest || {}).length === 0 && (
                    <p className="text-center text-muted">No interest data available</p>
                  )}
                </Card.Body>
              </Card>

              {/* Marketing Channel Effectiveness */}
              <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-danger text-white">
                  <h5 className="mb-0">📢 Marketing Channel Effectiveness</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    <small>How attendees discovered ICEGEX 2025</small>
                  </p>
                  {Object.entries(counts.survey.how_did_you_learn || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([channel, count]) => 
                      renderSurveyDataBar(channel, count, counts.survey.total_with_survey, 'danger')
                    )}
                  {Object.keys(counts.survey.how_did_you_learn || {}).length === 0 && (
                    <p className="text-center text-muted">No marketing channel data available</p>
                  )}
                </Card.Body>
              </Card>

              {/* Survey Insights Summary */}
              <Card className="shadow-sm">
                <Card.Header className="bg-dark text-white">
                  <h5 className="mb-0">📊 Key Insights</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Top Industry</h6>
                      {Object.entries(counts.survey.industry_sector || {}).length > 0 ? (
                        <div className="alert alert-primary">
                          <strong>
                            {Object.entries(counts.survey.industry_sector)
                              .sort((a, b) => b[1] - a[1])[0][0]}
                          </strong>
                          <br />
                          <small>
                            {Object.entries(counts.survey.industry_sector)
                              .sort((a, b) => b[1] - a[1])[0][1]} responses
                          </small>
                        </div>
                      ) : (
                        <p className="text-muted">No data</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Most Effective Channel</h6>
                      {Object.entries(counts.survey.how_did_you_learn || {}).length > 0 ? (
                        <div className="alert alert-danger">
                          <strong>
                            {Object.entries(counts.survey.how_did_you_learn)
                              .sort((a, b) => b[1] - a[1])[0][0]}
                          </strong>
                          <br />
                          <small>
                            {Object.entries(counts.survey.how_did_you_learn)
                              .sort((a, b) => b[1] - a[1])[0][1]} responses
                          </small>
                        </div>
                      ) : (
                        <p className="text-muted">No data</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Top Reason for Attending</h6>
                      {Object.entries(counts.survey.reason_for_attending || {}).length > 0 ? (
                        <div className="alert alert-info">
                          <strong>
                            {Object.entries(counts.survey.reason_for_attending)
                              .sort((a, b) => b[1] - a[1])[0][0].substring(0, 50)}...
                          </strong>
                          <br />
                          <small>
                            {Object.entries(counts.survey.reason_for_attending)
                              .sort((a, b) => b[1] - a[1])[0][1]} responses
                          </small>
                        </div>
                      ) : (
                        <p className="text-muted">No data</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Top Area of Interest</h6>
                      {Object.entries(counts.survey.areas_of_interest || {}).length > 0 ? (
                        <div className="alert alert-warning">
                          <strong>
                            {Object.entries(counts.survey.areas_of_interest)
                              .sort((a, b) => b[1] - a[1])[0][0]}
                          </strong>
                          <br />
                          <small>
                            {Object.entries(counts.survey.areas_of_interest)
                              .sort((a, b) => b[1] - a[1])[0][1]} responses
                          </small>
                        </div>
                      ) : (
                        <p className="text-muted">No data</p>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <h3 className="text-muted mb-3">📝 No Survey Data Available</h3>
                <p className="text-muted">
                  No attendees have completed the optional survey questions yet.
                  <br />
                  Survey responses will appear here as registrations are submitted.
                </p>
              </Card.Body>
            </Card>
          )}
        </Tab>

        {/* DETAILED RECORDS TAB */}
        <Tab eventKey="records" title="📋 Detailed Records">
          <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">📋 Registration List</h5>
            </Card.Header>
            <Card.Body>
              {/* FILTERS */}
              <Row className="mb-3 g-2">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">🔍 Search</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text>🔍</InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        placeholder="Name, email, company..." 
                        value={search} 
                        onChange={handleSearchChange}
                        disabled={loading}
                      />
                      {search && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={handleClearSearch}
                          size="sm"
                        >
                          ✕
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">📅 From</Form.Label>
                    <Form.Control 
                      type="date" 
                      size="sm"
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">📅 To</Form.Label>
                    <Form.Control 
                      type="date" 
                      size="sm"
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">💰 Payment</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={paymentFilter} 
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="complimentary">Complimentary</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">📋 Type</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={registrationTypeFilter} 
                      onChange={(e) => setRegistrationTypeFilter(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All Types</option>
                      <option value="onsite">Onsite</option>
                      <option value="online">Online</option>
                      <option value="pre-registered">Pre-Registered</option>
                      <option value="complimentary">Complimentary</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Additional Filters Row */}
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">👤 Age Range</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={ageRangeFilter} 
                      onChange={(e) => setAgeRangeFilter(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All Ages</option>
                      {uniqueAgeRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">⚧ Gender</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={genderFilter} 
                      onChange={(e) => setGenderFilter(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All</option>
                      {uniqueGenders.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">🏭 Industry</Form.Label>
                    <Form.Select 
                      size="sm"
                      value={industryFilter} 
                      onChange={(e) => setIndustryFilter(e.target.value)}
                      disabled={loading}
                    >
                      <option value="all">All Industries</option>
                      {uniqueIndustries.slice(0, 10).map(industry => (
                        <option key={industry} value={industry}>
                          {industry.substring(0, 50)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3} className="d-flex align-items-end">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters || loading}
                    className="w-100"
                  >
                    🗑️ Clear Filters
                  </Button>
                </Col>
              </Row>

              {/* COLUMN VISIBILITY */}
              <Row className="mb-3">
                <Col>
                  <div className="border rounded p-2 bg-light">
                    <small className="fw-bold d-block mb-2">👁️ Show/Hide Columns:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries({
                        id: 'ID',
                        name: 'Name',
                        email: 'Email',
                        phone: 'Phone',
                        address: 'Address',
                        company: 'Company',
                        designation: 'Designation',
                        type: 'Type',
                        payment: 'Payment',
                        badge: 'Badge',
                        age_range: 'Age',
                        gender: 'Gender',
                        industry: 'Industry',
                        date: 'Date'
                      }).map(([key, label]) => (
                        <Form.Check
                          key={key}
                          type="checkbox"
                          id={`col-${key}`}
                          label={label}
                          checked={visibleColumns[key]}
                          onChange={() => handleColumnToggle(key)}
                          inline
                          className="small"
                        />
                      ))}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* ACTIVE FILTERS */}
              {hasActiveFilters && (
                <div className="alert alert-info py-2 px-3 mb-3">
                  <small>
                    <strong>🔍 Active Filters:</strong>{' '}
                    {search && <Badge bg="primary" className="me-1">Search: {search.substring(0, 20)}</Badge>}
                    {dateFrom && <Badge bg="secondary" className="me-1">From: {dateFrom}</Badge>}
                    {dateTo && <Badge bg="secondary" className="me-1">To: {dateTo}</Badge>}
                    {paymentFilter !== 'all' && <Badge bg="success" className="me-1">Payment: {paymentFilter}</Badge>}
                    {registrationTypeFilter !== 'all' && <Badge bg="info" className="me-1">Type: {registrationTypeFilter}</Badge>}
                    {ageRangeFilter !== 'all' && <Badge bg="warning" className="me-1">Age: {ageRangeFilter}</Badge>}
                    {genderFilter !== 'all' && <Badge bg="secondary" className="me-1">Gender: {genderFilter}</Badge>}
                    {industryFilter !== 'all' && <Badge bg="primary" className="me-1">Industry</Badge>}
                    <br />
                    <strong>Showing {filteredRegistrations.length} of {allRegistrations.length} records</strong>
                  </small>
                </div>
              )}

              {/* TABLE */}
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading registrations...</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead className="table-dark">
                        <tr>
                          {visibleColumns.id && (
                            <th onClick={() => handleSort('id')} style={{cursor: 'pointer'}} className="user-select-none">
                              ID {getSortIcon('id')}
                            </th>
                          )}
                          {visibleColumns.name && (
                            <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}} className="user-select-none">
                              Name {getSortIcon('name')}
                            </th>
                          )}
                          {visibleColumns.email && (
                            <th onClick={() => handleSort('email')} style={{cursor: 'pointer'}} className="user-select-none">
                              Email {getSortIcon('email')}
                            </th>
                          )}
                          {visibleColumns.phone && <th>Phone</th>}
                          {visibleColumns.address && <th>Address</th>}
                          {visibleColumns.company && (
                            <th onClick={() => handleSort('company')} style={{cursor: 'pointer'}} className="user-select-none">
                              Company {getSortIcon('company')}
                            </th>
                          )}
                          {visibleColumns.designation && <th>Designation</th>}
                          {visibleColumns.type && <th>Type</th>}
                          {visibleColumns.payment && (
                            <th onClick={() => handleSort('payment')} style={{cursor: 'pointer'}} className="user-select-none">
                              Payment {getSortIcon('payment')}
                            </th>
                          )}
                          {visibleColumns.badge && <th>Badge</th>}
                          {visibleColumns.age_range && <th>Age</th>}
                          {visibleColumns.gender && <th>Gender</th>}
                          {visibleColumns.industry && <th>Industry</th>}
                          {visibleColumns.date && (
                            <th onClick={() => handleSort('date')} style={{cursor: 'pointer'}} className="user-select-none">
                              Date {getSortIcon('date')}
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentRecords.length > 0 ? (
                          currentRecords.map((reg) => (
                            <tr key={reg.id}>
                              {visibleColumns.id && <td>{reg.id}</td>}
                              {visibleColumns.name && <td>{reg.first_name} {reg.last_name}</td>}
                              {visibleColumns.email && <td><small>{reg.email || 'N/A'}</small></td>}
                              {visibleColumns.phone && <td><small>{reg.phone || 'N/A'}</small></td>}
                              {visibleColumns.address && <td><small>{reg.address || 'N/A'}</small></td>}
                              {visibleColumns.company && <td><small>{reg.company_name || 'N/A'}</small></td>}
                              {visibleColumns.designation && <td><small>{reg.designation || 'N/A'}</small></td>}
                              {visibleColumns.type && (
                                <td>
                                  <Badge bg={getTypeBadgeColor(reg.registration_type)}>
                                    {formatRegistrationType(reg.registration_type)}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.payment && (
                                <td>
                                  <Badge bg={getPaymentBadgeColor(reg.payment_status)}>
                                    {(reg.payment_status || 'unpaid').toUpperCase()}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.badge && <td><small>{reg.badge_status?.name || 'N/A'}</small></td>}
                              {visibleColumns.age_range && <td><small>{reg.age_range || 'N/A'}</small></td>}
                              {visibleColumns.gender && <td><small>{reg.gender || 'N/A'}</small></td>}
                              {visibleColumns.industry && (
                                <td><small>{(reg.industry_sector || 'N/A').substring(0, 30)}</small></td>
                              )}
                              {visibleColumns.date && (
                                <td><small>{new Date(reg.created_at).toLocaleDateString()}</small></td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="20" className="text-center text-muted py-4">
                              {hasActiveFilters ? (
                                <>
                                  🔍 No registrations found matching your filters
                                  <br />
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={handleClearFilters}
                                    className="mt-2"
                                  >
                                    Clear all filters
                                  </Button>
                                </>
                              ) : (
                                '📭 No registrations yet'
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* PAGINATION */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
                      <div className="text-muted small">
                        Showing <strong>{indexOfFirstRecord + 1}</strong> to{' '}
                        <strong>{Math.min(indexOfLastRecord, filteredRegistrations.length)}</strong> of{' '}
                        <strong>{filteredRegistrations.length}</strong> records
                      </div>
                      
                      <div className="d-flex justify-content-center flex-grow-1">
                        {renderPagination()}
                      </div>

                      <div className="text-muted small">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* EXPORT SECTION */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">📥 Export Options</h5>
        </Card.Header>
        <Card.Body>
          {hasActiveFilters && (
            <div className="alert alert-warning py-2 px-3 mb-3">
              <small>
                <strong>⚠️ Export Notice:</strong> Active filters detected. 
                Export will include <strong>{filteredRegistrations.length}</strong> filtered record(s) only.
              </small>
            </div>
          )}
          
          <Row>
            <Col md={6}>
              <Button 
                variant="danger" 
                onClick={exportToPDF} 
                disabled={exporting || filteredRegistrations.length === 0}
                size="lg"
                className="w-100"
              >
                {exporting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating PDF...
                  </>
                ) : (
                  `📄 Export to PDF (${filteredRegistrations.length} records)`
                )}
              </Button>
            </Col>
            <Col md={6}>
              <Button 
                variant="success"
                onClick={exportToCSV}
                disabled={exporting || filteredRegistrations.length === 0}
                size="lg"
                className="w-100"
              >
                {exporting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating CSV...
                  </>
                ) : (
                  `📊 Export to CSV (${filteredRegistrations.length} records)`
                )}
              </Button>
            </Col>
          </Row>
          
          {filteredRegistrations.length === 0 && (
            <small className="text-muted d-block mt-2 text-center">
              {hasActiveFilters ? 'No matching records to export' : 'No data available'}
            </small>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Reports;
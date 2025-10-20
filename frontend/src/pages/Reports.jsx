import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Table, Form, Button, Container, Row, Col, ListGroup, InputGroup, Spinner, Badge, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [counts, setCounts] = useState({not_printed: 0, printed: 0, reprinted: 0, paid: 0, unpaid: 0, total: 0 });
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ✅ NEW: Date filtering
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ✅ NEW: Payment filtering
  const [paymentFilter, setPaymentFilter] = useState('both'); // 'paid', 'unpaid', 'both'

  // ✅ NEW: Sorting (default ascending by ID)
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // ✅ NEW: Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    phone: true,
    address: false,
    company: false,
    type: true,
    payment: true,
    badge: true,
    ticket: true,
    date: true
  });

  // ✅ Load all data once on mount
  useEffect(() => {
    fetchCounts();
    fetchAllData();
  }, []);

  // ✅ Filter and sort data whenever any filter changes
  useEffect(() => {
    filterAndSortData();
    setCurrentPage(1);
  }, [search, allRegistrations, dateFrom, dateTo, paymentFilter, sortField, sortOrder]);

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

  // ✅ Enhanced filtering with date, payment, search, and sorting
  const filterAndSortData = () => {
    let filtered = [...allRegistrations];

    // 1. Search filter
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
        const registrationType = (reg.registration_type || '').toLowerCase().replace('-', ' ');
        const paymentStatus = (reg.payment_status || '').toLowerCase();
        
        return firstName.includes(searchLower)
          || lastName.includes(searchLower)
          || fullName.includes(searchLower)
          || email.includes(searchLower)
          || phone.includes(searchLower)
          || ticketNumber.includes(searchLower)
          || companyName.includes(searchLower)
          || registrationType.includes(searchLower)
          || paymentStatus.includes(searchLower);
      });
    }

    // 2. Date range filter
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

    // 3. Payment filter
    if (paymentFilter !== 'both') {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter);
    }

    // 4. Sorting
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

  // ✅ Calculate counts from filtered data
  const calculateCounts = (data) => {
    const counts = {
      not_printed: 0,
      printed: 0,
      reprinted: 0,
      paid: 0,
      unpaid: 0,
      total: data.length
    };

    data.forEach(reg => {
      if (reg.payment_status === 'paid') {
        counts.paid++;
      } else {
        counts.unpaid++;
      }

      const badgeStatus = reg.badge_status?.name?.toLowerCase() || '';
      const ticketStatus = reg.ticket_status?.name?.toLowerCase() || '';
      
      if (badgeStatus.includes('reprinted') || ticketStatus.includes('reprinted')) {
        counts.reprinted++;
      } else if (badgeStatus.includes('printed') || ticketStatus.includes('printed')) {
        counts.printed++;
      } else {
        counts.not_printed++;
      }
    });

    return counts;
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

  // ✅ NEW: Handle column visibility toggle
  const handleColumnToggle = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // ✅ NEW: Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // ✅ NEW: Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPaymentFilter('both');
    setSortField('id');
    setSortOrder('asc');
  };

  // ✅ Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);

  // ✅ Check if any filter is active
  const hasActiveFilters = search || dateFrom || dateTo || paymentFilter !== 'both' || sortField !== 'id' || sortOrder !== 'asc';

  // ✅ PDF Export
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

      const exportCounts = hasActiveFilters ? calculateCounts(dataToExport) : counts;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('Registration Reports', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      let yPos = 27;

      // Filter info
      if (hasActiveFilters) {
        doc.setFontSize(9);
        doc.setTextColor(255, 0, 0);
        if (search) doc.text(`Search: "${search}"`, 14, yPos++);
        if (dateFrom) doc.text(`From: ${dateFrom}`, 14, yPos += 4);
        if (dateTo) doc.text(`To: ${dateTo}`, 14, yPos += 4);
        if (paymentFilter !== 'both') doc.text(`Payment: ${paymentFilter}`, 14, yPos += 4);
        yPos += 3;
      }

      // Summary
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary:', 14, yPos);

      doc.setFontSize(9);
      yPos += 5;
      doc.text(`Not Printed: ${exportCounts.not_printed}`, 14, yPos);
      doc.text(`Printed: ${exportCounts.printed}`, 50, yPos);
      doc.text(`Re-Printed: ${exportCounts.reprinted}`, 86, yPos);
      doc.text(`Paid: ${exportCounts.paid}`, 122, yPos);
      doc.text(`Unpaid: ${exportCounts.unpaid}`, 158, yPos);
      doc.text(`Total: ${exportCounts.total}`, 194, yPos);

      if (hasActiveFilters) {
        yPos += 5;
        doc.text(`🔍 Showing: ${dataToExport.length} filtered records`, 14, yPos);
      }

      yPos += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos, 283, yPos);

      // Prepare table data based on visible columns
      const headers = [];
      const columnIndices = [];

      if (visibleColumns.id) { headers.push('ID'); columnIndices.push('id'); }
      if (visibleColumns.name) { headers.push('Name'); columnIndices.push('name'); }
      if (visibleColumns.email) { headers.push('Email'); columnIndices.push('email'); }
      if (visibleColumns.phone) { headers.push('Phone'); columnIndices.push('phone'); }
      if (visibleColumns.address) { headers.push('Address'); columnIndices.push('address'); }
      if (visibleColumns.company) { headers.push('Company'); columnIndices.push('company'); }
      if (visibleColumns.type) { headers.push('Type'); columnIndices.push('type'); }
      if (visibleColumns.payment) { headers.push('Payment'); columnIndices.push('payment'); }
      if (visibleColumns.badge) { headers.push('Badge'); columnIndices.push('badge'); }
      if (visibleColumns.ticket) { headers.push('Ticket'); columnIndices.push('ticket'); }
      if (visibleColumns.date) { headers.push('Date'); columnIndices.push('date'); }

      const tableData = dataToExport.map(reg => {
        const row = [];
        columnIndices.forEach(col => {
          switch(col) {
            case 'id': row.push(String(reg.id || '')); break;
            case 'name': row.push(`${reg.first_name || ''} ${reg.last_name || ''}`.trim()); break;
            case 'email': row.push(reg.email || ''); break;
            case 'phone': row.push(reg.phone || 'N/A'); break;
            case 'address': row.push(reg.address || 'N/A'); break;
            case 'company': row.push(reg.company_name || 'N/A'); break;
            case 'type': row.push(formatRegistrationType(reg.registration_type)); break;
            case 'payment': row.push(reg.payment_status || ''); break;
            case 'badge': row.push(reg.badge_status?.name || 'N/A'); break;
            case 'ticket': row.push(`#${reg.id}`); break;
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
          fontSize: 8,
          cellPadding: 2,
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

      const filename = `registrations_report_${new Date().toISOString().split('T')[0]}.pdf`;
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

  // ✅ CSV Export
  const exportToCSV = async () => {
    try {
      setExporting(true);

      const dataToExport = filteredRegistrations;
      
      if (dataToExport.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      const exportCounts = hasActiveFilters ? calculateCounts(dataToExport) : counts;

      const summaryRows = [
        ['Registration Reports'],
        [`Generated on: ${new Date().toLocaleString()}`],
        ...(search ? [[`Search Filter: "${search}"`]] : []),
        ...(dateFrom ? [[`Date From: ${dateFrom}`]] : []),
        ...(dateTo ? [[`Date To: ${dateTo}`]] : []),
        ...(paymentFilter !== 'both' ? [[`Payment Filter: ${paymentFilter}`]] : []),
        [''],
        ['Summary Statistics'],
        ['Not Printed', exportCounts.not_printed],
        ['Printed Counts', exportCounts.printed],
        ['Re-Printed Counts', exportCounts.reprinted],
        ['Paid Counts', exportCounts.paid],
        ['Unpaid Counts', exportCounts.unpaid],
        ['Total Registrants', exportCounts.total],
        ...(hasActiveFilters ? [[`🔍 Filtered Records`, dataToExport.length]] : []),
        [''],
        ['Registration Details']
      ];

      const headers = [];
      if (visibleColumns.id) headers.push('ID');
      if (visibleColumns.name) headers.push('First Name', 'Last Name');
      if (visibleColumns.email) headers.push('Email');
      if (visibleColumns.phone) headers.push('Phone');
      if (visibleColumns.address) headers.push('Address');
      if (visibleColumns.company) headers.push('Company Name');
      if (visibleColumns.type) headers.push('Registration Type');
      if (visibleColumns.payment) headers.push('Payment Status');
      if (visibleColumns.badge) headers.push('Badge Status');
      if (visibleColumns.ticket) headers.push('Ticket Status');
      if (visibleColumns.date) headers.push('Created At');

      const dataRows = dataToExport.map(reg => {
        const row = [];
        if (visibleColumns.id) row.push(reg.id);
        if (visibleColumns.name) row.push(`"${reg.first_name || ''}"`, `"${reg.last_name || ''}"`);
        if (visibleColumns.email) row.push(`"${reg.email || ''}"`);
        if (visibleColumns.phone) row.push(`"${reg.phone || 'N/A'}"`);
        if (visibleColumns.address) row.push(`"${(reg.address || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.company) row.push(`"${(reg.company_name || 'N/A').replace(/"/g, '""')}"`);
        if (visibleColumns.type) row.push(formatRegistrationType(reg.registration_type));
        if (visibleColumns.payment) row.push(reg.payment_status);
        if (visibleColumns.badge) row.push(`"${reg.badge_status?.name || 'N/A'}"`);
        if (visibleColumns.ticket) row.push(`#${reg.id}`);

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
      const filename = `registrations_report_${new Date().toISOString().split('T')[0]}.csv`;
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
      default: return 'light';
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📊 Reports</h2>
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

      {/* ✅ SUMMARY SECTION - TOP */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">📊 Summary Statistics</h5>
        </Card.Header>
        <Card.Body>
          <Row className="text-center">
            <Col md={2}>
              <div className="p-3 border rounded">
                <h3 className="text-secondary mb-1">{hasActiveFilters ? calculateCounts(filteredRegistrations).not_printed : counts.not_printed}</h3>
                <small className="text-muted">📄 Not Printed</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="p-3 border rounded">
                <h3 className="text-success mb-1">{hasActiveFilters ? calculateCounts(filteredRegistrations).printed : counts.printed}</h3>
                <small className="text-muted">✅ Printed</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="p-3 border rounded">
                <h3 className="text-warning mb-1">{hasActiveFilters ? calculateCounts(filteredRegistrations).reprinted : counts.reprinted}</h3>
                <small className="text-muted">🔄 Re-Printed</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="p-3 border rounded">
                <h3 className="text-info mb-1">{hasActiveFilters ? calculateCounts(filteredRegistrations).paid : counts.paid}</h3>
                <small className="text-muted">💰 Paid</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="p-3 border rounded">
                <h3 className="text-danger mb-1">{hasActiveFilters ? calculateCounts(filteredRegistrations).unpaid : counts.unpaid}</h3>
                <small className="text-muted">❌ Unpaid</small>
              </div>
            </Col>
            <Col md={2}>
              <div className="p-3 border rounded bg-primary text-white">
                <h3 className="mb-1">{hasActiveFilters ? filteredRegistrations.length : counts.total}</h3>
                <small>👥 Total</small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      

      {/* ✅ REPORTS SECTION */}
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">📋 Registration List</h5>
        </Card.Header>
        <Card.Body>
          {/* ✅ FILTERS ROW */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold">🔍 Search</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text>🔍</InputGroup.Text>
                  <Form.Control 
                    type="text" 
                    placeholder="Name, email, phone, type..." 
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
                <Form.Label className="small fw-bold">📅 Date From</Form.Label>
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
                <Form.Label className="small fw-bold">📅 Date To</Form.Label>
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
                <Form.Label className="small fw-bold">💰 Payment Status</Form.Label>
                <Form.Select 
                  size="sm"
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="both">Both</option>
                  <option value="paid">Paid Only</option>
                  <option value="unpaid">Unpaid Only</option>
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
                🗑️ Clear All Filters
              </Button>
            </Col>
          </Row>

          {/* ✅ COLUMN VISIBILITY CHECKBOXES */}
          <Row className="mb-3">
            <Col>
              <div className="border rounded p-2 bg-light">
                <small className="fw-bold d-block mb-2">👁️ Show/Hide Columns:</small>
                <div className="d-flex flex-wrap gap-3">
                  {Object.entries({
                    id: 'ID',
                    name: 'Name',
                    email: 'Email',
                    phone: 'Phone',
                    address: 'Address',
                    company: 'Company',
                    type: 'Type',
                    payment: 'Payment',
                    badge: 'Badge',
                    ticket: 'Ticket ID',
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

          {/* ✅ ACTIVE FILTERS DISPLAY */}
          {hasActiveFilters && (
            <div className="alert alert-info py-2 px-3 mb-3">
              <small>
                <strong>🔍 Active Filters:</strong>{' '}
                {search && <Badge bg="primary" className="me-1">Search: {search}</Badge>}
                {dateFrom && <Badge bg="secondary" className="me-1">From: {dateFrom}</Badge>}
                {dateTo && <Badge bg="secondary" className="me-1">To: {dateTo}</Badge>}
                {paymentFilter !== 'both' && <Badge bg="success" className="me-1">Payment: {paymentFilter}</Badge>}
                <br />
                <strong>Showing {filteredRegistrations.length} of {allRegistrations.length} records</strong>
              </small>
            </div>
          )}

          {/* ✅ TABLE */}
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading all registrations...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped bordered hover size="sm">
                  <thead className="table-dark">
                    <tr>
                      {visibleColumns.id && (
                        <th 
                          onClick={() => handleSort('id')} 
                          style={{cursor: 'pointer'}}
                          className="user-select-none"
                        >
                          ID {getSortIcon('id')}
                        </th>
                      )}
                      {visibleColumns.name && (
                        <th 
                          onClick={() => handleSort('name')} 
                          style={{cursor: 'pointer'}}
                          className="user-select-none"
                        >
                          Name {getSortIcon('name')}
                        </th>
                      )}
                      {visibleColumns.email && (
                        <th 
                          onClick={() => handleSort('email')} 
                          style={{cursor: 'pointer'}}
                          className="user-select-none"
                        >
                          Email {getSortIcon('email')}
                        </th>
                      )}
                      {visibleColumns.phone && <th>Phone</th>}
                      {visibleColumns.address && <th>Address</th>}
                      {visibleColumns.company && <th>Company</th>}
                      {visibleColumns.type && <th>Type</th>}
                      {visibleColumns.payment && (
                        <th 
                          onClick={() => handleSort('payment')} 
                          style={{cursor: 'pointer'}}
                          className="user-select-none"
                        >
                          Payment {getSortIcon('payment')}
                        </th>
                      )}
                      {visibleColumns.badge && <th>Badge</th>}
                      {visibleColumns.ticket && <th>Ticket ID</th>}
                      {visibleColumns.date && (
                        <th 
                          onClick={() => handleSort('date')} 
                          style={{cursor: 'pointer'}}
                          className="user-select-none"
                        >
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
                          {visibleColumns.email && <td><small>{reg.email}</small></td>}
                          {visibleColumns.phone && <td>{reg.phone || 'N/A'}</td>}
                          {visibleColumns.address && <td><small>{reg.address || 'N/A'}</small></td>}
                          {visibleColumns.company && <td><small>{reg.company_name || 'N/A'}</small></td>}
                          {visibleColumns.type && (
                            <td>
                              <Badge bg={getTypeBadgeColor(reg.registration_type)} className="text-capitalize">
                                {formatRegistrationType(reg.registration_type)}
                              </Badge>
                            </td>
                          )}
                          {visibleColumns.payment && (
                            <td>
                              <span className={`badge ${reg.payment_status === 'paid' ? 'bg-success' : 'bg-danger'}`}>
                                {reg.payment_status}
                              </span>
                            </td>
                          )}
                          {visibleColumns.badge && <td><small>{reg.badge_status?.name || 'N/A'}</small></td>}
                          {visibleColumns.ticket && <td><small>#{reg.id}</small></td>}
                          {visibleColumns.date && <td><small>{new Date(reg.created_at).toLocaleDateString()}</small></td>}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
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

              {/* ✅ PAGINATION */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ← Previous
                  </Button>
                  <span className="text-muted">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    <small className="ms-2">
                      (Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredRegistrations.length)} of {filteredRegistrations.length})
                    </small>
                  </span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* ✅ EXPORT SECTION - BOTTOM */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">📥 Export Options</h5>
        </Card.Header>
        <Card.Body>
          {hasActiveFilters && (
            <div className="alert alert-warning py-2 px-3 mb-3">
              <small>
                <strong>⚠️ Export Notice:</strong> You have active filters. 
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
                disabled={true}  // Always disabled
                size="lg"
                className="w-100"
                style={{
                  pointerEvents: 'none',  // Prevent all click events
                  cursor: 'not-allowed',  // Show not-allowed cursor
                  opacity: 0.6  // Optional: make it look visually disabled
                }}
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
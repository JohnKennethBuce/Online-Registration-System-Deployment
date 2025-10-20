import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Table, Form, Button, Container, Row, Col, ListGroup, InputGroup, Spinner, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [counts, setCounts] = useState({not_printed: 0, printed: 0, reprinted: 0, paid: 0, unpaid: 0, total: 0 });
  const [allRegistrations, setAllRegistrations] = useState([]); // ✅ All loaded data
  const [filteredRegistrations, setFilteredRegistrations] = useState([]); // ✅ Filtered results
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // ✅ Load all data once on mount
  useEffect(() => {
    fetchCounts();
    fetchAllData();
  }, []);

  // ✅ Filter data whenever search term changes
  useEffect(() => {
    filterData();
    setCurrentPage(1); // Reset to first page when search changes
  }, [search, allRegistrations]);

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

      // ✅ Load ALL data at once
      const res = await api.get('/dashboard/reports-list', { 
        params: { all: true } 
      });
      
      const data = res.data.data || [];
      console.log('✅ Loaded all registrations:', data.length);
      
      setAllRegistrations(data);
      setFilteredRegistrations(data); // Initially show all
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch registrations');
      setAllRegistrations([]);
      setFilteredRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Client-side filtering (includes pre-registered)
  const filterData = () => {
    if (!search.trim()) {
      setFilteredRegistrations(allRegistrations);
      return;
    }

    const searchLower = search.toLowerCase().trim();

    const filtered = allRegistrations.filter(reg => {
      // Search in multiple fields
      const firstName = (reg.first_name || '').toLowerCase();
      const lastName = (reg.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const email = (reg.email || '').toLowerCase();
      const phone = (reg.phone || '').toLowerCase();
      const ticketNumber = (reg.ticket_number || '').toLowerCase();
      const companyName = (reg.company_name || '').toLowerCase();
      const registrationType = (reg.registration_type || '').toLowerCase().replace('-', ' '); // Handle pre-registered
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

    console.log(`🔍 Search "${search}": ${filtered.length} results from ${allRegistrations.length} total`);
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
      // Payment status
      if (reg.payment_status === 'paid') {
        counts.paid++;
      } else {
        counts.unpaid++;
      }

      // Badge/Ticket status
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

  // ✅ Format registration type for display
  const formatRegistrationType = (type) => {
    if (!type) return 'N/A';
    // Convert pre-registered to Pre-Registered, onsite to Onsite, online to Online
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('-');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearch('');
  };

  const handleRefresh = () => {
    fetchAllData();
    fetchCounts();
  };

  // ✅ Pagination calculations (client-side)
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);

  // ✅ PDF Export (uses filtered data with recalculated counts)
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

      // ✅ Calculate counts from filtered data
      const exportCounts = search ? calculateCounts(dataToExport) : counts;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('Registration Reports', 14, 15);

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

      // Search filter note
      if (search) {
        doc.setFontSize(9);
        doc.setTextColor(255, 0, 0);
        doc.text(`Filtered by: "${search}"`, 14, 27);
      }

      // Summary section with all counts
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const summaryY = search ? 32 : 28;
      doc.text('Summary:', 14, summaryY);

      doc.setFontSize(9);
      doc.text(`Not Printed: ${exportCounts.not_printed}`, 14, summaryY + 5);
      doc.text(`Printed: ${exportCounts.printed}`, 50, summaryY + 5);
      doc.text(`Re-Printed: ${exportCounts.reprinted}`, 86, summaryY + 5);
      doc.text(`Paid: ${exportCounts.paid}`, 122, summaryY + 5);
      doc.text(`Unpaid: ${exportCounts.unpaid}`, 158, summaryY + 5);
      doc.text(`Total: ${exportCounts.total}`, 194, summaryY + 5);

      if (search) {
        doc.text(`🔍 Showing: ${dataToExport.length} filtered records`, 14, summaryY + 10);
      }

      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.line(14, summaryY + (search ? 13 : 8), 283, summaryY + (search ? 13 : 8));

      // Table data (includes formatted registration type)
      const tableData = dataToExport.map(reg => [
        String(reg.id || ''),
        `${reg.first_name || ''} ${reg.last_name || ''}`.trim(),
        reg.email || '',
        reg.phone || 'N/A',
        formatRegistrationType(reg.registration_type),
        reg.payment_status || '',
        reg.badge_status?.name || 'N/A',
        reg.ticket_status?.name || 'N/A',
        reg.registered_by?.name || 'System',
        new Date(reg.created_at).toLocaleDateString()
      ]);

      autoTable(doc, {
        startY: summaryY + (search ? 17 : 12),
        head: [['ID', 'Name', 'Email', 'Phone', 'Type', 'Payment', 'Badge', 'Ticket', 'By', 'Date']],
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
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 22, halign: 'center' },
          8: { cellWidth: 30 },
          9: { cellWidth: 25, halign: 'center' }
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

  // ✅ CSV Export (uses filtered data with recalculated counts)
  const exportToCSV = async () => {
    try {
      setExporting(true);

      const dataToExport = filteredRegistrations;
      
      if (dataToExport.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      // ✅ Calculate counts from filtered data
      const exportCounts = search ? calculateCounts(dataToExport) : counts;

      const summaryRows = [
        ['Registration Reports'],
        [`Generated on: ${new Date().toLocaleString()}`],
        ...(search ? [[`Filtered by: "${search}"`]] : []),
        [''],
        ['Summary Statistics'],
        ['Not Printed', exportCounts.not_printed],
        ['Printed Counts', exportCounts.printed],
        ['Re-Printed Counts', exportCounts.reprinted],
        ['Paid Counts', exportCounts.paid],
        ['Unpaid Counts', exportCounts.unpaid],
        ['Total Registrants', exportCounts.total],
        ...(search ? [[`🔍 Filtered Records`, dataToExport.length]] : []),
        [''],
        ['Registration Details']
      ];

      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Company Name',
        'Registration Type', 'Payment Status', 'Badge Status', 'Ticket Status',
        'Registered By', 'Created At'
      ];

      const dataRows = dataToExport.map(reg => [
        reg.id,
        `"${reg.first_name || ''}"`,
        `"${reg.last_name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.phone || 'N/A'}"`,
        `"${(reg.address || 'N/A').replace(/"/g, '""')}"`,
        `"${(reg.company_name || 'N/A').replace(/"/g, '""')}"`,
        formatRegistrationType(reg.registration_type),
        reg.payment_status,
        `"${reg.badge_status?.name || 'N/A'}"`,
        `"${reg.ticket_status?.name || 'N/A'}"`,
        `"${reg.registered_by?.name || 'System'}"`,
        new Date(reg.created_at).toLocaleString()
      ]);

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

  // ✅ Get badge color based on registration type
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'onsite': return 'primary';
      case 'online': return 'info';
      case 'pre-registered': return 'secondary';
      default: return 'light';
    }
  };

  return (
    <Container className="mt-4">
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

      <Row>
        <Col md={4}>
          <h4 className="mb-3">Summary</h4>
          <ListGroup>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>📄 Not Printed</span>
              <span className="badge bg-secondary rounded-pill">{counts.not_printed}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>✅ Printed Counts</span>
              <span className="badge bg-success rounded-pill">{counts.printed}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>🔄 Re-Printed Counts</span>
              <span className="badge bg-warning rounded-pill">{counts.reprinted}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>💰 Paid Counts</span>
              <span className="badge bg-info rounded-pill">{counts.paid}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span>❌ Unpaid Counts</span>
              <span className="badge bg-danger rounded-pill">{counts.unpaid}</span>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between align-items-center">
              <span><strong>👥 Total Registrants</strong></span>
              <span className="badge bg-primary rounded-pill">{counts.total}</span>
            </ListGroup.Item>
          </ListGroup>

          <div className="mt-4">
            <h5 className="mb-2">📥 Export Options</h5>
            {search && (
              <div className="alert alert-info py-2 px-3 mb-2">
                <small>
                  <strong>Filter active:</strong> "{search}"
                  <br />
                  Export will include {filteredRegistrations.length} filtered record(s)
                </small>
              </div>
            )}
            <div className="d-grid gap-2">
              <Button 
                variant="danger" 
                onClick={exportToPDF} 
                disabled={exporting || filteredRegistrations.length === 0}
                size="lg"
              >
                {exporting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating PDF...
                  </>
                ) : (
                  `📄 Export to PDF (${filteredRegistrations.length})`
                )}
              </Button>
              <Button 
                variant="success" 
                onClick={exportToCSV} 
                disabled={exporting || filteredRegistrations.length === 0}
              >
                {exporting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Generating CSV...
                  </>
                ) : (
                  `📊 Export to CSV (${filteredRegistrations.length})`
                )}
              </Button>
            </div>
            {filteredRegistrations.length === 0 && (
              <small className="text-muted d-block mt-2 text-center">
                {search ? 'No matching records to export' : 'No data available'}
              </small>
            )}
          </div>
        </Col>

        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Registration List</h4>
            <Badge bg="secondary">
              {filteredRegistrations.length} of {allRegistrations.length} records
            </Badge>
          </div>
          
          {/* ✅ Instant Search Field (updated placeholder) */}
          <InputGroup className="mb-3">
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control 
              type="text" 
              placeholder="Search: name, email, phone, ticket, type (onsite, online, pre-registered)..." 
              value={search} 
              onChange={handleSearchChange}
              disabled={loading}
            />
            {search && (
              <Button 
                variant="outline-secondary" 
                onClick={handleClearSearch}
              >
                ✕
              </Button>
            )}
          </InputGroup>

          {search && (
            <div className="alert alert-success py-2 px-3 mb-3">
              <small>
                ✅ Found <strong>{filteredRegistrations.length}</strong> result(s) for "<strong>{search}</strong>"
              </small>
            </div>
          )}

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
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Badge</th>
                      <th>Ticket</th>
                      <th>By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.length > 0 ? (
                      currentRecords.map((reg) => (
                        <tr key={reg.id}>
                          <td>{reg.id}</td>
                          <td>{reg.first_name} {reg.last_name}</td>
                          <td><small>{reg.email}</small></td>
                          <td>{reg.phone || 'N/A'}</td>
                          <td>
                            <Badge bg={getTypeBadgeColor(reg.registration_type)} className="text-capitalize">
                              {formatRegistrationType(reg.registration_type)}
                            </Badge>
                          </td>
                          <td>
                            <span className={`badge ${reg.payment_status === 'paid' ? 'bg-success' : 'bg-danger'}`}>
                              {reg.payment_status}
                            </span>
                          </td>
                          <td><small>{reg.badge_status?.name || 'N/A'}</small></td>
                          <td><small>{reg.ticket_status?.name || 'N/A'}</small></td>
                          <td><small>{reg.registered_by?.name || 'System'}</small></td>
                          <td><small>{new Date(reg.created_at).toLocaleDateString()}</small></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-4">
                          {search ? (
                            <>
                              🔍 No registrations found matching "<strong>{search}</strong>"
                              <br />
                              <Button 
                                variant="link" 
                                size="sm" 
                                onClick={handleClearSearch}
                                className="mt-2"
                              >
                                Clear search and show all
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
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;
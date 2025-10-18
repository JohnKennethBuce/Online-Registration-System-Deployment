import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Table, Form, Button, Container, Row, Col, ListGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// ✅ CORRECT imports for jsPDF v3.x and autotable v5.x
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [counts, setCounts] = useState({ printed: 0, reprinted: 0, paid: 0, unpaid: 0, total: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCounts();
    fetchList();
  }, [search, page]);

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

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = { search, page, per_page: 50 };
      const res = await api.get('/dashboard/reports-list', { params });
      
      console.log('✅ Reports list:', res.data);
      
      setRegistrations(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
    } catch (err) {
      console.error('❌ Error fetching list:', err);
      setError(err.response?.data?.message || 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // ✅ FIXED PDF Export for jsPDF v3.0.3 and autotable v5.0.2
  const exportToPDF = async () => {
    try {
      setExporting(true);
      console.log('🚀 Starting PDF export...');
      
      // Fetch all data
      const res = await api.get('/dashboard/reports-list', { 
        params: { search, all: true } 
      });
      
      const allData = res.data.data || [];
      console.log('📊 Data fetched:', allData.length, 'records');
      
      if (allData.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      // ✅ Create PDF - correct syntax for v3.x
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('📄 PDF document created');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.text('Registration Reports', 14, 15);
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      
      // Summary section
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const summaryY = 28;
      doc.text('Summary:', 14, summaryY);
      
      doc.setFontSize(9);
      doc.text(`Printed Counts: ${counts.printed}`, 14, summaryY + 5);
      doc.text(`Re-Printed Counts: ${counts.reprinted}`, 60, summaryY + 5);
      doc.text(`Paid Counts: ${counts.paid}`, 106, summaryY + 5);
      doc.text(`Unpaid Counts: ${counts.unpaid}`, 152, summaryY + 5);
      doc.text(`Total Registrants: ${counts.total}`, 198, summaryY + 5);
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, summaryY + 8, 283, summaryY + 8);
      
      // Notes section
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Notes: This report includes all registrations based on current filters and permissions.', 14, summaryY + 14);
      
      // Separator for notes
      doc.line(14, summaryY + 18, 283, summaryY + 18);
      
      // Prepare table data
      const tableData = allData.map(reg => [
        String(reg.id || ''),
        `${reg.first_name || ''} ${reg.last_name || ''}`.trim(),
        reg.email || '',
        reg.phone || 'N/A',
        reg.registration_type || '',
        reg.payment_status || '',
        reg.badge_status?.name || 'N/A',
        reg.ticket_status?.name || 'N/A',
        reg.registered_by?.name || 'System',
        new Date(reg.created_at).toLocaleDateString()
      ]);

      console.log('📋 Table data prepared:', tableData.length, 'rows');

      // ✅ CORRECT: Use autoTable function for v5.x (NOT doc.autoTable)
      autoTable(doc, {
        startY: summaryY + 22,
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
          // Page numbers
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          const pageText = `Page ${data.pageNumber} of ${pageCount}`;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });

      console.log('✅ Table added to PDF');

      // Save PDF
      const filename = `registrations_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF saved:', filename);
      alert(`✅ PDF exported successfully!\nFile: ${filename}`);
    } catch (err) {
      console.error('❌ PDF export error:', err);
      console.error('Error stack:', err.stack);
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ✅ CSV Export with summary
  const exportToCSV = async () => {
    try {
      setExporting(true);
      
      const res = await api.get('/dashboard/reports-list', { 
        params: { search, all: true } 
      });
      
      const allData = res.data.data || [];
      
      if (allData.length === 0) {
        alert('No data to export');
        setExporting(false);
        return;
      }

      // Summary at top
      const summaryRows = [
        ['Registration Reports'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [''],
        ['Summary Statistics'],
        ['Printed Counts', counts.printed],
        ['Re-Printed Counts', counts.reprinted],
        ['Paid Counts', counts.paid],
        ['Unpaid Counts', counts.unpaid],
        ['Total Registrants', counts.total],
        [''],
        ['Notes: This report includes all registrations based on current filters and permissions.'],
        [''],
        ['Registration Details']
      ];

      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address',
        'Registration Type', 'Payment Status', 'Badge Status', 'Ticket Status',
        'Registered By', 'Created At'
      ];

      const dataRows = allData.map(reg => [
        reg.id,
        `"${reg.first_name || ''}"`,
        `"${reg.last_name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.phone || 'N/A'}"`,
        `"${(reg.address || 'N/A').replace(/"/g, '""')}"`,
        reg.registration_type,
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

      // Download
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
      alert(`✅ CSV exported successfully!\nFile: ${filename}`);
    } catch (err) {
      console.error('❌ CSV export error:', err);
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>📊 Reports</h2>
      
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
            <div className="d-grid gap-2">
              <Button 
                variant="danger" 
                onClick={exportToPDF} 
                disabled={exporting || loading || counts.total === 0}
                size="lg"
              >
                {exporting ? '⏳ Generating PDF...' : '📄 Export to PDF'}
              </Button>
              <Button 
                variant="success" 
                onClick={exportToCSV} 
                disabled={exporting || loading || counts.total === 0}
              >
                {exporting ? '⏳ Generating CSV...' : '📊 Export to CSV'}
              </Button>
            </div>
            {counts.total === 0 && (
              <small className="text-muted d-block mt-2">No data available to export</small>
            )}
          </div>
        </Col>

        <Col md={8}>
          <h4 className="mb-3">Registration List</h4>
          <Form className="mb-3">
            <Form.Control 
              type="text" 
              placeholder="🔍 Search by name, email, or ticket number" 
              value={search} 
              onChange={handleSearch} 
            />
          </Form>

          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading registrations...</p>
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
                    {registrations.length > 0 ? (
                      registrations.map((reg) => (
                        <tr key={reg.id}>
                          <td>{reg.id}</td>
                          <td>{reg.first_name} {reg.last_name}</td>
                          <td><small>{reg.email}</small></td>
                          <td>{reg.phone || 'N/A'}</td>
                          <td>
                            <small className="text-capitalize">{reg.registration_type}</small>
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
                          {search ? '🔍 No registrations found matching your search' : '📭 No registrations yet'}
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
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)}
                  >
                    ← Previous
                  </Button>
                  <span className="text-muted">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                    <small className="ms-2">({registrations.length} records)</small>
                  </span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    disabled={page === totalPages} 
                    onClick={() => setPage(page + 1)}
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
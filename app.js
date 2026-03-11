// Invoice Generator - Main App Logic

let items = [];
let itemIdCounter = 0;

// Initialize with one item row
window.addEventListener('DOMContentLoaded', () => {
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('invoiceDate').value = today;
  
  // Add default item
  addItem();
  
  // Calculate totals on any input change
  document.addEventListener('input', calculateTotals);
});

function addItem() {
  const id = itemIdCounter++;
  const itemsContainer = document.getElementById('itemsContainer');
  
  const itemRow = document.createElement('div');
  itemRow.className = 'item-row';
  itemRow.id = `item-${id}`;
  itemRow.innerHTML = `
    <div class="form-group">
      <label>Description</label>
      <input type="text" class="item-description" placeholder="Service or product" required>
    </div>
    <div class="form-group">
      <label>Quantity</label>
      <input type="number" class="item-quantity" value="1" min="1" step="1">
    </div>
    <div class="form-group">
      <label>Rate</label>
      <input type="number" class="item-rate" value="0" min="0" step="0.01">
    </div>
    <div class="form-group">
      <label>Amount</label>
      <input type="text" class="item-amount" value="$0.00" readonly>
    </div>
    <button class="remove-btn" onclick="removeItem(${id})" title="Remove item">×</button>
  `;
  
  itemsContainer.appendChild(itemRow);
  items.push(id);
  calculateTotals();
}

function removeItem(id) {
  if (items.length === 1) {
    alert('Invoice must have at least one item');
    return;
  }
  
  const itemRow = document.getElementById(`item-${id}`);
  itemRow.remove();
  items = items.filter(itemId => itemId !== id);
  calculateTotals();
}

function calculateTotals() {
  let subtotal = 0;
  
  items.forEach(id => {
    const row = document.getElementById(`item-${id}`);
    if (!row) return;
    
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = quantity * rate;
    
    row.querySelector('.item-amount').value = `$${amount.toFixed(2)}`;
    subtotal += amount;
  });
  
  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').textContent = `$${subtotal.toFixed(2)}`;
}

function getFormData() {
  return {
    yourName: document.getElementById('yourName').value,
    yourEmail: document.getElementById('yourEmail').value,
    yourAddress: document.getElementById('yourAddress').value,
    clientName: document.getElementById('clientName').value,
    clientEmail: document.getElementById('clientEmail').value,
    clientAddress: document.getElementById('clientAddress').value,
    invoiceNumber: document.getElementById('invoiceNumber').value,
    invoiceDate: document.getElementById('invoiceDate').value,
    dueDate: document.getElementById('dueDate').value,
    currency: document.getElementById('currency').value || 'USD',
    notes: document.getElementById('notes').value,
    items: items.map(id => {
      const row = document.getElementById(`item-${id}`);
      return {
        description: row.querySelector('.item-description').value,
        quantity: parseFloat(row.querySelector('.item-quantity').value),
        rate: parseFloat(row.querySelector('.item-rate').value),
        amount: parseFloat(row.querySelector('.item-quantity').value) * parseFloat(row.querySelector('.item-rate').value)
      };
    }),
    subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('$', ''))
  };
}

function generatePDF() {
  const data = getFormData();
  
  // Validate required fields
  if (!data.yourName || !data.clientName || !data.invoiceNumber) {
    alert('Please fill in all required fields (Your Name, Client Name, Invoice Number)');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 20);
  
  // Your Info (left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 20, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(data.yourName, 20, 41);
  if (data.yourEmail) doc.text(data.yourEmail, 20, 46);
  if (data.yourAddress) {
    const addressLines = doc.splitTextToSize(data.yourAddress, 70);
    doc.text(addressLines, 20, 51);
  }
  
  // Invoice Details (right)
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice #:', 120, 35);
  doc.text('Date:', 120, 41);
  if (data.dueDate) doc.text('Due Date:', 120, 46);
  
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoiceNumber, 150, 35);
  doc.text(formatDate(data.invoiceDate), 150, 41);
  if (data.dueDate) doc.text(formatDate(data.dueDate), 150, 46);
  
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, 20, 76);
  if (data.clientEmail) doc.text(data.clientEmail, 20, 81);
  if (data.clientAddress) {
    const addressLines = doc.splitTextToSize(data.clientAddress, 70);
    doc.text(addressLines, 20, 86);
  }
  
  // Items Table
  const tableStartY = 105;
  
  // Table Header
  doc.setFillColor(102, 126, 234);
  doc.rect(20, tableStartY, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 22, tableStartY + 5);
  doc.text('Qty', 120, tableStartY + 5);
  doc.text('Rate', 140, tableStartY + 5);
  doc.text('Amount', 165, tableStartY + 5);
  
  // Table Rows
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 14;
  
  data.items.forEach((item, index) => {
    const description = doc.splitTextToSize(item.description, 90);
    doc.text(description, 22, currentY);
    doc.text(item.quantity.toString(), 120, currentY);
    doc.text(`$${item.rate.toFixed(2)}`, 140, currentY);
    doc.text(`$${item.amount.toFixed(2)}`, 165, currentY);
    currentY += 8 + (description.length - 1) * 5;
  });
  
  // Totals
  currentY += 10;
  doc.line(20, currentY, 190, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, currentY);
  doc.text(`${data.currency} $${data.subtotal.toFixed(2)}`, 165, currentY);
  
  // Notes
  if (data.notes) {
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, currentY);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, 170);
    doc.text(notesLines, 20, currentY + 6);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated with Free Invoice Generator', 105, 285, { align: 'center' });
  
  // Save PDF
  const filename = `invoice-${data.invoiceNumber.replace(/[^a-z0-9]/gi, '-')}.pdf`;
  doc.save(filename);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

import type { jsPDF } from "jspdf";

export interface InvoicePdfItem {
  name: string;
  imei?: string;
  color?: string;
  quantity: number;
  price: number;
  discount?: number;
  discountPercent?: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  dateStr: string;
  timeStr: string;
  placeOfSupply: string;
  poDateStr?: string;
  poNumber?: string;
  customer: {
    name: string;
    address?: string;
    cityStatePincode?: string;
    phone?: string;
  };
  items: InvoicePdfItem[];
  subtotal: number;
  total: number;
  received: number;
  youSaved?: number;
  terms?: string;
  store?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

// Indian Currency Number-to-Words Converter helper
export function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToWordsLessThanThousand = (n: number): string => {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  };

  if (num === 0) return "Zero Rupees only";

  let words = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) words += numToWordsLessThanThousand(crore) + " Crore ";
  if (lakh > 0) words += numToWordsLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) words += numToWordsLessThanThousand(thousand) + " Thousand ";
  if (num > 0) words += numToWordsLessThanThousand(num) + " ";

  return words.trim() + " Rupees only";
}

export function formatINR(val: number | null | undefined): string {
  const num = val ?? 0;
  return "Rs. " + Math.round(num).toLocaleString("en-IN") + ".00";
}

export async function generateTaxInvoicePdf(
  doc: jsPDF,
  data: InvoicePdfData,
  logoBase64?: string,
  signatureBase64?: string
) {
  // Page setup - A4 Portrait (210mm x 297mm)
  // 1. Centered Header Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text("Tax Invoice", 105, 14, { align: "center" });

  // Outer Stroke Settings for Grid Lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);

  // 2. Top Header Box (Logo & Store Info)
  doc.rect(12, 18, 186, 28);
  
  // Logo Box (Left inside Header Box)
  doc.rect(14, 20, 24, 24);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", 14.5, 20.5, 23, 23);
    } catch {
      // Fallback
    }
  }

  // Store Text Info
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(data.store?.name || "Hello Bazaar", 42, 25);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(data.store?.address || "SABJI MANDI BASANTPUR SIWAN", 42, 30);

  doc.setFont("Helvetica", "bold");
  doc.text("Phone:", 42, 35);
  doc.setFont("Helvetica", "normal");
  doc.text(data.store?.phone || "9504912525", 54, 35);

  doc.setFont("Helvetica", "normal");
  doc.text("Mobile No.:", 115, 35);

  doc.text("Address:", 42, 40);

  // 3. Bill To & Invoice Details Box
  doc.rect(12, 48, 186, 28);
  doc.line(104, 48, 104, 76); // Vertical divider
  doc.line(12, 54, 198, 54); // Header horizontal line

  // Left Side: Bill To Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Bill To:", 14, 52.5);

  // Bill To Content - Dynamic Line Layout & Text Wrapping to avoid overlaps
  let billY = 58.5;
  
  // Name
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const nameLinesCustomer = doc.splitTextToSize(data.customer.name || "Customer", 86);
  doc.text(nameLinesCustomer, 14, billY);
  billY += nameLinesCustomer.length * 3.8;

  // Address
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  if (data.customer.address) {
    const addrLines = doc.splitTextToSize(data.customer.address, 86);
    doc.text(addrLines, 14, billY);
    billY += addrLines.length * 3.5;
  }
  if (data.customer.cityStatePincode) {
    const cityLines = doc.splitTextToSize(data.customer.cityStatePincode, 86);
    doc.text(cityLines, 14, billY);
    billY += cityLines.length * 3.5;
  }
  if (data.customer.phone && billY <= 73.5) {
    doc.text(`Mobile: ${data.customer.phone}`, 14, Math.min(billY, 73.5));
  }

  // Right Side: Invoice Details Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Invoice Details:", 106, 52.5);

  // Invoice Details Content (2 Columns)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  
  // Col 1
  doc.setFont("Helvetica", "bold");
  doc.text("No:", 106, 59);
  doc.setFont("Helvetica", "bold");
  doc.text(data.invoiceNumber || "1072", 112, 59);

  doc.setFont("Helvetica", "normal");
  doc.text("Date:", 106, 63.5);
  doc.setFont("Helvetica", "bold");
  doc.text(data.dateStr || "", 115, 63.5);

  doc.setFont("Helvetica", "normal");
  doc.text("Time:", 106, 68);
  doc.setFont("Helvetica", "bold");
  doc.text(data.timeStr || "", 115, 68);

  doc.setFont("Helvetica", "normal");
  doc.text("Place of Supply:", 106, 72.5);
  doc.setFont("Helvetica", "bold");
  doc.text(data.placeOfSupply || "10-Bihar", 130, 72.5);

  // Col 2
  doc.setFont("Helvetica", "normal");
  doc.text("PO date:", 152, 59);
  doc.setFont("Helvetica", "bold");
  doc.text(data.poDateStr || data.dateStr || "", 166, 59);

  doc.setFont("Helvetica", "normal");
  doc.text("PO number:", 152, 63.5);
  doc.setFont("Helvetica", "bold");
  doc.text(data.poNumber || data.invoiceNumber || "", 171, 63.5);

  // 4. Items Table Grid
  const tableStartY = 78;
  const headerHeight = 6;
  const tableWidth = 186;

  // Header Row Box
  doc.rect(12, tableStartY, tableWidth, headerHeight);

  // Table Headers
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  doc.text("#", 14, tableStartY + 4.2);
  doc.text("Item name", 22, tableStartY + 4.2);
  doc.text("Colour", 84, tableStartY + 4.2);
  doc.text("Quantity", 116, tableStartY + 4.2, { align: "center" });
  doc.text("Price/ Unit (Rs.)", 150, tableStartY + 4.2, { align: "right" });
  doc.text("Discount (Rs.)", 175, tableStartY + 4.2, { align: "right" });
  doc.text("Amount(Rs.)", 196, tableStartY + 4.2, { align: "right" });

  let currentY = tableStartY + headerHeight;

  // Render Items with Auto-wrapping and dynamic row heights to prevent overlap
  data.items.forEach((it, idx) => {
    const rowY = currentY;
    const hasImei = Boolean(it.imei);
    const hasDiscPct = Boolean(it.discountPercent && it.discountPercent > 0);

    // Auto-wrap product name so it never overflows into the Colour column (max width 58mm)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    const nameLines = doc.splitTextToSize(it.name || "Product", 58);

    // Auto-wrap color if long (max width 20mm)
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    const colorLines = doc.splitTextToSize(it.color || "-", 20);

    // Calculate dynamic row height
    const nameHeight = nameLines.length * 3.8;
    const colorHeight = colorLines.length * 3.8;
    const imeiHeight = hasImei ? 3.8 : 0;
    const rowHeight = Math.max(7, Math.max(nameHeight + imeiHeight, colorHeight) + 3);

    // Index
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(String(idx + 1), 14, rowY + 4.2);

    // Item name (multi-line supported)
    doc.text(nameLines, 22, rowY + 4.2);
    if (hasImei) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Imei / Serial No.: ${it.imei}`, 22, rowY + 4.2 + nameHeight);
    }

    // Colour (multi-line supported)
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(colorLines, 84, rowY + 4.2);

    // Quantity
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(it.quantity), 116, rowY + 4.2, { align: "center" });

    // Price/Unit
    doc.text(`Rs. ${it.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 150, rowY + 4.2, { align: "right" });

    // Discount
    const discVal = it.discount ?? 0;
    doc.text(`Rs. ${discVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 175, rowY + 4.2, { align: "right" });
    if (hasDiscPct) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`(${it.discountPercent?.toFixed(3)}%)`, 175, rowY + 8, { align: "right" });
    }

    // Amount
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs. ${it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, rowY + 4.2, { align: "right" });

    currentY += rowHeight;
    doc.line(12, currentY, 198, currentY);
  });

  // Total Row
  const totalY = currentY;
  const totalRowHeight = 6;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  doc.text("Total", 22, totalY + 4.2);
  const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
  doc.text(String(totalQty), 116, totalY + 4.2, { align: "center" });

  const totalDisc = data.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  doc.text(`Rs. ${totalDisc.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 175, totalY + 4.2, { align: "right" });
  doc.text(`Rs. ${data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, totalY + 4.2, { align: "right" });

  currentY += totalRowHeight;
  doc.line(12, currentY, 198, currentY);

  // Draw Vertical Grid Lines across entire table (Header + Items + Total)
  const colXList = [12, 20, 82, 107, 125, 152, 177, 198];
  colXList.forEach((x) => {
    doc.line(x, tableStartY, x, currentY);
  });

  // 5. Lower Section (Summary Box, Words, Terms & Signatory)
  const summaryStartY = currentY;

  // Breakdown & Calculation Box (Right Side x=135 to 198)
  const summaryBoxWidth = 63;
  const summaryBoxX = 135;
  
  // Outer Border for Summary Box
  const summaryBoxHeight = 36;
  doc.rect(summaryBoxX, summaryStartY, summaryBoxWidth, summaryBoxHeight);

  let sumY = summaryStartY + 4.5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);

  // Sub Total
  doc.text("Sub Total", summaryBoxX + 2, sumY);
  doc.text(":", summaryBoxX + 26, sumY);
  doc.text(`Rs. ${data.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, sumY, { align: "right" });

  sumY += 5.5;
  doc.line(summaryBoxX, sumY - 1.5, 198, sumY - 1.5);

  // Total
  doc.setFont("Helvetica", "bold");
  doc.text("Total", summaryBoxX + 2, sumY + 1);
  doc.text(":", summaryBoxX + 26, sumY + 1);
  doc.text(`Rs. ${data.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, sumY + 1, { align: "right" });

  sumY += 6.5;
  doc.line(summaryBoxX, sumY - 1, 198, sumY - 1);

  // Invoice Amount In Words
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Invoice Amount In Words :", summaryBoxX + 2, sumY + 2.5);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(numberToWords(data.total), summaryBoxX + 2, sumY + 6.5);

  sumY += 10.5;
  doc.line(summaryBoxX, sumY - 1, 198, sumY - 1);

  // Received
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Received", summaryBoxX + 2, sumY + 2.5);
  doc.text(":", summaryBoxX + 26, sumY + 2.5);
  doc.text(`Rs. ${data.received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, sumY + 2.5, { align: "right" });

  sumY += 5;
  // You Saved
  const savedVal = data.youSaved ?? (data.items.reduce((s, i) => s + (i.discount || 0), 0));
  doc.text("You Saved", summaryBoxX + 2, sumY + 2);
  doc.text(":", summaryBoxX + 26, sumY + 2);
  doc.text(`Rs. ${savedVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 196, sumY + 2, { align: "right" });

  // 6. Terms And Conditions Box (Left Side x=12 to 198)
  const termsY = summaryStartY + summaryBoxHeight;
  doc.rect(12, termsY, 186, 14);
  doc.line(12, termsY + 5.5, 198, termsY + 5.5);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Terms And Conditions:", 14, termsY + 4);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.terms || "1 Year Warranty !", 14, termsY + 10);

  // 7. Authorized Signatory Box (Right Bottom)
  const signY = termsY + 14;
  const signWidth = 94;
  const signX = 104;

  doc.rect(signX, signY, signWidth, 24);
  doc.line(signX, signY + 5.5, 198, signY + 5.5);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`For ${data.store?.name || "Hello Bazaar"}:`, signX + 2, signY + 4);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorized Signatory", signX + 47, signY + 21, { align: "center" });

  return doc;
}

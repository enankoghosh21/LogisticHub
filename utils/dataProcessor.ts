import { LogisticsCase } from '../types';
import { differenceInDays, parse, isValid, parseISO, format } from 'date-fns';

// Helper to parse various date formats often found in Excel
const parseExcelDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Excel serial date (days since 1900-01-01)
  if (typeof value === 'number') {
     // Excel counts from 1900, JS from 1970. Approx conversion:
     const date = new Date(Math.round((value - 25569) * 86400 * 1000));
     return date;
  }

  if (typeof value === 'string') {
    // Try common formats
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    for (const fmt of formats) {
      const d = parse(value, fmt, new Date());
      if (isValid(d)) return d;
    }
    // Fallback to ISO
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  }
  
  return null;
};

export const processRawData = (jsonData: any[]): LogisticsCase[] => {
  // jsonData is array of arrays. Row 0 is likely header.
  // We will try to map by index as per user prompt A-W.
  // Excel columns are 0-indexed here: A=0, B=1, ... Q=16, U=20, V=21, W=22
  
  const processed: LogisticsCase[] = [];
  const today = new Date();

  // Start from index 1 to skip header, unless user uploads headerless. 
  // We assume row 0 is header.
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const registrationDate = parseExcelDate(row[0]);
    const orderStatus = String(row[16] || '').trim(); // Col Q
    const isEmergencyRaw = String(row[12] || '').trim().toLowerCase(); // Col M

    // Parse Handling DDL (Col O - index 14) and Updated ETA (Col R - index 17)
    const handlingDdlDate = parseExcelDate(row[14]);
    const updatedEtaDate = parseExcelDate(row[17]);

    // Logic: If Order Status is "Under Follow Up", it is Open.
    const isOpen = orderStatus === 'Under Follow Up';
    
    let calculatedPendency = 0;
    if (isOpen && registrationDate) {
      calculatedPendency = differenceInDays(today, registrationDate);
    } else if (row[22]) {
        // If provided in Col W and valid number
        calculatedPendency = Number(row[22]) || 0;
    }

    processed.push({
      id: `case-${i}-${row[5] || Math.random()}`,
      registrationDate,
      customerName: String(row[1] || ''),
      contactNumber: String(row[2] || ''),
      warehouse: String(row[3] || ''),
      deliveryPartner: String(row[4] || ''),
      orderNumber: String(row[5] || ''),
      onNumber: String(row[6] || ''),
      awbNumber: String(row[7] || ''),
      abnormalType: String(row[8] || 'Unknown'),
      description: String(row[9] || ''),
      product: String(row[10] || ''),
      woStatus: String(row[11] || ''),
      isEmergency: isEmergencyRaw === 'yes',
      oEta: String(row[13] || ''),
      handlingDdl: handlingDdlDate ? format(handlingDdlDate, 'MMM dd, yyyy') : String(row[14] || ''),
      requirementMails: String(row[15] || ''),
      orderStatus: orderStatus,
      updatedEta: updatedEtaDate ? format(updatedEtaDate, 'MMM dd, yyyy') : String(row[17] || ''),
      others: String(row[18] || ''),
      caseStatus: String(row[20] || ''),
      caseCloseDate: parseExcelDate(row[21]),
      pendingDays: Number(row[22]) || 0,
      calculatedPendency,
      isOpen
    });
  }

  return processed;
};
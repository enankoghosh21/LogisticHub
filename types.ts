export interface LogisticsCase {
  id: string; // Generated ID
  registrationDate: Date | null; // Col A
  customerName: string; // Col B
  contactNumber: string; // Col C
  warehouse: string; // Col D
  deliveryPartner: string; // Col E
  orderNumber: string; // Col F
  onNumber: string; // Col G
  awbNumber: string; // Col H
  abnormalType: string; // Col I
  description: string; // Col J
  product: string; // Col K
  woStatus: string; // Col L
  isEmergency: boolean; // Col M (Yes/No)
  oEta: string; // Col N
  handlingDdl: string; // Col O
  requirementMails: string; // Col P
  orderStatus: string; // Col Q
  updatedEta: string; // Col R
  others: string; // Col S
  // Col T skipped
  caseStatus: string; // Col U
  caseCloseDate: Date | null; // Col V
  pendingDays: number; // Col W (or calculated)
  
  // Calculated Fields
  calculatedPendency: number; // Days open relative to today
  isOpen: boolean; // Based on Order Status "Under Follow Up"
}

export interface DashboardStats {
  totalCases: number;
  openCases: number;
  emergencyCases: number;
  avgPendency: number;
  longestPending: number;
}

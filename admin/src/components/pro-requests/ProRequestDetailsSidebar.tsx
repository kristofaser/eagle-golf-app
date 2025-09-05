'use client';

import ProRequestValidationView from './ProRequestValidationView';
import type { ProValidationRequestWithDetails } from '@/types';

interface ProRequestDetailsSidebarProps {
  request: ProValidationRequestWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  onReject: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  canValidate?: boolean;
}

export default function ProRequestDetailsSidebar({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject,
  canValidate = false
}: ProRequestDetailsSidebarProps) {
  return (
    <ProRequestValidationView
      request={request}
      isOpen={isOpen}
      onClose={onClose}
      onApprove={onApprove}
      onReject={onReject}
      canValidate={canValidate}
    />
  );
}
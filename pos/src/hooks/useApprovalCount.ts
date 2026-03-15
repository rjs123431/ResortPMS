import { useQuery } from '@tanstack/react-query';
import { approvalService } from '@services/approval.service';

export function useApprovalCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ['approval-count'],
    queryFn: ({ signal }) => approvalService.getForApprovalCount(signal),
    enabled,
  });
}

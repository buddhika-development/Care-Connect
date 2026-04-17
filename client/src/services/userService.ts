import axios from 'axios';

import { apiClient } from '@/lib/axios';

export interface UserSummaryDetails {
  id?: string;
  user_id?: string;
  user_summary?: string;
  created_datetime?: string;
  updated_datetime?: string;
  [key: string]: unknown;
}

function normalizeUserSummary(raw: unknown): UserSummaryDetails {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return raw as UserSummaryDetails;
}

export async function getUserSummaryDetails(userId: string): Promise<UserSummaryDetails | null> {
  try {
    const { data } = await apiClient.get(`${process.env.NEXT_PUBLIC_SUMMARY_ENDPOINT}/user/${userId}/details`);
    const payload = data?.data ?? data;
    if (!payload) return null;
    return normalizeUserSummary(payload);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}
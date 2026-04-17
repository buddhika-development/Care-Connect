import { apiClient } from '@/lib/axios';

export interface TelemedicineSession {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  room_name: string;
  patient_join_url: string;
  doctor_join_url: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  cancelled_at: string | null;
  session_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface JoinRoomResponse {
  roomName: string;
  joinUrl: string;
  status: TelemedicineSession['status'];
}

export async function getTelemedicineSessionById(sessionId: string): Promise<TelemedicineSession> {
  const { data } = await apiClient.get(`/api/telemedicine/sessions/${sessionId}`);
  return data.data as TelemedicineSession;
}

export async function startTelemedicineRoom(sessionId: string): Promise<void> {
  await apiClient.patch(`/api/telemedicine/room/start/${sessionId}`);
}

export async function joinTelemedicineRoom(sessionId: string): Promise<JoinRoomResponse> {
  const { data } = await apiClient.get(`/api/telemedicine/room/join/${sessionId}`);
  return data.data as JoinRoomResponse;
}

export async function openTelemedicineMeetingInNewTab(
  sessionId: string,
  role: 'doctor' | 'patient',
): Promise<void> {
  const session = await getTelemedicineSessionById(sessionId);

  if (role === 'doctor' && session.status === 'pending') {
    await startTelemedicineRoom(sessionId);
  }

  const room = await joinTelemedicineRoom(sessionId);

  if (!room.joinUrl) {
    throw new Error('No join URL found for this session.');
  }

  const newTab = window.open(room.joinUrl, '_blank', 'noopener,noreferrer');
  if (!newTab) {
    throw new Error('Popup blocked. Please allow popups and try again.');
  }
}

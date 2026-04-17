'use client';

import { useState } from 'react';
import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { openTelemedicineMeetingInNewTab } from '@/services/telemedicineService';

interface TelemedicineJoinButtonProps {
  sessionId: string | null | undefined;
  role: 'doctor' | 'patient';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function TelemedicineJoinButton({
  sessionId,
  role,
  label = 'Join Session',
  className,
  disabled = false,
}: TelemedicineJoinButtonProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!sessionId) {
      toast.error('No telemedicine session is linked to this appointment.');
      return;
    }

    try {
      setIsJoining(true);
      await openTelemedicineMeetingInNewTab(sessionId, role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join telemedicine session.';
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={disabled || isJoining}
      className={cn(className, (disabled || isJoining) && 'opacity-60 cursor-not-allowed')}
    >
      <Video className="w-3.5 h-3.5" />
      {isJoining ? 'Joining...' : label}
    </button>
  );
}

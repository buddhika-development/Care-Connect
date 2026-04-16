'use client';

import { useState } from 'react';
import { Search, Filter, MapPin, Video, Building2, IndianRupee } from 'lucide-react';
import { useDoctors } from '@/hooks/useDoctor';
import { useBookingStore } from '@/store/bookingStore';
import { DoctorCard } from '@/types/doctor';
import { ConsultationType } from '@/types/common';
import EmptyState from '@/components/common/EmptyState';
import BookingFlow from '@/components/patient/BookingFlow';
import { formatCurrency, getInitials } from '@/lib/utils';

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Pulmonologist',
  'Dermatologist', 'Orthopedic Surgeon', 'Pediatrician', 'Neurologist',
];

function DoctorCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 skeleton rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-32" />
          <div className="h-3 skeleton rounded w-24" />
        </div>
      </div>
      <div className="h-3 skeleton rounded w-40" />
      <div className="h-10 skeleton rounded-xl" />
    </div>
  );
}

export default function FindDoctorPage() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [consultationType, setConsultationType] = useState<ConsultationType | 'all'>('all');
  const [bookingDoctor, setBookingDoctor] = useState<DoctorCard | null>(null);

  const { data: doctors, isLoading, isError, refetch } = useDoctors(
    search || undefined,
    specialization !== 'All' ? specialization : undefined
  );

  const setDoctor = useBookingStore((s) => s.setDoctor);

  const filtered = (doctors ?? []).filter(d =>
    consultationType === 'all' || d.availableConsultationTypes.includes(consultationType)
  );

  const handleBook = (doctor: DoctorCard) => {
    setDoctor(doctor);
    setBookingDoctor(doctor);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Find a Doctor</h1>
        <p className="text-text-secondary text-sm mt-1">Search by name, specialization, or consultation type</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2 bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex rounded-xl border border-border overflow-hidden text-sm">
            {(['all', 'physical', 'online'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setConsultationType(type)}
                className={`px-3 py-2 font-medium capitalize transition-colors ${consultationType === type ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-secondary'}`}
              >
                {type === 'all' ? 'All Types' : type === 'online' ? '📹 Online' : '🏥 Physical'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <DoctorCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-error font-medium mb-3">Failed to load doctors.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No doctors found"
          description="Try adjusting your search or filters to find the right doctor."
          action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setSpecialization('All'); setConsultationType('all'); } }}
        />
      ) : (
        <>
          <p className="text-sm text-text-secondary">{filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doctor) => (
              <div key={doctor.id} className="bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                    {doctor.profileImage
                      ? <img src={doctor.profileImage} alt="" className="w-full h-full object-cover rounded-2xl" />
                      : getInitials(doctor.firstName, doctor.lastName)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{doctor.currentHospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <IndianRupee className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium text-text">{formatCurrency(doctor.consultationFee)}</span>
                    <span>/ consultation</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {doctor.availableConsultationTypes.includes('physical') && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-secondary text-accent rounded-full font-medium">
                        <MapPin className="w-3 h-3" /> Physical
                      </span>
                    )}
                    {doctor.availableConsultationTypes.includes('online') && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-50 text-primary rounded-full font-medium">
                        <Video className="w-3 h-3" /> Online
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBook(doctor)}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-sm transition-all"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Booking Flow Modal */}
      {bookingDoctor && (
        <BookingFlow
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  );
}

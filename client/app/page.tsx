'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Heart, Calendar, Video, Brain, Shield, ChevronRight,
  Star, Stethoscope, Clock, CheckCircle, ArrowRight, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Health Assistant',
    description: 'Get instant health guidance, symptom analysis, and doctor recommendations from our intelligent CareBot.',
    color: 'text-primary',
    bg: 'bg-primary-50',
    border: 'border-primary-100',
  },
  {
    icon: Calendar,
    title: 'Smart Appointment Booking',
    description: 'Find the right specialist, choose your preferred time slot, and book in seconds — with instant confirmation.',
    color: 'text-accent',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: Video,
    title: 'Telemedicine Sessions',
    description: 'Consult with your doctor from anywhere via encrypted HD video call. No waiting rooms, no commute.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    icon: Shield,
    title: 'Secure Medical Records',
    description: 'Your prescriptions, test results, and medical history — securely stored and always accessible.',
    color: 'text-success',
    bg: 'bg-success-light',
    border: 'border-green-100',
  },
];

const STATS = [
  { value: 1200, suffix: '+', label: 'Verified Doctors' },
  { value: 50000, suffix: '+', label: 'Patients Served' },
  { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  { value: 24, suffix: '/7', label: 'Support Available' },
];

const TESTIMONIALS = [
  {
    name: 'Kavindi Perera',
    role: 'Patient',
    location: 'Colombo',
    text: "CareConnect made it so easy to find a cardiologist and book a telemedicine session within minutes. The AI assistant helped me understand my symptoms before I even spoke to the doctor.",
    avatar: 'KP',
    rating: 5,
  },
  {
    name: 'Dr. Suresh Fernando',
    role: 'General Physician',
    location: 'National Hospital, Colombo',
    text: "Managing my schedule is effortless now. My patients can book slots, and I get a clear view of my day. The prescription builder during sessions saves me significant time.",
    avatar: 'SF',
    rating: 5,
  },
  {
    name: 'Nimali Jayawardena',
    role: 'Patient',
    location: 'Kandy',
    text: "As someone with a chronic condition, having all my records in one place and being able to consult a doctor without traveling is life-changing. Highly recommended!",
    avatar: 'NJ',
    rating: 5,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up as a patient in under 2 minutes. Complete your health profile to personalise your experience.' },
  { step: '02', title: 'Find the Right Doctor', desc: 'Search by specialization, location, or availability. Read profiles and book your preferred consultation type.' },
  { step: '03', title: 'Attend Your Appointment', desc: 'Visit in person or join a secure video call. Your doctor has full context — history, reports, medications.' },
  { step: '04', title: 'Follow Up with Ease', desc: 'Receive your digital prescription, schedule follow-ups, and chat with CareBot for ongoing guidance.' },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-background font-inter overflow-x-hidden">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-text text-lg">CareConnect</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                href={`/${user.role}/dashboard`}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all shadow-sm"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-gradient-to-t from-secondary/50 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            Sri Lanka&apos;s most advanced healthcare platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text leading-tight mb-6">
            Healthcare,
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #00A896, #00C9B1)' }}>
              reimagined.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with verified doctors, book appointments, attend video consultations,
            and manage your complete health journey — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated && user ? (
              <Link
                href={`/${user.role}/dashboard`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Go to my Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-border hover:border-primary bg-card text-text font-bold text-base transition-all hover:bg-primary-50"
                >
                  Sign in to your account
                </Link>
              </>
            )}
          </div>

          <p className="text-xs text-text-muted mt-4">No credit card required · Free for patients</p>

          {/* Hero card — dynamic: shows real user info if logged in, generic preview if not */}
          <div className="mt-14 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 z-10 pointer-events-none rounded-3xl" />
            <div className="bg-card border border-border rounded-3xl shadow-2xl p-6 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  {isAuthenticated && user ? (
                    <>
                      <p className="font-bold text-text">Welcome back, {user.firstName}!</p>
                      <p className="text-sm text-text-secondary capitalize">{user.role} account · {user.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-text">Good afternoon, Future Patient</p>
                      <p className="text-sm text-text-secondary">Your health journey starts here</p>
                    </>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-success font-medium bg-success-light px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-success rounded-full" />
                  {isAuthenticated ? 'Active' : 'All good'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Calendar, label: 'Book', value: 'Appointments', color: 'text-primary', bg: 'bg-primary-50' },
                  { icon: Clock, label: 'Instant', value: 'Confirmation', color: 'text-accent', bg: 'bg-orange-50' },
                  { icon: CheckCircle, label: 'Digital', value: 'Prescriptions', color: 'text-success', bg: 'bg-success-light' },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-secondary rounded-xl">
                    <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <p className="text-xs text-text-muted">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-text text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Why CareConnect</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Everything you need, nothing you don&apos;t</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Built specifically for Sri Lankan healthcare — local hospitals, verified doctors, LKR payments.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`bg-card border ${f.border} rounded-2xl p-6 hover:shadow-card-hover transition-shadow`}>
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-secondary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border z-0 -translate-x-6" />
                )}
                <div className="bg-card rounded-2xl border border-border p-5 relative z-10 h-full">
                  <div className="text-3xl font-black text-primary/20 mb-3">{step.step}</div>
                  <h3 className="font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Real Stories</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">Loved by patients & doctors</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border border-border p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-primary rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white" />
            </div>
            <div className="relative">
              <Stethoscope className="w-10 h-10 text-white/70 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to take control of your health?</h2>
              <p className="text-primary-light text-base mb-8">Join thousands of Sri Lankans who have made CareConnect their trusted healthcare companion.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-bold hover:bg-primary-50 transition-all">
                  Create free account
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all">
                  Already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-bold text-text text-sm">CareConnect</span>
          </div>
          <p className="text-xs text-text-muted">© 2025 CareConnect. Built for Sri Lanka&apos;s healthcare future.</p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PhoneOff, Mic, MicOff, Video, VideoOff, MessageSquare, ArrowLeft } from 'lucide-react';

interface ChatMsg { id: string; sender: string; text: string; time: string; }

const MOCK_MESSAGES: ChatMsg[] = [
  { id: '1', sender: 'Dr. Suresh Fernando', text: 'Good morning! I can see you clearly. How are you feeling today?', time: '10:02 AM' },
  { id: '2', sender: 'You', text: "Good morning, doctor. I've been having some chest discomfort since yesterday.", time: '10:02 AM' },
  { id: '3', sender: 'Dr. Suresh Fernando', text: "I see. Can you describe the discomfort? Is it sharp or dull? Any other symptoms?", time: '10:03 AM' },
];

export default function TelemedicineRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>(MOCK_MESSAGES);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-white font-medium text-sm">Session in progress</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-success rounded-full pulse-dot" />
              {formatTime(elapsed)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden md:block">Room: {id?.slice(0, 8)}...</span>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className={`flex-1 p-4 ${showChat ? 'hidden md:flex' : 'flex'} gap-4 flex-col sm:flex-row`}>
          {/* Doctor video (simulated) */}
          <div className="flex-1 rounded-2xl bg-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-3xl font-bold text-accent">SF</span>
              </div>
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
              Dr. Suresh Fernando
            </div>
            <div className="absolute bottom-3 right-3 w-2 h-2 bg-success rounded-full" />
          </div>

          {/* Patient video (self) */}
          <div className="sm:w-56 h-40 sm:h-full rounded-2xl bg-gray-700 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">KP</span>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
              You {isMuted && <span className="ml-1">🔇</span>}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-full md:w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-medium text-sm">Session Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`${msg.sender === 'You' ? 'text-right' : ''}`}>
                  <p className="text-xs text-gray-500 mb-1">{msg.sender} · {msg.time}</p>
                  <div className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[90%] ${msg.sender === 'You' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-100'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-xl outline-none border border-gray-700 focus:border-primary placeholder:text-gray-600"
              />
              <button onClick={sendMessage} className="px-3 py-2 bg-primary rounded-xl text-white text-sm">Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-5 bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-error text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-error text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        <button
          onClick={() => router.back()}
          className="w-14 h-14 rounded-full bg-error hover:bg-red-700 flex items-center justify-center transition-all shadow-lg"
          title="End call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

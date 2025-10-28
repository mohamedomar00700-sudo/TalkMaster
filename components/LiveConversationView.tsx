import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scenario, UserLevel, Message, Speaker, Voice, ConversationResult } from '../types';
import { connectLiveSession } from '../services/geminiService';
import { decode, decodeAudioData, createBlob } from '../services/audioService';
import { PhoneOffIcon } from './icons';
import { LiveServerMessage, LiveSession } from '@google/genai';
import ExpressiveBotAvatar from './ExpressiveBotAvatar';
import MessageBubble from './MessageBubble'; // Import the new MessageBubble

interface LiveConversationViewProps {
  scenario: Scenario;
  userLevel: UserLevel;
  voice: Voice;
  onConversationEnd: (result: Omit<ConversationResult, 'duration'>) => void;
  selectedAvatarId: string;
}

type CallStatus = 'CONNECTING' | 'LIVE' | 'ERROR' | 'ENDED' | 'THINKING';

const LiveConversationView: React.FC<LiveConversationViewProps> = ({ scenario, userLevel, voice, onConversationEnd, selectedAvatarId }) => {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [status, setStatus] = useState<CallStatus>('CONNECTING');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRefs = useRef({ userInput: '', modelOutput: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // FIX: Replace NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [transcript]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up live session...');
    setStatus('ENDED');
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current);

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    scriptProcessorRef.current?.disconnect();
    
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(console.error);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(console.error);
    }

    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();

    sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing session:", e));

  }, []);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
    setStatus('LIVE'); // Reset to LIVE whenever a message comes in

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContextRef.current.destination);
      source.addEventListener('ended', () => {
        outputSourcesRef.current.delete(source);
      });
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      outputSourcesRef.current.add(source);
    }

    if (message.serverContent?.interrupted) {
      outputSourcesRef.current.forEach(source => source.stop());
      outputSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    }

    if (message.serverContent?.inputTranscription) {
      transcriptionRefs.current.userInput += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
      transcriptionRefs.current.modelOutput += message.serverContent.outputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const userText = transcriptionRefs.current.userInput.trim();
      const botText = transcriptionRefs.current.modelOutput.trim();
      const newMessages: Message[] = [];
      if (userText) {
        newMessages.push({ id: `user-${Date.now()}`, speaker: Speaker.User, text: userText });
      }
      if (botText) {
        newMessages.push({ id: `bot-${Date.now()}`, speaker: Speaker.Bot, text: botText });
      }
      if (newMessages.length > 0) {
        setTranscript(prev => [...prev, ...newMessages]);
      }
      transcriptionRefs.current = { userInput: '', modelOutput: '' };
      
      // Heuristic to detect if bot is now thinking after a turn
      turnTimerRef.current = setTimeout(() => {
        if (outputSourcesRef.current.size === 0) {
            setStatus('THINKING');
        }
      }, 500); // Wait 500ms after a turn completes to see if a new one starts
    }

  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const sessionPromise = connectLiveSession(scenario.systemPrompt, userLevel, voice, {
          onopen: () => {
            console.log('Live session opened.');
            setStatus('THINKING'); // Start in thinking state until first audio comes
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: handleMessage,
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('ERROR');
          },
          onclose: (e: CloseEvent) => {
            console.log('Live session closed.');
            if (status !== 'ENDED') {
                cleanup();
            }
          },
        });
        sessionPromiseRef.current = sessionPromise;

      } catch (err) {
        console.error('Failed to initialize live session:', err);
        setStatus('ERROR');
      }
    };
    initialize();
    return cleanup;
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = () => {
    cleanup();
    onConversationEnd({
      earnedXp: transcript.filter(m => m.speaker === Speaker.User).length * 10,
      messages: transcript,
      scenario
    });
  };

  const getStatusDisplay = () => {
    switch(status) {
        case 'CONNECTING':
            return { text: 'Connecting Call...', color: 'text-amber-300' };
        case 'LIVE':
            return { text: 'Live', color: 'text-emerald-400 animate-pulse' };
        case 'THINKING':
            return { text: 'Thinking...', color: 'text-sky-300' };
        case 'ERROR':
            return { text: 'Connection Error', color: 'text-rose-400' };
        case 'ENDED':
            return { text: 'Call Ended', color: 'text-slate-400' };
        default:
            return { text: '', color: ''};
    }
  }

  return (
    <div className="flex flex-col h-[80vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden relative">
       <div 
        className="absolute inset-0 conversation-background"
        style={{ backgroundImage: `url(${scenario.backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-slate-900/40"></div>

      <div className="relative z-10 flex flex-col h-full">
         <header className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{scenario.emoji}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{scenario.title}</h2>
                <p className={ `text-xs font-semibold ${getStatusDisplay().color}` }>{getStatusDisplay().text}</p>
              </div>
            </div>
          </header>

        <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
                {transcript.map((msg) => (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg}
                        avatarId={selectedAvatarId} 
                        isBotSpeaking={false} // Not applicable in live view
                        translatedText={null} // Not applicable in live view
                        onReplayAudio={()=>{}} // Not applicable
                        onTranslate={()=>{}} // Not applicable
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>

        <footer className="flex flex-col items-center justify-center p-6 space-y-6">
            <ExpressiveBotAvatar isThinking={status === 'THINKING'} isSpeaking={status === 'LIVE'} avatarId={selectedAvatarId} />
            <button 
              onClick={handleEnd} 
              className="flex items-center justify-center w-16 h-16 space-x-2 font-semibold text-white bg-gradient-to-br from-rose-500 to-red-600 rounded-full shadow-lg hover:scale-105 transition-transform duration-150 active:scale-95"
              aria-label="End Call"
            >
              <PhoneOffIcon className="w-8 h-8" />
            </button>
        </footer>
      </div>
    </div>
  );
};

export default LiveConversationView;
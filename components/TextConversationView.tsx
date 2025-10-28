import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scenario, UserLevel, Message, Speaker, ConversationStatus, Voice, ConversationResult } from '../types';
import { createChatSession, generateSpeech, getFeedbackOnText, getHint, translateText } from '../services/geminiService';
import { audioService, decode, decodeAudioData } from '../services/audioService';
import { reviewService } from '../services/reviewService';
import MessageBubble from './MessageBubble';
import VocabularyPopup from './VocabularyPopup';
import { StopIcon, SendIcon, LightbulbIcon, MicIcon } from './icons';
import { Chat } from '@google/genai';
import ExpressiveBotAvatar from './ExpressiveBotAvatar';

// Fix for SpeechRecognition types not being present in standard DOM libs
interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

interface TextConversationViewProps {
  scenario: Scenario;
  userLevel: UserLevel;
  voice: Voice;
  onConversationEnd: (result: Omit<ConversationResult, 'duration'>) => void;
  selectedAvatarId: string;
}

const Waveform: React.FC = () => (
    <div className="flex items-center justify-center h-full space-x-1">
        <div className="w-1 bg-white rounded-full waveform-bar" style={{ animationDelay: '0s' }}></div>
        <div className="w-1 bg-white rounded-full waveform-bar" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1 bg-white rounded-full waveform-bar" style={{ animationDelay: '0.4s' }}></div>
        <div className="w-1 bg-white rounded-full waveform-bar" style={{ animationDelay: '0.6s' }}></div>
        <div className="w-1 bg-white rounded-full waveform-bar" style={{ animationDelay: '0.8s' }}></div>
    </div>
);


const TextConversationView: React.FC<TextConversationViewProps> = ({ scenario, userLevel, voice, onConversationEnd, selectedAvatarId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.CONNECTING);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Map<string, string>>(new Map());
  
  const [vocabPopup, setVocabPopup] = useState<{ word: string, x: number, y: number } | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleApiError = useCallback((error: any) => {
    console.error("API Error:", error);
    audioService.playError();
    const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
        setStatus(ConversationStatus.RATE_LIMIT_ERROR);
        setTimeout(() => {
            setStatus(ConversationStatus.IDLE);
            setIsProcessing(false);
        }, 5000);
    } else {
        setStatus(ConversationStatus.ERROR);
        setIsProcessing(false);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || !outputAudioContextRef.current) return;
    setStatus(ConversationStatus.SPEAKING);
    setIsProcessing(true);
    setIsBotSpeaking(true);
    
    try {
        const base64Audio = await generateSpeech(text, voice.id);
        if (base64Audio && outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
          const ctx = outputAudioContextRef.current;
          const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start();
          source.onended = () => {
            setStatus(ConversationStatus.IDLE);
            setIsProcessing(false);
            setIsBotSpeaking(false);
          };
        } else {
            setStatus(ConversationStatus.IDLE);
            setIsProcessing(false);
            setIsBotSpeaking(false);
        }
    } catch(error) {
        setIsBotSpeaking(false);
        handleApiError(error);
    }
  }, [voice.id, handleApiError]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    audioService.playMessageSend();
    setIsProcessing(true);
    setInputValue('');

    const userMessageId = Date.now() + 'user';
    const userMessage: Message = { id: userMessageId, speaker: Speaker.User, text: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    
    setStatus(ConversationStatus.THINKING);

    getFeedbackOnText(text.trim())
      .then(feedback => {
        if (feedback) {
            setMessages(prev => prev.map(msg => 
                msg.id === userMessageId ? { ...msg, feedback } : msg
            ));
            if (feedback !== 'Great job!') {
              const correction = feedback.split('->')[1]?.trim().split('(')[0]?.trim() || feedback;
              reviewService.addReviewItem({
                id: Date.now().toString(),
                original: text.trim(),
                correction,
              });
            }
        }
      })
      .catch(error => {
        console.error("Non-blocking feedback error:", error);
        setMessages(prev => prev.map(msg => 
            msg.id === userMessageId ? { ...msg, feedback: "Couldn't get feedback due to an API error." } : msg
        ));
      });

    try {
        const response = await chatSessionRef.current.sendMessage({ message: text.trim() });
        const botText = response.text;
        audioService.playMessagePop();
        setMessages(prev => [...prev, { id: Date.now() + 'bot', speaker: Speaker.Bot, text: botText }]);
        await speak(botText);

    } catch (error) {
        handleApiError(error);
    }
  }, [speak, handleApiError]);
  
  const cleanup = useCallback(() => {
    if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(console.error);
    }
  }, []);

  const initialize = useCallback(async () => {
    cleanup();
    setMessages([]);
    setStatus(ConversationStatus.CONNECTING);

    try {
      chatSessionRef.current = createChatSession(scenario.systemPrompt, userLevel);
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setInputValue(transcript);
              setStatus(ConversationStatus.IDLE);
          };
          recognition.onerror = (event) => {
              console.error('Speech recognition error:', event.error);
              setStatus(ConversationStatus.IDLE);
          };
          recognition.onend = () => {
              if (status === ConversationStatus.LISTENING) {
                  setStatus(ConversationStatus.IDLE);
              }
          };
          speechRecognitionRef.current = recognition;
      }

      const initialResponse = await chatSessionRef.current.sendMessage({ message: "Hello, please start the conversation." });
      const botText = initialResponse.text;
      
      audioService.playMessagePop();
      setMessages([{ id: Date.now() + 'bot', speaker: Speaker.Bot, text: botText }]);
      await speak(botText);
      
    } catch (error) {
      handleApiError(error);
    }
  }, [scenario.systemPrompt, userLevel, cleanup, speak, status, handleApiError]);

  useEffect(() => {
    initialize();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleMicClick = () => {
      if (!speechRecognitionRef.current) {
          alert('Speech recognition is not supported in this browser.');
          return;
      }
      if (status === ConversationStatus.LISTENING) {
          speechRecognitionRef.current.stop();
          setStatus(ConversationStatus.IDLE);
      } else if (!isProcessing) {
          speechRecognitionRef.current.start();
          setStatus(ConversationStatus.LISTENING);
      }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(inputValue);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioService.playKeypress();
    setInputValue(e.target.value);
  };

  const handleEnd = () => {
    cleanup();
    onConversationEnd({
      earnedXp: messages.filter(m => m.speaker === Speaker.User).length * 10,
      messages,
      scenario
    });
  };

  const handleHintClick = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatus(ConversationStatus.THINKING);
    try {
        const hintText = await getHint(messages, scenario.systemPrompt);
        setInputValue(hintText);
        setStatus(ConversationStatus.IDLE);
        setIsProcessing(false);
    } catch (error) {
        handleApiError(error);
    }
  };
  
  const handleTranslate = useCallback(async (messageId: string, text: string) => {
    if (translatedMessages.has(messageId)) return;
    try {
        const translation = await translateText(text);
        if (translation) {
            setTranslatedMessages(prev => new Map(prev).set(messageId, translation));
        }
    } catch (error) {
        console.error("Translation error:", error);
    }
  }, [translatedMessages]);
  
  const handleReplayAudio = useCallback(async (text: string) => {
    await speak(text);
  }, [speak]);

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    setVocabPopup({ word, x: event.clientX, y: event.clientY });
  };

  const closeVocabPopup = () => {
    setVocabPopup(null);
  }
  
  return (
    <div className="flex flex-col h-[80vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden relative"
    >
      <div 
        className="absolute inset-0 conversation-background"
        style={{ backgroundImage: `url(${scenario.backgroundImage})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20"></div>

      <div className="relative z-10 flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{scenario.emoji}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{scenario.title}</h2>
                <p className="text-xs text-slate-300">{status === ConversationStatus.IDLE ? 'Ready' : status}</p>
              </div>
            </div>
            <button onClick={handleEnd} className="flex items-center justify-center w-10 h-10 text-white transition-all duration-200 bg-rose-600/80 rounded-full hover:bg-rose-600 active:scale-95">
              <StopIcon className="w-5 h-5" />
            </button>
          </header>
          
          <div className="flex-1 p-4 overflow-y-auto" onClick={closeVocabPopup}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onWordClick={handleWordClick} 
                    avatarId={selectedAvatarId} 
                    isBotSpeaking={isBotSpeaking && messages[messages.length-1].id === msg.id}
                    translatedText={translatedMessages.get(msg.id) || null}
                    onReplayAudio={handleReplayAudio}
                    onTranslate={handleTranslate}
                />
              ))}
              {status === ConversationStatus.THINKING && (
                 <div className="flex items-end justify-start gap-3 message-enter">
                     <ExpressiveBotAvatar isThinking={true} isSpeaking={false} avatarId={selectedAvatarId} />
                     <div className="max-w-md px-4 py-3 rounded-3xl shadow bg-slate-200 dark:bg-slate-700 rounded-bl-lg">
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></span>
                        </div>
                     </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <footer className="p-4 glassmorphism">
            <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                <button
                    type="button"
                    onClick={handleHintClick}
                    disabled={isProcessing}
                    className="flex-shrink-0 p-3 bg-amber-500/80 rounded-full hover:bg-amber-500 disabled:bg-slate-500/50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                    aria-label="Get a hint"
                >
                    <LightbulbIcon className="w-6 h-6 text-white"/>
                </button>
                <div className="relative flex-grow h-12">
                   {status === ConversationStatus.LISTENING ? (
                        <Waveform/>
                   ) : (
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Type or use mic..."
                        className="w-full h-full px-5 text-white placeholder-slate-300 bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                        disabled={isProcessing}
                        aria-label="Your message"
                    />
                   )}
                </div>
                <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className={`flex-shrink-0 p-3 rounded-full transition-all duration-150 transform active:scale-95
                        ${status === ConversationStatus.LISTENING ? 'bg-rose-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'} 
                        disabled:bg-slate-500/50 disabled:cursor-not-allowed`
                    }
                    aria-label="Use microphone"
                >
                    <MicIcon className="w-6 h-6 text-white"/>
                </button>
                <button
                    type="submit"
                    disabled={isProcessing || !inputValue.trim()}
                    className="flex-shrink-0 p-3 bg-gradient-to-r from-teal-500 to-purple-600 rounded-full hover:opacity-90 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
                    aria-label="Send message"
                >
                    <SendIcon className="w-6 h-6 text-white"/>
                </button>
            </form>
          </footer>
          {vocabPopup && (
            <VocabularyPopup
                word={vocabPopup.word}
                x={vocabPopup.x}
                y={vocabPopup.y}
                onClose={closeVocabPopup}
            />
          )}
      </div>
    </div>
  );
};

export default TextConversationView;
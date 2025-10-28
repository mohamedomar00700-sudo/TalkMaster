import React, { useState, useEffect, useRef } from 'react';
import { getWordInfo, generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../services/audioService';
import { VolumeUpIcon, SparklesIcon, BookmarkIcon, CheckIcon } from './icons';
import { vocabularyService } from '../services/vocabularyService';
import { questService } from '../services/questService';
import { QuestType } from '../types';

interface VocabularyPopupProps {
  word: string;
  x: number;
  y: number;
  onClose: () => void;
}

const VocabularyPopup: React.FC<VocabularyPopupProps> = ({ word, x, y, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [definition, setDefinition] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSaved(vocabularyService.isWordSaved(word));
    const fetchWordInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const info = await getWordInfo(word);
        if (info) {
          setDefinition(info.definition);
          setExample(info.example);
        } else {
          setError('Could not find information for this word.');
        }
      } catch (e: any) {
        const errorMessage = typeof e === 'object' && e !== null ? JSON.stringify(e) : String(e);
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
            setError('API limit reached. Please wait.');
        } else {
            setError('An error occurred while fetching word info.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchWordInfo();
  }, [word]);
  
  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handlePlaySound = async (text: string) => {
    const base64Audio = await generateSpeech(text, 'Zephyr'); // Use a default clear voice
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      source.onended = () => audioContext.close();
    }
  };
  
  const handleSaveWord = () => {
    if (!isSaved && definition && example) {
      vocabularyService.saveVocabularyItem({ word, definition, example });
      questService.updateQuestProgress(QuestType.SAVE_VOCAB_WORDS, 1);
      setIsSaved(true);
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    const popupWidth = 288; // w-72
    const popupHeight = 220; // estimate
    
    let top = y + 10;
    let left = x - (popupWidth / 2);

    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) {
        left = window.innerWidth - popupWidth - 10;
    }
    if (top + popupHeight > window.innerHeight - 10) {
        top = y - popupHeight - 10;
    }

    return {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 100,
    };
  }

  return (
    <div
      ref={popupRef}
      style={getPositionStyles()}
      className="w-72 p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-600">
        <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-purple-600 capitalize">{word}</h3>
        <button onClick={() => handlePlaySound(word)} className="p-1 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
          <VolumeUpIcon className="w-5 h-5" />
        </button>
      </div>

      {isLoading && <p className="text-sm text-center text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-center text-rose-500">{error}</p>}
      
      {!isLoading && !error && (
        <div className="space-y-3">
          <div className="space-y-2 text-sm">
            <div>
              <h4 className="font-semibold text-slate-600 dark:text-slate-300">Definition:</h4>
              <p className="text-slate-800 dark:text-slate-200">{definition}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-600 dark:text-slate-300">Example:</h4>
              <p className="italic text-slate-700 dark:text-slate-400">"{example}"</p>
            </div>
          </div>
          <button
              onClick={handleSaveWord}
              disabled={isSaved}
              className={`w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 disabled:cursor-default ${
                  isSaved
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'text-white bg-gradient-to-r from-teal-500 to-purple-600 hover:opacity-90'
              }`}
          >
              {isSaved ? (
                  <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Saved
                  </>
              ) : (
                  <>
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Save Word
                  </>
              )}
          </button>
        </div>
      )}

      <p className="flex items-center justify-end mt-3 text-xs text-slate-400">
        <SparklesIcon className="w-3 h-3 mr-1" />
        Powered by AI
      </p>
    </div>
  );
};

export default VocabularyPopup;
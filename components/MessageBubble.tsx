import React, { useState } from 'react';
import { Message, Speaker } from '../types';
import { UserIcon, GlowingStarIcon, XCircleIcon, RotateCcwIcon, LanguagesIcon } from './icons';
import ExpressiveBotAvatar from './ExpressiveBotAvatar';

interface MessageBubbleProps {
  message: Message;
  avatarId: string;
  isBotSpeaking: boolean;
  translatedText: string | null;
  onWordClick?: (word: string, event: React.MouseEvent) => void;
  onReplayAudio: (text: string) => void;
  onTranslate: (messageId: string, text: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, avatarId, isBotSpeaking, translatedText, onWordClick, onReplayAudio, onTranslate }) => {
  const isUser = message.speaker === Speaker.User;
  const [showTranslation, setShowTranslation] = useState(false);

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (onWordClick && e.currentTarget.textContent) {
      const word = e.currentTarget.textContent.replace(/[^a-zA-Z]/g, '');
      if (word.length > 2) {
        onWordClick(word, e);
      }
    }
  };

  const handleTranslateClick = () => {
    if (!translatedText) {
      onTranslate(message.id, message.text);
    }
    setShowTranslation(!showTranslation);
  };

  const isFeedbackError = message.feedback?.toLowerCase().includes('correction');
  const isGreatJob = message.feedback === 'Great job!';

  const textToDisplay = showTranslation && translatedText ? translatedText : message.text;

  return (
    <div className={`flex flex-col message-enter ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'justify-start'}`}>
        {!isUser && (
          <ExpressiveBotAvatar isThinking={false} isSpeaking={isBotSpeaking} avatarId={avatarId} />
        )}
        <div
          className={`relative group max-w-md px-5 py-3 rounded-3xl shadow-md ${
            isUser
              ? 'bg-gradient-to-br from-teal-500 to-purple-600 text-white rounded-br-lg'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-bl-lg'
          }`}
        >
          {isUser || !onWordClick ? (
            <p className="whitespace-pre-wrap">{textToDisplay}</p>
          ) : (
            <p className="whitespace-pre-wrap">
              {textToDisplay.split(/(\s+)/).map((segment, index) =>
                /\s+/.test(segment) ? (
                  <span key={index}>{segment}</span>
                ) : (
                  <span
                    key={index}
                    onClick={handleWordClick}
                    className="cursor-pointer hover:bg-teal-200/50 dark:hover:bg-teal-500/30 rounded-md"
                  >
                    {segment}
                  </span>
                )
              )}
            </p>
          )}

          {!isUser && (
            <div className="absolute top-1/2 -translate-y-1/2 -right-20 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => onReplayAudio(message.text)} className="p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 backdrop-blur-sm">
                   <RotateCcwIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
               </button>
               <button onClick={handleTranslateClick} className="p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 backdrop-blur-sm">
                   <LanguagesIcon className="w-4 h-4 text-slate-600 dark:text-slate-300"/>
               </button>
            </div>
          )}
        </div>
         {isUser && (
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-inner">
              <UserIcon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      {isUser && message.feedback && (
        <div className={`flex items-center gap-2 max-w-md p-2 mt-2 text-xs rounded-lg border mr-12 ${
            isFeedbackError
              ? 'text-rose-800 bg-rose-100/80 border-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-700'
              : isGreatJob
              ? 'text-amber-800 bg-amber-100/80 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700'
              : 'text-emerald-800 bg-emerald-100/80 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700'
          }`}>
          {isFeedbackError ? (
            <XCircleIcon className="flex-shrink-0 w-4 h-4 text-rose-600 dark:text-rose-400" />
          ) : isGreatJob ? (
            <GlowingStarIcon className="flex-shrink-0 w-4 h-4 text-amber-400 animate-glowing-star" />
          ) : null}
          <span className="font-semibold">{message.feedback}</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
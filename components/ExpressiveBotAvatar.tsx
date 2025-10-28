import React from 'react';
import { BotHeadIcon } from './icons';
import { BOT_AVATARS } from '../constants';

interface ExpressiveBotAvatarProps {
  isThinking: boolean;
  isSpeaking: boolean;
  avatarId: string;
}

const ExpressiveBotAvatar: React.FC<ExpressiveBotAvatarProps> = ({ isThinking, isSpeaking, avatarId }) => {
  const avatar = BOT_AVATARS.find(a => a.id === avatarId);
  const Icon = avatar ? avatar.icon : BotHeadIcon;

  const animationClass = isThinking 
    ? 'animate-thinking-pulse' 
    : isSpeaking 
    ? '' // Voice wave is a sibling element
    : 'animate-breathing';

  return (
    <div className={`relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${isSpeaking ? 'bg-purple-600' : 'bg-purple-500'}`}>
      <Icon className={`w-6 h-6 text-white transition-transform duration-300 ${animationClass}`} />
      
      {isSpeaking && (
        <div className="absolute w-full h-full bg-white/30 rounded-full animate-voice-wave"></div>
      )}

      {isThinking && (
        <span className="absolute w-full h-full border-2 rounded-full border-white/50 animate-ping"></span>
      )}
    </div>
  );
};

export default ExpressiveBotAvatar;
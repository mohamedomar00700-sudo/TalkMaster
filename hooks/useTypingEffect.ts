import { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

export const useTypingEffect = (text: string, speed: number = 50, onComplete?: () => void) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!text) return;
        
        setIsTyping(true);
        setDisplayedText('');
        audioService.playTextAppear();

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
                setIsTyping(false);
                if (onComplete) {
                    onComplete();
                }
            }
        }, speed);

        return () => {
            clearInterval(typingInterval);
            setIsTyping(false);
        };
    }, [text, speed, onComplete]);

    return { displayedText, isTyping };
};

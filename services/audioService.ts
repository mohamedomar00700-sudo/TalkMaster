// A service to manage and play sound effects using the Web Audio API.
// This avoids the need for external audio files, keeping the app lightweight.
import { Blob } from "@google/genai";


// Standalone utility functions for audio processing
export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768.0;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


class AudioService {
  private audioContext: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isMuted = localStorage.getItem('soundMuted') === 'true';
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.");
      }
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5) {
    if (!this.audioContext || this.isMuted) return;
    
    // Resume context if it's suspended (e.g., due to browser policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundMuted', this.isMuted.toString());
  }

  public playWelcome(): void {
    if (!this.audioContext || this.isMuted) return;
    const now = this.audioContext.currentTime;
    this.playTone(261.63, 0.15, 'triangle', 0.4); // C4
    setTimeout(() => this.playTone(329.63, 0.15, 'triangle', 0.4), 100); // E4
    setTimeout(() => this.playTone(392.00, 0.2, 'triangle', 0.4), 200); // G4
  }

  // New onboarding welcome chime
  public playOnboardingWelcome(): void {
    if (!this.audioContext || this.isMuted) return;
    const now = this.audioContext.currentTime;
    this.playTone(523.25, 0.2, 'sine', 0.3); // C5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine', 0.3), 150); // G5
  }

  public playTextAppear(): void {
    this.playTone(800, 0.05, 'triangle', 0.1);
  }

  public playKeypress(): void {
    this.playTone(1200, 0.03, 'square', 0.05);
  }

  public playButtonHover(): void {
    this.playTone(400, 0.08, 'sine', 0.15);
  }

  public playSuccess(): void {
    if (!this.audioContext || this.isMuted) return;
    this.playTone(523.25, 0.2, 'sine', 0.5); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.5), 120); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'sine', 0.5), 240); // G5
  }
  
  public playError(): void {
    this.playTone(150, 0.3, 'square', 0.3);
  }

  public playTransition(): void {
     if (!this.audioContext || this.isMuted) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    
    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  public playMessagePop(): void {
    this.playTone(600, 0.1, 'triangle', 0.3);
  }

  public playMessageSend(): void {
    if (!this.audioContext || this.isMuted) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }
  
  public playCardFlip(): void {
    if (!this.audioContext || this.isMuted) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }
  
  public playSummaryOpen(): void {
    if (!this.audioContext || this.isMuted) return;
    this.playTone(392.00, 0.1, 'sine', 0.4); // G4
    setTimeout(() => this.playTone(523.25, 0.1, 'sine', 0.4), 100); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.5), 200); // E5
  }

  public playAchievementUnlock(): void {
    if (!this.audioContext || this.isMuted) return;
    this.playTone(523.25, 0.1, 'sine', 0.6); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.6), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.6), 200); // G5
    setTimeout(() => this.playTone(1046.50, 0.2, 'sine', 0.6), 300); // C6
  }
  
  // New themed sounds
  private playNoise(duration: number, volume: number, filterFreq: number, filterQ: number) {
    if (!this.audioContext || this.isMuted) return;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
    filter.Q.setValueAtTime(filterQ, this.audioContext.currentTime);

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + duration);
  }

  public playAirportSound(): void { this.playNoise(0.8, 0.08, 600, 5); }
  public playRestaurantSound(): void { this.playNoise(0.8, 0.05, 1000, 1); }
  public playHotelSound(): void { this.playTone(440, 0.5, 'triangle', 0.1); }
  public playInterviewSound(): void { this.playNoise(0.5, 0.03, 4000, 10); }
}

export const audioService = new AudioService();
// src/types/speech.d.ts

declare interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
  
  declare interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  
  declare interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
  }
  
  declare interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  declare interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  declare interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  
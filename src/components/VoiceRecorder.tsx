import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionInstanceRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const startRecording = async () => {
    if (!isSupported || disabled) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0].transcript)
          .join(' ');
        
        if (transcript.trim()) {
          onTranscription(transcript.trim());
        }
      };

      recognition.onerror = (event: { error: string }) => {

        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
      
      recognitionInstanceRef.current = recognition;
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (recognitionInstanceRef.current && isRecording) {
      recognitionInstanceRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <button
      onClick={toggleRecording}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        isRecording
          ? 'text-red-600 bg-red-50 hover:bg-red-100'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isRecording ? 'Stop recording' : 'Start voice recording'}
    >
      {isRecording ? (
        <div className="relative">
          <Square className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
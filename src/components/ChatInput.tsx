
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, X, FileText, Paperclip, Camera, RotateCcw, Circle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatInputProps {
  onSendMessage: (
    message: string,
    image?: string,
    file?: { name: string; type: string; content: string }
  ) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; content: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment'); // rear camera by default
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage || selectedFile) {
      onSendMessage(message.trim(), selectedImage || undefined, selectedFile || undefined);
      setMessage('');
      setSelectedImage(null);
      setSelectedFile(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type);

      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            text += pageText + '\n';
          }

          console.log("Extracted text:", text);

          setSelectedFile({
            name: file.name,
            type: file.type,
            content: text.trim()
          });
        } catch (error) {
          console.error('Error parsing PDF:', error);
          alert('Error reading PDF file. Please try again.');
        }
      } else if (file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedFile({
            name: file.name,
            type: file.type,
            content: e.target?.result as string
          });
        };
        reader.readAsText(file);
      }
    }
  };

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }, 100);
      }
      
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhoto(null);
  };

  const switchCamera = async () => {
    const newCamera = currentCamera === 'user' ? 'environment' : 'user';
    setCurrentCamera(newCamera);
    
    if (stream) {
      // Restart camera with new facing mode
      await startCamera();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoDataUrl);
      }
    }
  };

  const usePhoto = () => {
    if (capturedPhoto) {
      setSelectedImage(capturedPhoto);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="border-t bg-white p-4">
        {(selectedImage || selectedFile) && (
          <div className="mb-3 flex flex-col gap-2">
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-h-20 rounded-md border"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {selectedFile && (
              <div className="relative bg-gray-100 p-3 rounded-md border">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedFile.type === 'application/pdf' ? 'PDF Document' : 'Text File'}
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <pre className="text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap bg-white p-2 rounded border">
                  {selectedFile.content}
                </pre>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={pdfInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.txt,.md"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={disabled}
            title="Upload image"
          >
            <Image className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={startCamera}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={disabled}
            title="Take photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={disabled}
            title="Upload PDF or text file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />

          <button
            type="submit"
            disabled={disabled || (!message.trim() && !selectedImage && !selectedFile)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={stopCamera}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold">Camera</h2>
            <button
              onClick={switchCamera}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title={`Switch to ${currentCamera === 'user' ? 'rear' : 'front'} camera`}
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Camera Preview */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center p-6 gap-8">
            {capturedPhoto ? (
              <>
                <button
                  onClick={retakePhoto}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={usePhoto}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  Use Photo
                </button>
              </>
            ) : (
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Circle className="w-12 h-12 text-gray-800" />
              </button>
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  );
};
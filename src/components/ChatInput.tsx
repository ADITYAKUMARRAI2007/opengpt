import React, { useState, useRef } from 'react';
import { Send, Image, X, FileText, Paperclip, Camera } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  return (
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
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        {/* Native camera input - this will open the device's camera app */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleCameraCapture}
          accept="image/*"
          capture="environment" // This tells the browser to prefer the rear camera
          className="hidden"
        />
        
        <input
          type="file"
          ref={pdfInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.txt,.md"
          className="hidden"
        />

        {/* Gallery/Image upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={disabled}
          title="Upload from gallery"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* Native camera button */}
        <button
          type="button"
          onClick={openCamera}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={disabled}
          title="Take photo with camera"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* File upload button */}
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
  );
};
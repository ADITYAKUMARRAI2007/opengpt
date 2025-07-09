import { useState, useRef, useEffect } from 'react';
import { Settings, MessageSquare, Trash2 } from 'lucide-react';
import { Message, ApiConfig } from './types';
import { ChatAPI } from './services/api';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { VoiceRecorder } from './components/VoiceRecorder';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: 'openai',
    apiKey: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAPI = useRef<ChatAPI | null>(null);

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setApiConfig(config);
      chatAPI.current = new ChatAPI(config);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConfigSave = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('apiConfig', JSON.stringify(config));
    chatAPI.current = new ChatAPI(config);
  };

  const handleSendMessage = async (content: string, image?: string, file?: { name: string; type: string; content: string }) => {
    if (!chatAPI.current) {
      setIsModalOpen(true);
      return;
    }

    // Combine message content with file content if present
    let fullContent = content;
    if (file) {
      fullContent = `${content}\n\n[File: ${file.name}]\n${file.content}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: fullContent,
      image,
      file,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatAPI.current.sendMessage([...messages, userMessage]);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleVoiceTranscription = (text: string) => {
    // Send the transcribed text as a message
    handleSendMessage(text);
  };

  const hasApiKey = apiConfig.apiKey.trim() !== '';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">GPT Clone</h1>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {apiConfig.provider === 'openai' ? 'OpenAI' : 'Gemini'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {hasApiKey && (
            <VoiceRecorder 
              onTranscription={handleVoiceTranscription}
              disabled={isLoading}
            />
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasApiKey ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Welcome to GPT Clone</h2>
              <p className="text-gray-500 mb-4">Configure your API key to start chatting</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Configure API Key
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Start a conversation</h2>
              <p className="text-gray-500">Send a message or upload an image to begin</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {hasApiKey && (
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={isLoading}
        />
      )}

      {/* Modal */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={apiConfig}
        onSave={handleConfigSave}
      />
    </div>
  );
}
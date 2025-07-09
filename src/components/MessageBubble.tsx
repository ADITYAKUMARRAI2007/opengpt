import React from 'react';
import { User, Bot, FileText } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-600' : 'bg-gray-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className={`max-w-[70%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {message.image && (
            <div className="mb-2">
              <img 
                src={message.image} 
                alt="Uploaded" 
                className="max-w-full h-auto rounded-md"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.file && (
            <div className="mt-2 p-2 bg-black bg-opacity-10 rounded border-l-2 border-gray-400">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3 h-3" />
                <span className="text-xs font-medium">{message.file.name}</span>
              </div>
              <div className="text-xs opacity-75 max-h-20 overflow-y-auto">
                {message.file.content.substring(0, 200)}
                {message.file.content.length > 200 && '...'}
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
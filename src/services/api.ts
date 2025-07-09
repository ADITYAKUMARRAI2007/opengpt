import { ApiConfig, ChatResponse } from '../types';

export class ChatAPI {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async sendMessage(messages: any[]): Promise<ChatResponse> {
    try {
      if (this.config.provider === 'openai') {
        return await this.sendToOpenAI(messages);
      } else {
        return await this.sendToGemini(messages);
      }
    } catch (error) {
      return {
        content: '',
        error: error instanceof Error ? error.message : 'An error occurred'
      };
    }
  }

  private async sendToOpenAI(messages: any[]): Promise<ChatResponse> {
    const formattedMessages = messages.map(msg => {
      const content: any[] = [{ type: 'text', text: msg.content }];
      
      if (msg.image && msg.role === 'user') {
        content.push({ type: 'image_url', image_url: { url: msg.image } });
      }
      
      if (msg.role === 'user' && (msg.image || msg.file)) {
        return {
          role: msg.role,
          content: content
        };
      }
      
      return { role: msg.role, content: msg.content };
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: formattedMessages,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }

  private async sendToGemini(messages: any[]): Promise<ChatResponse> {
    const lastMessage = messages[messages.length - 1];
    
    let parts: any[] = [{ text: lastMessage.content }];
    
    if (lastMessage.image) {
      // Convert data URL to base64
      const base64Data = lastMessage.image.split(',')[1];
      const mimeType = lastMessage.image.split(';')[0].split(':')[1];
      
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return { content: data.candidates[0].content.parts[0].text };
  }
}
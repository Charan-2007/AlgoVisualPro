import { useState } from 'react';
import { Bot, X, MessageSquare } from 'lucide-react';
import './Chatbot.css';

export function Chatbot({ algorithmId }: { algorithmId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: "Hello! I'm your AI Assistant. I can explain the current algorithms, discuss complexities, and help you understand Graph architectures perfectly. Ask me anything!" }
    ]);
    const [input, setInput] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const query = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setInput('');
        setIsLoading(true);

        try {
            // Using a generic open-source or custom backend relay if the user defines one.
            // Since we don't have a secure backend established for the user's API Key, 
            // relying on standard OpenAI structure using environment variable `VITE_OPENAI_API_KEY`.
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'assistant', text: "API Key missing! Please set VITE_OPENAI_API_KEY in your .env file to enable live AI responses." }]);
                setIsLoading(false);
                return;
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: `You are an expert computer science tutor integrated into AlgoVisual Pro. The user is currently observing the '${algorithmId}' algorithm visualization. Explain algorithms clearly, answer queries concisely, and adapt to their context.` },
                        { role: "user", content: query }
                    ],
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                throw new Error("API call failed");
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "AI service temporarily unavailable. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="chat-trigger" onClick={() => setIsOpen(true)}>
                    <Bot size={24} />
                    <span className="tooltip">Ask AI Assistant</span>
                </button>
            )}

            {isOpen && (
                <div className="chat-window glass-panel">
                    <div className="chat-header">
                        <div className="header-info">
                            <Bot size={20} className="icon" />
                            <h3>Algo Assistant</h3>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`chat-bubble ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder={`Ask about ${algorithmId ? algorithmId.toUpperCase() : 'algorithms'}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} disabled={isLoading}>
                            {isLoading ? <div className="spinner"></div> : <MessageSquare size={16} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

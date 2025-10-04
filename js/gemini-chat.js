const GEMINI_API_KEY = 'AIzaSyA-YgCzTMN35yreG9uWvWMHFYbtA5a_3L8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

class GeminiLigaMXChat {
    constructor() {
        this.conversationHistory = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createChatUI();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    createChatUI() {
        const chatHTML = `
            <div class="gemini-chat-button" id="gemini-chat-button">
                <i class="fas fa-futbol"></i>
            </div>
            
            <div class="gemini-chat-container" id="gemini-chat-container">
                <div class="gemini-chat-header">
                    <div class="gemini-chat-header-content">
                        <i class="fas fa-robot"></i>
                        <div>
                            <h3>Asistente Liga MX</h3>
                            <p>Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button class="gemini-chat-close" id="gemini-chat-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="gemini-suggestions">
                    <div class="gemini-suggestion" data-suggestion="¿Cuál es la tabla de posiciones actual de Liga MX?">
                        📊 Tabla de posiciones
                    </div>
                    <div class="gemini-suggestion" data-suggestion="¿Cuándo juega América?">
                        ⚽ Próximos partidos
                    </div>
                    <div class="gemini-suggestion" data-suggestion="¿Cuál es la historia del Club América?">
                        📖 Historia de equipos
                    </div>
                    <div class="gemini-suggestion" data-suggestion="¿Quién es el máximo goleador de la Liga MX?">
                        🏆 Estadísticas
                    </div>
                </div>
                
                <div class="gemini-chat-messages" id="gemini-chat-messages">
                </div>
                
                <div class="gemini-chat-input-container">
                    <input 
                        type="text" 
                        class="gemini-chat-input" 
                        id="gemini-chat-input"
                        placeholder="Pregunta sobre Liga MX..."
                    />
                    <button class="gemini-chat-send" id="gemini-chat-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    attachEventListeners() {
        const button = document.getElementById('gemini-chat-button');
        const closeBtn = document.getElementById('gemini-chat-close');
        const sendBtn = document.getElementById('gemini-chat-send');
        const input = document.getElementById('gemini-chat-input');
        const suggestions = document.querySelectorAll('.gemini-suggestion');

        button.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.toggleChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const text = suggestion.dataset.suggestion;
                input.value = text;
                this.sendMessage();
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('gemini-chat-container');
        const button = document.getElementById('gemini-chat-button');
        
        if (this.isOpen) {
            container.classList.add('active');
            button.style.animation = 'none';
        } else {
            container.classList.remove('active');
            button.style.animation = 'pulse 2s infinite';
        }
    }

    showWelcomeMessage() {
        const welcomeMessage = `
            ¡Hola! 👋⚽ Soy tu asistente de Liga MX powered by Gemini AI.
            
            Puedo ayudarte con:
            • Información sobre equipos
            • Estadísticas y resultados
            • Historia de la Liga MX
            • Próximos partidos
            • ¡Y mucho más!
            
            ¿Qué te gustaría saber sobre la Liga MX?
        `;
        this.addMessage(welcomeMessage, 'bot');
    }

    async sendMessage() {
        const input = document.getElementById('gemini-chat-input');
        const sendBtn = document.getElementById('gemini-chat-send');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';
        sendBtn.disabled = true;

        this.showTypingIndicator();

        try {
            const systemPrompt = `Eres un experto asistente de la Liga MX, el campeonato de fútbol profesional de México. 
            Tienes conocimiento profundo sobre todos los equipos (América, Chivas, Cruz Azul, Pumas, Tigres, Monterrey, etc.), 
            jugadores, estadísticas, historia y partidos actuales. Responde de manera amigable, informativa y entusiasta. 
            Usa emojis relacionados al fútbol cuando sea apropiado. Si no sabes algo específico, sé honesto pero ofrece 
            información relacionada que pueda ser útil.`;

            const response = await this.callGeminiAPI(systemPrompt, message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage(
                '❌ Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.',
                'bot'
            );
            console.error('Error calling Gemini API:', error);
        } finally {
            sendBtn.disabled = false;
        }
    }

    async callGeminiAPI(systemPrompt, userMessage) {
        const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Details:', errorData);
                throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Gemini API Response:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
        } catch (error) {
            console.error('Full Gemini API Error:', error);
            throw error;
        }
    }

    addMessage(text, type) {
        const messagesContainer = document.getElementById('gemini-chat-messages');
        const messageHTML = `
            <div class="gemini-message ${type}">
                <div class="gemini-message-avatar">
                    <i class="fas ${type === 'bot' ? 'fa-robot' : 'fa-user'}"></i>
                </div>
                <div class="gemini-message-content">
                    ${this.formatMessage(text)}
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(text) {
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => `<p>${line}</p>`)
            .join('');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('gemini-chat-messages');
        const typingHTML = `
            <div class="gemini-message bot typing-indicator">
                <div class="gemini-message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="gemini-message-content">
                    <div class="gemini-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Gemini Liga MX Chat initialized');
    new GeminiLigaMXChat();
});

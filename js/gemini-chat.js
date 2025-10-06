const GEMINI_API_KEY = 'AIzaSyA-YgCzTMN35yreG9uWvWMHFYbtA5a_3L8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

class GeminiLigaMXChat {
    constructor() {
        this.conversationHistory = [];
        this.isOpen = false;
        this.fixturesData = [];
        this.standingsData = [];
        this.teamsData = [];
        this.init();
    }

    async init() {
        await this.loadLigaMXData();
        this.createChatUI();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    async loadLigaMXData() {
        try {
            const [fixtures, standings, teams] = await Promise.all([
                fetch('data/fixtures.json').then(r => r.json()).catch(() => []),
                fetch('data/standings.json').then(r => r.json()).catch(() => []),
                fetch('data/teams.json').then(r => r.json()).catch(() => [])
            ]);
            
            this.fixturesData = fixtures;
            this.standingsData = standings;
            this.teamsData = teams;
            
            console.log('✅ Datos de Liga MX cargados para el chatbot:', {
                partidos: this.fixturesData.length,
                equipos: this.teamsData.length,
                posiciones: this.standingsData.length
            });
        } catch (error) {
            console.error('Error cargando datos de Liga MX:', error);
        }
    }

    createChatUI() {
        const chatHTML = `
            <div class="gemini-chat-button" id="gemini-chat-button">
                <i class="fas fa-futbol"></i>
            </div>
            
            <div class="gemini-chat-container" id="gemini-chat-container">
                <div class="gemini-chat-header" id="gemini-chat-header">
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
                
                <div class="gemini-resize-handle" id="gemini-resize-handle"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
        this.initDragAndResize();
        this.restorePosition();
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
            const contextData = this.prepareContextData(message);
            const systemPrompt = `Eres un experto asistente de la Liga MX, el campeonato de fútbol profesional de México. 
            Tienes conocimiento profundo sobre todos los equipos (América, Chivas, Cruz Azul, Pumas, Tigres, Monterrey, etc.), 
            jugadores, estadísticas, historia y partidos actuales. Responde de manera amigable, informativa y entusiasta. 
            Usa emojis relacionados al fútbol cuando sea apropiado.

${contextData}

IMPORTANTE: Usa SIEMPRE los datos actuales proporcionados arriba para responder preguntas sobre la temporada actual, 
tabla de posiciones, próximos partidos y resultados recientes. Estos datos son de ${new Date().getFullYear()} y están actualizados.`;

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

    prepareContextData(userMessage) {
        let context = '\n--- DATOS ACTUALES DE LIGA MX ---\n';
        
        const lowerMessage = userMessage.toLowerCase();
        const needsStandings = lowerMessage.includes('tabla') || lowerMessage.includes('posicion') || 
                               lowerMessage.includes('puntaj') || lowerMessage.includes('lugar') ||
                               lowerMessage.includes('clasificaci');
        const needsFixtures = lowerMessage.includes('partido') || lowerMessage.includes('juega') || 
                             lowerMessage.includes('proxim') || lowerMessage.includes('cuand') ||
                             lowerMessage.includes('resultado') || lowerMessage.includes('jornada');
        const needsTeams = lowerMessage.includes('equipo') || lowerMessage.includes('club') ||
                          lowerMessage.includes('historia') || lowerMessage.includes('estadio');

        if (needsStandings && this.standingsData.length > 0) {
            const top10 = this.standingsData.slice(0, 10);
            context += '\n📊 TABLA DE POSICIONES ACTUAL (Top 10):\n';
            top10.forEach(team => {
                context += `${team.position}. ${team.name} - ${team.points} pts (${team.played} PJ, ${team.wins} G, ${team.draws} E, ${team.losses} P, GF:${team.goalsFor}, GC:${team.goalsAgainst})\n`;
            });
        }

        if (needsFixtures && this.fixturesData.length > 0) {
            const now = new Date();
            const upcomingMatches = this.fixturesData
                .filter(m => new Date(m.date) > now && m.status !== 'completed')
                .slice(0, 8);
            const recentMatches = this.fixturesData
                .filter(m => m.status === 'completed')
                .slice(-8);

            if (upcomingMatches.length > 0) {
                context += '\n⚽ PRÓXIMOS PARTIDOS:\n';
                upcomingMatches.forEach(m => {
                    const date = new Date(m.date);
                    context += `${m.homeTeam} vs ${m.awayTeam} - ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})} (Jornada ${m.jornada})\n`;
                });
            }

            if (recentMatches.length > 0) {
                context += '\n📋 RESULTADOS RECIENTES:\n';
                recentMatches.forEach(m => {
                    context += `${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam} (Jornada ${m.jornada})\n`;
                });
            }
        }

        if (needsTeams || (!needsStandings && !needsFixtures)) {
            const topTeams = this.teamsData.slice(0, 5);
            if (topTeams.length > 0) {
                context += '\n🏆 EQUIPOS PRINCIPALES:\n';
                topTeams.forEach(team => {
                    context += `${team.name} (${team.nickname}) - ${team.titles} títulos, Goleador: ${team.topScorer} (${team.topScorerGoals} goles)\n`;
                });
            }
        }

        context += '\n--- FIN DE DATOS ACTUALES ---\n';
        return context;
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

    initDragAndResize() {
        const container = document.getElementById('gemini-chat-container');
        const header = document.getElementById('gemini-chat-header');
        const resizeHandle = document.getElementById('gemini-resize-handle');
        
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.gemini-chat-close') || window.innerWidth <= 768) return;
            
            isDragging = true;
            container.classList.add('dragging');
            
            const rect = container.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            e.preventDefault();
        });

        resizeHandle.addEventListener('mousedown', (e) => {
            if (window.innerWidth <= 768) return;
            
            isResizing = true;
            container.classList.add('resizing');
            
            const rect = container.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const newLeft = e.clientX - startX;
                const newTop = e.clientY - startY;
                
                const maxX = window.innerWidth - container.offsetWidth;
                const maxY = window.innerHeight - container.offsetHeight;
                
                const clampedLeft = Math.max(10, Math.min(newLeft, maxX - 10));
                const clampedTop = Math.max(10, Math.min(newTop, maxY - 10));
                
                container.style.left = clampedLeft + 'px';
                container.style.top = clampedTop + 'px';
                container.style.right = 'auto';
                container.style.bottom = 'auto';
            }
            
            if (isResizing) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth + deltaX;
                let newHeight = startHeight + deltaY;
                
                newWidth = Math.max(380, Math.min(newWidth, window.innerWidth * 0.9));
                newHeight = Math.max(450, Math.min(newHeight, window.innerHeight * 0.9));
                
                container.style.width = newWidth + 'px';
                container.style.height = newHeight + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                this.savePosition();
            }
            
            isDragging = false;
            isResizing = false;
            container.classList.remove('dragging', 'resizing');
        });

        window.addEventListener('resize', () => {
            const rect = container.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width;
            const maxY = window.innerHeight - rect.height;
            
            if (rect.left > maxX) {
                container.style.left = Math.max(10, maxX - 10) + 'px';
            }
            if (rect.top > maxY) {
                container.style.top = Math.max(10, maxY - 10) + 'px';
            }
        });
    }

    savePosition() {
        const container = document.getElementById('gemini-chat-container');
        const rect = container.getBoundingClientRect();
        
        const position = {
            left: container.style.left || null,
            top: container.style.top || null,
            width: container.style.width || null,
            height: container.style.height || null
        };
        
        localStorage.setItem('geminiChatPosition', JSON.stringify(position));
    }

    restorePosition() {
        const saved = localStorage.getItem('geminiChatPosition');
        if (!saved) return;
        
        try {
            const position = JSON.parse(saved);
            const container = document.getElementById('gemini-chat-container');
            
            if (window.innerWidth > 768) {
                if (position.left) container.style.left = position.left;
                if (position.top) container.style.top = position.top;
                if (position.width) container.style.width = position.width;
                if (position.height) container.style.height = position.height;
                
                if (position.left || position.top) {
                    container.style.right = 'auto';
                    container.style.bottom = 'auto';
                }
                
                const rect = container.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                
                if (rect.left > maxX || rect.left < 0) {
                    container.style.left = '';
                    container.style.right = '30px';
                }
                if (rect.top > maxY || rect.top < 0) {
                    container.style.top = '';
                    container.style.bottom = '120px';
                }
            }
        } catch (error) {
            console.error('Error restoring chat position:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Gemini Liga MX Chat initialized');
    new GeminiLigaMXChat();
});

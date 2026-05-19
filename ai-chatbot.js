// ========== OPENROUTER AI ЧАТ-БОТ (БЕСПЛАТНЫЕ МОДЕЛИ) ==========

/** Ключ из config.local.js (читается при отправке, не при загрузке скрипта) */
function getOpenRouterApiKey() {
    const key =
        (typeof window !== 'undefined' && window.DHARMA_OPENROUTER_KEY) || '';
    return String(key).trim();
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

let isTyping = false;
let messageHistory = [];
const CHAT_STORAGE_KEY = 'dharmaAiChatMessages';
const HISTORY_STORAGE_KEY = 'dharmaAiMessageHistory';

// АКТУАЛЬНЫЕ БЕСПЛАТНЫЕ МОДЕЛИ (из официальной коллекции OpenRouter)
const FREE_MODELS = [
    'openrouter/free',  // АВТОМАТИЧЕСКИЙ ВЫБОР ЛУЧШЕЙ БЕСПЛАТНОЙ МОДЕЛИ
    'nvidia/nemotron-3-super:free',
    'arcee-ai/trinity-large-preview:free',
    'z-ai/glm-4.5-air:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'arcee-ai/trinity-mini:free',
    'minimax/minimax-m2.5:free',
    'qwen/qwen3-coder-480b-a35b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'openai/gpt-oss-120b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-20b:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'liquid/lfm2.5-1.2b-thinking:free'
];

async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question || isTyping) return;
    
    addMessage(question, 'user');
    chatInput.value = '';
    messageHistory.push({ role: 'user', content: question });
    saveChatState();
    showTypingIndicator();
    
    try {
        const apiKey = getOpenRouterApiKey();
        if (!apiKey || !apiKey.startsWith('sk-or-')) {
            removeTypingIndicator();
            const onGithubPages = typeof window !== 'undefined' &&
                window.location.hostname.endsWith('github.io');
            const errorMessage = onGithubPages
                ? 'AI ключ на сайте неверный. GitHub → Settings → Secrets → Actions → OPENROUTER_API_KEY: вставьте ключ sk-or-v1-... с openrouter.ai/keys, затем Actions → Deploy to GitHub Pages → Run workflow.'
                : 'AI ключ не настроен. Создайте config.local.js из config.local.js.example и вставьте ключ sk-or-v1-... с openrouter.ai/keys.';
            addMessage(errorMessage, 'bot');
            messageHistory.push({ role: 'assistant', content: errorMessage });
            saveChatState();
            return;
        }

        let reply = null;
        let authErrorMessage = '';
        
        // Пробуем каждую модель по очереди
        for (const model of FREE_MODELS) {
            try {
                console.log(`Пробуем модель: ${model}`);
                
                const requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };

                // OpenRouter: стабильный referer (свой домен или GitHub Pages)
                const referer =
                    (typeof window !== 'undefined' && window.DHARMA_SITE_ORIGIN) ||
                    (window.location.protocol === 'http:' || window.location.protocol === 'https:'
                        ? window.location.origin
                        : '');
                if (referer) {
                    requestHeaders['HTTP-Referer'] = referer;
                    requestHeaders['X-Title'] = 'Put Dharamy';
                }

                const response = await fetch(OPENROUTER_URL, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: `Ты — буддийский наставник и учитель Дхармы. 
                                Отвечай мудро, спокойно, на русском языке.
                                Будь добрым и сострадательным.
                                Используй эмодзи для украшения ответов.
                                
                                Ты знаешь о буддизме, медитации, Четырех Благородных Истинах, 
                                Восьмеричном Пути, мантрах, традициях Калмыкии, 
                                праздниках Зул и Цаган Сар, калмыцком чае Джомба,
                                карме, перерождении, Будде Шакьямуни и Далай-ламе.`
                            },
                            ...messageHistory.slice(-5)
                        ],
                        temperature: 0.7,
                        max_tokens: 2600
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        reply = typeof data.choices[0].message.content === 'string'
                            ? data.choices[0].message.content
                            : '';
                        console.log(`✅ Модель ${model} успешно ответила!`);
                        break;
                    }
                } else {
                    let errorData = {};
                    try {
                        errorData = await response.json();
                    } catch (parseError) {
                        errorData = { error: { message: 'Ответ API не в формате JSON' } };
                    }
                    console.log(`Модель ${model} ошибка ${response.status}:`, errorData.error?.message || 'Неизвестная ошибка');
                    
                    // При 401 дальнейшие попытки бесполезны: проблема в ключе.
                    if (response.status === 401) {
                        authErrorMessage =
                            (errorData.error?.message || 'Неверный ключ') +
                            '. Создайте новый на https://openrouter.ai/keys и вставьте в config.local.js';
                        break;
                    }

                    // Если ошибка 429 (превышен лимит), пробуем следующую модель
                    if (response.status === 429) {
                        console.log(`Модель ${model} превысила лимит, пробуем следующую...`);
                        continue;
                    }
                }
            } catch (e) {
                console.log(`Модель ${model} ошибка:`, e.message);
            }

            if (authErrorMessage) break;
        }
        
        removeTypingIndicator();
        
        if (reply) {
            addMessage(reply, 'bot');
            messageHistory.push({ role: 'assistant', content: reply });
            saveChatState();
        } else if (authErrorMessage) {
            const errorMessage = `Ошибка авторизации OpenRouter (401): ${authErrorMessage}`;
            addMessage(errorMessage, 'bot');
            messageHistory.push({ role: 'assistant', content: errorMessage });
            saveChatState();
        } else {
            const errorMessage = 'Не удалось получить ответ от AI. Попробуйте еще раз через несколько секунд.';
            addMessage(errorMessage, 'bot');
            messageHistory.push({ role: 'assistant', content: errorMessage });
            saveChatState();
        }
        
        if (messageHistory.length > 20) messageHistory = messageHistory.slice(-20);
        
    } catch (error) {
        console.error('Ошибка:', error);
        removeTypingIndicator();
        const errorMessage = 'Ошибка соединения с AI. Проверьте интернет и попробуйте снова.';
        addMessage(errorMessage, 'bot');
        messageHistory.push({ role: 'assistant', content: errorMessage });
        saveChatState();
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = `<div class="message-content">${formattedText}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveChatState() {
    try {
        const domMessages = Array.from(chatMessages.querySelectorAll('.message:not(.typing-indicator)')).map((item) => {
            const sender = item.classList.contains('user') ? 'user' : 'bot';
            const content = item.querySelector('.message-content')?.innerText?.trim() || '';
            return { sender, content };
        }).filter((item) => item.content);

        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(domMessages));
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messageHistory.slice(-20)));
    } catch (error) {
        console.warn('Не удалось сохранить историю чата:', error);
    }
}

function restoreChatState() {
    try {
        const savedMessagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
        const savedHistoryRaw = localStorage.getItem(HISTORY_STORAGE_KEY);

        if (savedHistoryRaw) {
            const parsedHistory = JSON.parse(savedHistoryRaw);
            if (Array.isArray(parsedHistory)) {
                messageHistory = parsedHistory.slice(-20);
            }
        }

        if (!savedMessagesRaw) return;
        const savedMessages = JSON.parse(savedMessagesRaw);
        if (!Array.isArray(savedMessages) || savedMessages.length === 0) return;

        chatMessages.innerHTML = '';
        savedMessages.forEach((msg) => {
            if (msg && typeof msg.content === 'string' && (msg.sender === 'user' || msg.sender === 'bot')) {
                addMessage(msg.content, msg.sender);
            }
        });
    } catch (error) {
        console.warn('Не удалось восстановить историю чата:', error);
    }
}

function clearChatStateOnPageLoad() {
    messageHistory = [];
    try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.warn('Не удалось очистить историю чата:', error);
    }
}

function initChatIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function showTypingIndicator() {
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
        chatInput.focus();
    }
});

chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('active');
});

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        clearChatStateOnPageLoad();
        initChatIcons();
    }, { once: true });
} else {
    clearChatStateOnPageLoad();
    initChatIcons();
}

console.log('✅ AI чат-бот загружен (бесплатные модели OpenRouter)');
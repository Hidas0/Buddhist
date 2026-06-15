/**
 * ai-chatbot.js — виджет «Спросите у ИИ» (OpenRouter, бесплатные модели).
 *
 * Нужны элементы: #chatToggle, #chatWindow, #chatClose, #chatSend, #chatInput, #chatMessages.
 * Ключ: window.DHARMA_OPENROUTER_KEY из config.local.js (или CI на GitHub Pages).
 * Referer: window.DHARMA_SITE_ORIGIN из site-config.js.
 *
 * При ошибке 401 перебор моделей прекращается. При 429 — следующая модель из FREE_MODELS.
 */

/** Ключ читается в момент отправки (config.local.js может подключиться позже скрипта) */
function getOpenRouterApiKey() {
    const key =
        (typeof window !== 'undefined' && window.DHARMA_OPENROUTER_KEY) || '';
    return String(key).trim();
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'; // endpoint OpenRouter

// Элементы виджета из HTML (общий фрагмент на страницах)
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

let isTyping = false; // блокировка повторной отправки
let messageHistory = []; // последние сообщения для API (role: user|assistant)
const CHAT_STORAGE_KEY = 'dharmaAiChatMessages'; // localStorage: отображение в DOM
const HISTORY_STORAGE_KEY = 'dharmaAiMessageHistory'; // localStorage: контекст для API

/** Приветствие в #chatMessages (одинаковое на всех страницах) */
const CHAT_WELCOME =
    'Здравствуйте! Я помощник по теме «Традиции и обычаи буддийских народов». ' +
    'Могу рассказать о ритуалах, праздниках (Зул, Лосар, Весак), быте калмыков, тибетцев, монголов и юго-восточной Азии, ' +
    'а также ответить на общие вопросы о буддизме. Чем помочь?';

const CHAT_SYSTEM_PROMPT = `Ты — образовательный помощник сайта «Путь Дхармы»: традиции и обычаи буддийских народов (Тибет, Калмыкия, Монголия, Бурятия, ЮВА).

ПРАВИЛА ОТВЕТА:
0. Язык — только русский. Не пиши на английском. Не показывай ход рассуждений («Okay», «Let me», «The user is asking») — только готовый ответ пользователю.
1. Отвечай только на то, о чём спросили. Не подставляй темы (гелуг, школы, праздники), если пользователь о них не спрашивал.
2. На приветствие («привет», «здравствуйте») — 1–2 коротких предложения: поздороваться и мягко спросить, чем помочь. Без лекций и без перечисления терминов.
3. Длина ответа пропорциональна вопросу: короткий вопрос — короткий ответ (2–5 предложений), развёрнутый — до 8–10.
4. Пиши грамотным русским, без выдуманных слов и «галлюцинаций». Если не уверен в факте — скажи кратко, не выдумывай.
5. Термины на этом сайте — буддийские (гелуг, лама, дацан, лосар, зул и т.д.). Не трактуй их как фольклор или «символы». Объясняй термин только когда его назвали в вопросе.

Контекст по умолчанию — буддизм и культура народов сайта; не проси «уточнить контекст», если вопрос ясен.

Темы: обычаи, ритуалы, праздники, этикет, паломничество, мантры, региональные традиции.
Про Калмыкию — опирайся на материалы раздела kalm.html.

Справочно (используй только если спросили):
- Гелуг — школа тибетского буддизма (Цонкапа, XIV в.), «жёлтая шапка»; линия Далай-лам; распространена в Калмыкии и Бурятии.
- Тхеравада, махаяна, ваджраяна — направления буддизма.
- Зул, Лосар, Весак — праздники; алмс, овоо, хадак — обычаи.

Тон: спокойный, доброжелательный. Эмодзи — редко (0–1 на ответ).`;

/** Только приветствие без вопроса — ответ без API */
function isSimpleGreeting(text) {
    const t = String(text || '').trim().toLowerCase().replace(/[!?.…,]+$/g, '').trim();
    return /^(привет|здравствуй|здравствуйте|добрый день|добрый вечер|доброе утро|hi|hello|хай|салам)$/.test(t);
}

const GREETING_REPLY =
    'Здравствуйте! Я помогу с традициями и обычаями буддийских народов — ритуалы, праздники, Калмыкия, мантры. О чём хотите спросить?';

/** Ответ модели на английском или с «мыслями вслух» — не показывать пользователю */
function sanitizeBotReply(text) {
    const s = String(text || '').trim();
    if (!s) return s;
    const cyrillic = (s.match(/[а-яёА-ЯЁ]/g) || []).length;
    const latin = (s.match(/[a-zA-Z]/g) || []).length;
    const looksLikeThinking = /^(okay|let me|the user is|i need to|wait,|from my knowledge|upon recalling)/i.test(s);
    if (looksLikeThinking || (latin > 80 && cyrillic < latin * 0.4)) {
        return 'Извините, ответ пришёл некорректно. Повторите вопрос по-русски — отвечу кратко и по теме.';
    }
    return s;
}

/** Список бесплатных моделей OpenRouter — перебор по порядку до первого успешного ответа */
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

/** Отправка вопроса: UI → перебор FREE_MODELS → ответ или ошибка */
async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question || isTyping) return;

    addMessage(question, 'user');
    chatInput.value = '';
    messageHistory.push({ role: 'user', content: question });
    saveChatState();

    if (isSimpleGreeting(question)) {
        addMessage(GREETING_REPLY, 'bot');
        messageHistory.push({ role: 'assistant', content: GREETING_REPLY });
        saveChatState();
        return;
    }

    showTypingIndicator();
    
    try {
        const apiKey = getOpenRouterApiKey();
        if (!apiKey || !apiKey.startsWith('sk-or-')) {
            removeTypingIndicator();
            const onGithubPages = typeof window !== 'undefined' &&
                window.location.hostname.endsWith('github.io');
            const errorMessage = onGithubPages
                ? 'AI ключ на сайте неверный. GitHub → Settings → Secrets → Actions → OPENROUTER_API_KEY: вставьте ключ sk-or-v1-... с openrouter.ai/keys, затем Actions → Deploy to GitHub Pages → Run workflow.'
                : 'AI ключ не настроен. Создайте js/config.local.js из js/config.local.js.example и вставьте ключ sk-or-v1-... с openrouter.ai/keys.';
            addMessage(errorMessage, 'bot');
            messageHistory.push({ role: 'assistant', content: errorMessage });
            saveChatState();
            return;
        }

        let reply = null;
        let authErrorMessage = '';
        
        for (const model of FREE_MODELS) {
            try {
                console.log(`Пробуем модель: ${model}`);
                
                const requestHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };

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
                                content: CHAT_SYSTEM_PROMPT
                            },
                            ...messageHistory.slice(-5)
                        ],
                        temperature: 0.5,
                        max_tokens: 900
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
                    
                    if (response.status === 401) {
                        authErrorMessage =
                            (errorData.error?.message || 'Неверный ключ') +
                            '. Создайте новый на https://openrouter.ai/keys и вставьте в js/config.local.js';
                        break;
                    }

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
            reply = sanitizeBotReply(reply);
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

/** Добавить пузырь в #chatMessages (user|bot), простой markdown ** * и переносы */
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

/** Сохранить DOM и history в localStorage (на случай восстановления в сессии) */
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

/** Страница обновлена (F5 / Ctrl+R), а не переход по ссылке */
function isPageReload() {
    const nav = performance.getEntriesByType('navigation')[0];
    return nav && nav.type === 'reload';
}

/** Очистить историю и вернуть приветствие */
function clearChatState() {
    messageHistory = [];
    try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.warn('Не удалось очистить историю чата:', error);
    }
    if (chatMessages) {
        chatMessages.innerHTML =
            '<div class="message bot"><div class="message-content"></div></div>';
        applyWelcomeMessage();
    }
    setChatOpen(false);
}

/** Восстановить чат из localStorage при переходе между страницами сайта */
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

        if (!savedMessagesRaw) return false;
        const savedMessages = JSON.parse(savedMessagesRaw);
        if (!Array.isArray(savedMessages) || savedMessages.length === 0) return false;

        chatMessages.innerHTML = '';
        savedMessages.forEach((msg) => {
            if (msg && typeof msg.content === 'string' && (msg.sender === 'user' || msg.sender === 'bot')) {
                addMessage(msg.content, msg.sender);
            }
        });
        return true;
    } catch (error) {
        console.warn('Не удалось восстановить историю чата:', error);
        return false;
    }
}

/** F5 — новый диалог; переход по меню — сохранить историю */
function initChatOnPageLoad() {
    if (isPageReload()) {
        clearChatState();
    } else {
        const restored = restoreChatState();
        if (!restored) {
            applyWelcomeMessage();
        }
    }
    initChatIcons();
}

/** Перерисовать иконки Lucide в шапке чата */
function initChatIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

/** Показать «три точки» пока ждём ответ API */
function showTypingIndicator() {
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Убрать индикатор набора */
function removeTypingIndicator() {
    isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

/** Открыть/закрыть окно чата, класс body.chat-open */
function setChatOpen(open) {
    if (!chatWindow) return;
    chatWindow.classList.toggle('active', open);
    document.body.classList.toggle('chat-open', open);
    if (open && chatInput) chatInput.focus();
}

if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        setChatOpen(!chatWindow.classList.contains('active'));
    });
}

if (chatClose) {
    chatClose.addEventListener('click', () => setChatOpen(false));
}

if (chatSend) chatSend.addEventListener('click', sendMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

if (!chatToggle || !chatWindow || !chatMessages) {
    console.warn('AI чат: элементы не найдены на этой странице');
}

/** Подставить CHAT_WELCOME в первое сообщение бота из HTML */
function applyWelcomeMessage() {
    if (!chatMessages) return;
    const firstBot = chatMessages.querySelector('.message.bot .message-content');
    if (firstBot) firstBot.textContent = CHAT_WELCOME;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatOnPageLoad, { once: true });
} else {
    initChatOnPageLoad();
}

console.log('✅ AI чат-бот загружен (бесплатные модели OpenRouter)');
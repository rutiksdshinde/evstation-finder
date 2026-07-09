// Chatbot functionality with free AI integration
let chatWindow, chatMessages, userInput, toggleBtn;

// Using free Hugging Face API (no API key required)
console.log('Chatbot initialized with free AI service');
console.log('CONFIG object available:', typeof CONFIG !== 'undefined');

function initChatbot() {
    // Wait for DOM to be ready and CONFIG to be loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for config.js to load
            setTimeout(initChatbotElements, 100);
        });
    } else {
        // Wait a bit for config.js to load
        setTimeout(initChatbotElements, 100);
    }
}

function initChatbotElements() {
    chatWindow = document.getElementById('chat-window');
    chatMessages = document.getElementById('chat-messages');
    userInput = document.getElementById('user-input');
    toggleBtn = document.getElementById('chat-toggle-btn');

    // Check if elements exist
    if (!chatWindow || !chatMessages || !userInput || !toggleBtn) {
        console.error('Chatbot elements not found. Make sure the HTML includes the chatbot structure.');
        return;
    }

    // Add initial greeting
    setTimeout(() => {
        addMessage("Hello! I'm your EV assistant. I can help you find charging stations, plan routes, calculate costs, and answer questions about electric vehicles. What can I help you with today?", 'bot');
    }, 1000);

    console.log('Chatbot initialized successfully');
}

function toggleChat() {
    if (chatWindow.classList.contains('chat-hidden')) {
        chatWindow.classList.remove('chat-hidden');
        chatWindow.classList.add('chat-visible');
        userInput.focus();
    } else {
        chatWindow.classList.remove('chat-visible');
        chatWindow.classList.add('chat-hidden');
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    console.log('Attempting API call for message:', message);

    try {
        // Try API response first
        console.log('Calling getAPIResponse...');
        const response = await getAPIResponse(message);
        console.log('API response received:', response);
        hideTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        console.log('API failed, using fallback response:', error);
        console.log('Error details:', error.message);
        // Fallback to static responses
        setTimeout(() => {
            hideTypingIndicator();
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000);
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    // Convert URLs to links
    const linkedText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>');

    messageDiv.innerHTML = linkedText;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// API response function
async function getAPIResponse(message) {
    // Use proxy endpoint to avoid CORS issues
    const proxyUrl = 'http://localhost:3001/api/chat';

    console.log('Making fetch request to:', proxyUrl);

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful and maximally truthful AI assistant. You can answer questions on any topic, provide information, help with tasks, and engage in conversation. Be friendly, informative, and provide accurate information. Keep responses helpful and engaging.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        })
    });

    console.log('Fetch response status:', response.status);
    console.log('Fetch response ok:', response.ok);

    if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data);

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from API');
    }

    return data.choices[0].message.content.trim();
}

function generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Keywords and responses
    const responses = {
        greeting: [
            "hello", "hi", "hey", "good morning", "good afternoon", "good evening"
        ],
        charging: [
            "charg", "station", "charging", "battery", "power", "electricity"
        ],
        route: [
            "route", "trip", "plan", "destination", "drive", "travel", "map"
        ],
        cost: [
            "cost", "price", "money", "calculate", "estimate", "budget", "expensive"
        ],
        traffic: [
            "traffic", "congestion", "jam", "delay", "slow", "accident"
        ],
        range: [
            "range", "distance", "mileage", "km", "battery life", "anxiety"
        ],
        help: [
            "help", "assist", "support", "guide", "tutorial"
        ]
    };

    // Check for keywords and return appropriate response
    if (responses.greeting.some(word => lowerMessage.includes(word))) {
        return "Hello! How can I help you with your electric vehicle needs today?";
    }

    if (responses.charging.some(word => lowerMessage.includes(word))) {
        return "For charging stations, I recommend using our Station Finder page. You can search by location and filter by charger type. Fast chargers (DC) are great for long trips, while Level 2 chargers are perfect for overnight charging. What's your current location?";
    }

    if (responses.route.some(word => lowerMessage.includes(word))) {
        return "Planning a route? Our Route Planner can help you find the best path with charging stops. Just enter your start and destination, and we'll suggest optimal charging points along the way. Make sure to consider your vehicle's range and charging speed preferences!";
    }

    if (responses.cost.some(word => lowerMessage.includes(word))) {
        return "Calculating costs? Try our Cost Calculator! It factors in your trip distance, vehicle efficiency, and local electricity rates. Generally, EV charging costs ₹8-25 per kWh depending on the charger type and location. Home charging is usually the cheapest option.";
    }

    if (responses.traffic.some(word => lowerMessage.includes(word))) {
        return "Traffic information is available on our Traffic Monitor page. It shows live congestion data and incidents. For EV drivers, this is especially useful to avoid delays that could affect your battery range. You can also draw custom areas to monitor specific routes.";
    }

    if (responses.range.some(word => lowerMessage.includes(word))) {
        return "Range anxiety is common but solvable! Modern EVs typically offer 300-500km range. Plan your trips with our Route Planner, which suggests charging stops. Always keep your battery above 20% and use fast chargers when needed. What's your vehicle's range?";
    }

    if (responses.help.some(word => lowerMessage.includes(word))) {
        return "I'm here to help! I can assist with:\n• Finding charging stations\n• Planning routes with charging stops\n• Calculating trip costs\n• Traffic monitoring\n• General EV questions\n\nWhat would you like to know more about?";
    }

    // Default responses
    const defaultResponses = [
        "That's an interesting question! I'm still learning, but I can help with charging stations, route planning, cost calculations, and traffic information. What specific EV topic can I assist you with?",
        "I'm not sure about that specific detail, but I can definitely help you find charging stations, plan routes, calculate costs, or check traffic conditions. What are you looking for?",
        "I'd love to help! While I specialize in EV-related topics like charging, routing, costs, and traffic, I can try to point you in the right direction. What can I assist you with today?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', initChatbot);

// Make functions globally available
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;

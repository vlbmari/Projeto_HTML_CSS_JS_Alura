document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const messagesContainer = document.getElementById('chat-messages');
    const chatHeader = document.getElementById('chat-header');
    const inputContainer = document.getElementById('chat-input-container');

    // --- ESTADO DO CHAT ---
    let knowledgeBase = [];
    let conversationState = 'initial'; // 'initial', 'awaiting_tech_choice', 'awaiting_comparison_1', 'awaiting_comparison_2', 'awaiting_evolution_choice'
    let techToCompare = null;

    // --- CARREGAMENTO DOS DADOS ---
    async function loadKnowledge() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Falha ao carregar a base de conhecimento.');
            knowledgeBase = await response.json();
            showInitialMessage();
        } catch (error) {
            console.error(error);
            addBotMessage('Desculpe, estou com problemas para acessar minhas informações. Tente recarregar a página.');
        }
    }

    function closeChat() {
        chatWindow.classList.add('hidden');
        chatBubble.classList.remove('hidden');
    }

    function openChat() {
        chatWindow.classList.remove('hidden');
        chatBubble.classList.add('hidden');
    }

    // --- FUNÇÕES DE INTERFACE ---
    chatBubble.addEventListener('click', openChat);

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'chat-close-btn';
    closeButton.addEventListener('click', closeChat);
    chatHeader.appendChild(closeButton);

    // Fecha a janela se clicar fora dela
    document.addEventListener('click', (event) => {
        if (!chatWindow.classList.contains('hidden')) {
            const isClickInsideChat = chatWindow.contains(event.target);
            const isClickOnBubble = chatBubble.contains(event.target);

            if (!isClickInsideChat && !isClickOnBubble) {
                closeChat();
            }
        }
    });

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.innerHTML = text; // Usamos innerHTML para renderizar HTML como <br> e <a>
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addBotMessage(text) {
        addMessage(text, 'bot');
    }

    function addUserMessage(text) {
        addMessage(text, 'user');
    }

    function clearInput() {
        inputContainer.innerHTML = '';
    }

    // --- LÓGICA DO CHATBOT ---

    function showInitialMessage() {
        const welcomeText = "🤖 Olá! Sou seu assistente de tecnologias. Como posso ajudar?";
        const optionsHtml = `
            <div class="chat-options">
                <button onclick="handleUserChoice('detail', event)">1. Detalhar uma tecnologia</button>
                <button onclick="handleUserChoice('evolution', event)">2. Mostrar linha do tempo da evolução</button>
                <button onclick="handleUserChoice('compare', event)">3. Comparar duas tecnologias (IA)</button>
            </div>
        `;
        addBotMessage(welcomeText + optionsHtml);
    }

    window.handleUserChoice = (choice, event) => {
        event.stopPropagation(); // Impede que o clique feche a janela
        // Remove os botões após a escolha
        const options = document.querySelector('.chat-options');
        if (options) options.parentElement.removeChild(options);

        switch (choice) {
            case 'detail':
                addUserMessage("Quero detalhar uma tecnologia.");
                promptForTechnology("Para qual tecnologia você gostaria de detalhes?");
                conversationState = 'awaiting_tech_choice';
                break;
            case 'evolution':
                addUserMessage("Mostrar linha do tempo da evolução.");
                promptForTechnology("Qual tecnologia você gostaria de analisar a evolução?");
                conversationState = 'awaiting_evolution_choice';
                break;
            case 'compare':
                addUserMessage("Quero comparar tecnologias.");
                promptForTechnology("Escolha a primeira tecnologia para comparar.");
                conversationState = 'awaiting_comparison_1';
                break;
        }
    };

    function promptForTechnology(promptText) {
        addBotMessage(promptText);
        clearInput();

        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'chat-suggestions';
        inputContainer.appendChild(suggestionsBox);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'chat-input';
        input.placeholder = 'Digite o nome aqui...';
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Previne o comportamento padrão (ex: quebra de linha)

                const suggestions = suggestionsBox.querySelectorAll('.suggestion-item');
                const lastSuggestion = suggestions[suggestions.length - 1];

                if (lastSuggestion) {
                    // Se a última sugestão existir, simula um clique nela
                    lastSuggestion.click();
                } else {
                    // Caso contrário, envia o texto que já está no input
                    const text = input.value.trim();
                    if (text !== '') {
                        handleTextInput(text);
                    }
                }
            }
        });

        input.addEventListener('input', () => {
            const text = input.value.toLowerCase().trim();
            suggestionsBox.innerHTML = '';
            if (text.length === 0) return;

            const filteredTechs = knowledgeBase
                .filter(tech => tech.nome.toLowerCase().startsWith(text))
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .slice(0, 5); // Limita a 5 sugestões

            filteredTechs.forEach(tech => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = tech.nome;
                suggestionItem.addEventListener('click', (event) => {
                    event.stopPropagation(); // Impede que o clique feche a janela do chat
                    input.value = tech.nome;
                    suggestionsBox.innerHTML = '';
                    handleTextInput(tech.nome);
                });
                suggestionsBox.appendChild(suggestionItem);
            });
        });

        inputContainer.appendChild(input);
        input.focus();
    }

    function handleTextInput(text) {
        // Limpa as sugestões ao processar o input
        const suggestionsBox = inputContainer.querySelector('.chat-suggestions');
        if (suggestionsBox) suggestionsBox.innerHTML = '';

        addUserMessage(text);
        const tech = findTechnology(text);

        if (!tech) {
            addBotMessage("Não encontrei essa tecnologia. Tente novamente.");
            // Mantém o estado para o usuário tentar de novo
            return;
        }

        switch (conversationState) {
            case 'awaiting_tech_choice':
                showTechDetails(tech);
                resetConversation();
                break;
            case 'awaiting_comparison_1':
                techToCompare = tech;
                promptForTechnology(`Ok, a primeira é ${tech.nome}. Qual a segunda?`);
                conversationState = 'awaiting_comparison_2';
                break;
            case 'awaiting_comparison_2':
                // A segunda tecnologia foi escolhida, vamos chamar a IA para comparar
                callComparisonAPI(techToCompare, tech);
                break;
            case 'awaiting_evolution_choice':
                // A tecnologia para a timeline foi escolhida
                showEvolutionTimeline(tech);
                break;
        }
    }

    async function callComparisonAPI(tech1, tech2) {
        addBotMessage(`Analisando e comparando ${tech1.nome} e ${tech2.nome}...`);
        clearInput();

        // Lógica de fallback que usa os dados locais do data.json
        let fallbackMessage = "Segue abaixo o diferencial das tecnologias informadas:<br><br>";
        
        if (tech1.diferencial) {
            fallbackMessage += `<b>Diferencial de ${tech1.nome}:</b> ${tech1.diferencial}<br><br>`;
        } else {
            fallbackMessage += `Não possuo um diferencial pré-definido para ${tech1.nome}.<br><br>`;
        }
        if (tech2.diferencial) {
            fallbackMessage += `<b>Diferencial de ${tech2.nome}:</b> ${tech2.diferencial}`;
        } else {
            fallbackMessage += `Não possuo um diferencial pré-definido para ${tech2.nome}.`;
        }
        addBotMessage(fallbackMessage);
        resetConversation();
    }

    function showEvolutionTimeline(tech) {
        clearInput();
        if (tech.evolucao && tech.evolucao.length > 0) {
            let timelineMessage = `<b>--- Linha do Tempo de ${tech.nome} ---</b><br><br>`;
            
            tech.evolucao.forEach(item => {
                timelineMessage += `<b>${item.ano}:</b> ${item.evento}<br><br>`;
            });

            addBotMessage(timelineMessage);
        } else {
            addBotMessage(`Desculpe, ainda não tenho uma linha do tempo detalhada para ${tech.nome}, mas sei que seu diferencial é: <br><br><b>${tech.diferencial}</b>`);
        }
        resetConversation();
    }

    function findTechnology(name) {
        return knowledgeBase.find(t => t.nome.toLowerCase() === name.toLowerCase());
    }

    function showTechDetails(tech) {
        let details = `Claro! Aqui estão os detalhes sobre <b>${tech.nome}</b>:<br><br>`;
        details += `${tech.descricao} Lançada em <b>${tech.ano}</b>, é considerada uma linguagem de <b>${tech.nivel}</b>. `;
        details += `Seu código é executado de forma <b>${tech.tipo_execucao.toLowerCase()}</b>.<br><br>`;
        details += `Uma curiosidade interessante é que ${tech.curiosidade.charAt(0).toLowerCase() + tech.curiosidade.slice(1)}<br><br>`;
        details += `É comumente usada em áreas como: <b>${tech.tags.join(', ')}</b>.<br><br>`;
        details += `Você pode encontrar mais informações na <a href="${tech.link}" target="_blank">documentação oficial</a>.`;
        addBotMessage(details);
    }

    function resetConversation() {
        clearInput();
        conversationState = 'initial';
        setTimeout(() => {
            showInitialMessage();
        }, 1500); // Aguarda um pouco antes de mostrar o menu novamente
    }

    // Inicia o chatbot
    loadKnowledge();
});

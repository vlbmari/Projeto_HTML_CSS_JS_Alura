/**
 * @file script.js
 * @description Lógica principal da interface: renderização, filtros, gráficos e animações.
 * @author Mariana Lourenço
 */

let cardContainer = document.querySelector(".card-container");
let categoriaAtiva = 'Todos'; 
let dados = [];
let sugestaoAtivaIndex = -1;

// Elementos do Modal de Curva
const curvaModalOverlay = document.getElementById('curva-modal-overlay');
const curvaModalTitle = document.getElementById('curva-modal-title');
const curvaModalBody = document.getElementById('curva-modal-body');
const curvaModalDesc = document.getElementById('curva-modal-desc');
const curvaModalCloseBtn = document.getElementById('curva-modal-close');

/**
 * Calcula os pontos SVG para simular a curva de aprendizado.
 * @param {string} nome - Nome da tecnologia.
 * @returns {string} String de coordenadas "x,y" para o polyline.
 */
function obterCurvaQualitativa(nome) {
    const tempo = Array.from({ length: 20 }, (_, i) => i);
    let proficiencia;

    if (nome.includes("Python") || nome.includes("PHP") || nome.includes("Fortran") || nome.includes("COBOL")) {
        proficiencia = tempo.map(t => Math.min(90, 30 * Math.log1p(t * 0.5) + 10));
    } else if (nome.includes("JavaScript") || nome.includes("TypeScript") || nome.includes("Swift")) {
        proficiencia = tempo.map(t => 100 / (1 + Math.exp(-0.25 * (t - 10))));
    } else if (nome.includes("C#") || nome.includes("Java") || nome.includes("Go")) {
        proficiencia = tempo.map(t => 100 * (1 - Math.exp(-0.15 * t)));
    } else if (nome.includes("C++") || nome.includes("Rust") || nome.includes("C")) {
        proficiencia = tempo.map(t => 100 * (1 - Math.exp(-0.25 * t * t / 20)));
    } else if (nome.includes("Assembly")) {
        proficiencia = tempo.map(t => Math.min(100, t * 1.5 + (t > 10 ? 10 : 0)));
    } else {
        proficiencia = tempo.map(t => t * 5);
    }
    
    const maxProf = Math.max(...proficiencia);
    const pontos = proficiencia.map((p, i) => {
        const x = (i / (tempo.length - 1)) * 100;
        const y = 100 - (p / maxProf) * 100;
        return `${x},${y}`;
    }).join(' ');

    return pontos;
}

function getCurvaDesc(nome) {
    if (nome.includes("Python") || nome.includes("PHP") || nome.includes("COBOL")) return "suave (fácil de começar)";
    if (nome.includes("JavaScript") || nome.includes("TypeScript")) return "em S (com pico de complexidade)";
    if (nome.includes("C#") || nome.includes("Java") || nome.includes("Go")) return "equilibrada e estável";
    if (nome.includes("C++") || nome.includes("Rust") || nome.includes("C")) return "muito íngreme (alta barreira inicial)";
    if (nome.includes("Assembly")) return "extremamente lenta (requer alto domínio de hardware)";
    return "linear";
}

function abrirCurvaModal(dado) {
    const pontosSvg = obterCurvaQualitativa(dado.nome);
    const nome = dado.nome;
    
    document.body.classList.add('no-scroll');
    curvaModalTitle.textContent = `Curva de Aprendizagem de ${nome}`;
    curvaModalDesc.textContent = `Esta é uma representação qualitativa: ${nome} tende a ter uma curva inicial ${getCurvaDesc(nome)}.`;

    curvaModalBody.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${pontosSvg}" fill="none" stroke="#d2fc83b9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="eixo-y">Proficiência</span>
        <span class="eixo-x">Tempo/Esforço</span>
    `;
    
    curvaModalOverlay.style.display = 'flex';
    curvaModalOverlay.style.animation = 'none';
    curvaModalOverlay.offsetHeight; 
    curvaModalOverlay.style.animation = 'overlayFadeIn 0.4s ease-out forwards';
}

function fecharCurvaModal() {
    curvaModalOverlay.style.display = 'none';
    document.body.classList.remove('no-scroll'); 
}

curvaModalCloseBtn.addEventListener('click', fecharCurvaModal);
curvaModalOverlay.addEventListener('click', (event) => {
    if (event.target === curvaModalOverlay) {
        fecharCurvaModal();
    }
});


function renderizarBotaoCurva(dado) {
    const button = document.createElement('button');
    button.className = 'btn-curva';
    button.textContent = 'Ver Curva de Aprendizagem';
    
    button.addEventListener('click', (event) => {
        event.stopPropagation(); 
        abrirCurvaModal(dado);
    });

    return button;
}

/**
 * Renderiza os cards de tecnologia na DOM.
 * @param {Array} dados - Lista de tecnologias filtradas.
 */
function renderizarCards(dados){
    cardContainer.innerHTML = ""; 

    dados.sort((a, b) => a.nome.localeCompare(b.nome));

    dados.forEach((dado, index) => {
        let nivelColor = '';
        switch (dado.nivel) {
            case "Nível alto": nivelColor = 'var(--quinary-color)'; break;
            case "Nível intermediário": nivelColor = 'var(--seventh-color)'; break;
            case "Nível baixo": nivelColor = 'var(--quaternary-color)'; break;
        }

        const tagsHtml = dado.tags.map(tag => `<span class="tag-item">${tag}</span>`).join('');

        let article = document.createElement("article");
        article.classList.add("card");
        article.style.animationDelay = `${index * 0.05}s`;
        
        article.innerHTML = ` 
            <img class="card-logo" src="${dado.logo_url}" alt="Logo ${dado.nome}">
            <h2>${dado.nome}</h2>
            <p><strong>${dado.ano}</strong></p>
            <div class="tags-container">${tagsHtml}</div>
            <p>${dado.descricao}</p>
            <p class="curiosidade"><strong>Curiosidade:</strong> ${dado.curiosidade}</p> 
            <p><strong>Execução: ${dado.tipo_execucao}</strong></p>
            <p><strong>Nível:</strong> <strong style="color: ${nivelColor};">${dado.nivel}</strong></p>
            <a href="${dado.link}" target="_blank" rel="noopener noreferrer">Saiba mais</a> 
        `;

        const btnCurva = renderizarBotaoCurva(dado);
        article.appendChild(btnCurva);

        cardContainer.appendChild(article);
    });
}

/**
 * Inicialização da aplicação.
 */
async function inicializar() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();

        const filterContainer = document.getElementById('filter-container');
        const categorias = ['Todos', 'Linguagem de Programação', 'Framework/Biblioteca', 'Banco de Dados', 'Ferramenta/Plataforma'];
        
        const nomesExibicao = {
            'Linguagem de Programação': 'Tecnologias',
            'Framework/Biblioteca': 'Frameworks',
            'Banco de Dados': 'Bancos de Dados',
            'Ferramenta/Plataforma': 'Ferramentas'
        };

        categorias.forEach(categoria => {
            const button = document.createElement('button');
            button.classList.add('filter-btn');
            button.setAttribute('data-categoria', categoria);
            button.textContent = nomesExibicao[categoria] || categoria; 
            if (categoria === 'Todos') {
                button.classList.add('active');
            }
            filterContainer.appendChild(button);
        });

        filtrarErenderizar(); 

        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); 
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                categoriaAtiva = button.getAttribute('data-categoria');
                filtrarErenderizar();

                const linguagensSection = document.getElementById('linguagens');
                if (linguagensSection) {
                    linguagensSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                setTimeout(() => {
                    filterContainer.classList.remove('show');
                    const filterToggleButton = document.getElementById('filter-toggle-btn');
                    filterToggleButton.setAttribute('aria-expanded', 'false');
                }, 100);
            });
        });

        const filterToggleButton = document.getElementById('filter-toggle-btn');
        filterToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isShown = filterContainer.classList.toggle('show');
            filterToggleButton.setAttribute('aria-expanded', isShown);
        });
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        cardContainer.innerHTML = "<p>Erro ao carregar dados. Tente recarregar a página.</p>";
    }
}


function mostrarSugestoes() {
    sugestaoAtivaIndex = -1; // Reseta o índice a cada nova busca
    const termoBusca = document.getElementById("campo-busca").value.toLowerCase();
    const sugestoesContainer = document.getElementById("sugestoes-container");

    sugestoesContainer.innerHTML = "";

    if (termoBusca.length === 0) {
        return; 
    }

    const sugestoesFiltradas = dados
        .filter(dado => 
            dado.nome.toLowerCase().includes(termoBusca) &&
            (categoriaAtiva === 'Todos' || dado.categoria === categoriaAtiva)
        )
        .slice(0, 5); 

    sugestoesFiltradas.forEach(sugestao => {
        const item = document.createElement("div");
        item.classList.add("sugestao-item");
        item.textContent = sugestao.nome;
        item.onclick = () => selecionarSugestao(sugestao.nome);
        sugestoesContainer.appendChild(item);
    });
}

function selecionarSugestao(nome) {
    document.getElementById("campo-busca").value = nome;
    document.getElementById("sugestoes-container").innerHTML = ""; 
    filtrarErenderizar();

    const linguagensSection = document.getElementById('linguagens');
    if (linguagensSection) {
        linguagensSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrarErenderizar() {
    const campoBusca = document.getElementById("campo-busca");
    const termoBusca = campoBusca.value.toLowerCase();
    let dadosFiltrados = dados.filter(dado => {
        return categoriaAtiva === 'Todos' || dado.categoria === categoriaAtiva;
    });

    dadosFiltrados = dadosFiltrados.filter(dado => {
        return dado.nome.toLowerCase().includes(termoBusca);
    });
    renderizarCards(dadosFiltrados);
}

function handleSearchInput() {
    mostrarSugestoes();
    filtrarErenderizar();
}

document.addEventListener('DOMContentLoaded', () => {
    const campoBusca = document.getElementById("campo-busca");
    if (campoBusca) {
        campoBusca.addEventListener('keydown', (event) => {
            const sugestoesContainer = document.getElementById("sugestoes-container");
            const sugestoes = sugestoesContainer.querySelectorAll('.sugestao-item');
            if (sugestoes.length === 0) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    sugestaoAtivaIndex = (sugestaoAtivaIndex + 1) % sugestoes.length;
                    atualizarDestaqueSugestao(sugestoes);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    sugestaoAtivaIndex = (sugestaoAtivaIndex - 1 + sugestoes.length) % sugestoes.length;
                    atualizarDestaqueSugestao(sugestoes);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (sugestaoAtivaIndex > -1) {
                        sugestoes[sugestaoAtivaIndex].click();
                    } else {
                        sugestoes[0].click(); // Comportamento padrão: clica no primeiro
                    }
                    break;
                case 'Escape':
                    sugestoesContainer.innerHTML = '';
                    break;
            }
        });
    }
});

function atualizarDestaqueSugestao(sugestoes) {
    sugestoes.forEach((sugestao, index) => {
        if (index === sugestaoAtivaIndex) {
            sugestao.classList.add('sugestao-ativa');
            // Garante que o item ativo esteja visível na rolagem
            sugestao.scrollIntoView({ block: 'nearest' });
        } else {
            sugestao.classList.remove('sugestao-ativa');
        }
    });
}

document.addEventListener('click', function(event) {
    const searchWrapper = document.querySelector('.search-wrapper');
    if (!searchWrapper.contains(event.target)) {
        document.getElementById('sugestoes-container').innerHTML = '';
    }

    const filterContainer = document.getElementById('filter-container');
    const filterToggleButton = document.getElementById('filter-toggle-btn');
    if (!filterContainer.contains(event.target) && !filterToggleButton.contains(event.target)) {
        filterContainer.classList.remove('show');
        filterToggleButton.setAttribute('aria-expanded', 'false');
    }
});

const detalhesExecucao = {
    "Compilada": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Performance máxima, pois o código já está na linguagem da máquina.",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Menos portável. O programa só roda no sistema para o qual foi compilado."
    },
    "Interpretada": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Altamente portável (roda em qualquer sistema com o interpretador) e desenvolvimento ágil.",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Performance inferior à do código compilado."
    },
    "Interpretada (JIT)": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Ótimo equilíbrio entre a flexibilidade da interpretação e a velocidade da compilação.",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Pode ter um 'aquecimento' inicial (warm-up) mais lento enquanto otimiza o código."
    },
    "Traduzida (Transpilada)": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Permite usar recursos de linguagens modernas em plataformas que não as suportam nativamente.",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Adiciona um passo extra de compilação ao desenvolvimento e pode complicar a depuração."
    },
    "Compilada para bytecode": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Excelente portabilidade ('escreva uma vez, rode em qualquer lugar' com a JVM).",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Exige que a Máquina Virtual Java (JVM) esteja instalada no sistema."
    },
    "Compilada para IL": {
        vantagem: "<strong class='modal-subtitle color-vantagem'>Vantagens:</strong> Portabilidade entre sistemas (com o .NET Core/5+) e interoperabilidade entre linguagens .NET.",
        desvantagem: "<strong class='modal-subtitle color-desvantagem'>Desvantagens:</strong> Exige que o Common Language Runtime (CLR) esteja instalado no sistema."
    }
};

const detalhesNivel = {
    "Nível alto": {
        descricao: "Linguagens mais próximas da comunicação humana. Elas abstraem detalhes complexos do hardware, tornando a programação mais rápida, fácil e menos propensa a erros."
    },
    "Nível intermediário": {
        descricao: "Atuam como uma ponte, oferecendo tanto abstrações de alto nível quanto a capacidade de acessar recursos de baixo nível, como gerenciamento de memória. Combinam poder e produtividade."
    },
    "Nível baixo": {
        descricao: "Linguagens muito próximas do código de máquina. Oferecem controle máximo sobre o hardware e performance extrema, mas são complexas e difíceis de usar."
    }
};

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalAdvantage = document.getElementById('modal-advantage');
const modalDisadvantage = document.getElementById('modal-disadvantage');
const modalCloseBtn = document.getElementById('modal-close');

document.querySelectorAll('.details-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.body.classList.add('no-scroll');

        const tipo = button.getAttribute('data-tipo');
        const nivel = button.getAttribute('data-nivel');

        if (tipo) { 
            const detalhes = detalhesExecucao[tipo];
            modalTitle.textContent = tipo;
            modalAdvantage.innerHTML = detalhes.vantagem;
            modalDisadvantage.innerHTML = detalhes.desvantagem;
            modalOverlay.style.display = 'flex';
        } else if (nivel) { 
            const detalhes = detalhesNivel[nivel];
            const linguagensHtml = dados
                .filter(dado => dado.nivel === nivel)
                .map(dado => `<span class="tag-item">${dado.nome}</span>`)
                .join('');

            modalTitle.textContent = nivel;
            modalAdvantage.innerHTML = detalhes.descricao; 
            modalDisadvantage.innerHTML = `<strong class="modal-subtitle">Linguagens:</strong><div class="modal-tags-container">${linguagensHtml}</div>`;
            modalOverlay.style.display = 'flex';
        }
    });
});

function fecharModal() {
    modalOverlay.style.display = 'none';
    document.body.classList.remove('no-scroll'); 
}

modalCloseBtn.addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        fecharModal();
    }
});


function animateTitleBinary(selector, finalColorClass = 'revealed', scrambleColorClass = 'scrambling') {
    const titleElement = document.querySelector(selector);
    if (!titleElement) return;

    const originalText = titleElement.textContent;
    titleElement.innerHTML = ''; 

    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; 
        span.classList.add('binary-char');
        titleElement.appendChild(span);
    });

    const spans = titleElement.querySelectorAll('.binary-char');
    let iterations = 0;

    const interval = setInterval(() => {
        spans.forEach((span, index) => {
            if (index < iterations) {
                span.textContent = originalText[index] === ' ' ? '\u00A0' : originalText[index];
                span.classList.add(finalColorClass);
                span.classList.remove(scrambleColorClass);
            } else {
                span.textContent = Math.random() < 0.5 ? '0' : '1';
                span.classList.add(scrambleColorClass);
                span.classList.remove(finalColorClass);
            }
        });

        if (iterations >= originalText.length) {
            clearInterval(interval);
        }

        iterations += 1 / 3; 
    }, 50); 
}

const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNav = document.getElementById('mobile-nav');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('header'); 

function toggleMenu() {
    hamburgerBtn.classList.toggle('open');
    mobileNav.classList.toggle('open');
    if (mobileNav.classList.contains('open')) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
}

hamburgerBtn.addEventListener('click', toggleMenu);

document.addEventListener('click', (event) => {
    const isClickInsideNav = mobileNav.contains(event.target);
    const isClickOnHamburger = hamburgerBtn.contains(event.target);

    if (mobileNav.classList.contains('open') && !isClickInsideNav && !isClickOnHamburger) {
        toggleMenu();
    }
});

navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); 

        const targetId = link.getAttribute('href'); 
        const targetElement = document.querySelector(targetId); 

        if (targetElement) {
            const headerHeight = header.offsetHeight; 
            const extraOffset = 20; 
            const targetPosition = targetElement.offsetTop - headerHeight - extraOffset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }

        toggleMenu();
    });
});

inicializar();
animateTitleBinary('#main-title');
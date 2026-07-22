import type { Video } from "./videos";

export type StudyLanguage = "pt" | "en";

export type StudyVideo = {
  id: string;
  title: string;
  channel: string;
  language: StudyLanguage;
};

export type StudyResource = {
  institution: string;
  title: string;
  description: string;
  url: string;
  kind: "Curso completo" | "Aulas e exercícios" | "Referência";
  level: "Base" | "Intermediário" | "Avançado";
  language: StudyLanguage;
  area?: string;
};

export type StudyLesson = {
  id: string;
  stage: "Base" | "Fundamento" | "Modelo" | "Prática" | "Aplicação" | "Integração" | "Avançado";
  title: string;
  summary: string;
  principle: string;
  practice: string;
  steps?: string[];
  area?: string;
  videos: Record<StudyLanguage, StudyVideo>;
};

export type StudyTrack = {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  outcome: string;
  estimatedHours?: number;
  areas?: string[];
  resources?: StudyResource[];
  lessons: StudyLesson[];
};

const baseStudyTracks: StudyTrack[] = [
  {
    id: "matematica", title: "Matemática", icon: "∑", color: "#5b8cff",
    description: "Funções, cálculo e álgebra linear como linguagens para descrever mudança e estrutura.",
    outcome: "Modelar um problema e explicar o que cada representação revela.",
    lessons: [
      { id: "funcoes", stage: "Fundamento", title: "Funções: relações antes de fórmulas", summary: "Entenda entrada, saída, domínio e variação como uma mesma ideia.", principle: "Uma função é uma regra de dependência entre quantidades.", practice: "Descreva três relações do cotidiano como funções.", videos: { pt: { id: "uGPeyerEIis", title: "Introdução sobre função", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "WUvTyaaNkzM", title: "The essence of calculus", channel: "3Blue1Brown", language: "en" } } },
      { id: "vetores", stage: "Modelo", title: "Vetores e transformações", summary: "Passe de números isolados para direções, espaços e transformações.", principle: "A mesma estrutura pode ser vista geometricamente e algebricamente.", practice: "Desenhe dois vetores e explique sua soma sem usar uma fórmula.", videos: { pt: { id: "k2-wVKJvsqs", title: "O que é uma função", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "fNk_zzaMoSs", title: "Vectors | Essence of linear algebra", channel: "3Blue1Brown", language: "en" } } },
      { id: "calculo", stage: "Aplicação", title: "Mudança, acumulação e campos", summary: "Conecte derivadas, integrais e campos a fenômenos observáveis.", principle: "Derivar mede mudança local; integrar recompõe o todo.", practice: "Escolha um fenômeno e identifique o que muda e o que se acumula.", videos: { pt: { id: "C4yZ_MDoN7U", title: "Conexão dos teoremas fundamentais do cálculo", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "rB83DpBJQsE", title: "Divergence and curl", channel: "3Blue1Brown", language: "en" } } },
    ],
  },
  {
    id: "ia", title: "Inteligência artificial", icon: "⌘", color: "#a879ff",
    description: "Do significado de aprender com dados aos modelos de linguagem e suas limitações.",
    outcome: "Distinguir IA, machine learning e modelos generativos sem recorrer a slogans.",
    lessons: [
      { id: "campo", stage: "Fundamento", title: "O que a IA realmente tenta resolver", summary: "Mapeie agentes, busca, representação, aprendizado e decisão.", principle: "Inteligência computacional exige objetivo, representação e mecanismo de escolha.", practice: "Defina uma tarefa de IA com entrada, objetivo e critério de erro.", videos: { pt: { id: "Bcw5YZA-Avw", title: "Introdução à Inteligência Artificial", channel: "UNIVESP", language: "pt" }, en: { id: "t4K6lney7Zw", title: "Artificial Intelligence and Machine Learning", channel: "MIT OpenCourseWare", language: "en" } } },
      { id: "aprendizado", stage: "Modelo", title: "Aprender padrões sem confundir correlação", summary: "Compare regras programadas, aprendizado supervisionado e redes neurais.", principle: "Um modelo comprime regularidades dos dados; ele não recebe verdade automaticamente.", practice: "Liste dados, alvo e possíveis vieses de um classificador simples.", videos: { pt: { id: "wFYAV_Wk5bc", title: "IA, Machine Learning e Deep Learning", channel: "Bóson Treinamentos", language: "pt" }, en: { id: "5NgNicANyqM", title: "Harvard CS50’s Artificial Intelligence with Python", channel: "freeCodeCamp.org", language: "en" } } },
      { id: "llms", stage: "Aplicação", title: "Modelos de linguagem: mecanismo e uso crítico", summary: "Entenda previsão de tokens, treinamento, contexto, alucinações e avaliação.", principle: "Fluência é evidência de modelagem linguística, não garantia de verdade.", practice: "Crie um teste que separa resposta convincente de resposta verificável.", videos: { pt: { id: "y8em7JhKwhU", title: "Aplicações de IA e machine learning em saúde", channel: "Canal USP", language: "pt" }, en: { id: "zjkBMFhNj_g", title: "Intro to Large Language Models", channel: "Andrej Karpathy", language: "en" } } },
    ],
  },
  {
    id: "ciencia", title: "Ciência", icon: "⚗", color: "#4dc6a2",
    description: "Como perguntas viram hipóteses, testes, evidências e conhecimento provisório.",
    outcome: "Avaliar uma afirmação distinguindo observação, inferência e explicação.",
    lessons: [
      { id: "perguntas", stage: "Fundamento", title: "Perguntas testáveis", summary: "Transforme curiosidade em hipóteses que podem falhar.", principle: "Uma boa hipótese arrisca previsões observáveis.", practice: "Reescreva uma opinião como pergunta mensurável.", videos: { pt: { id: "XjZL1ZQ81Nc", title: "Entenda o método científico", channel: "Paulo Jubilut", language: "pt" }, en: { id: "xOLcZMw0hd4", title: "The Scientific Method", channel: "CrashCourse", language: "en" } } },
      { id: "evidencia", stage: "Modelo", title: "Evidência, erro e replicação", summary: "Veja por que controle, medição e repetição importam.", principle: "Resultados confiáveis sobrevivem a tentativas independentes de refutação.", practice: "Identifique três fontes de erro em um experimento cotidiano.", videos: { pt: { id: "CU42FzU-8x0", title: "A ciência e o método científico", channel: "Com Ciência", language: "pt" }, en: { id: "UdQreBq6MOY", title: "The Scientific Methods", channel: "CrashCourse", language: "en" } } },
      { id: "curiosidade", stage: "Aplicação", title: "Pensar como cientista", summary: "Use dúvida disciplinada sem perder o prazer de descobrir.", principle: "Não saber é o ponto de partida de uma investigação, não uma falha.", practice: "Explique o que mudaria sua opinião sobre uma crença importante.", videos: { pt: { id: "dWMREFKZ-2k", title: "Resumo sobre método científico", channel: "Biologia com Samuel Cunha", language: "pt" }, en: { id: "36GT2zI8lVA", title: "Richard Feynman: Why", channel: "Arquivo de Richard Feynman", language: "en" } } },
    ],
  },
  {
    id: "biologia", title: "Biologia", icon: "⎔", color: "#72bd55",
    description: "Da célula à hereditariedade: organização, informação e evolução dos sistemas vivos.",
    outcome: "Explicar como estrutura celular e informação genética produzem função.",
    lessons: [
      { id: "celula", stage: "Fundamento", title: "A célula como sistema", summary: "Conheça membrana, metabolismo, informação e reprodução.", principle: "Vida depende de fronteiras, fluxo de energia e conservação de informação.", practice: "Compare uma célula a outro sistema sem perder as diferenças essenciais.", videos: { pt: { id: "E08n-S2PaH0", title: "Introdução à célula", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "RZhL7LDPk8w", title: "Cancer | Cells", channel: "Khan Academy", language: "en" } } },
      { id: "estrutura", stage: "Modelo", title: "Estrutura produz função", summary: "Relacione organelas e especialização às tarefas da célula.", principle: "Em biologia, forma e função coevoluem sob restrições.", practice: "Escolha uma organela e explique o custo de sua falha.", videos: { pt: { id: "Lj5EA1wgKNY", title: "Estrutura celular", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "8kK2zwjRV0M", title: "DNA Structure and Replication", channel: "CrashCourse", language: "en" } } },
      { id: "genes", stage: "Aplicação", title: "Genes, variação e herança", summary: "Conecte DNA, alelos, expressão e diferenças observáveis.", principle: "Genes influenciam possibilidades; ambiente e regulação participam do resultado.", practice: "Explique por que DNA não equivale a destino usando um exemplo.", videos: { pt: { id: "hmNqQMlOOfc", title: "Biologia: DNA", channel: "Khan Academy Brasil", language: "pt" }, en: { id: "P0nMnPPdW_k", title: "Alleles and genes", channel: "Khan Academy", language: "en" } } },
    ],
  },
  {
    id: "pensamento-critico", title: "Pensamento crítico", icon: "◇", color: "#ffb04a",
    description: "Argumentos, inferências, falácias e a disciplina de mudar de ideia com boas razões.",
    outcome: "Reconstruir um argumento, testar suas premissas e formular o melhor contraponto.",
    lessons: [
      { id: "argumentos", stage: "Fundamento", title: "Pensar não é apenas opinar", summary: "Separe conclusão, premissas e evidências.", principle: "Um argumento é uma estrutura de razões, não o tom de quem fala.", practice: "Retire adjetivos de uma opinião e reconstrua seu argumento.", videos: { pt: { id: "Bh3JO4J4SG0", title: "O que é pensamento crítico", channel: "LearnFree em Português", language: "pt" }, en: { id: "Cum3k-Wglfw", title: "Introduction to Critical Thinking", channel: "Wireless Philosophy", language: "en" } } },
      { id: "deducao", stage: "Modelo", title: "Deduzir e testar validade", summary: "Descubra quando uma conclusão decorre necessariamente das premissas.", principle: "Validade trata da forma; verdade trata das premissas.", practice: "Crie um argumento válido com uma premissa falsa e explique a diferença.", videos: { pt: { id: "-ozrs4FtCFY", title: "Lógica: argumentos e argumentação", channel: "Pensamento Crítico", language: "pt" }, en: { id: "3jvQrpVQaYM", title: "Deductive Arguments", channel: "Wireless Philosophy", language: "en" } } },
      { id: "inferencia", stage: "Aplicação", title: "A melhor explicação disponível", summary: "Compare hipóteses e reconheça incerteza sem paralisar.", principle: "A explicação preferível equilibra evidência, simplicidade e poder explicativo.", practice: "Formule duas explicações rivais para o mesmo fato e indique como testá-las.", videos: { pt: { id: "odmAzRnBeyw", title: "Linguagem, lógica e pensamento crítico", channel: "Lógica Viva", language: "pt" }, en: { id: "vflZuk-_Hz4", title: "Abductive Arguments", channel: "Wireless Philosophy", language: "en" } } },
    ],
  },
  {
    id: "neurociencia", title: "Neurociência", icon: "⌬", color: "#f06d8b",
    description: "Neurônios, circuitos, memória e aprendizagem sem neuromitos ou promessas mágicas.",
    outcome: "Explicar aprendizagem em diferentes escalas e reconhecer limites das evidências.",
    lessons: [
      { id: "sistema", stage: "Fundamento", title: "Organização do sistema nervoso", summary: "Localize células, circuitos, regiões e funções.", principle: "Explicações cerebrais precisam conectar escalas, do neurônio ao comportamento.", practice: "Desenhe a cadeia entre estímulo, processamento e resposta.", videos: { pt: { id: "dGXOJXGCb68", title: "Função e organização do sistema nervoso", channel: "Neurociência Básica", language: "pt" }, en: { id: "5031rWXgdYo", title: "Introduction to Neuroscience I", channel: "Stanford", language: "en" } } },
      { id: "neuronios", stage: "Modelo", title: "Neurônios, sinais e circuitos", summary: "Entenda comunicação elétrica, química e organização em redes.", principle: "Cognição emerge de circuitos dinâmicos, não de um ponto isolado.", practice: "Explique uma sinapse como mecanismo causal, evitando a metáfora de um fio simples.", videos: { pt: { id: "c-RUQPw9rss", title: "Como funciona o cérebro? Neurônios", channel: "NeuroVox", language: "pt" }, en: { id: "ba-HMvDn_vU", title: "Introduction to the Human Brain", channel: "MIT OpenCourseWare", language: "en" } } },
      { id: "aprendizagem", stage: "Aplicação", title: "Aprendizagem, memória e prática", summary: "Relacione atenção, recuperação, erro e consolidação.", principle: "Aprender exige modificação recuperável, não apenas familiaridade durante o estudo.", practice: "Troque uma releitura passiva por um teste de recuperação espaçado.", videos: { pt: { id: "9HrVoKHtzQU", title: "Neurociência e aprendizagem", channel: "Conexão Neural", language: "pt" }, en: { id: "5_6fezBz9IA", title: "The Neuroscience of Learning", channel: "Stanford", language: "en" } } },
    ],
  },
  {
    id: "economia", title: "Economia", icon: "⇄", color: "#d7a83e",
    description: "Escassez, incentivos, trocas e comportamento para interpretar escolhas sem reduzi-las a slogans.",
    outcome: "Analisar uma decisão por custos de oportunidade, incentivos e efeitos indiretos.",
    lessons: [
      { id: "escassez", stage: "Fundamento", title: "Escolhas sob escassez", summary: "Comece por recursos limitados, alternativas e trade-offs.", principle: "Escolher algo significa renunciar à melhor alternativa disponível.", practice: "Calcule o custo de oportunidade de uma hora do seu dia.", videos: { pt: { id: "Nj0AN2p1coQ", title: "O que é economia?", channel: "Economia para Iniciantes", language: "pt" }, en: { id: "3ez10ADR_gM", title: "Intro to Economics", channel: "CrashCourse", language: "en" } } },
      { id: "incentivos", stage: "Modelo", title: "Incentivos e efeitos não intencionais", summary: "Observe como regras alteram comportamento e distribuem custos.", principle: "Pessoas respondem a incentivos, inclusive aos que uma regra não pretendia criar.", practice: "Escolha uma política e liste efeitos diretos e possíveis efeitos de segunda ordem.", videos: { pt: { id: "pdHM58sb8Vo", title: "Conceitos fundamentais em economia", channel: "Prof. Luiz Paloschi", language: "pt" }, en: { id: "x-hYzRncxTc", title: "What Is Opportunity Cost?", channel: "Marginal Revolution University", language: "en" } } },
      { id: "comportamento", stage: "Aplicação", title: "Decisão real e economia comportamental", summary: "Compare o agente ideal com atalhos, vieses e contextos reais.", principle: "Modelos simplificam para explicar; seus limites fazem parte da explicação.", practice: "Identifique um viés em uma decisão sua e proponha um mecanismo de correção.", videos: { pt: { id: "CxC1UCsJv90", title: "Toda a economia explicada", channel: "Ciência Mapeada", language: "pt" }, en: { id: "dqxQ3E1bubI", title: "Behavioral Economics", channel: "CrashCourse", language: "en" } } },
    ],
  },
  {
    id: "quimica", title: "Química", icon: "⚛", color: "#35c7d8",
    description: "Da matéria observável à estrutura atômica, às reações, à energia e à química da vida.",
    outcome: "Prever e explicar transformações químicas conectando partículas, energia, quantidade e evidência experimental.",
    lessons: [
      { id: "quimica-ancora-atomos", stage: "Fundamento", title: "Átomos e elementos", summary: "Use modelos para passar do observável ao microscópico.", principle: "Propriedades macroscópicas emergem da organização de partículas.", practice: "Represente uma substância nos níveis macroscópico, particulado e simbólico.", videos: { pt: { id: "t-w9znZhNbk", title: "Introdução à Química — do zero", channel: "Química do Monstro", language: "pt" }, en: { id: "FSyAehMdpyI", title: "The Nucleus: Crash Course Chemistry #1", channel: "CrashCourse", language: "en" } } },
      { id: "quimica-ancora-ligacoes", stage: "Modelo", title: "Ligações e moléculas", summary: "Relacione elétrons, geometria e interações.", principle: "Estrutura eletrônica restringe como átomos se combinam.", practice: "Compare uma ligação iônica e uma covalente usando elétrons.", videos: { pt: { id: "S6PcueZI_h4", title: "Ligações Químicas", channel: "Brasil Escola", language: "pt" }, en: { id: "ANi709MYnWg", title: "Acid-Base Reactions in Solution", channel: "CrashCourse", language: "en" } } },
      { id: "quimica-ancora-reacoes", stage: "Aplicação", title: "Reações, energia e equilíbrio", summary: "Explique por que reações acontecem e até onde avançam.", principle: "Reações reorganizam matéria e redistribuem energia.", practice: "Balanceie uma transformação e explique o significado dos coeficientes.", videos: { pt: { id: "9PH2whlpg4o", title: "Estequiometria: rápido e fácil", channel: "Química com Cabral", language: "pt" }, en: { id: "UL1jmJaUkaQ", title: "Stoichiometry: Crash Course Chemistry #6", channel: "CrashCourse", language: "en" } } },
    ],
  },
  {
    id: "programacao", title: "Programação", icon: "</>", color: "#ff7a59",
    description: "Do raciocínio algorítmico à construção, teste e arquitetura de sistemas úteis.",
    outcome: "Decompor um problema, implementar uma solução legível, testá-la e evoluí-la como um pequeno sistema real.",
    lessons: [
      { id: "programacao-ancora-logica", stage: "Fundamento", title: "Lógica antes da linguagem", summary: "Aprenda a transformar objetivos em passos executáveis.", principle: "Programar é tornar uma intenção precisa o bastante para ser executada.", practice: "Escreva em papel um algoritmo para uma tarefa cotidiana.", videos: { pt: { id: "8mei6uVttho", title: "Introdução a Algoritmos", channel: "Curso em Vídeo", language: "pt" }, en: { id: "zOjov-2OZ0E", title: "Introduction to Programming and Computer Science", channel: "freeCodeCamp.org", language: "en" } } },
      { id: "programacao-ancora-python", stage: "Modelo", title: "Python e os blocos de um programa", summary: "Use dados, decisões, repetições e funções.", principle: "Poucos blocos combináveis expressam uma enorme variedade de comportamentos.", practice: "Implemente um programa pequeno e rastreie cada mudança de estado.", videos: { pt: { id: "S9uPNppGsGo", title: "Curso Python #01 — Seja um Programador", channel: "Curso em Vídeo", language: "pt" }, en: { id: "rfscVS0vtbw", title: "Learn Python — Full Course for Beginners", channel: "freeCodeCamp.org", language: "en" } } },
      { id: "programacao-ancora-sistemas", stage: "Aplicação", title: "Da função ao sistema", summary: "Conecte estruturas de dados, testes, banco, rede e interface.", principle: "Software confiável nasce de contratos claros entre partes pequenas.", practice: "Construa um projeto com entrada, regra, persistência, teste e saída.", videos: { pt: { id: "31llNGKWDdo", title: "Curso Python #04 — Primeiros comandos", channel: "Curso em Vídeo", language: "pt" }, en: { id: "8mAITcNt710", title: "Harvard CS50 — Full Computer Science Course", channel: "freeCodeCamp.org", language: "en" } } },
    ],
  },
];

type CurriculumUnit = Omit<StudyLesson, "videos">;

function unit(id: string, stage: StudyLesson["stage"], title: string, summary: string, principle: string, steps: string[], practice: string): CurriculumUnit {
  return { id, stage, title, summary, principle, steps, practice };
}

const curriculumByTrack: Record<string, CurriculumUnit[]> = {
  matematica: [
    unit("numeros", "Base", "Números, operações e estimativa", "Reconstrua o sentido de quantidade antes de manipular símbolos.", "Cálculo confiável começa por ordem de grandeza, unidade e relação entre quantidades.", ["Naturais, inteiros, racionais e reais", "Frações, razões e porcentagens", "Potências, raízes e notação científica", "Estimativa, unidades e análise dimensional"], "Estime primeiro e depois calcule três problemas cotidianos, explicando a diferença entre aproximação e resultado exato."),
    unit("algebra", "Fundamento", "Álgebra como linguagem de relações", "Passe da aritmética concreta para variáveis, expressões e equações.", "Uma equação conserva uma igualdade enquanto transforma sua representação.", ["Variáveis e expressões", "Propriedades das operações", "Equações e inequações", "Sistemas e fatoração"], "Modele uma compra, uma mistura ou uma distância com uma equação e resolva verificando a resposta."),
    unit("funcoes", "Fundamento", "Funções e gráficos", "Veja entrada, saída, domínio, taxa e gráfico como faces da mesma relação.", "Uma função descreve como uma quantidade depende de outra.", ["Domínio, imagem e notação", "Funções lineares e quadráticas", "Exponenciais e logaritmos", "Transformações e composição"], "Escolha uma relação real, construa tabela, fórmula e gráfico e explique o que cada representação evidencia."),
    unit("geometria", "Modelo", "Geometria e trigonometria", "Conecte forma, medida, semelhança e periodicidade.", "Invariantes geométricos permitem raciocinar sem medir tudo diretamente.", ["Ângulos, congruência e semelhança", "Área, volume e escala", "Seno, cosseno e círculo unitário", "Coordenadas, vetores e projeções"], "Meça indiretamente uma altura usando semelhança ou trigonometria e registre as hipóteses."),
    unit("algebra-linear", "Modelo", "Vetores, matrizes e transformações", "Descreva espaços e transformações com linguagem geométrica e algébrica.", "Uma matriz representa uma transformação; seus números só fazem sentido pelo efeito no espaço.", ["Vetores, base e dimensão", "Produto escalar e projeção", "Matrizes e sistemas lineares", "Autovalores e mudança de base"], "Desenhe uma transformação de dois vetores e traduza o desenho para uma matriz."),
    unit("derivadas", "Prática", "Limites, derivadas e otimização", "Formalize mudança instantânea a partir de aproximações sucessivas.", "A derivada é a melhor aproximação linear local de uma mudança.", ["Sequências e ideia de limite", "Taxa média e taxa instantânea", "Regras de derivação", "Máximos, mínimos e sensibilidade"], "Modele uma grandeza que muda, estime sua taxa e interprete o sinal da derivada."),
    unit("integrais", "Prática", "Integrais e acumulação", "Reconstrua totais a partir de pequenas contribuições.", "Integrar soma efeitos locais; o teorema fundamental liga acumulação e mudança.", ["Somas e áreas aproximadas", "Integral definida e indefinida", "Teorema fundamental do cálculo", "Aplicações em área, volume e probabilidade"], "Divida uma acumulação real em parcelas, estime a soma e explique o limite dessa aproximação."),
    unit("probabilidade", "Integração", "Probabilidade e combinatória", "Raciocine sob incerteza sem confundir possibilidade com frequência.", "Probabilidade quantifica informação e incerteza sob um modelo explícito.", ["Contagem e espaço amostral", "Probabilidade condicional", "Independência e Bayes", "Variáveis aleatórias e distribuições"], "Resolva um problema de diagnóstico com Bayes e explique por que a taxa-base altera a conclusão."),
    unit("estatistica", "Integração", "Estatística e inferência", "Passe de dados observados para conclusões com incerteza declarada.", "Uma amostra informa sobre uma população apenas através de hipóteses e variabilidade.", ["Descrição, dispersão e visualização", "Amostragem e viés", "Intervalos e testes", "Regressão, correlação e causalidade"], "Analise um conjunto pequeno de dados, mostre sua dispersão e escreva o que não pode ser concluído."),
    unit("modelagem", "Avançado", "Modelagem, equações diferenciais e otimização", "Integre álgebra, cálculo, probabilidade e computação em problemas abertos.", "Modelos são simplificações úteis cujas suposições fazem parte do resultado.", ["Equações diferenciais e dinâmica", "Otimização com restrições", "Métodos numéricos", "Validação, estabilidade e limites"], "Construa um modelo simples de crescimento, simule cenários e identifique a suposição mais frágil."),
  ],
  ia: [
    unit("computacao-dados", "Base", "Computação, dados e representação", "Aprenda como problemas do mundo viram estados, dados e objetivos computáveis.", "Um sistema só pode aprender com aquilo que foi representado e medido.", ["Bits, programas e abstrações", "Tabelas, vetores, textos e imagens", "Qualidade, rótulos e vazamento de dados", "Objetivo, métrica e linha de base"], "Defina uma tarefa de IA com entrada, saída, métrica e três formas de o dado enganar o modelo."),
    unit("busca", "Fundamento", "Busca, planejamento e agentes", "Comece pela IA clássica: estados, ações, custos e escolhas.", "Agir inteligentemente exige explorar possibilidades sob limites de tempo e informação.", ["Espaço de estados", "Busca em largura e profundidade", "Heurísticas e A*", "Planejamento, jogos e utilidade"], "Modele um problema cotidiano como estados e ações e proponha uma heurística que reduza a busca."),
    unit("base-matematica", "Fundamento", "Álgebra linear, cálculo e probabilidade para IA", "Construa a matemática mínima para compreender treinamento e incerteza.", "Aprender ajusta representações para reduzir erro sob uma distribuição de dados.", ["Vetores, matrizes e similaridade", "Derivadas e gradiente", "Probabilidade condicional", "Otimização e regularização"], "Explique graficamente como o gradiente altera dois parâmetros para reduzir uma função de erro."),
    unit("machine-learning", "Modelo", "Aprendizado supervisionado e não supervisionado", "Compare previsão com rótulo, descoberta de grupos e redução de dimensão.", "Generalizar é capturar regularidades que sobrevivem fora da amostra de treino.", ["Regressão e classificação", "Árvores e modelos lineares", "Agrupamento e representação", "Overfitting, validação e regularização"], "Treine mentalmente um classificador simples e liste sinais de que ele memorizou em vez de generalizar."),
    unit("avaliacao", "Modelo", "Avaliação, viés e experimentação", "Aprenda a medir o sistema antes de melhorar sua complexidade.", "A métrica escolhida define qual erro o sistema aprende a tolerar.", ["Treino, validação e teste", "Precisão, recall, calibração e custo", "Desbalanceamento e fatias", "Experimentos, ablações e comparação"], "Crie uma matriz de custos para falsos positivos e negativos em uma decisão real."),
    unit("redes", "Prática", "Redes neurais e backpropagation", "Entenda camadas, ativações, perda e propagação do erro.", "Redes profundas compõem transformações simples e ajustam-nas por crédito distribuído.", ["Perceptron e funções de ativação", "Forward pass e função de perda", "Gradiente e backpropagation", "Inicialização, normalização e treino"], "Calcule à mão a saída e a direção de correção de uma rede mínima com um neurônio."),
    unit("arquiteturas", "Integração", "Visão, sequências e transformers", "Compare arquiteturas pelas estruturas que exploram nos dados.", "Arquitetura incorpora hipóteses sobre quais relações importam.", ["Convoluções e visão", "Recorrência e sequências", "Atenção e transformers", "Embeddings e aprendizado auto-supervisionado"], "Compare como uma CNN e um transformer tratariam localização e contexto em uma imagem."),
    unit("llms", "Integração", "Modelos de linguagem e sistemas generativos", "Passe de previsão de tokens para pré-treino, alinhamento, ferramentas e recuperação.", "Fluência decorre de modelagem estatística; verdade exige grounding, verificação e desenho de sistema.", ["Tokenização e pré-treino", "Contexto, prompting e in-context learning", "Fine-tuning, preferência e alinhamento", "RAG, agentes, ferramentas e avaliação"], "Desenhe um teste que separe resposta eloquente, resposta fundamentada e resposta verificável."),
    unit("producao", "Avançado", "IA em produção", "Integre dados, modelo, produto, monitoramento e custo.", "O comportamento real de um modelo depende do sistema sociotécnico em que ele opera.", ["Pipelines e versionamento", "Latência, custo e escalabilidade", "Monitoramento, drift e feedback", "Privacidade, segurança e resposta a incidentes"], "Esboce um serviço de IA com limites, logs, revisão humana e plano de falha segura."),
    unit("fronteiras", "Avançado", "Segurança, causalidade e fronteiras da IA", "Examine riscos, explicabilidade, autonomia, impactos e questões em aberto.", "Capacidade não implica confiabilidade, alinhamento nem legitimidade para decidir.", ["Robustez e ataques", "Causalidade e interpretabilidade", "Alinhamento, governança e auditoria", "Multimodalidade, robótica e pesquisa aberta"], "Faça um pré-mortem de um sistema de IA e proponha barreiras técnicas e institucionais."),
  ],
  ciencia: [
    unit("observacao-medida", "Base", "Observar, medir e definir", "Separe fenômeno, conceito, indicador e instrumento.", "Uma medida é uma comparação operacional, não o fenômeno em si.", ["Perguntas e definições operacionais", "Grandezas, unidades e escalas", "Instrumentos, resolução e calibração", "Registro, rastreabilidade e contexto"], "Defina operacionalmente uma ideia abstrata e indique o que seu indicador deixa de fora."),
    unit("hipoteses", "Fundamento", "Hipóteses e previsões que podem falhar", "Transforme explicações vagas em expectativas observáveis.", "Uma hipótese científica ganha conteúdo ao excluir resultados possíveis.", ["Hipótese, modelo e teoria", "Previsões e condições iniciais", "Falsificabilidade e alternativas", "Exploração versus confirmação"], "Escreva duas hipóteses rivais e uma observação que as diferencie."),
    unit("experimentos", "Fundamento", "Desenho experimental e controles", "Isole mecanismos sem perder validade fora do laboratório.", "Comparações confiáveis exigem que a diferença relevante seja identificável.", ["Controle, tratamento e randomização", "Cegamento e placebo", "Confundidores e validade", "Experimentos naturais e quase-experimentos"], "Desenhe um teste com controle, variável de resultado e três confundidores possíveis."),
    unit("erro", "Modelo", "Erro, incerteza e propagação", "Quantifique o que uma medição não consegue determinar.", "Todo resultado empírico combina sinal, ruído e incerteza do modelo.", ["Erro sistemático e aleatório", "Precisão, acurácia e repetibilidade", "Propagação de incerteza", "Sensibilidade e robustez"], "Repita uma medição, estime sua dispersão e explique o que repetição não corrige."),
    unit("dados", "Modelo", "Dados, estatística e inferência", "Use amostras para atualizar crenças sem fabricar certeza.", "Evidência muda graus de confiança; não converte automaticamente correlação em causa.", ["Distribuições e amostragem", "Estimativas e intervalos", "Testes, tamanho de efeito e poder", "Múltiplas comparações e viés de publicação"], "Interprete um intervalo de confiança sem usar a palavra certeza e compare significância com relevância."),
    unit("causalidade", "Prática", "Causalidade e mecanismos", "Diferencie associação, intervenção e explicação causal.", "Uma causa altera o resultado sob uma intervenção comparável.", ["Contrafactuais e DAGs", "Confusão, mediação e colisores", "Intervenções e identificação", "Mecanismos e generalização"], "Desenhe um diagrama causal para uma notícia e identifique qual relação não está identificada."),
    unit("modelos", "Integração", "Modelos, simulação e sistemas", "Construa representações simplificadas e teste sua utilidade.", "Um modelo deve ser julgado pelo propósito, suposições e erros previsíveis.", ["Idealização e parâmetros", "Modelos mecanísticos e estatísticos", "Simulação, calibração e validação", "Sistemas, feedback e emergência"], "Crie um modelo de caixas e setas, simule uma mudança e registre onde ele provavelmente falha."),
    unit("comunidade", "Integração", "Replicação, revisão e ciência aberta", "Entenda como comunidades corrigem erros individuais.", "Confiabilidade científica é um processo social apoiado por transparência e crítica organizada.", ["Replicação e reprodutibilidade", "Revisão por pares", "Dados, código e pré-registro", "Consenso, controvérsia e atualização"], "Monte um checklist de reprodutibilidade para uma afirmação empírica."),
    unit("fronteira-ciencia", "Avançado", "Síntese, comunicação e limites do conhecimento", "Integre evidências heterogêneas e comunique incerteza.", "Boa ciência torna explícito o que sabe, como sabe e o que ainda não sabe.", ["Revisões sistemáticas e meta-análise", "Hierarquias e triangulação de evidências", "Comunicação de risco", "Ética, valores e decisões sob incerteza"], "Escreva um resumo de cinco frases separando achado, método, incerteza, limitação e implicação."),
  ],
  biologia: [
    unit("quimica-vida", "Base", "Química da vida", "Comece por água, carbono, energia e macromoléculas.", "Sistemas vivos são química organizada longe do equilíbrio.", ["Água, pH e interações", "Carbono e grupos funcionais", "Proteínas, lipídios e carboidratos", "Ácidos nucleicos e ATP"], "Explique como a forma de uma molécula biológica restringe sua função."),
    unit("celula", "Fundamento", "Células, membranas e compartimentos", "Entenda a unidade mínima capaz de manter organização e reprodução.", "Vida celular depende de fronteira seletiva, energia e informação.", ["Procariontes e eucariontes", "Membrana e transporte", "Organelas e citoesqueleto", "Comunicação e homeostase"], "Desenhe o fluxo de matéria, energia e informação através de uma célula."),
    unit("metabolismo", "Fundamento", "Metabolismo e bioenergética", "Conecte enzimas, respiração, fotossíntese e balanço energético.", "Metabolismo acopla reações favoráveis às que exigem energia.", ["Enzimas e catálise", "Glicólise e respiração", "Fotossíntese", "Regulação metabólica"], "Rastreie um átomo de carbono e a energia associada ao atravessar uma cadeia metabólica."),
    unit("genetica", "Modelo", "DNA, herança e expressão gênica", "Passe da molécula à transmissão e ao uso da informação.", "Genes são sequências reguladas em contexto, não destinos isolados.", ["Replicação e reparo", "Transcrição e tradução", "Mendel, cromossomos e recombinação", "Regulação, epigenética e ambiente"], "Explique um traço separando variante genética, expressão, ambiente e incerteza."),
    unit("evolucao", "Modelo", "Evolução e história da vida", "Integre variação, herança, seleção, deriva e ancestralidade.", "Evolução é mudança de populações ao longo de gerações sob múltiplos mecanismos.", ["Variação e seleção natural", "Deriva, fluxo gênico e mutação", "Especiação e filogenias", "Evidências e transições evolutivas"], "Construa uma explicação evolutiva evitando linguagem de intenção ou progresso inevitável."),
    unit("desenvolvimento", "Prática", "Desenvolvimento, reprodução e forma", "Veja como uma célula origina tecidos e organismos diferenciados.", "Padrões complexos emergem de sinais locais, expressão diferencial e restrições físicas.", ["Ciclo celular e meiose", "Fecundação e desenvolvimento", "Diferenciação e morfogênese", "Células-tronco e regeneração"], "Explique como células com o mesmo DNA assumem funções diferentes."),
    unit("fisiologia", "Integração", "Fisiologia e homeostase", "Conecte órgãos em sistemas de transporte, controle e troca.", "Homeostase é regulação dinâmica por sensores, sinais e respostas.", ["Sistema nervoso e endócrino", "Circulação e respiração", "Digestão e excreção", "Movimento, temperatura e reprodução"], "Modele um circuito de feedback fisiológico e preveja uma falha possível."),
    unit("imunologia", "Integração", "Imunidade, microrganismos e doença", "Entenda defesa, tolerância, infecção e evolução entre hospedeiro e patógeno.", "Imunidade equilibra reconhecimento, memória e dano colateral.", ["Imunidade inata e adaptativa", "Anticorpos, células e memória", "Vírus, bactérias e microbioma", "Vacinas, autoimunidade e resistência"], "Compare resposta primária, memória imune e o custo de uma resposta excessiva."),
    unit("ecologia", "Integração", "Ecologia e biosfera", "Amplie a escala para populações, comunidades, energia e ciclos.", "Organismos transformam e são transformados por redes ecológicas.", ["Populações e capacidade de suporte", "Interações e redes tróficas", "Ciclos biogeoquímicos", "Biodiversidade, clima e conservação"], "Mapeie uma rede ecológica e identifique efeitos diretos e indiretos de remover uma espécie."),
    unit("biotecnologia", "Avançado", "Biotecnologia, genômica e limites", "Aplique a biologia com análise de riscos, evidências e ética.", "Intervir em sistemas vivos exige considerar efeitos fora do alvo e escalas evolutivas.", ["Sequenciamento e bioinformática", "CRISPR e engenharia genética", "Biologia sintética e terapias", "Biossegurança, ética e governança"], "Faça uma avaliação benefício-risco de uma intervenção genética e indique evidências necessárias."),
  ],
  "pensamento-critico": [
    unit("clareza", "Base", "Clareza, conceitos e perguntas", "Aprenda a identificar o que está realmente sendo afirmado.", "Antes de avaliar uma ideia, torne seus termos, escopo e pergunta explícitos.", ["Definições e ambiguidades", "Fato, valor e recomendação", "Perguntas descritivas e causais", "Escopo, exceções e contraexemplos"], "Reescreva uma afirmação vaga em uma proposição precisa com condições de erro."),
    unit("argumentos", "Fundamento", "Premissas, conclusões e caridade", "Reconstrua raciocínios sem depender do tom ou da pessoa.", "Um argumento é uma relação entre razões e conclusão.", ["Indicadores de premissa e conclusão", "Premissas ocultas", "Validade e solidez", "Princípio da caridade e steelman"], "Transforme uma opinião em mapa de argumentos e apresente sua versão mais forte."),
    unit("deducao", "Fundamento", "Dedução e lógica formal", "Descubra quando a conclusão decorre necessariamente das premissas.", "Validade é propriedade da forma; verdade é propriedade das proposições.", ["Proposições e conectivos", "Tabelas-verdade", "Silogismos e regras de inferência", "Contradição, consistência e prova"], "Crie um argumento válido com premissas falsas e explique por que isso não o torna sólido."),
    unit("inducao", "Modelo", "Indução, analogia e generalização", "Aprenda a passar de casos observados para conclusões graduais.", "Força indutiva depende de representatividade, quantidade e mecanismo plausível.", ["Amostras e generalização", "Analogias fortes e fracas", "Previsão e regularidade", "Problema da indução"], "Avalie uma generalização identificando população, amostra e possíveis vieses."),
    unit("probabilidade", "Modelo", "Probabilidade, Bayes e taxas-base", "Atualize crenças sem ignorar a frequência anterior dos eventos.", "Evidência deve ser ponderada por sua probabilidade sob hipóteses rivais.", ["Risco absoluto e relativo", "Probabilidade condicional", "Teorema de Bayes", "Calibração e excesso de confiança"], "Resolva um caso de teste diagnóstico e explique intuitivamente com frequências naturais."),
    unit("causalidade-critica", "Prática", "Causalidade e explicações rivais", "Separe sequência, correlação, mecanismo e intervenção.", "Uma boa explicação causal enfrenta confundidores e produz previsões diferenciadoras.", ["Correlação e confundimento", "Contrafactuais", "Mecanismos e mediação", "Experimentos naturais e intervenções"], "Liste três explicações rivais para a mesma correlação e um teste para diferenciá-las."),
    unit("falacias", "Prática", "Falácias e vieses sem caça-rótulos", "Use falácias para diagnosticar relações quebradas, não para encerrar conversas.", "Nomear um viés não substitui mostrar como ele altera a inferência.", ["Relevância, ambiguidade e pressuposição", "Generalização e falsa causa", "Vieses cognitivos e motivação", "Debiasing e ambientes de decisão"], "Identifique uma falha em seu próprio argumento e reconstrua-o sem o salto lógico."),
    unit("fontes", "Integração", "Fontes, mídia, números e propaganda", "Avalie procedência, incentivos, métodos e apresentação de evidências.", "Credibilidade é graduada e deve ser rastreada até a evidência primária.", ["Fonte primária e secundária", "Gráficos, denominadores e enquadramento", "Conflitos de interesse", "Desinformação, propaganda e verificação"], "Rastreie uma notícia até a fonte original e registre o que se perdeu em cada camada."),
    unit("debate", "Integração", "Desacordo produtivo e mudança de ideia", "Aprenda a testar posições sem transformar divergência em identidade.", "Desacordo melhora o pensamento quando critérios de revisão são declarados antes.", ["Steelman e princípio de caridade", "Perguntas socráticas", "Dupla crux e previsões", "Humildade epistêmica e atualização"], "Escreva o que mudaria sua opinião e peça ao outro lado o mesmo critério."),
    unit("decisao", "Avançado", "Decisão sob incerteza e síntese", "Converta evidência imperfeita em escolhas revisáveis.", "Decidir bem é comparar consequências, probabilidades, valores e custo de esperar.", ["Árvores de decisão", "Valor esperado e utilidade", "Opções reversíveis e valor da informação", "Pré-mortem, portfólio e revisão"], "Faça um pré-mortem de uma decisão real e defina indicadores que justificariam revisá-la."),
  ],
  neurociencia: [
    unit("organizacao", "Base", "Mapa do sistema nervoso", "Localize níveis do neurônio ao comportamento antes de atribuir funções.", "Explicações neurais precisam ligar escala celular, circuito, corpo e ambiente.", ["Sistema central e periférico", "Encéfalo, medula e nervos", "Níveis de análise", "Métodos e limites de localização"], "Desenhe a cadeia de um estímulo até uma resposta e marque onde a evidência é indireta."),
    unit("neuronios", "Fundamento", "Neurônios, potenciais e sinapses", "Construa o mecanismo básico de comunicação elétrica e química.", "Sinais neurais dependem de gradientes, membranas e mudança de probabilidade na rede.", ["Membrana e potencial de repouso", "Potencial de ação", "Sinapses e neurotransmissores", "Excitação, inibição e plasticidade"], "Explique uma sinapse sem tratá-la como simples fio elétrico."),
    unit("circuitos", "Fundamento", "Circuitos, redes e desenvolvimento", "Passe de células isoladas para populações dinâmicas.", "Função emerge de padrões distribuídos, recorrentes e adaptativos.", ["Codificação neural", "Circuitos feedforward e feedback", "Desenvolvimento e poda", "Plasticidade e períodos críticos"], "Compare duas formas de codificar intensidade em uma população de neurônios."),
    unit("sensacao", "Modelo", "Sensação e percepção", "Entenda como o cérebro infere o mundo a partir de sinais incompletos.", "Percepção é construção guiada por evidência sensorial e expectativas.", ["Transdução sensorial", "Visão, audição e somatossensação", "Integração multissensorial", "Ilusões e inferência perceptiva"], "Use uma ilusão para separar estímulo físico de experiência perceptiva."),
    unit("acao", "Modelo", "Movimento, corpo e ação", "Conecte intenção, planejamento, controle e feedback corporal.", "Movimento é controle preditivo corrigido continuamente por erro sensorial.", ["Córtex motor e vias", "Cerebelo e gânglios da base", "Propriocepção e feedback", "Hábitos e aprendizagem motora"], "Decomponha uma habilidade motora em previsão, comando, sensação e correção."),
    unit("atencao", "Prática", "Atenção e controle executivo", "Veja como seleção, memória de trabalho e metas competem por recursos.", "Atenção prioriza processamento; não é um reservatório único e ilimitado.", ["Orientação e seleção", "Memória de trabalho", "Inibição e flexibilidade", "Multitarefa, fadiga e ambiente"], "Redesenhe uma sessão de estudo reduzindo alternância, pistas e custo de retomada."),
    unit("memoria", "Prática", "Aprendizagem e sistemas de memória", "Diferencie codificação, consolidação, recuperação e esquecimento.", "Memória é reconstrução dependente de pistas, prática e atualização.", ["Memória episódica, semântica e procedural", "Hipocampo e consolidação", "Recuperação, espaçamento e interleaving", "Reconsolidação e falsas memórias"], "Converta uma releitura em plano de recuperação espaçada com feedback."),
    unit("emocao", "Integração", "Emoção, motivação e decisão", "Integre corpo, valor, aprendizagem e contexto social.", "Emoções organizam prioridades e ação; não são o oposto da razão.", ["Valência, arousal e interocepção", "Recompensa e previsão de erro", "Estresse e regulação", "Decisão social e motivação"], "Analise uma decisão separando recompensa esperada, estado corporal e contexto."),
    unit("sono", "Integração", "Sono, saúde e plasticidade", "Conecte ritmos, estados cerebrais, memória e desempenho.", "Plasticidade depende de ciclos de atividade, repouso e regulação corporal.", ["Ritmos circadianos", "Estágios e arquitetura do sono", "Sono, memória e emoção", "Exercício, nutrição e limites de evidência"], "Registre uma semana de sono e formule uma hipótese testável sem confundir correlação com causa."),
    unit("consciencia", "Avançado", "Linguagem, consciência e fronteiras", "Examine teorias e limites sem transformar neuroimagem em resposta final.", "Correlato neural não é automaticamente mecanismo nem explicação completa.", ["Linguagem e lateralização", "Consciência e acesso", "Livre-arbítrio e agência", "Neuroética, interfaces e neuromitos"], "Compare duas teorias de consciência indicando previsão, evidência e ponto ainda não resolvido."),
  ],
  economia: [
    unit("escassez", "Base", "Escassez, escolha e custo de oportunidade", "Comece pelo problema universal de fins concorrentes e recursos limitados.", "Toda escolha relevante desloca recursos e renuncia a uma alternativa.", ["Escassez e trade-offs", "Custo de oportunidade", "Análise marginal", "Fronteira de possibilidades"], "Calcule o custo de oportunidade de uma hora, incluindo a melhor alternativa abandonada."),
    unit("oferta-demanda", "Fundamento", "Oferta, demanda e preços", "Entenda preços como sinais emergentes de planos descentralizados.", "Preço coordena escassez relativa, mas não mede sozinho valor social ou justiça.", ["Curvas e deslocamentos", "Equilíbrio e excedentes", "Elasticidade", "Controles de preço e incidência"], "Preveja efeitos de primeira e segunda ordem de um teto de preço, explicitando suposições."),
    unit("firmas", "Fundamento", "Firmas, custos e estruturas de mercado", "Veja como tecnologia, custos e competição moldam produção.", "Estrutura de custos e poder de mercado alteram quantidade, preço e inovação.", ["Custos fixos, variáveis e marginais", "Concorrência e monopólio", "Oligopólio e estratégia", "Externalidades e bens públicos"], "Compare duas empresas pelo custo marginal e pela barreira de entrada que enfrentam."),
    unit("macroeconomia", "Modelo", "Produção, renda, emprego e ciclos", "Passe de agentes individuais para agregados e flutuações.", "Contabilidade macroeconômica organiza fluxos; não explica sozinha suas causas.", ["PIB, renda e limitações", "Desemprego e produtividade", "Poupança, investimento e juros", "Ciclos, demanda e oferta agregada"], "Explique por que PIB pode subir sem melhorar igualmente o bem-estar de todos."),
    unit("moeda", "Modelo", "Moeda, bancos, inflação e política monetária", "Entenda criação de moeda, crédito, juros e nível de preços.", "Inflação persistente envolve interação entre moeda, capacidade produtiva, expectativas e instituições.", ["Funções da moeda", "Bancos, crédito e risco", "Inflação e índices", "Banco central e transmissão monetária"], "Rastreie como uma mudança de juros pode afetar crédito, câmbio, investimento e preços."),
    unit("governo", "Prática", "Estado, impostos e política fiscal", "Analise arrecadação, gasto, dívida e desenho de políticas.", "Política pública redistribui recursos e incentivos; seu custo inclui efeitos indiretos.", ["Tributos e incidência", "Gasto, multiplicadores e estabilização", "Dívida e sustentabilidade", "Custo-benefício e desenho institucional"], "Avalie uma política com beneficiários, pagadores, incentivos, capacidade administrativa e alternativa."),
    unit("trabalho", "Prática", "Trabalho, salários e desigualdade", "Conecte produtividade, barganha, instituições e oportunidades.", "Renda resulta de produtividade, poder, patrimônio, regras e contingência histórica.", ["Oferta e demanda de trabalho", "Capital humano e sinalização", "Discriminação e segmentação", "Distribuição, mobilidade e pobreza"], "Compare duas explicações para uma diferença salarial e proponha dados que as distingam."),
    unit("comercio", "Integração", "Comércio, câmbio e economia internacional", "Entenda especialização, ganhos, conflitos distributivos e fluxos globais.", "Vantagem comparativa cria ganhos potenciais, não garante sua distribuição.", ["Vantagem absoluta e comparativa", "Tarifas, quotas e cadeias", "Câmbio e balanço de pagamentos", "Crises e coordenação internacional"], "Calcule um exemplo de vantagem comparativa e identifique quem pode perder na transição."),
    unit("desenvolvimento", "Integração", "Crescimento, instituições e desenvolvimento", "Investigue por que produtividade e prosperidade divergem entre sociedades.", "Tecnologia, capital, instituições e confiança se reforçam ou bloqueiam mutuamente.", ["Produtividade e crescimento", "Instituições e direitos", "Demografia, educação e saúde", "Geografia, história e dependência de trajetória"], "Compare duas teorias de desenvolvimento e escreva uma previsão diferente para cada uma."),
    unit("comportamental", "Avançado", "Comportamento, informação e desenho de mecanismos", "Integre vieses, incentivos estratégicos e informação assimétrica.", "Modelos econômicos são ferramentas condicionais; comportamento e instituições definem seus limites.", ["Heurísticas e nudges", "Seleção adversa e risco moral", "Teoria dos jogos", "Leilões, mecanismos e economia política"], "Redesenhe uma regra para reduzir oportunismo sem criar um incentivo perverso maior."),
  ],
  quimica: [
    unit("materia-medida", "Base", "Matéria, medidas e linguagem química", "Aprenda a observar propriedades e registrar quantidades com segurança.", "Química conecta fenômenos macroscópicos a modelos de partículas e símbolos.", ["Matéria, substância e mistura", "Unidades, algarismos e incerteza", "Separação e propriedades", "Segurança, evidência e caderno de laboratório"], "Classifique materiais cotidianos e proponha como separar uma mistura sem alterar suas substâncias."),
    unit("atomos", "Fundamento", "Átomos, isótopos e estrutura eletrônica", "Construa o modelo nuclear e a organização dos elétrons.", "O número de prótons define o elemento; elétrons determinam grande parte de sua química.", ["Prótons, nêutrons e elétrons", "Número atômico, massa e isótopos", "Orbitais e configuração eletrônica", "Íons e espectros"], "Determine partículas e configuração de três átomos ou íons e explique cada passo."),
    unit("periodicidade", "Fundamento", "Tabela periódica e tendências", "Use posição e estrutura eletrônica para prever propriedades.", "Periodicidade emerge da repetição de configurações de valência.", ["Grupos, períodos e blocos", "Raio e energia de ionização", "Eletronegatividade e afinidade", "Metais, ametais e reatividade"], "Preveja e justifique a ordem de raio e reatividade de quatro elementos."),
    unit("ligacoes", "Modelo", "Ligações, Lewis e geometria molecular", "Passe de elétrons de valência para forma e polaridade.", "Ligações redistribuem densidade eletrônica e restringem geometria.", ["Iônica, covalente e metálica", "Estruturas de Lewis e carga formal", "Ressonância e VSEPR", "Polaridade e orbitais"], "Desenhe Lewis, geometria e polaridade de três moléculas e confronte a previsão com propriedades."),
    unit("intermoleculares", "Modelo", "Forças intermoleculares e estados da matéria", "Relacione interações microscópicas a ebulição, solubilidade e materiais.", "Mudanças de estado alteram organização e interação, não a identidade molecular.", ["Dispersão, dipolo e hidrogênio", "Sólidos, líquidos e gases", "Diagramas de fase", "Soluções e solubilidade"], "Ordene substâncias por ponto de ebulição explicando a interação dominante."),
    unit("mol", "Prática", "Mol, equações e estequiometria", "Conecte partículas invisíveis a massas mensuráveis.", "Coeficientes de uma equação balanceada expressam proporções de conservação.", ["Mol e massa molar", "Fórmulas e composição", "Balanceamento", "Reagente limitante, rendimento e pureza"], "Resolva uma síntese completa passando de massa a mol, proporção, limitante e rendimento."),
    unit("termoquimica", "Prática", "Energia, termoquímica e espontaneidade", "Acompanhe calor, trabalho, entalpia, entropia e energia livre.", "Conservar energia não diz sozinho se uma transformação é espontânea.", ["Calor, trabalho e primeira lei", "Entalpia e calorimetria", "Entropia e microestados", "Energia livre e acoplamento"], "Monte um ciclo de Hess e interprete o sinal de cada termo fisicamente."),
    unit("cinetica", "Integração", "Cinética e mecanismos", "Explique velocidade por colisões, barreiras e caminhos de reação.", "Velocidade depende do mecanismo e da barreira, não apenas do balanço energético final.", ["Lei de velocidade", "Ordem e meia-vida", "Energia de ativação", "Mecanismos, catalisadores e etapa lenta"], "Use dados simulados para inferir a ordem de uma reação e propor um mecanismo compatível."),
    unit("equilibrio", "Integração", "Equilíbrio químico", "Entenda equilíbrio dinâmico e resposta a perturbações.", "No equilíbrio, velocidades opostas se igualam; as concentrações não precisam ser iguais.", ["Constante e quociente", "Le Châtelier", "Equilíbrios gasosos e solubilidade", "Aproximações e cálculo"], "Calcule a direção de evolução com Q e depois estime a composição de equilíbrio."),
    unit("acido-base", "Integração", "Ácidos, bases, tampões e solubilidade", "Passe de prótons e elétrons a pH e controle químico.", "Força, concentração e capacidade são ideias distintas.", ["Arrhenius, Brønsted e Lewis", "pH, Ka, Kb e titulação", "Tampões", "Produto de solubilidade"], "Projete um tampão simples e explique como ele responde a ácido e base adicionados."),
    unit("redox-organica", "Avançado", "Redox, eletroquímica e química orgânica", "Integre transferência de elétrons, energia elétrica e estruturas de carbono.", "Reatividade orgânica e eletroquímica pode ser prevista por distribuição eletrônica e energia.", ["Oxidação, redução e balanceamento", "Pilhas, eletrólise e potenciais", "Grupos funcionais e nomenclatura", "Mecanismos, polímeros e biomoléculas"], "Compare uma pilha e uma eletrólise e mapeie o fluxo de elétrons, íons e energia."),
    unit("quimica-aplicada", "Avançado", "Química ambiental, materiais e investigação", "Use o repertório para problemas reais com múltiplas escalas.", "Aplicar química exige balanço de massa, energia, risco e ciclo de vida.", ["Atmosfera, água e ciclos", "Materiais e nanotecnologia", "Análise instrumental", "Química verde, toxicologia e risco"], "Faça o balanço de ciclo de vida de um material e proponha uma melhoria química mensurável."),
  ],
  programacao: [
    unit("cpp-fundamentos", "Base", "C++: sintaxe, tipos e controle", "Construa a base da linguagem entendendo compilação, memória e fluxo.", "C++ torna explícito o custo das abstrações e o ciclo de vida dos dados.", ["Compilador, linker e programa mínimo", "Tipos, expressões e conversões", "Condições, laços e funções", "Entrada, saída e depuração"], "Implemente um simulador de caixa eletrônico, teste entradas inválidas e explique o caminho da compilação à execução."),
    unit("cpp-memoria", "Fundamento", "C++: memória, referências e RAII", "Aprenda a controlar recursos sem criar vazamentos ou referências inválidas.", "Todo recurso precisa de um dono e de um ciclo de vida explícito.", ["Stack, heap e tempo de vida", "Ponteiros, referências e const", "Construtores, destrutores e RAII", "Smart pointers e segurança"], "Modele um recurso com aquisição e liberação automáticas e demonstre por teste que ele não vaza."),
    unit("cpp-abstracoes", "Modelo", "C++: objetos, templates e STL", "Use abstrações expressivas preservando correção e desempenho.", "Uma abstração é boa quando reduz carga mental sem esconder custos importantes.", ["Classes, composição e interfaces", "Templates e programação genérica", "Containers, iteradores e algoritmos", "Exceções, invariantes e testes"], "Construa uma pequena biblioteca genérica e compare duas estruturas da STL pelas operações dominantes."),
    unit("cpp-sistemas", "Avançado", "C++: algoritmos, concorrência e sistemas", "Integre estruturas de dados, desempenho, build e concorrência em um projeto real.", "Otimizar exige medir o gargalo e preservar primeiro a correção.", ["Complexidade, cache e profiling", "Threads, sincronização e atomics", "CMake, testes e análise estática", "Projeto de sistema e benchmark"], "Entregue um indexador concorrente com benchmark, testes, análise de memória e relatório de trade-offs."),

    unit("python-fundamentos", "Base", "Python: lógica, dados e funções", "Aprenda a expressar algoritmos com clareza antes de usar bibliotecas complexas.", "Código legível torna o modelo mental do problema verificável.", ["Tipos, expressões e entrada/saída", "Condições, laços e compreensão", "Funções, escopo e módulos", "Erros, exceções e depuração"], "Crie um analisador de despesas com validação, funções pequenas e casos de teste."),
    unit("python-modelagem", "Fundamento", "Python: coleções, objetos e tipos", "Modele dados e comportamento com estruturas adequadas e contratos claros.", "A estrutura escolhida determina quais operações ficam simples e seguras.", ["Listas, dicionários e conjuntos", "Dataclasses e orientação a objetos", "Iteradores, geradores e contexto", "Type hints, protocolos e documentação"], "Modele uma biblioteca com empréstimos, invariantes, tipagem e documentação executável."),
    unit("python-dados", "Aplicação", "Python: arquivos, SQL e análise de dados", "Transforme dados brutos em informação rastreável e reproduzível.", "Uma análise é confiável quando origem, transformação e incerteza podem ser auditadas.", ["Arquivos, CSV e JSON", "SQL, modelagem e transações", "NumPy, pandas e visualização", "Limpeza, validação e reprodutibilidade"], "Construa um pipeline que importa, valida, persiste e resume um conjunto de dados real."),
    unit("python-producao", "Avançado", "Python: APIs, assíncrono e produção", "Passe do script local a um serviço observável, testado e empacotado.", "Software em produção precisa falhar de forma previsível e diagnosticável.", ["HTTP, APIs e serialização", "Async, filas e concorrência", "Pytest, integração e cobertura", "Empacotamento, logs, segurança e deploy"], "Publique uma API pequena com testes, autenticação, logs estruturados e plano de recuperação."),

    unit("html-documento", "Base", "HTML: documento e semântica", "Estruture conteúdo pela função de cada elemento, não por sua aparência.", "Semântica correta comunica significado a pessoas, navegadores e máquinas.", ["Estrutura do documento e metadados", "Títulos, parágrafos e listas", "Landmarks e elementos semânticos", "Validação e inspeção do DOM"], "Recrie uma página de artigo usando apenas HTML semântico e valide o documento."),
    unit("html-conteudo", "Fundamento", "HTML: links, mídia e dados tabulares", "Organize navegação, imagens, áudio, vídeo e tabelas de modo acessível.", "Conteúdo alternativo preserva a intenção quando uma modalidade não está disponível.", ["Links, URLs e navegação", "Imagens responsivas e figuras", "Áudio, vídeo e legendas", "Tabelas, cabeçalhos e escopo"], "Monte uma matéria multimídia navegável por teclado e compreensível sem imagens."),
    unit("html-formularios", "Aplicação", "HTML: formulários e validação", "Colete dados com controles adequados, instruções claras e validação progressiva.", "Um formulário é um contrato entre intenção humana e estrutura de dados.", ["Labels, inputs e agrupamentos", "Tipos, atributos e validação nativa", "Mensagens de erro e acessibilidade", "Envio, segurança e privacidade"], "Crie um cadastro completo, teste teclado e leitor de tela e documente riscos de dados."),
    unit("html-acessibilidade", "Avançado", "HTML: acessibilidade, SEO e dados estruturados", "Faça o documento funcionar para diferentes agentes, dispositivos e contextos.", "Acessibilidade e encontrabilidade começam na estrutura, não em correções posteriores.", ["Árvore de acessibilidade e ARIA", "Metadados sociais e SEO técnico", "Schema.org e dados estruturados", "Auditoria, performance e compatibilidade"], "Audite uma página, corrija sua estrutura e produza um relatório de acessibilidade e SEO."),

    unit("css-fundamentos", "Base", "CSS: cascata, seletores e box model", "Entenda como regras competem e como cada caixa ocupa espaço.", "A cascata é um algoritmo de decisão; previsibilidade vem de compreender suas prioridades.", ["Seletores, herança e especificidade", "Unidades, cores e tipografia", "Box model, overflow e display", "DevTools e depuração visual"], "Reproduza um cartão sem copiar valores cegamente e explique cada dimensão no box model."),
    unit("css-layout", "Fundamento", "CSS: layout com Flexbox e Grid", "Construa relações espaciais robustas sem posicionamento frágil.", "Escolha o algoritmo de layout pela relação entre os elementos, não pelo desenho isolado.", ["Fluxo normal e posicionamento", "Flexbox e alinhamento unidimensional", "Grid e layout bidimensional", "Subgrid, camadas e composição"], "Implemente o mesmo painel com Flexbox e Grid e compare onde cada modelo é mais claro."),
    unit("css-responsivo", "Aplicação", "CSS: interfaces responsivas", "Projete componentes que se adaptem ao conteúdo, ao espaço e às preferências do usuário.", "Responsividade é comportamento contínuo, não uma coleção de larguras de aparelhos.", ["Design fluido e funções CSS", "Media e container queries", "Imagens, tipografia e densidade", "Preferências, toque e acessibilidade"], "Crie uma página funcional de 320 px a telas largas, com zoom de 200% e navegação por toque."),
    unit("css-sistemas", "Avançado", "CSS: sistemas de design e performance", "Transforme decisões visuais em tokens, componentes e regras reutilizáveis.", "Consistência sustentável nasce de restrições explícitas e composição.", ["Custom properties e tokens", "Arquitetura, escopo e cascade layers", "Animação, movimento e estados", "Performance, manutenção e regressão visual"], "Construa um mini design system com temas, cinco componentes e testes de regressão visual."),

    unit("js-fundamentos", "Base", "JavaScript: valores, controle e funções", "Compreenda execução, tipos e transformação de estado antes de usar frameworks.", "JavaScript executa modelos de estado; bugs surgem quando transições ficam implícitas.", ["Tipos, coerção e igualdade", "Controle, funções e escopo", "Arrays, objetos e imutabilidade", "Erros, módulos e depuração"], "Implemente um gerenciador de tarefas sem framework e teste as funções de domínio separadamente."),
    unit("js-navegador", "Fundamento", "JavaScript: DOM, eventos e formulários", "Conecte estado, interface e interação com APIs nativas do navegador.", "A interface é uma projeção do estado e os eventos são pedidos de transição.", ["DOM, seleção e atualização", "Eventos, propagação e delegação", "Formulários, validação e acessibilidade", "Storage, URL e histórico"], "Crie uma interface acessível com filtros, persistência local e navegação sem recarregar."),
    unit("js-assincrono", "Aplicação", "JavaScript: assíncrono, rede e módulos", "Coordene operações que terminam em momentos diferentes e podem falhar parcialmente.", "Assincronicidade exige estados explícitos de espera, sucesso, vazio e erro.", ["Event loop e tarefas", "Promises e async/await", "Fetch, HTTP e cancelamento", "Módulos, bundling e dependências"], "Consuma uma API com cancelamento, retry controlado, cache e todos os estados de interface."),
    unit("js-producao", "Avançado", "JavaScript: arquitetura, testes e segurança", "Organize uma aplicação evolutiva com fronteiras, ferramentas e proteção contra entradas hostis.", "Arquitetura de frontend é gestão explícita de estado, efeitos, dependências e confiança.", ["Componentes, estado e padrões", "Testes unitários, DOM e ponta a ponta", "Performance, profiling e Web Vitals", "XSS, CSP, dependências e entrega"], "Entregue uma aplicação modular com testes, orçamento de performance, threat model e documentação."),
  ],
};

const areasByTrack: Record<string, Record<string, string>> = {
  matematica: {
    numeros: "Fundamentos", algebra: "Álgebra e funções", funcoes: "Álgebra e funções", geometria: "Geometria e trigonometria",
    "algebra-linear": "Álgebra linear", derivadas: "Cálculo", integrais: "Cálculo", probabilidade: "Probabilidade e estatística",
    estatistica: "Probabilidade e estatística", modelagem: "Modelagem",
  },
  ia: {
    "computacao-dados": "Fundamentos", busca: "Fundamentos", "base-matematica": "Matemática para IA", "machine-learning": "Machine learning",
    avaliacao: "Machine learning", redes: "Deep learning", arquiteturas: "Deep learning", llms: "IA generativa", producao: "Engenharia e segurança",
    fronteiras: "Engenharia e segurança",
  },
  ciencia: {
    "observacao-medida": "Método científico", hipoteses: "Método científico", experimentos: "Experimentos", erro: "Experimentos",
    dados: "Evidência e causalidade", causalidade: "Evidência e causalidade", modelos: "Modelagem", comunidade: "Ciência aberta",
    "fronteira-ciencia": "Ciência aberta",
  },
  biologia: {
    "quimica-vida": "Bioquímica e célula", celula: "Bioquímica e célula", metabolismo: "Bioquímica e célula", genetica: "Genética e evolução",
    evolucao: "Genética e evolução", desenvolvimento: "Organismos", fisiologia: "Organismos", imunologia: "Organismos", ecologia: "Ecologia",
    biotecnologia: "Biotecnologia",
  },
  "pensamento-critico": {
    clareza: "Clareza e lógica", argumentos: "Clareza e lógica", deducao: "Clareza e lógica", inducao: "Inferência",
    probabilidade: "Inferência", "causalidade-critica": "Inferência", falacias: "Falácias e fontes", fontes: "Falácias e fontes",
    debate: "Diálogo e decisão", decisao: "Diálogo e decisão",
  },
  neurociencia: {
    organizacao: "Células e circuitos", neuronios: "Células e circuitos", circuitos: "Células e circuitos", sensacao: "Percepção e ação",
    acao: "Percepção e ação", atencao: "Cognição", memoria: "Cognição", emocao: "Emoção e estados", sono: "Emoção e estados",
    consciencia: "Emoção e estados",
  },
  economia: {
    escassez: "Microeconomia", "oferta-demanda": "Microeconomia", firmas: "Microeconomia", macroeconomia: "Macroeconomia",
    moeda: "Macroeconomia", governo: "Macroeconomia", trabalho: "Trabalho e comércio", comercio: "Trabalho e comércio",
    desenvolvimento: "Desenvolvimento", comportamental: "Economia comportamental",
  },
  quimica: {
    "materia-medida": "Fundamentos", atomos: "Fundamentos", periodicidade: "Fundamentos", ligacoes: "Estrutura e ligações",
    intermoleculares: "Estrutura e ligações", mol: "Quantidade e energia", termoquimica: "Quantidade e energia", cinetica: "Cinética e equilíbrio",
    equilibrio: "Cinética e equilíbrio", "acido-base": "Cinética e equilíbrio", "redox-organica": "Orgânica e eletroquímica",
    "quimica-aplicada": "Aplicações",
  },
  programacao: {
    "cpp-fundamentos": "C++", "cpp-memoria": "C++", "cpp-abstracoes": "C++", "cpp-sistemas": "C++",
    "python-fundamentos": "Python", "python-modelagem": "Python", "python-dados": "Python", "python-producao": "Python",
    "html-documento": "HTML", "html-conteudo": "HTML", "html-formularios": "HTML", "html-acessibilidade": "HTML",
    "css-fundamentos": "CSS", "css-layout": "CSS", "css-responsivo": "CSS", "css-sistemas": "CSS",
    "js-fundamentos": "JavaScript", "js-navegador": "JavaScript", "js-assincrono": "JavaScript", "js-producao": "JavaScript",
  },
};

const studyHoursByTrack: Record<string, number> = {
  matematica: 120, ia: 120, ciencia: 90, biologia: 150, "pensamento-critico": 90,
  neurociencia: 120, economia: 100, quimica: 150, programacao: 220,
};

const institutionalResourcesByTrack: Record<string, StudyResource[]> = {
  matematica: [
    { institution: "MIT OpenCourseWare", title: "18.01SC · Single Variable Calculus", description: "Curso independente com aulas, notas, problemas, soluções e provas.", url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/", kind: "Curso completo", level: "Intermediário", language: "en", area: "Cálculo" },
    { institution: "MIT OpenCourseWare", title: "18.06SC · Linear Algebra", description: "Álgebra linear de Gilbert Strang com aulas e exercícios organizados.", url: "https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/", kind: "Aulas e exercícios", level: "Intermediário", language: "en", area: "Álgebra linear" },
  ],
  ia: [
    { institution: "MIT OpenCourseWare", title: "6.034 · Artificial Intelligence", description: "Representação, busca, resolução de problemas e aprendizado em uma disciplina universitária completa.", url: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/", kind: "Curso completo", level: "Intermediário", language: "en" },
    { institution: "Harvard", title: "CS50's Introduction to AI with Python", description: "Projetos em busca, conhecimento, incerteza, otimização, aprendizado e linguagem.", url: "https://cs50.harvard.edu/ai/", kind: "Curso completo", level: "Intermediário", language: "en", area: "Fundamentos" },
  ],
  ciencia: [
    { institution: "MIT OpenCourseWare", title: "8.01SC · Classical Mechanics", description: "Ciência quantitativa por modelos, experimentos, resolução de problemas e avaliações.", url: "https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/", kind: "Curso completo", level: "Intermediário", language: "en", area: "Modelagem" },
  ],
  biologia: [
    { institution: "MIT OpenCourseWare", title: "7.01SC · Fundamentals of Biology", description: "Bioquímica, biologia molecular, genética e DNA recombinante com problemas, quizzes e provas.", url: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/", kind: "Curso completo", level: "Base", language: "en" },
  ],
  "pensamento-critico": [
    { institution: "Open Yale Courses", title: "PLSC 114 · Introduction to Political Philosophy", description: "Leitura e discussão rigorosa de Platão, Aristóteles, Maquiavel, Hobbes, Locke, Rousseau e Tocqueville.", url: "https://oyc.yale.edu/political-science/plsc-114", kind: "Curso completo", level: "Intermediário", language: "en", area: "Diálogo e decisão" },
    { institution: "Open Yale Courses", title: "PHIL 176 · Death", description: "Curso de argumentação filosófica sobre pessoa, identidade, valor, mortalidade e decisão.", url: "https://oyc.yale.edu/death/phil-176", kind: "Curso completo", level: "Intermediário", language: "en", area: "Clareza e lógica" },
  ],
  neurociencia: [
    { institution: "MIT OpenCourseWare", title: "9.01 · Introduction to Neuroscience", description: "Do neurônio a sistemas sensoriais, movimento, memória, emoção e doenças do cérebro.", url: "https://ocw.mit.edu/courses/9-01-introduction-to-neuroscience-fall-2007/", kind: "Aulas e exercícios", level: "Intermediário", language: "en" },
    { institution: "Open Yale Courses", title: "PSYC 110 · Introduction to Psychology", description: "Panorama científico da mente, aprendizagem, memória, decisão, relações e comportamento.", url: "https://oyc.yale.edu/introduction-psychology/psyc-110", kind: "Curso completo", level: "Base", language: "en", area: "Cognição" },
  ],
  economia: [
    { institution: "MIT OpenCourseWare", title: "14.01 · Principles of Microeconomics", description: "Oferta, demanda, firmas, competição, bem-estar, bens públicos e externalidades.", url: "https://ocw.mit.edu/courses/14-01-principles-of-microeconomics-fall-2023/", kind: "Aulas e exercícios", level: "Base", language: "en", area: "Microeconomia" },
  ],
  quimica: [
    { institution: "MIT OpenCourseWare", title: "5.111SC · Principles of Chemical Science", description: "Estrutura eletrônica, ligações, termodinâmica, equilíbrio, redox, cinética e catálise em 35 aulas.", url: "https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/", kind: "Curso completo", level: "Base", language: "en" },
  ],
  programacao: [
    { institution: "Harvard", title: "CS50x · Introduction to Computer Science", description: "Fundamentos, algoritmos, memória, estruturas, Python, SQL e web com problem sets e projeto final.", url: "https://cs50.harvard.edu/x/", kind: "Curso completo", level: "Base", language: "en" },
    { institution: "MIT OpenCourseWare", title: "6.096 · Introduction to C++", description: "C++ em ritmo universitário com notas de aula e tarefas de programação.", url: "https://ocw.mit.edu/courses/6-096-introduction-to-c-january-iap-2011/", kind: "Aulas e exercícios", level: "Base", language: "en", area: "C++" },
    { institution: "Stanford", title: "CS106B · Programming Abstractions", description: "C++, recursão, análise de algoritmos, abstração e estruturas de dados.", url: "https://web.stanford.edu/class/cs106b/", kind: "Curso completo", level: "Avançado", language: "en", area: "C++" },
    { institution: "MIT OpenCourseWare", title: "6.0001 · Computer Science and Programming in Python", description: "Python para resolver problemas, com vídeos, código, questões e tarefas.", url: "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/", kind: "Curso completo", level: "Base", language: "en", area: "Python" },
    { institution: "Mozilla Developer Network", title: "MDN Curriculum · Web standards", description: "Currículo oficial e progressivo de HTML, CSS, acessibilidade e JavaScript para a web.", url: "https://developer.mozilla.org/en-US/curriculum/", kind: "Referência", level: "Base", language: "en", area: "HTML" },
    { institution: "Mozilla Developer Network", title: "MDN Curriculum · CSS", description: "Cascata, layout, responsividade, acessibilidade e práticas modernas de CSS.", url: "https://developer.mozilla.org/en-US/curriculum/", kind: "Referência", level: "Intermediário", language: "en", area: "CSS" },
    { institution: "Mozilla Developer Network", title: "MDN Curriculum · JavaScript", description: "Fundamentos da linguagem, APIs do navegador, assíncrono e aplicações web.", url: "https://developer.mozilla.org/en-US/curriculum/", kind: "Referência", level: "Intermediário", language: "en", area: "JavaScript" },
  ],
};

const programmingVideos: Record<string, Record<StudyLanguage, StudyVideo>> = {
  "C++": {
    pt: { id: "nUQKr-ey86Y", title: "Curso de C++ · introdução", channel: "CFB Cursos", language: "pt" },
    en: { id: "vLnPwxZdW4Y", title: "C++ Tutorial for Beginners · Full Course", channel: "freeCodeCamp.org", language: "en" },
  },
  Python: {
    pt: { id: "S9uPNppGsGo", title: "Curso Python #01 · Seja um Programador", channel: "Curso em Vídeo", language: "pt" },
    en: { id: "rfscVS0vtbw", title: "Learn Python · Full Course for Beginners", channel: "freeCodeCamp.org", language: "en" },
  },
  HTML: {
    pt: { id: "Ejkb_YpuHWs", title: "Curso HTML5 e CSS3 · módulo 1", channel: "Curso em Vídeo", language: "pt" },
    en: { id: "pQN-pnXPaVg", title: "HTML Full Course · Build a Website Tutorial", channel: "freeCodeCamp.org", language: "en" },
  },
  CSS: {
    pt: { id: "Ejkb_YpuHWs", title: "Curso HTML5 e CSS3 · módulo 1", channel: "Curso em Vídeo", language: "pt" },
    en: { id: "OXGznpKZ_sA", title: "CSS Tutorial · Full Course for Beginners", channel: "freeCodeCamp.org", language: "en" },
  },
  JavaScript: {
    pt: { id: "Ptbk2af68e8", title: "Curso JavaScript #01 · o que faz o JavaScript?", channel: "Curso em Vídeo", language: "pt" },
    en: { id: "PkZNo7MFNFg", title: "Learn JavaScript · Full Course for Beginners", channel: "freeCodeCamp.org", language: "en" },
  },
};

export const studyMethod = [
  { name: "Musk · primeiros princípios", prompt: "Quebre o problema até fatos e restrições que você consegue justificar; reconstrua a solução sem depender de analogias." },
  { name: "Jobs · foco e simplicidade", prompt: "Escolha a pergunta central, remova o que não contribui para compreendê-la e torne a ideia clara o bastante para ser comunicada." },
  { name: "Gates · amplitude conectada", prompt: "Leia fontes completas, conecte o tema a outras áreas e registre evidências que confirmam ou desafiam seu modelo mental." },
  { name: "Feynman · explicar para aprender", prompt: "Explique com palavras simples, localize lacunas e volte à fonte até conseguir reconstruir a ideia sem jargão." },
];

export const studyTracks: StudyTrack[] = baseStudyTracks.map((track) => {
  const curriculum = curriculumByTrack[track.id];
  if (!curriculum?.length) return track;
  const lessons = curriculum.map((lesson, index) => {
    const area = areasByTrack[track.id]?.[lesson.id] || lesson.stage;
    return {
      ...lesson,
      area,
      videos: track.id === "programacao" && programmingVideos[area]
        ? programmingVideos[area]
        : track.lessons[index % track.lessons.length].videos,
    };
  });
  return {
    ...track,
    estimatedHours: studyHoursByTrack[track.id] || curriculum.length * 4,
    areas: Array.from(new Set(lessons.map((lesson) => lesson.area))),
    resources: institutionalResourcesByTrack[track.id] || [],
    lessons,
  };
});

const feedCategories: Record<string, string> = {
  matematica: "Ciência", ia: "Ciência", ciencia: "Ciência", biologia: "Ciência",
  neurociencia: "Ciência", quimica: "Ciência", programacao: "Ciência", "pensamento-critico": "Ideias", economia: "Negócios",
};
const feedPalettes: Video["palette"][] = ["blue", "violet", "moss", "coral", "ink", "sand"];
const stageDepth: Record<StudyLesson["stage"], number> = { Base: .56, Fundamento: .68, Modelo: .78, Prática: .84, Aplicação: .88, Integração: .92, Avançado: .97 };

export const studyFeedVideos: Video[] = studyTracks.flatMap((track, trackIndex) => track.lessons.flatMap((lesson, lessonIndex) =>
  ([lesson.videos.pt, lesson.videos.en]).map((video, languageIndex) => ({
    id: `study-${track.id}-${lesson.id}-${video.id}`,
    youtubeId: video.id,
    thumbnailId: video.id,
    embedType: "video" as const,
    category: feedCategories[track.id] || "Ideias",
    title: video.title,
    channel: video.channel,
    topic: track.title.toLowerCase(),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    durationSeconds: 0,
    depth: stageDepth[lesson.stage],
    novelty: .68 + languageIndex * .05,
    quality: .94,
    evergreen: .98,
    publishedLabel: `trilha · ${video.language === "pt" ? "português" : "english"}`,
    palette: feedPalettes[(trackIndex + lessonIndex + languageIndex) % feedPalettes.length],
    mark: "TRILHA",
  })),
));

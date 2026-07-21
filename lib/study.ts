import type { Video } from "./videos";

export type StudyLanguage = "pt" | "en";

export type StudyVideo = {
  id: string;
  title: string;
  channel: string;
  language: StudyLanguage;
};

export type StudyLesson = {
  id: string;
  stage: "Fundamento" | "Modelo" | "Aplicação";
  title: string;
  summary: string;
  principle: string;
  practice: string;
  videos: Record<StudyLanguage, StudyVideo>;
};

export type StudyTrack = {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  outcome: string;
  lessons: StudyLesson[];
};

export const studyTracks: StudyTrack[] = [
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
];

const feedCategories: Record<string, string> = {
  matematica: "Ciência", ia: "Ciência", ciencia: "Ciência", biologia: "Ciência",
  neurociencia: "Ciência", "pensamento-critico": "Ideias", economia: "Negócios",
};
const feedPalettes: Video["palette"][] = ["blue", "violet", "moss", "coral", "ink", "sand"];

export const studyFeedVideos: Video[] = studyTracks.flatMap((track, trackIndex) => track.lessons.flatMap((lesson, lessonIndex) =>
  ([lesson.videos.pt, lesson.videos.en]).map((video, languageIndex) => ({
    id: `study-${track.id}-${video.id}`,
    youtubeId: video.id,
    thumbnailId: video.id,
    embedType: "video" as const,
    category: feedCategories[track.id] || "Ideias",
    title: video.title,
    channel: video.channel,
    topic: track.title.toLowerCase(),
    url: `https://www.youtube.com/watch?v=${video.id}`,
    durationSeconds: 0,
    depth: lesson.stage === "Fundamento" ? .74 : lesson.stage === "Modelo" ? .86 : .93,
    novelty: .68 + languageIndex * .05,
    quality: .94,
    evergreen: .98,
    publishedLabel: `trilha · ${video.language === "pt" ? "português" : "english"}`,
    palette: feedPalettes[(trackIndex + lessonIndex + languageIndex) % feedPalettes.length],
    mark: "TRILHA",
  })),
));

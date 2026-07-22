export type Video = {
  id: string;
  youtubeId: string;
  thumbnailId?: string;
  embedType?: "video" | "playlist";
  publishedAt?: string;
  category: string;
  title: string;
  channel: string;
  topic: string;
  url: string;
  durationSeconds: number;
  depth: number;
  novelty: number;
  quality: number;
  evergreen: number;
  publishedLabel: string;
  palette: "blue" | "coral" | "ink" | "moss" | "violet" | "sand";
  mark: string;
};

const seedVideosRaw: Video[] = [
  { id: "neural-net", youtubeId: "aircAruvnKk", category: "Ciência", title: "Mas o que é, de fato, uma rede neural?", channel: "3Blue1Brown", topic: "matemática", url: "https://www.youtube.com/watch?v=aircAruvnKk", durationSeconds: 1156, depth: .93, novelty: .62, quality: .98, evergreen: .97, publishedLabel: "aula visual", palette: "blue", mark: "∑ → ?" },
  { id: "collatz", youtubeId: "094y1Z2wpJg", category: "Ciência", title: "O problema de matemática mais simples que ninguém resolve", channel: "Veritasium", topic: "curiosidades", url: "https://www.youtube.com/watch?v=094y1Z2wpJg", durationSeconds: 1326, depth: .87, novelty: .8, quality: .95, evergreen: .96, publishedLabel: "ensaio científico", palette: "coral", mark: "3n+1" },
  { id: "egg", youtubeId: "h6fcK_fRYaI", category: "Ideias", title: "O Ovo — uma história sobre humanidade e sentido", channel: "Kurzgesagt", topic: "filosofia", url: "https://www.youtube.com/watch?v=h6fcK_fRYaI", durationSeconds: 474, depth: .7, novelty: .83, quality: .97, evergreen: .99, publishedLabel: "ensaio", palette: "violet", mark: "∞" },
  { id: "stoicism", youtubeId: "R9OCA6UFE-0", category: "Ideias", title: "Uma introdução à filosofia estoica", channel: "Einzelgänger", topic: "filosofia", url: "https://www.youtube.com/watch?v=R9OCA6UFE-0", durationSeconds: 1032, depth: .81, novelty: .6, quality: .89, evergreen: .99, publishedLabel: "fundamentos", palette: "ink", mark: "MEMENTO" },
  { id: "internet", youtubeId: "Dxcc6ycZ73M", category: "Mundo", title: "Como a internet atravessa oceanos inteiros", channel: "Vox", topic: "geopolítica", url: "https://www.youtube.com/watch?v=Dxcc6ycZ73M", durationSeconds: 711, depth: .65, novelty: .7, quality: .88, evergreen: .88, publishedLabel: "infraestrutura global", palette: "moss", mark: "≈ ≈ ≈" },
  { id: "printing", youtubeId: "yeikqw0kyqI", category: "Mundo", title: "Como a prensa mudou o poder das ideias", channel: "TED-Ed", topic: "história", url: "https://www.youtube.com/watch?v=yeikqw0kyqI", durationSeconds: 298, depth: .58, novelty: .68, quality: .91, evergreen: .97, publishedLabel: "história das ideias", palette: "coral", mark: "Aa" },
  { id: "empresa-autogerenciavel", youtubeId: "nqQdtaijxKw", category: "Negócios", title: "Como construir uma empresa autogerenciável", channel: "Podcast EAG", topic: "gestão", url: "https://www.youtube.com/watch?v=nqQdtaijxKw", durationSeconds: 5700, depth: .88, novelty: .76, quality: .9, evergreen: .9, publishedLabel: "aula longa", palette: "blue", mark: "SISTEMA > HERÓI" },
  { id: "celulares-recondicionados", youtubeId: "30-pRrIyALs", category: "Negócios", title: "O modelo de negócio dos celulares recondicionados", channel: "NeoFeed", topic: "negócios", url: "https://www.youtube.com/watch?v=30-pRrIyALs", durationSeconds: 1560, depth: .75, novelty: .9, quality: .88, evergreen: .72, publishedLabel: "estudo de empresa", palette: "sand", mark: "MARGEM × ESCALA" },
  { id: "gateway-lunar", youtubeId: "okVO_zv_9I0", category: "Ciência", title: "Por que a NASA quer uma estação na órbita lunar?", channel: "Olhar Digital", topic: "foguetes", url: "https://www.youtube.com/watch?v=okVO_zv_9I0", durationSeconds: 131, depth: .55, novelty: .96, quality: .86, evergreen: .7, publishedLabel: "astronomia", palette: "violet", mark: "LUA → MARTE" },
  { id: "feynman", youtubeId: "36GT2zI8lVA", category: "Ciência", title: "Richard Feynman e o prazer de descobrir", channel: "BBC Archive", topic: "natureza humana", url: "https://www.youtube.com/watch?v=36GT2zI8lVA", durationSeconds: 2968, depth: .9, novelty: .72, quality: .96, evergreen: 1, publishedLabel: "arquivo", palette: "ink", mark: "WHY?" },
  { id: "scripts-film-booth", youtubeId: "a5438jzwVnQ", category: "Criação", title: "Como escrever roteiros melhores que 99% dos YouTubers", channel: "Film Booth", topic: "roteiro", url: "https://www.youtube.com/watch?v=a5438jzwVnQ", durationSeconds: 0, depth: .86, novelty: .76, quality: .94, evergreen: .96, publishedLabel: "estratégia de roteiro", palette: "coral", mark: "ROTEIRO" },
  { id: "youtube-playbook", youtubeId: "8XSssH3B_Dk", category: "Criação", title: "The YouTube Playbook in 37 Minutes", channel: "Colin and Samir", topic: "estratégia de canal", url: "https://www.youtube.com/watch?v=8XSssH3B_Dk", durationSeconds: 2220, depth: .84, novelty: .82, quality: .94, evergreen: .93, publishedLabel: "manual de criação", palette: "blue", mark: "PLAYBOOK" },
  { id: "youtube-studio-guide", youtubeId: "sVx2Ux_J-fQ", category: "Criação", title: "O guia Conteúdo no YouTube Studio", channel: "YouTube Criadores", topic: "planejamento de canal", url: "https://www.youtube.com/watch?v=sVx2Ux_J-fQ", durationSeconds: 0, depth: .7, novelty: .72, quality: .91, evergreen: .9, publishedLabel: "guia oficial", palette: "moss", mark: "PLANO" },
  { id: "youtube-comments", youtubeId: "6YlPc_B1IZs", category: "Criação", title: "Comentários do YouTube: responder, filtrar e moderar", channel: "YouTube Criadores", topic: "gestão de comunidade", url: "https://www.youtube.com/watch?v=6YlPc_B1IZs", durationSeconds: 0, depth: .64, novelty: .68, quality: .9, evergreen: .88, publishedLabel: "guia oficial", palette: "sand", mark: "COMUNIDADE" },
  { id: "habeas-democracia", youtubeId: "GKhmaU9Simk", category: "Política", title: "Habeas corpus coletivos e sua relação com a democracia", channel: "Nexo Jornal", topic: "instituições", url: "https://www.youtube.com/watch?v=GKhmaU9Simk", durationSeconds: 0, depth: .84, novelty: .68, quality: .93, evergreen: .95, publishedLabel: "instituições", palette: "ink", mark: "DEMOCRACIA" },
  { id: "democracia-mundo", youtubeId: "28Jh_94EjwM", category: "Política", title: "Democracia no Brasil e no mundo: conceitos, avanços e ameaças", channel: "Nexo Jornal", topic: "democracia", url: "https://www.youtube.com/watch?v=28Jh_94EjwM", durationSeconds: 0, depth: .9, novelty: .63, quality: .94, evergreen: .97, publishedLabel: "fundamentos políticos", palette: "violet", mark: "INSTITUIÇÕES" },
  { id: "teoria-do-louco", youtubeId: "knQzUq8QNLc", category: "Política", title: "Como funciona a 'Teoria do Louco' na política", channel: "BBC News Brasil", topic: "estratégia política", url: "https://www.youtube.com/watch?v=knQzUq8QNLc", durationSeconds: 0, depth: .76, novelty: .8, quality: .93, evergreen: .9, publishedLabel: "contexto internacional", palette: "coral", mark: "PODER" },
  { id: "trump-xi", youtubeId: "u1pFwOFX_Oc", category: "Política", title: "Sobre o que conversaram Trump e Xi?", channel: "Petit Journal", topic: "geopolítica", url: "https://www.youtube.com/watch?v=u1pFwOFX_Oc", durationSeconds: 0, depth: .82, novelty: .86, quality: .94, evergreen: .7, publishedLabel: "análise geopolítica", palette: "blue", mark: "DIPLOMACIA" },
  { id: "start-startup", youtubeId: "CBYhVcO4WgI", category: "Negócios", title: "How to Start a Startup", channel: "YC Root Access", topic: "startups", url: "https://www.youtube.com/watch?v=CBYhVcO4WgI", durationSeconds: 0, depth: .91, novelty: .64, quality: .95, evergreen: .98, publishedLabel: "aula de negócios", palette: "ink", mark: "STARTUP" },
  { id: "what-is-strategy", youtubeId: "o7Ik1OB4TaE", category: "Negócios", title: "What Is Strategy? It’s Simpler Than You Think", channel: "Harvard Business Review", topic: "estratégia", url: "https://www.youtube.com/watch?v=o7Ik1OB4TaE", durationSeconds: 0, depth: .82, novelty: .72, quality: .96, evergreen: .97, publishedLabel: "fundamentos de estratégia", palette: "sand", mark: "ESTRATÉGIA" },
  { id: "plan-not-strategy", youtubeId: "iuYlGRnC7J8", category: "Negócios", title: "A Plan Is Not a Strategy", channel: "Harvard Business Review", topic: "gestão", url: "https://www.youtube.com/watch?v=iuYlGRnC7J8", durationSeconds: 0, depth: .84, novelty: .7, quality: .96, evergreen: .98, publishedLabel: "gestão por princípios", palette: "moss", mark: "ESCOLHAS" },
  { id: "startup-finance", youtubeId: "LBC16jhiwak", category: "Negócios", title: "Managing Startup Finances", channel: "Y Combinator", topic: "finanças empresariais", url: "https://www.youtube.com/watch?v=LBC16jhiwak", durationSeconds: 0, depth: .88, novelty: .69, quality: .95, evergreen: .96, publishedLabel: "aula de finanças", palette: "blue", mark: "CAIXA" },
  { id: "storytelling-video", youtubeId: "mUAOaAkAWNU", category: "Criação", title: "How to Use Storytelling to Make Better YouTube Videos", channel: "Film Booth", topic: "storytelling", url: "https://www.youtube.com/watch?v=mUAOaAkAWNU", durationSeconds: 0, depth: .82, novelty: .78, quality: .93, evergreen: .95, publishedLabel: "narrativa aplicada", palette: "violet", mark: "HISTÓRIA" },
  { id: "storytelling-structures", youtubeId: "zSVYfQsHUxU", category: "Criação", title: "Five Storytelling Structures Used by Major Creators", channel: "Creator Talk", topic: "estrutura narrativa", url: "https://www.youtube.com/watch?v=zSVYfQsHUxU", durationSeconds: 0, depth: .8, novelty: .8, quality: .91, evergreen: .94, publishedLabel: "estrutura de roteiro", palette: "coral", mark: "ESTRUTURA" },
  { id: "youtube-algorithms", youtubeId: "dhYIb72L1hU", category: "Criação", title: "The YouTube Algorithms Explained", channel: "Creator Insider", topic: "algoritmo do youtube", url: "https://www.youtube.com/watch?v=dhYIb72L1hU", durationSeconds: 0, depth: .76, novelty: .84, quality: .94, evergreen: .83, publishedLabel: "fonte oficial", palette: "blue", mark: "ALGORITMO" },
  { id: "creator-knowledge", youtubeId: "7MWNGqmukmE", category: "Criação", title: "13 Years of YouTube Knowledge in 46 Minutes", channel: "Colin and Samir", topic: "economia dos criadores", url: "https://www.youtube.com/watch?v=7MWNGqmukmE", durationSeconds: 2760, depth: .87, novelty: .78, quality: .94, evergreen: .92, publishedLabel: "estratégia de criadores", palette: "ink", mark: "13 ANOS" },
  { id: "youtube-analytics", youtubeId: "J1t34uTT0iA", category: "Criação", title: "Analytics in YouTube Studio", channel: "YouTube Creators", topic: "métricas de canal", url: "https://www.youtube.com/watch?v=J1t34uTT0iA", durationSeconds: 0, depth: .68, novelty: .66, quality: .92, evergreen: .9, publishedLabel: "guia oficial", palette: "moss", mark: "MÉTRICAS" },
  { id: "ideologia-paulo", youtubeId: "zZECwWYtmKg", category: "Fé", title: "O que é uma ideologia?", channel: "Padre Paulo Ricardo", topic: "fé e razão", url: "https://www.youtube.com/watch?v=zZECwWYtmKg", durationSeconds: 0, depth: .88, novelty: .62, quality: .96, evergreen: .97, publishedLabel: "formação católica", palette: "ink", mark: "FÉ × IDEIAS" },
  { id: "temperamentos-paulo", youtubeId: "WeM3QSgMbV0", category: "Fé", title: "Os Quatro Temperamentos", channel: "Padre Paulo Ricardo", topic: "natureza humana", url: "https://www.youtube.com/watch?v=WeM3QSgMbV0", durationSeconds: 0, depth: .84, novelty: .65, quality: .96, evergreen: .98, publishedLabel: "natureza humana", palette: "sand", mark: "TEMPERAMENTO" },
  { id: "catecismo-anjos", youtubeId: "brj8wamlS30", category: "Fé", title: "Aula de Catecismo: A Queda dos Anjos", channel: "Padre Paulo Ricardo", topic: "catecismo", url: "https://www.youtube.com/watch?v=brj8wamlS30", durationSeconds: 0, depth: .9, novelty: .6, quality: .96, evergreen: .99, publishedLabel: "aula de catecismo", palette: "violet", mark: "CATECISMO" },
  { id: "origem-biblia", youtubeId: "MZA4Ud7ArEM", category: "Fé", title: "Origem da Bíblia e primeiras escritas", channel: "Frei Gilson", topic: "bíblia", url: "https://www.youtube.com/watch?v=MZA4Ud7ArEM", durationSeconds: 0, depth: .86, novelty: .67, quality: .94, evergreen: .98, publishedLabel: "fundamentos bíblicos", palette: "moss", mark: "BÍBLIA" },
  { id: "sentido-escritura", youtubeId: "2ZjigeDVrDE", category: "Fé", title: "O sentido espiritual da Escritura", channel: "Frei Gilson", topic: "bíblia", url: "https://www.youtube.com/watch?v=2ZjigeDVrDE", durationSeconds: 0, depth: .88, novelty: .64, quality: .94, evergreen: .98, publishedLabel: "leitura espiritual", palette: "blue", mark: "ESCRITURA" },
  { id: "liturgia", youtubeId: "4eLPmkhSMrk", category: "Fé", title: "O que é liturgia?", channel: "Frei Gilson", topic: "liturgia", url: "https://www.youtube.com/watch?v=4eLPmkhSMrk", durationSeconds: 0, depth: .8, novelty: .66, quality: .94, evergreen: .98, publishedLabel: "formação litúrgica", palette: "coral", mark: "LITURGIA" },
  { id: "fim-guerra-fria", youtubeId: "0_6CekBxM80", category: "Mundo", title: "O colapso da União Soviética e o fim da Guerra Fria", channel: "Professor HOC", topic: "história", url: "https://www.youtube.com/watch?v=0_6CekBxM80", durationSeconds: 0, depth: .84, novelty: .68, quality: .93, evergreen: .96, publishedLabel: "história geopolítica", palette: "coral", mark: "1991" },
  { id: "historia-passaportes", youtubeId: "JhxuP0AuRPA", category: "Mundo", title: "When Did We Start Using Passports?", channel: "TED-Ed", topic: "história e fronteiras", url: "https://www.youtube.com/watch?v=JhxuP0AuRPA", durationSeconds: 0, depth: .65, novelty: .77, quality: .92, evergreen: .97, publishedLabel: "história global", palette: "sand", mark: "FRONTEIRAS" },
];

// Durações verificadas nas páginas dos vídeos. Zero nunca é aceito como
// duração presumida, pois esconderia Shorts e vídeos incompletos no feed.
const VERIFIED_DURATIONS: Record<string, number> = {
  aircAruvnKk: 1120, "094y1Z2wpJg": 1329, h6fcK_fRYaI: 486, "R9OCA6UFE-0": 329,
  Dxcc6ycZ73M: 224, yeikqw0kyqI: 124, nqQdtaijxKw: 5706, "30-pRrIyALs": 1563,
  okVO_zv_9I0: 131, "36GT2zI8lVA": 453, a5438jzwVnQ: 3625, "8XSssH3B_Dk": 2273,
  "sVx2Ux_J-fQ": 121, "6YlPc_B1IZs": 471, GKhmaU9Simk: 334, "28Jh_94EjwM": 2023,
  knQzUq8QNLc: 793, u1pFwOFX_Oc: 3334, CBYhVcO4WgI: 2633, o7Ik1OB4TaE: 572,
  iuYlGRnC7J8: 571, LBC16jhiwak: 1740, mUAOaAkAWNU: 312, zSVYfQsHUxU: 956,
  dhYIb72L1hU: 1265, "7MWNGqmukmE": 2795, J1t34uTT0iA: 344, zZECwWYtmKg: 648,
  WeM3QSgMbV0: 2934, brj8wamlS30: 2642, MZA4Ud7ArEM: 3286, "2ZjigeDVrDE": 2859,
  "4eLPmkhSMrk": 1108, "0_6CekBxM80": 1545, JhxuP0AuRPA: 369,
};

export const seedVideos: Video[] = seedVideosRaw.map((video) => ({
  ...video,
  durationSeconds: VERIFIED_DURATIONS[video.youtubeId] || 0,
}));

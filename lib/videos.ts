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

export const seedVideos: Video[] = [
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
];

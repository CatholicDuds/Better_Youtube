const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const sectionLinks = [
  { label: "Início", icon: "⌂", href: `${BASE_PATH}/` },
  { label: "Modo Estudo", icon: "⌘", href: `${BASE_PATH}/estudo/` },
  { label: "Leituras", icon: "▤", href: `${BASE_PATH}/leituras/` },
  { label: "Notícias", icon: "◫", href: `${BASE_PATH}/#noticias` },
];

const exploreLinks = [
  { label: "Negócios", icon: "▥" },
  { label: "Ideias", icon: "◈" },
  { label: "Mundo", icon: "◎" },
  { label: "Política", icon: "⚖" },
  { label: "Fé", icon: "✦" },
  { label: "Ciência", icon: "⚗" },
  { label: "Criação", icon: "✎" },
];

export default function SectionSidebar({ active }: { active: "Início" | "Modo Estudo" | "Leituras" }) {
  return (
    <aside className="sidebar section-sidebar" aria-label="Navegação do Clarity">
      <nav>
        {sectionLinks.map((item) => <a key={item.label} className={active === item.label ? "nav-item active" : "nav-item"} href={item.href} aria-current={active === item.label ? "page" : undefined}><span>{item.icon}</span>{item.label}</a>)}
      </nav>
      <div className="side-separator" />
      <p className="side-label">EXPLORAR</p>
      <nav>
        {exploreLinks.map((item) => <a key={item.label} className="nav-item" href={`${BASE_PATH}/?tema=${encodeURIComponent(item.label)}`}><span>{item.icon}</span>{item.label}</a>)}
      </nav>
      <div className="side-separator" />
      <div className="focus-card"><strong>Aprendizado intencional</strong><p>Vídeos, leitura e síntese unidos no mesmo percurso.</p><span>Sem autoplay e sem Shorts</span></div>
    </aside>
  );
}

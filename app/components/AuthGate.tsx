"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import AIStudyDock from "./AIStudyDock";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type AuthMode = "signin" | "signup" | "forgot" | "update" | "verify";
type Profile = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: "user" | "admin";
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

function friendlyError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (normalized.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return message;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [profileError, setProfileError] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  async function loadProfile(userId: string) {
    if (!supabase) return;
    setProfileError("");
    const [{ data, error }, accessResult] = await Promise.all([
      supabase.from("profiles").select("id,email,username,display_name,role,trial_started_at,trial_ends_at").eq("id", userId).single(),
      supabase.rpc("current_user_has_access"),
    ]);
    if (error || accessResult.error) {
      setProfile(null);
      setHasAccess(null);
      setProfileError("O perfil não pôde ser carregado. Confirme se a configuração do banco foi aplicada.");
      return;
    }
    setProfile(data as Profile);
    setHasAccess(Boolean(accessResult.data));
  }

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) void loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setMessage("");
      if (event === "PASSWORD_RECOVERY") setMode("update");
      if (nextSession) window.setTimeout(() => void loadProfile(nextSession.user.id), 0);
      else { setProfile(null); setHasAccess(null); }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email") || "").trim(), password: String(form.get("password") || "") });
    if (error) setMessage(friendlyError(error.message));
    setSubmitting(false);
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const username = String(form.get("username") || "").trim().toLowerCase();
    const displayName = String(form.get("displayName") || "").trim();
    setSubmitting(true); setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username, display_name: displayName }, emailRedirectTo: `${window.location.origin}${BASE_PATH}/` } });
    if (error) setMessage(friendlyError(error.message));
    else if (!data.session) { setMode("verify"); setMessage(email); }
    setSubmitting(false);
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email") || "").trim(), { redirectTo: `${window.location.origin}${BASE_PATH}/` });
    setMessage(error ? friendlyError(error.message) : "Se a conta existir, enviaremos um link para redefinir a senha.");
    setSubmitting(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password: String(form.get("password") || "") });
    if (error) setMessage(friendlyError(error.message));
    else { setMode("signin"); setMessage("Senha alterada com sucesso."); }
    setSubmitting(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccountOpen(false);
    setMode("signin");
  }

  if (loading) return <div className="auth-loading"><span className="brand-mark">C</span><p>Preparando seu Clarity…</p></div>;

  if (!isSupabaseConfigured) return <main className="auth-config"><div className="auth-config-card"><span className="brand-mark">C</span><p className="eyebrow">AUTENTICAÇÃO AGUARDANDO CONFIGURAÇÃO</p><h1>Conecte o projeto de usuários</h1><p>O sistema de login já está no site, mas precisa das duas variáveis públicas do seu projeto Supabase para funcionar.</p><ol><li>Crie um projeto no Supabase.</li><li>Execute o arquivo <b>supabase/schema.sql</b> no SQL Editor.</li><li>Cadastre a URL e a chave publicável no GitHub Actions.</li></ol><small>Nunca coloque a chave <b>service_role</b> no site ou no GitHub Pages.</small></div></main>;

  if (!session) return <main className="auth-page"><section className="auth-story"><a className="brand" href={`${BASE_PATH}/`}><span className="brand-mark">C</span><strong>Clarity</strong></a><div><p className="eyebrow">APRENDER SEM SER CONSUMIDO PELO FEED</p><h1>Seu tempo merece conteúdo com propósito.</h1><p>Vídeos longos, leituras, notícias e sínteses guiadas em uma experiência sem Shorts e sem rolagem infinita.</p><ul><li>7 dias para explorar gratuitamente</li><li>Algoritmo ajustado por você</li><li>Resumos que viram memória de longo prazo</li></ul></div><small>Clarity · formação guiada por intenção</small></section><section className="auth-panel">
    {mode === "signin" && <><div><p className="eyebrow">BEM-VINDO DE VOLTA</p><h2>Entrar na sua conta</h2><p>Continue de onde parou.</p></div><form onSubmit={signIn}><label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" /></label><label>Senha<input name="password" type="password" required autoComplete="current-password" placeholder="Sua senha" /></label>{message && <p className="auth-message">{message}</p>}<button disabled={submitting} type="submit">{submitting ? "Entrando…" : "Entrar"}</button></form><button className="auth-text-button" onClick={() => { setMode("forgot"); setMessage(""); }}>Esqueci minha senha</button><div className="auth-switch"><span>Ainda não tem conta?</span><button onClick={() => { setMode("signup"); setMessage(""); }}>Começar 7 dias grátis</button></div></>}
    {mode === "signup" && <><div><p className="eyebrow">7 DIAS GRÁTIS</p><h2>Criar sua conta</h2><p>O período começa após a confirmação do e-mail.</p></div><form onSubmit={signUp}><label>Nome<input name="displayName" required minLength={2} maxLength={60} autoComplete="name" placeholder="Como devemos chamar você?" /></label><label>Nome de usuário<input name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z0-9._-]+" autoComplete="username" placeholder="seu.usuario" /></label><label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" /></label><label>Senha<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" /></label>{message && <p className="auth-message">{message}</p>}<button disabled={submitting} type="submit">{submitting ? "Criando…" : "Criar conta e iniciar trial"}</button></form><p className="auth-terms">Ao continuar, você concorda em usar o Clarity para fins pessoais e respeitar as fontes dos conteúdos.</p><button className="auth-text-button" onClick={() => { setMode("signin"); setMessage(""); }}>Já tenho uma conta</button></>}
    {mode === "forgot" && <><div><p className="eyebrow">RECUPERAR ACESSO</p><h2>Redefinir senha</h2><p>Enviaremos um link seguro para seu e-mail.</p></div><form onSubmit={requestReset}><label>E-mail<input name="email" type="email" required autoComplete="email" /></label>{message && <p className="auth-message">{message}</p>}<button disabled={submitting} type="submit">Enviar link</button></form><button className="auth-text-button" onClick={() => { setMode("signin"); setMessage(""); }}>← Voltar ao login</button></>}
    {mode === "verify" && <div className="auth-confirm"><span>✉</span><p className="eyebrow">CONFIRME SEU E-MAIL</p><h2>Um último passo</h2><p>Enviamos um link para <b>{message}</b>. Depois da confirmação, seu trial de sete dias começa.</p><button onClick={() => { setMode("signin"); setMessage(""); }}>Voltar para entrar</button></div>}
  </section></main>;

  if (mode === "update") return <main className="auth-page recovery-page"><section className="auth-panel"><div><p className="eyebrow">NOVA SENHA</p><h2>Proteja sua conta</h2><p>Escolha uma senha com pelo menos oito caracteres.</p></div><form onSubmit={updatePassword}><label>Nova senha<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>{message && <p className="auth-message">{message}</p>}<button disabled={submitting} type="submit">Salvar nova senha</button></form></section></main>;

  if (!profile || hasAccess === null) return <div className="auth-loading"><span className="brand-mark">C</span><p>{profileError || "Carregando seu perfil…"}</p>{profileError && <button onClick={() => void loadProfile(session.user.id)}>Tentar novamente</button>}</div>;

  const isAdmin = profile.role === "admin";
  const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialExpired = !isAdmin && !hasAccess;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now) / 86_400_000)) : 0;

  if (trialExpired) return <main className="trial-expired"><section><span className="brand-mark">C</span><p className="eyebrow">PERÍODO DE TESTE ENCERRADO</p><h1>Seu ciclo gratuito chegou ao fim.</h1><p>Seus resumos e preferências locais continuam no seu dispositivo. Entre em contato para liberar a próxima etapa do Clarity.</p><a href="mailto:eduardo.emilio.gomes@gmail.com?subject=Acesso%20ao%20Clarity">Solicitar acesso</a><button onClick={() => void signOut()}>Sair da conta</button></section></main>;

  return <><AIStudyDock /><div className="account-dock"><button className="account-trigger" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}><span>{(profile.display_name || profile.username).slice(0, 1).toUpperCase()}</span><div><strong>{profile.display_name || profile.username}</strong><small>{isAdmin ? "Administrador" : `${daysLeft} dia${daysLeft === 1 ? "" : "s"} de trial`}</small></div></button>{accountOpen && <div className="account-menu"><p>{profile.email}</p><span className={isAdmin ? "role-badge admin" : "role-badge"}>{isAdmin ? "Acesso administrativo" : `Trial até ${trialEnd?.toLocaleDateString("pt-BR")}`}</span><button onClick={() => void signOut()}>Sair da conta</button></div>}</div>{children}<nav className="mobile-nav" aria-label="Navegação principal"><a href={`${BASE_PATH}/`}><span>⌂</span><small>Início</small></a><a href={`${BASE_PATH}/estudo/`}><span>⌘</span><small>Estudo</small></a><a href={`${BASE_PATH}/#noticias`}><span>◫</span><small>Notícias</small></a><a href={`${BASE_PATH}/leituras/`}><span>▤</span><small>Leituras</small></a></nav></>;
}

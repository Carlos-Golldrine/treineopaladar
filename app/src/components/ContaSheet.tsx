import { useState, type FormEvent } from 'react';
import { Sheet } from './Sheet';
import { criarContaEmail, entrarOuCriar, entrarComGoogle, GOOGLE_PRONTO } from '../lib/conta';
import { track } from '../lib/analytics';
import './conta.css';

/**
 * Folha de criar conta / entrar (F3.1b). Anonimo-primeiro: "Criar conta" anexa
 * e-mail+senha ao usuario anonimo (mesmo user_id, progresso intacto). Google
 * chega quando o OAuth estiver configurado (GOOGLE_PRONTO).
 */
interface Props {
  onFechar: () => void;
  /** Chamado depois de criar conta ou entrar com sucesso. `criado` indica conta
   *  recem-criada (e-mail novo) — o chamador manda pro onboarding nesse caso. */
  onSucesso?: (info?: { criado: boolean }) => void;
  /** Abre direto em "criar" (padrao) ou "entrar" (ex.: "Ja tem conta? Entrar"). */
  modoInicial?: 'criar' | 'entrar';
}

export function ContaSheet({ onFechar, onSucesso, modoInicial }: Props) {
  const [modo, setModo] = useState<'criar' | 'entrar'>(modoInicial ?? 'criar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<{ confirmar: boolean } | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setErro(null);
    setCarregando(true);
    const conta = email.trim();
    const r = modo === 'criar' ? await criarContaEmail(conta, senha) : await entrarOuCriar(conta, senha);
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro ?? 'Tente de novo.');
      return;
    }
    if (modo === 'criar' || r.criado) {
      // Conta criada agora (modo criar, ou "entrar" num e-mail que ainda nao tinha
      // conta): confirma e o chamador leva pro onboarding.
      track('conta_criada', { metodo: 'email' });
      setFeito({ confirmar: Boolean(r.confirmarEmail) });
    } else {
      // Login numa conta existente.
      track('login', { metodo: 'email' });
      onSucesso?.({ criado: false });
      onFechar();
    }
  }

  if (feito) {
    return (
      <Sheet titulo="Conta criada" onFechar={onFechar}>
        <p className="folha-texto">
          Seu progresso está salvo. Agora você acessa de qualquer aparelho.
        </p>
        {feito.confirmar && (
          <p className="folha-texto">
            Enviamos um e-mail de confirmação para <strong>{email.trim()}</strong>. Confirme quando
            puder.
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary btn-jogo btn-cheio tap"
          onClick={() => {
            onSucesso?.({ criado: true });
            onFechar();
          }}
        >
          Continuar
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet titulo={modo === 'criar' ? 'Salve seu progresso' : 'Entrar na sua conta'} onFechar={onFechar}>
      <p className="folha-texto">
        {modo === 'criar'
          ? 'Seu treino fica guardado e você acessa de qualquer aparelho.'
          : 'Entre para continuar de onde parou.'}
      </p>

      <button
        type="button"
        className="btn btn-outline btn-cheio conta-google tap"
        disabled={!GOOGLE_PRONTO || carregando}
        aria-disabled={!GOOGLE_PRONTO}
        onClick={() => {
          if (!GOOGLE_PRONTO || carregando) return;
          setErro(null);
          track('login', { metodo: 'google' });
          void entrarComGoogle().then((r) => {
            if (!r.ok) setErro(r.erro ?? 'Tente de novo.');
          });
        }}
      >
        <svg className="conta-google-logo" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.4673-.806 5.9564-2.1809l-2.9087-2.2581c-.806.54-1.8368.8591-3.0477.8591-2.344 0-4.3282-1.5836-5.0364-3.7105H.9573v2.3318C2.4382 15.9836 5.4818 18 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.9636 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9636 10.71z"
          />
          <path
            fill="#EA4335"
            d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0164.9573 4.9582L3.9636 7.29C4.6718 5.1632 6.656 3.5795 9 3.5795z"
          />
        </svg>
        Continuar com Google
        {!GOOGLE_PRONTO && <span className="conta-embreve">em breve</span>}
      </button>

      <div className="conta-ou">
        <span>ou</span>
      </div>

      <form className="conta-form" onSubmit={enviar}>
        <label className="conta-campo">
          <span className="conta-label">E-mail</span>
          <input
            className="conta-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            required
          />
        </label>
        <label className="conta-campo">
          <span className="conta-label">Senha</span>
          <input
            className="conta-input"
            type="password"
            autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder={modo === 'criar' ? 'mínimo 6 caracteres' : 'sua senha'}
            minLength={6}
            required
          />
        </label>

        {erro && (
          <p className="conta-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-jogo btn-cheio tap" disabled={carregando}>
          {carregando ? 'Um instante...' : modo === 'criar' ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        className="conta-troca tap"
        onClick={() => {
          setErro(null);
          setModo(modo === 'criar' ? 'entrar' : 'criar');
        }}
      >
        {modo === 'criar' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Criar'}
      </button>
    </Sheet>
  );
}

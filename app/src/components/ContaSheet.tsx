import { useState, type FormEvent } from 'react';
import { Sheet } from './Sheet';
import { criarContaEmail, entrarComEmail, entrarComGoogle, GOOGLE_PRONTO } from '../lib/conta';
import { track } from '../lib/analytics';
import './conta.css';

/**
 * Folha de criar conta / entrar (F3.1b). Anonimo-primeiro: "Criar conta" anexa
 * e-mail+senha ao usuario anonimo (mesmo user_id, progresso intacto). Google
 * chega quando o OAuth estiver configurado (GOOGLE_PRONTO).
 */
interface Props {
  onFechar: () => void;
  /** Chamado depois de criar conta ou entrar com sucesso. */
  onSucesso?: () => void;
}

export function ContaSheet({ onFechar, onSucesso }: Props) {
  const [modo, setModo] = useState<'criar' | 'entrar'>('criar');
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
    const r = modo === 'criar' ? await criarContaEmail(conta, senha) : await entrarComEmail(conta, senha);
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro ?? 'Tente de novo.');
      return;
    }
    if (modo === 'criar') {
      track('conta_criada', { metodo: 'email' });
      setFeito({ confirmar: Boolean(r.confirmarEmail) });
    } else {
      track('login', { metodo: 'email' });
      onSucesso?.();
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
            onSucesso?.();
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

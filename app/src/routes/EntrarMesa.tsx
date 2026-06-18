/**
 * Rota do link de convite: /mesa/entrar/:codigo
 * Espera a sessao (auth anonima do iniciarNuvem) ficar pronta, entra na mesa
 * do codigo e manda para a Mesa. Sem nuvem, so abre a Mesa.
 */
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupabase, nuvemConfigurada } from '../lib/supabase';
import { entrarPorConvite } from '../lib/mesa';

export default function EntrarMesa() {
  const { codigo } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const sb = getSupabase();
      if (codigo && sb && nuvemConfigurada()) {
        let uid = (await sb.auth.getUser()).data.user?.id;
        if (!uid) {
          /* Recem-chegado: aguarda a sessao anonima ser criada (com teto). */
          await new Promise<void>((resolve) => {
            const { data } = sb.auth.onAuthStateChange((_e, sessao) => {
              if (sessao) {
                data.subscription.unsubscribe();
                resolve();
              }
            });
            window.setTimeout(() => {
              data.subscription.unsubscribe();
              resolve();
            }, 4000);
          });
          uid = (await sb.auth.getUser()).data.user?.id;
        }
        if (uid) {
          await entrarPorConvite(codigo);
          /* entrou de propria vontade: a Mesa pode auto-recolocar se um dia sair */
          try {
            localStorage.setItem('tp.mesa.auto', '1');
          } catch {
            /* storage bloqueado: ignora */
          }
        }
      }
      if (vivo) navigate('/mesa', { replace: true });
    })();
    return () => {
      vivo = false;
    };
  }, [codigo, navigate]);

  return <div className="mesa-entrando" aria-busy="true" aria-label="Entrando na mesa" />;
}

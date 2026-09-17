import { PainelDashboard } from "@/components/PainelDashboard";
import { compararPeriodo, serieTendencia, rascunhosParados } from "@/lib/metrics";
import { curvaABCAnoCorrente } from "@/lib/curva-abc";
import { lerPropostasSalvas, lerItensVendidos } from "@/lib/store";

// Sem isso, o Next serviria a versão pré-renderizada em build (sem os dados
// importados depois) em vez de consultar o Supabase a cada acesso.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [propostas, itensVendidos] = await Promise.all([lerPropostasSalvas(), lerItensVendidos()]);
  const referencia = new Date();
  const semDados = propostas.length === 0;

  const comparativos = {
    semana: compararPeriodo(propostas, "semana", referencia),
    mes: compararPeriodo(propostas, "mes", referencia),
  };
  const series = {
    semana: serieTendencia(propostas, "semana", referencia, 8),
    // 9 pra cobrir desde janeiro, agora que o backfill histórico trouxe o ano todo.
    mes: serieTendencia(propostas, "mes", referencia, 9),
  };
  const parados = rascunhosParados(propostas, referencia, 15);
  const curvaABC = curvaABCAnoCorrente(itensVendidos, referencia);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <PainelDashboard
        comparativos={comparativos}
        series={series}
        rascunhosParados={parados}
        curvaABC={curvaABC}
        semDados={semDados}
      />
    </main>
  );
}

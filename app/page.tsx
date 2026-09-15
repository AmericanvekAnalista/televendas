import { PainelDashboard } from "@/components/PainelDashboard";
import { PROPOSTAS, DATA_REFERENCIA, FONTE_DADOS } from "@/lib/mock-data";
import { compararPeriodo, serieTendencia, rascunhosParados } from "@/lib/metrics";

export default function Page() {
  const comparativos = {
    semana: compararPeriodo(PROPOSTAS, "semana", DATA_REFERENCIA),
    mes: compararPeriodo(PROPOSTAS, "mes", DATA_REFERENCIA),
  };
  const series = {
    semana: serieTendencia(PROPOSTAS, "semana", DATA_REFERENCIA, 8),
    mes: serieTendencia(PROPOSTAS, "mes", DATA_REFERENCIA, 6),
  };
  const parados = rascunhosParados(PROPOSTAS, DATA_REFERENCIA, 15);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <PainelDashboard comparativos={comparativos} series={series} rascunhosParados={parados} fonteDados={FONTE_DADOS} />
    </main>
  );
}

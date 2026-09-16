"use client";

import { useModo } from "@/lib/use-modo";
import { CORES } from "@/lib/theme";
import { calcularDelta, formatarRotuloFaixa } from "@/lib/metrics";
import type { ClasseABC, ComparativoCurvaABC } from "@/lib/curva-abc";
import { formatarMoedaCompacta, formatarNumero, formatarPercentual } from "@/lib/format";
import { StatTile } from "./StatTile";

interface CurvaABCProps {
  comparativo: ComparativoCurvaABC;
}

const CLASSES: ClasseABC[] = ["A", "B", "C"];

const DESCRICAO_CLASSE: Record<ClasseABC, string> = {
  A: "até 80% do valor acumulado",
  B: "de 80% a 95%",
  C: "últimos 5%",
};

export function CurvaABC({ comparativo }: CurvaABCProps) {
  const modo = useModo();
  const cores = CORES[modo];
  const { atual, anterior } = comparativo;

  const corPorClasse: Record<ClasseABC, string> = {
    A: cores.ordinal[3],
    B: cores.ordinal[2],
    C: cores.ordinal[1],
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium text-text-secondary">Curva ABC de produtos</h3>
        <p className="text-xs text-text-muted">
          Produtos das propostas concluídas, ordenados por valor de venda. Sempre comparado mês a mês —{" "}
          {formatarRotuloFaixa(atual.faixa)} vs. {formatarRotuloFaixa(anterior.faixa)} — independente do filtro de
          período acima.
        </p>
      </div>

      {atual.produtos.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted sm:p-5">
          Nenhum produto vendido no período. A Curva ABC só é calculada a partir de propostas concluídas
          sincronizadas com a Tiny (não entra em dados de exemplo nem em importações por planilha).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {CLASSES.map((classe) => {
              const c = atual.porClasse[classe];
              const anteriorC = anterior.porClasse[classe];
              return (
                <StatTile
                  key={classe}
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ background: corPorClasse[classe] }}
                      />
                      Classe {classe}
                      <span className="font-normal text-text-muted">— {DESCRICAO_CLASSE[classe]}</span>
                    </span>
                  }
                  value={formatarMoedaCompacta(c.valor)}
                  subvalor={`${formatarNumero(c.count)} produto${c.count === 1 ? "" : "s"} · ${formatarPercentual(c.percentual)} do total`}
                  delta={calcularDelta(c.valor, anteriorC.valor)}
                  rotuloComparacao="vs. mês anterior"
                />
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Produto</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Valor</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">% do total</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">% acumulado</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Classe</th>
                </tr>
              </thead>
              <tbody>
                {atual.produtos.map((p) => (
                  <tr key={p.produtoId} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 sm:px-5">
                      <div className="text-text-primary">{p.descricao}</div>
                      {p.sku ? <div className="text-xs text-text-muted">{p.sku}</div> : null}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-primary sm:px-5">
                      {formatarMoedaCompacta(p.valor)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary sm:px-5">
                      {formatarPercentual(p.percentualIndividual, 1)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary sm:px-5">
                      {formatarPercentual(p.percentualAcumulado, 1)}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ background: corPorClasse[p.classe] }}
                        />
                        {p.classe}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

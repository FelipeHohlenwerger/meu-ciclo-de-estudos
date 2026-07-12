import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { observarSessoes, resetarQuestoesFixacao } from "./dados";

function inicioDaSemana() {
  const d = new Date();
  const diaSemana = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - diaSemana);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inicioDoMes() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function Estatisticas({ materias }) {
  const { user } = useAuth();
  const [sessoes, setSessoes] = useState([]);
  const [periodo, setPeriodo] = useState("semana"); // "semana" | "mes"
  const [abaQuestoes, setAbaQuestoes] = useState("fixacao"); // "fixacao" | "simulado"
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) return;
    setCarregando(true);
    const cancelar = observarSessoes(user.uid, (s) => {
      setSessoes(s);
      setCarregando(false);
    });
    return cancelar;
  }, [user]);

  async function handleReset(materia) {
    const ok = window.confirm(
      `Resetar a contagem de fixação de "${materia}"? Isso apaga os registros de questões de fixação dessa matéria de vez.`
    );
    if (!ok) return;
    await resetarQuestoesFixacao(user.uid, materia);
    // Não precisa recarregar manualmente: o listener em tempo real já vai
    // refletir a mudança assim que o Firestore confirmar a escrita.
  }

  if (carregando) return <div className="tela-carregando">Carregando...</div>;

  const limite = periodo === "semana" ? inicioDaSemana() : inicioDoMes();
  const sessoesPeriodo = sessoes.filter((s) => s.criadoEm >= limite);

  // tempo por matéria
  const tempoPorMateria = {};
  for (const s of sessoesPeriodo) {
    tempoPorMateria[s.materia] = (tempoPorMateria[s.materia] || 0) + (s.duracaoMin || 0);
  }
  const maxTempo = Math.max(1, ...Object.values(tempoPorMateria));

  // questões por matéria (todo o histórico, não só o período)
  const questoesPorMateria = {};
  for (const s of sessoes) {
    if (!s.questoesTipo || s.questoesTipo !== abaQuestoes) continue;
    if (!questoesPorMateria[s.materia]) {
      questoesPorMateria[s.materia] = { feitas: 0, acertos: 0 };
    }
    questoesPorMateria[s.materia].feitas += s.questoesFeitas || 0;
    questoesPorMateria[s.materia].acertos += s.questoesAcertos || 0;
  }

  const totalQuestoes = sessoes.reduce((acc, s) => acc + (s.questoesFeitas || 0), 0);
  const totalAcertos = sessoes.reduce((acc, s) => acc + (s.questoesAcertos || 0), 0);
  const pctGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  const simulados = sessoes.filter((s) => s.questoesTipo === "simulado");
  const totalSimulados = simulados.length;
  const acertoMedioSimulados =
    simulados.length > 0
      ? Math.round(
          (simulados.reduce((acc, s) => acc + (s.questoesAcertos || 0), 0) /
            Math.max(
              1,
              simulados.reduce((acc, s) => acc + (s.questoesFeitas || 0), 0)
            )) *
            100
        )
      : 0;

  return (
    <div className="device">
      <div className="card">
        <div className="form-header" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 18 }}>
          <p className="form-title">Estatísticas</p>
          <p className="form-sub">Acompanhamento geral</p>
        </div>

        <div style={{ padding: "20px 22px 6px" }}>
          <div className="stat-top-row">
            <div className="stat-box">
              <span className="stat-num">{totalQuestoes}</span>
              <span className="stat-label">questões feitas no total</span>
            </div>
            <div className="stat-box">
              <span className="stat-num" style={{ color: "var(--ok)" }}>{pctGeral}%</span>
              <span className="stat-label">acerto geral (fixação + simulado)</span>
            </div>
          </div>
        </div>

        <div className="section-label" style={{ margin: "20px 22px 8px" }}>tempo por matéria</div>
        <div className="chart-tabs">
          <button className={`chart-tab ${periodo === "semana" ? "sel" : ""}`} onClick={() => setPeriodo("semana")}>
            Semana
          </button>
          <button className={`chart-tab ${periodo === "mes" ? "sel" : ""}`} onClick={() => setPeriodo("mes")}>
            Mês
          </button>
        </div>
        <div className="bar-chart">
          {Object.entries(tempoPorMateria).length === 0 && (
            <p className="footnote">Nenhum registro nesse período ainda.</p>
          )}
          {Object.entries(tempoPorMateria)
            .sort((a, b) => b[1] - a[1])
            .map(([materia, min]) => (
              <div className="bar-row" key={materia}>
                <span className="bar-name">{materia}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(min / maxTempo) * 100}%` }}></div>
                </div>
                <span className="bar-val">
                  {Math.floor(min / 60)}h{String(min % 60).padStart(2, "0")}
                </span>
              </div>
            ))}
        </div>

        <div className="section-label" style={{ margin: "24px 22px 8px" }}>questões por matéria</div>
        <div className="chart-tabs">
          <button className={`chart-tab ${abaQuestoes === "fixacao" ? "sel" : ""}`} onClick={() => setAbaQuestoes("fixacao")}>
            Fixação
          </button>
          <button className={`chart-tab ${abaQuestoes === "simulado" ? "sel" : ""}`} onClick={() => setAbaQuestoes("simulado")}>
            Simulado
          </button>
        </div>
        <div className="q-list">
          {Object.entries(questoesPorMateria).length === 0 && (
            <p className="footnote" style={{ padding: "0 22px" }}>Nenhum registro dessa categoria ainda.</p>
          )}
          {Object.entries(questoesPorMateria).map(([materia, { feitas, acertos }]) => {
            const pct = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;
            const classe = pct >= 70 ? "good" : pct >= 55 ? "mid" : "low";
            return (
              <div className="q-row" key={materia}>
                <span className="q-name">{materia}</span>
                <span className="q-numbers">{feitas} feitas</span>
                <span className={`q-pct ${classe}`}>{pct}%</span>
                {abaQuestoes === "fixacao" && (
                  <button
                    className="reset-btn"
                    title={`Resetar contagem de ${materia}`}
                    onClick={() => handleReset(materia)}
                  >
                    ↺
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="footnote" style={{ padding: "0 22px" }}>
          {abaQuestoes === "fixacao"
            ? "Toque em ↺ para resetar a contagem de fixação de uma matéria — apaga os registros dela de vez."
            : "% de acerto acumulado em simulados desde o início dos estudos."}
        </p>

        <div className="section-label" style={{ margin: "22px 22px 8px" }}>simulados</div>
        <div style={{ padding: "0 22px 24px" }}>
          <div className="stat-top-row">
            <div className="stat-box">
              <span className="stat-num">{totalSimulados}</span>
              <span className="stat-label">simulados feitos</span>
            </div>
            <div className="stat-box">
              <span className="stat-num" style={{ color: "var(--pen-red)" }}>{acertoMedioSimulados}%</span>
              <span className="stat-label">acerto médio em simulados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

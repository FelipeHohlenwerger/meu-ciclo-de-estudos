import { useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  salvarCiclo,
  avancarCiclo,
  observarSessoes,
  contarRevisoes,
} from "./dados";
import FormSessao from "./FormSessao";
import EditorCiclo from "./EditorCiclo";

function inicioDoDiaTimestamp() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function Hoje({ cicloData }) {
  const { user, logout } = useAuth();
  const [todasSessoes, setTodasSessoes] = useState([]);
  const [revisoesCount, setRevisoesCount] = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarEditor, setMostrarEditor] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const temCiclo = !!cicloData && cicloData.ciclo.length > 0;
  const materiaAtual = temCiclo
    ? cicloData.ciclo[cicloData.posicaoAtual % cicloData.ciclo.length]
    : null;

  // Escuta todas as sessões em tempo real; qualquer registro novo (dessa aba
  // ou de outro dispositivo) atualiza a tela sozinho, sem precisar recarregar.
  useEffect(() => {
    if (!user) return;
    setCarregando(true);
    setErro("");
    const cancelar = observarSessoes(
      user.uid,
      (sessoes) => {
        setTodasSessoes(sessoes);
        setCarregando(false);
      }
    );
    return cancelar;
  }, [user]);

  const sessoesHoje = useMemo(() => {
    if (!temCiclo) return [];
    const inicio = inicioDoDiaTimestamp();
    return todasSessoes
      .filter((s) => s.materia === materiaAtual && (s.criadoEm || 0) >= inicio)
      .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
  }, [todasSessoes, materiaAtual, temCiclo]);

  useEffect(() => {
    if (!user || !temCiclo || sessoesHoje.length === 0) {
      setRevisoesCount(0);
      return;
    }
    const assuntoAtual = sessoesHoje[sessoesHoje.length - 1].assunto;
    contarRevisoes(user.uid, materiaAtual, assuntoAtual)
      .then(setRevisoesCount)
      .catch((e) => console.error("Erro ao contar revisões:", e));
  }, [user, temCiclo, materiaAtual, sessoesHoje]);

  async function handleEncerrarBloco() {
    if (!temCiclo) return;
    await avancarCiclo(user.uid, cicloData.ciclo, cicloData.posicaoAtual);
  }

  async function handleSessaoSalva() {
    setMostrarForm(false);
  }

  if (carregando) {
    return <div className="tela-carregando">Carregando...</div>;
  }

  if (erro) {
    return (
      <div className="device">
        <div className="card">
          <div className="hero">
            <p className="assunto">{erro}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!temCiclo) {
    return (
      <div className="device">
        <div className="card">
          <div className="hero empty-state">
            <div className="eyebrow"><span className="dot"></span>primeiro passo</div>
            <h1 className="materia">Monte seu<br />ciclo de estudos</h1>
            <p className="assunto">
              Escolha suas matérias e a ordem em que elas devem se repetir.
              Você pode ajustar isso a qualquer momento.
            </p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setMostrarEditor(true)}>
              Montar meu ciclo
            </button>
          </div>
        </div>
        {mostrarEditor && (
          <EditorCiclo
            cicloData={cicloData}
            onFechar={() => setMostrarEditor(false)}
            onSalvar={async (novo) => {
              await salvarCiclo(user.uid, novo);
              setMostrarEditor(false);
            }}
          />
        )}
      </div>
    );
  }

  const tempoTotalMin = sessoesHoje.reduce((acc, s) => acc + (s.duracaoMin || 0), 0);
  const progressoPct = Math.min(100, Math.round((tempoTotalMin / 90) * 100));
  const vezesNoCiclo =
    cicloData.ciclo
      .slice(0, cicloData.posicaoAtual + 1)
      .filter((m) => m === materiaAtual).length;

  return (
    <div className="device">
      <div className="topbar">
        <span className="brand">ciclo</span>
        <button className="logout-link" onClick={logout}>sair</button>
      </div>

      <div className="card">
        <div className="hero">
          <div className="eyebrow"><span className="dot"></span>próxima da fila</div>
          <h1 className="materia">{materiaAtual}</h1>
          {sessoesHoje.length > 0 && (
            <p className="assunto">
              {sessoesHoje[sessoesHoje.length - 1].assunto} —{" "}
              {sessoesHoje[sessoesHoje.length - 1].ondeParei || "continuando"}
            </p>
          )}
          <div className="progress-row">
            <span className="pill">{vezesNoCiclo}ª vez no ciclo</span>
            {revisoesCount > 0 && <span>· {revisoesCount} revisões feitas</span>}
          </div>
          <div className="block-progress">
            <div className="bp-row">
              <span className="bp-label">bloco de hoje</span>
              <span className="bp-time">
                {tempoTotalMin} min <span className="bp-ref">/ ref. 1h30</span>
              </span>
            </div>
            <div className="bp-track">
              <div className="bp-fill" style={{ width: `${progressoPct}%` }}></div>
            </div>
          </div>
        </div>
        <div className="actions two">
          <button className="btn btn-ghost" onClick={() => setMostrarForm(true)}>
            + Adicionar sessão
          </button>
          <button className="btn btn-primary" onClick={handleEncerrarBloco}>
            Encerrar bloco
          </button>
        </div>
      </div>

      {sessoesHoje.length > 0 && (
        <>
          <div className="section-label">sessões de hoje · {materiaAtual}</div>
          <div className="card">
            <div className="today-blocks">
              {sessoesHoje.map((s) => (
                <div className="tb-row" key={s.id}>
                  <span className="tb-time">
                    {s.criadoEm
                      ? new Date(s.criadoEm).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </span>
                  <div className="tb-mid">
                    <span className="tb-materia">{s.materia}</span>
                    <span className="tb-detail">
                      {s.assunto} {s.ondeParei ? `· ${s.ondeParei}` : ""}
                      {s.tipo === "revisao" ? " · revisão" : ""}
                    </span>
                  </div>
                  <span className="tb-dur">{s.duracaoMin} min</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "4px 22px 18px" }}>
              <span className="tb-total">{tempoTotalMin} min acumulados neste bloco</span>
            </div>
          </div>
        </>
      )}

      <div className="section-label">fila do ciclo (sequencial, sem pular)</div>
      <div className="card">
        <div className="ciclo-list">
          {cicloData.ciclo.map((m, i) => (
            <div
              className={`ciclo-item ${i === cicloData.posicaoAtual ? "current" : ""} ${
                i < cicloData.posicaoAtual ? "past" : ""
              }`}
              key={i}
            >
              <span className="ciclo-num">{String(i + 1).padStart(2, "0")}</span>
              <span className={`ciclo-nome ${i < cicloData.posicaoAtual ? "ciclo-done" : ""}`}>
                {m}
              </span>
            </div>
          ))}
        </div>
        <div className="ciclo-edit-row">
          <button className="btn-edit-ciclo" onClick={() => setMostrarEditor(true)}>
            ✎ Editar ciclo (matérias e ordem)
          </button>
        </div>
      </div>

      {mostrarForm && (
        <FormSessao
          materiaSugerida={materiaAtual}
          materias={cicloData.materias}
          onFechar={() => setMostrarForm(false)}
          onSalvo={handleSessaoSalva}
        />
      )}

      {mostrarEditor && (
        <EditorCiclo
          cicloData={cicloData}
          onFechar={() => setMostrarEditor(false)}
          onSalvar={async (novo) => {
            await salvarCiclo(user.uid, novo);
            setMostrarEditor(false);
          }}
        />
      )}
    </div>
  );
}

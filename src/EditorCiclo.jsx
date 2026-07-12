import { useState } from "react";

export default function EditorCiclo({ cicloData, onFechar, onSalvar }) {
  const [materias, setMaterias] = useState(cicloData?.materias || []);
  const [ciclo, setCiclo] = useState(cicloData?.ciclo || []);
  const [novaMateria, setNovaMateria] = useState("");
  const [materiaParaAdicionar, setMateriaParaAdicionar] = useState("");
  const [salvando, setSalvando] = useState(false);

  function adicionarMateria() {
    const nome = novaMateria.trim();
    if (!nome || materias.includes(nome)) return;
    setMaterias([...materias, nome]);
    setNovaMateria("");
  }

  function removerMateria(nome) {
    setMaterias(materias.filter((m) => m !== nome));
    setCiclo(ciclo.filter((m) => m !== nome));
  }

  function adicionarNaFila() {
    if (!materiaParaAdicionar) return;
    setCiclo([...ciclo, materiaParaAdicionar]);
  }

  function removerDaFila(index) {
    setCiclo(ciclo.filter((_, i) => i !== index));
  }

  function moverNaFila(index, direcao) {
    const novo = [...ciclo];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= novo.length) return;
    [novo[index], novo[alvo]] = [novo[alvo], novo[index]];
    setCiclo(novo);
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      await onSalvar({
        materias,
        ciclo,
        posicaoAtual: Math.min(cicloData?.posicaoAtual || 0, Math.max(ciclo.length - 1, 0)),
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <p className="form-title">Editar ciclo</p>
          <p className="form-sub">Matérias e ordem da fila</p>
        </div>

        <div className="form-body">
          <div className="section-label" style={{ margin: "0 0 8px" }}>suas matérias</div>
          <div className="tag-list">
            {materias.map((m) => (
              <span className="tag" key={m}>
                {m}
                <button className="tag-remove" onClick={() => removerMateria(m)}>×</button>
              </span>
            ))}
          </div>
          <div className="duo" style={{ marginTop: 10 }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Nova matéria"
                value={novaMateria}
                onChange={(e) => setNovaMateria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarMateria()}
              />
            </div>
            <button className="btn btn-ghost" onClick={adicionarMateria}>
              Adicionar
            </button>
          </div>

          <div className="section-label" style={{ margin: "22px 0 8px" }}>fila do ciclo</div>
          <div className="ciclo-edit-list">
            {ciclo.map((m, i) => (
              <div className="ciclo-edit-item" key={i}>
                <span className="ciclo-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="ciclo-nome" style={{ flex: 1 }}>{m}</span>
                <button className="mini-btn" onClick={() => moverNaFila(i, -1)} disabled={i === 0}>↑</button>
                <button className="mini-btn" onClick={() => moverNaFila(i, 1)} disabled={i === ciclo.length - 1}>↓</button>
                <button className="mini-btn mini-btn-danger" onClick={() => removerDaFila(i)}>×</button>
              </div>
            ))}
            {ciclo.length === 0 && <p className="footnote">Nenhuma matéria na fila ainda.</p>}
          </div>

          <div className="duo" style={{ marginTop: 10 }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <select
                value={materiaParaAdicionar}
                onChange={(e) => setMateriaParaAdicionar(e.target.value)}
              >
                <option value="">Escolha uma matéria...</option>
                {materias.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost" onClick={adicionarNaFila}>
              + na fila
            </button>
          </div>
          <p className="footnote" style={{ marginTop: 8 }}>
            Repita a mesma matéria quantas vezes quiser para dar mais peso a ela no ciclo.
          </p>
        </div>

        <div className="footer-actions" style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onFechar} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando} style={{ flex: 1 }}>
            {salvando ? "Salvando..." : "Salvar ciclo"}
          </button>
        </div>
      </div>
    </div>
  );
}

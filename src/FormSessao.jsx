import { useState } from "react";
import { useAuth } from "./AuthContext";
import { registrarSessao } from "./dados";

export default function FormSessao({ materiaSugerida, materias, onFechar, onSalvo }) {
  const { user } = useAuth();
  const [materia, setMateria] = useState(materiaSugerida);
  const [assunto, setAssunto] = useState("");
  const [ondeParei, setOndeParei] = useState("");
  const [duracaoMin, setDuracaoMin] = useState(30);
  const [tipo, setTipo] = useState("novo"); // "novo" | "revisao"
  const [temQuestoes, setTemQuestoes] = useState(false);
  const [questoesTipo, setQuestoesTipo] = useState("fixacao"); // "fixacao" | "simulado"
  const [questoesFeitas, setQuestoesFeitas] = useState("");
  const [questoesAcertos, setQuestoesAcertos] = useState("");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!assunto.trim()) {
      alert("Informe o material/assunto estudado.");
      return;
    }
    setSalvando(true);
    try {
      await registrarSessao(user.uid, {
        materia,
        assunto: assunto.trim(),
        ondeParei: ondeParei.trim() || null,
        duracaoMin: Number(duracaoMin) || 0,
        tipo,
        questoesFeitas: temQuestoes ? Number(questoesFeitas) || 0 : null,
        questoesAcertos: temQuestoes ? Number(questoesAcertos) || 0 : null,
        questoesTipo: temQuestoes ? questoesTipo : null,
        observacao: obs.trim() || null,
      });
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <p className="form-title">Adicionar sessão</p>
          <p className="form-sub">Registro de um período de estudo</p>
        </div>
        <div className="form-body">
          <div className="field">
            <label>Disciplina</label>
            <select value={materia} onChange={(e) => setMateria(e.target.value)}>
              {materias.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === materiaSugerida ? " (matéria da vez)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Material / assunto</label>
            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="ex: Atos Administrativos - PDF 2"
            />
          </div>

          <div className="field">
            <label>Onde parei (opcional)</label>
            <input
              type="text"
              value={ondeParei}
              onChange={(e) => setOndeParei(e.target.value)}
              placeholder="pág. 23, ou aula 2/5..."
            />
          </div>

          <div className="duo">
            <div className="field">
              <label>Tempo (min)</label>
              <input
                type="number"
                min="1"
                value={duracaoMin}
                onChange={(e) => setDuracaoMin(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Tipo de bloco</label>
              <div className="seg">
                <button className={tipo === "novo" ? "sel" : ""} onClick={() => setTipo("novo")}>
                  Estudo novo
                </button>
                <button className={tipo === "revisao" ? "sel" : ""} onClick={() => setTipo("revisao")}>
                  Revisão
                </button>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={temQuestoes}
                onChange={(e) => setTemQuestoes(e.target.checked)}
              />
              Registrar questões nesta sessão
            </label>
          </div>

          {temQuestoes && (
            <>
              <div className="field">
                <label>Tipo de questão</label>
                <div className="seg">
                  <button
                    className={questoesTipo === "fixacao" ? "sel" : ""}
                    onClick={() => setQuestoesTipo("fixacao")}
                  >
                    Fixação
                  </button>
                  <button
                    className={questoesTipo === "simulado" ? "sel" : ""}
                    onClick={() => setQuestoesTipo("simulado")}
                  >
                    Simulado
                  </button>
                </div>
              </div>
              <div className="duo">
                <div className="field">
                  <label>Questões feitas</label>
                  <input
                    type="number"
                    min="0"
                    value={questoesFeitas}
                    onChange={(e) => setQuestoesFeitas(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Acertos</label>
                  <input
                    type="number"
                    min="0"
                    value={questoesAcertos}
                    onChange={(e) => setQuestoesAcertos(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label>Observação (opcional)</label>
            <textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="footer-actions" style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onFechar} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={salvando} style={{ flex: 1 }}>
            {salvando ? "Salvando..." : "Salvar sessão"}
          </button>
        </div>
      </div>
    </div>
  );
}

import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ---------- CICLO (matérias + ordem + posição atual) ---------- */

export async function carregarCiclo(uid) {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const inicial = { materias: [], ciclo: [], posicaoAtual: 0 };
    await setDoc(ref, inicial);
    return inicial;
  }
  return snap.data();
}

/**
 * Observa o documento do ciclo em tempo real.
 * onMudanca é chamado com os dados atuais sempre que algo muda no Firestore
 * (por essa aba, outra aba, ou outro dispositivo). Retorna uma função de
 * cancelamento — chame-a ao desmontar o componente para parar de escutar.
 */
export function observarCiclo(uid, onMudanca) {
  const ref = doc(db, "usuarios", uid);
  return onSnapshot(ref, async (snap) => {
    if (!snap.exists()) {
      const inicial = { materias: [], ciclo: [], posicaoAtual: 0 };
      await setDoc(ref, inicial);
      return; // o próprio setDoc vai disparar este listener de novo com os dados
    }
    onMudanca(snap.data());
  });
}

export async function salvarCiclo(uid, { materias, ciclo, posicaoAtual }) {
  const ref = doc(db, "usuarios", uid);
  await setDoc(ref, { materias, ciclo, posicaoAtual }, { merge: true });
}

export async function avancarCiclo(uid, cicloAtual, posicaoAtual) {
  const proxima = (posicaoAtual + 1) % cicloAtual.length;
  const ref = doc(db, "usuarios", uid);
  await setDoc(ref, { posicaoAtual: proxima }, { merge: true });
  return proxima;
}

/* ---------- SESSÕES ----------
   Observação técnica: evitamos orderBy() nas queries do Firestore para não
   depender da criação manual de índices compostos no Console. Com o volume
   de dados de uso pessoal, ordenar em JavaScript depois de buscar é mais
   simples e não tem custo perceptível de performance. */

export async function registrarSessao(uid, sessao) {
  // sessao: { materia, assunto, ondeParei, duracaoMin, tipo, questoesFeitas, questoesAcertos, questoesTipo }
  const ref = collection(db, "sessoes");
  await addDoc(ref, {
    uid,
    ...sessao,
    data: serverTimestamp(),
    criadoEm: Date.now(), // usado para ordenação/agrupamento por dia sem esperar o servidor
  });
}

/**
 * Observa todas as sessões do usuário em tempo real. Filtragens específicas
 * (por dia, por matéria, etc.) são feitas em JavaScript sobre o resultado,
 * assim evitamos múltiplos listeners e múltiplos índices compostos.
 */
export function observarSessoes(uid, onMudanca) {
  const ref = collection(db, "sessoes");
  const q = query(ref, where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    const sessoes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
    onMudanca(sessoes);
  });
}

export async function contarRevisoes(uid, materia, assunto) {
  const ref = collection(db, "sessoes");
  const q = query(
    ref,
    where("uid", "==", uid),
    where("materia", "==", materia),
    where("assunto", "==", assunto),
    where("tipo", "==", "revisao")
  );
  const snap = await getDocs(q);
  return snap.size;
}

/* ---------- RESET DE QUESTÕES POR MATÉRIA ---------- */

export async function resetarQuestoes(uid, materia, questoesTipo) {
  // questoesTipo: "fixacao" | "simulado"
  const ref = collection(db, "sessoes");
  const q = query(
    ref,
    where("uid", "==", uid),
    where("materia", "==", materia),
    where("questoesTipo", "==", questoesTipo)
  );
  const snap = await getDocs(q);
  // Apaga o campo de questões dos registros (mantém a sessão, some só a contagem)
  // Aqui optamos por apagar o documento de questão vinculado; como questões vivem
  // dentro da própria sessão, removemos apenas os campos de questão daquela sessão.
  const promises = snap.docs.map((d) =>
    setDoc(
      doc(db, "sessoes", d.id),
      { questoesFeitas: null, questoesAcertos: null, questoesTipo: null },
      { merge: true }
    )
  );
  await Promise.all(promises);
}

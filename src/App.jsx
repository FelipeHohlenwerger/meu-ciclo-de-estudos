import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { observarCiclo } from "./dados";
import Login from "./Login";
import Hoje from "./Hoje";
import Estatisticas from "./Estatisticas";
import "./styles.css";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isDesktop;
}

function AppInterno() {
  const { user, loading } = useAuth();
  const [aba, setAba] = useState("hoje"); // "hoje" | "estatisticas" (só usado no mobile)
  const [cicloData, setCicloData] = useState(null);
  const [carregandoCiclo, setCarregandoCiclo] = useState(true);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!user) return;
    setCarregandoCiclo(true);
    const cancelar = observarCiclo(user.uid, (dados) => {
      setCicloData(dados);
      setCarregandoCiclo(false);
    });
    return cancelar; // para de escutar ao trocar de usuário ou desmontar
  }, [user]);

  if (loading || (user && carregandoCiclo)) {
    return <div className="tela-carregando">Carregando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const materias = cicloData?.materias || [];
  const temCiclo = (cicloData?.ciclo || []).length > 0;

  if (isDesktop) {
    return (
      <div className="app-wrapper">
        <div className={`desktop-only-split ${!temCiclo ? "single" : ""}`}>
          <Hoje cicloData={cicloData} />
          {temCiclo && <Estatisticas materias={materias} />}
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {aba === "estatisticas" && temCiclo ? (
        <Estatisticas materias={materias} />
      ) : (
        <Hoje cicloData={cicloData} />
      )}

      {temCiclo && (
        <nav className="bottom-nav">
          <button
            className={`nav-btn ${aba === "hoje" ? "active" : ""}`}
            onClick={() => setAba("hoje")}
          >
            Hoje
          </button>
          <button
            className={`nav-btn ${aba === "estatisticas" ? "active" : ""}`}
            onClick={() => setAba("estatisticas")}
          >
            Estatísticas
          </button>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInterno />
    </AuthProvider>
  );
}

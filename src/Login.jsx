import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { login, cadastrar, loginComGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modoCadastro) {
        await cadastrar(email, senha);
      } else {
        await login(email, senha);
      }
    } catch (err) {
      setErro(traduzErro(err.code));
    } finally {
      setCarregando(false);
    }
  }

  async function handleGoogle() {
    setErro("");
    setCarregando(true);
    try {
      await loginComGoogle();
    } catch (err) {
      setErro(traduzErro(err.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-eyebrow">ciclo</p>
        <h1 className="login-title">{modoCadastro ? "Criar conta" : "Entrar"}</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" className="btn btn-primary" disabled={carregando} style={{ width: "100%" }}>
            {carregando ? "Aguarde..." : modoCadastro ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <div className="login-divider"><span>ou</span></div>

        <button className="btn btn-google" onClick={handleGoogle} disabled={carregando}>
          Continuar com Google
        </button>

        <button className="login-switch" onClick={() => setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tenho conta — entrar" : "Não tenho conta — criar"}
        </button>
      </div>
    </div>
  );
}

function traduzErro(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/popup-closed-by-user": "Login cancelado.",
  };
  return mapa[code] || "Ocorreu um erro. Tente novamente.";
}

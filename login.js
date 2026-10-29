
"use strict";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bhbboegwmnqejkixbvqb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fm7TrvN1VsuGbkycgmH0CA_SY3QOA6A";;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");

const avisoLogin = document.getElementById("aviso-login");
const avisoCadastro = document.getElementById("aviso-cadastro");

function mostrarTela(tela) {
  formLogin.classList.add("escondido");
  formCadastro.classList.add("escondido");
  tela.classList.remove("escondido");
}

function mostrarAviso(elemento, mensagem, sucesso = false) {
  elemento.textContent = mensagem;
  elemento.classList.toggle("ok", sucesso);
}

function traduzirErro(erro) {
  const mensagem = (erro?.message || "").toLowerCase();

  if (mensagem.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (
    mensagem.includes("user already registered") ||
    mensagem.includes("already been registered")
  ) {
    return "Este e-mail já está cadastrado.";
  }

  if (mensagem.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (mensagem.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (mensagem.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }

  console.error("Erro do Supabase:", erro);
  return "Não foi possível concluir a operação. Verifique os dados e tente novamente.";
}

// Alternar para cadastro
document.getElementById("ir-cadastro").addEventListener("click", (e) => {
  e.preventDefault();
  mostrarAviso(avisoLogin, "");
  mostrarAviso(avisoCadastro, "");
  mostrarTela(formCadastro);
});

// Voltar para login
document.getElementById("ir-login").addEventListener("click", (e) => {
  e.preventDefault();
  mostrarAviso(avisoLogin, "");
  mostrarAviso(avisoCadastro, "");
  mostrarTela(formLogin);
});

// Criar conta
formCadastro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const botao = formCadastro.querySelector('button[type="submit"]');
  const nome = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email").value.trim().toLowerCase();
  const senha = document.getElementById("cad-senha").value;

  mostrarAviso(avisoCadastro, "");

  if (!nome || !email || senha.length < 6) {
    mostrarAviso(
      avisoCadastro,
      "Preencha todos os campos e use uma senha de pelo menos 6 caracteres."
    );
    return;
  }

  botao.disabled = true;
  botao.textContent = "Cadastrando...";

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin + "/index.html"
      }
    });

    if (error) throw error;

    formCadastro.reset();

    if (data.session) {
      window.location.replace("gastos.html");
      return;
    }

    document.getElementById("login-email").value = email;
    mostrarTela(formLogin);

    mostrarAviso(
      avisoLogin,
      "Cadastro iniciado! Verifique seu e-mail para confirmar a conta antes de entrar.",
      true
    );
  } catch (erro) {
    mostrarAviso(avisoCadastro, traduzirErro(erro));
  } finally {
    botao.disabled = false;
    botao.textContent = "Cadastrar";
  }
});

// Entrar
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const botao = formLogin.querySelector('button[type="submit"]');
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const senha = document.getElementById("login-senha").value;

  mostrarAviso(avisoLogin, "");

  botao.disabled = true;
  botao.textContent = "Entrando...";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) throw error;

    window.location.replace("gastos.html");
  } catch (erro) {
    mostrarAviso(avisoLogin, traduzirErro(erro));
  } finally {
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});

// Se já houver sessão válida, abrir a página principal
async function verificarSessao() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (data.session) {
      window.location.replace("gastos.html");
    }
  } catch (erro) {
    console.error("Não foi possível verificar a sessão:", erro);
  }
}

verificarSessao();

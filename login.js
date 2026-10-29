
"use strict";

const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");

const avisoLogin = document.getElementById("aviso-login");
const avisoCadastro = document.getElementById("aviso-cadastro");

const chaveUsuarios = "usuarios";
const chaveSessao = "usuarioLogado";

// Recuperar os usuários salvos
function pegarUsuarios() {
  try {
    const dados = localStorage.getItem(chaveUsuarios);

    if (!dados) {
      return [];
    }

    const usuarios = JSON.parse(dados);

    return Array.isArray(usuarios) ? usuarios : [];
  } catch (erro) {
    console.error("Erro ao recuperar usuários:", erro);
    return [];
  }
}

// Salvar usuários
function salvarUsuarios(usuarios) {
  try {
    localStorage.setItem(chaveUsuarios, JSON.stringify(usuarios));
    return true;
  } catch (erro) {
    console.error("Erro ao salvar usuários:", erro);
    return false;
  }
}

// Alternar entre login e cadastro
function mostrarTela(tela) {
  formLogin.classList.add("escondido");
  formCadastro.classList.add("escondido");

  tela.classList.remove("escondido");
}

// Exibir mensagens
function mostrarAviso(elemento, mensagem, sucesso = false) {
  elemento.textContent = mensagem;
  elemento.classList.toggle("ok", sucesso);
}

// Entrar no sistema
function entrar(usuario) {
  try {
    localStorage.setItem(chaveSessao, usuario.email);
    window.location.href = "gastos.html";
  } catch (erro) {
    console.error("Erro ao iniciar sessão:", erro);

    mostrarAviso(
      avisoLogin,
      "Não foi possível iniciar a sessão neste navegador."
    );
  }
}

// Ir para cadastro

document.getElementById("ir-cadastro").addEventListener("click", function (e) {
  e.preventDefault();

  document.getElementById("aviso-login").textContent = "";
  document.getElementById("form-login").classList.add("escondido");
  document.getElementById("form-cadastro").classList.remove("escondido");
});


// Voltar para login
document.getElementById("ir-login").addEventListener("click", function (e) {
  e.preventDefault();

  mostrarAviso(avisoLogin, "");
  mostrarAviso(avisoCadastro, "");

  formLogin.reset();
  mostrarTela(formLogin);
});

// Cadastrar usuário
formCadastro.addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email")
    .value.trim().toLowerCase();
  const senha = document.getElementById("cad-senha").value;

  mostrarAviso(avisoCadastro, "");

  if (!nome || !email || senha.length < 6) {
    mostrarAviso(
      avisoCadastro,
      "Preencha todos os campos e use uma senha de pelo menos 6 caracteres."
    );
    return;
  }

  const usuarios = pegarUsuarios();

  const emailExiste = usuarios.some(function (usuario) {
    return usuario.email.toLowerCase() === email;
  });

  if (emailExiste) {
    mostrarAviso(avisoCadastro, "Este e-mail já está cadastrado.");
    return;
  }

  usuarios.push({
    nome: nome,
    email: email,
    senha: senha
  });

  if (!salvarUsuarios(usuarios)) {
    mostrarAviso(
      avisoCadastro,
      "Não foi possível salvar a conta. Verifique o navegador."
    );
    return;
  }

  formCadastro.reset();

  document.getElementById("login-email").value = email;

  mostrarTela(formLogin);

  mostrarAviso(
    avisoLogin,
    "Conta criada com sucesso! Agora entre com sua senha.",
    true
  );
});

// Fazer login
formLogin.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("login-email")
    .value.trim().toLowerCase();
  const senha = document.getElementById("login-senha").value;

  mostrarAviso(avisoLogin, "");

  const usuario = pegarUsuarios().find(function (u) {
    return u.email.toLowerCase() === email && u.senha === senha;
  });

  if (!usuario) {
    mostrarAviso(avisoLogin, "E-mail ou senha incorretos.");
    return;
  }

  entrar(usuario);
});

// Recuperar sessão existente
function verificarSessao() {
  const emailLogado = localStorage.getItem(chaveSessao);

  if (!emailLogado) {
    return;
  }

  const usuario = pegarUsuarios().find(function (u) {
    return u.email === emailLogado;
  });

  if (usuario) {
    window.location.replace("gastos.html");
  } else {
    localStorage.removeItem(chaveSessao);
  }
}

verificarSessao();

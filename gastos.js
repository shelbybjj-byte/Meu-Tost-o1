
import { supabase } from "./supabase.js";

const $ = (id) => document.getElementById(id);

let usuarioAtual = null;
let movimentacoes = [];
let dividas = [];

const dinheiro = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const escapar = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

const dataBR = (data) => {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};

function mostrarMensagem(id, texto, erro = false) {
  const elemento = $(id);
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = erro ? "#dc2626" : "#15803d";
}

function mostrarErro(erro, id = "mensagem") {
  console.error("Erro no Supabase:", erro);
  mostrarMensagem(
    id,
    erro?.message || "Não foi possível concluir a operação.",
    true
  );
}

async function verificarSessao() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (!data.session) {
    window.location.replace("index.html");
    return false;
  }

  usuarioAtual = data.session.user;

  if ($("nome-usuario")) {
    $("nome-usuario").textContent =
      usuarioAtual.user_metadata?.nome || usuarioAtual.email || "Usuário";
  }

  return true;
}

async function carregarMovimentacoes() {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select("id, descricao, valor, tipo, categoria, data, criado_em")
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });

  if (error) throw error;

  movimentacoes = data || [];
  renderizarMovimentacoes();
}

async function carregarDividas() {
  const { data, error } = await supabase
    .from("dividas")
    .select("id, descricao, valor, vencimento, status, data_pagamento")
    .order("vencimento", { ascending: true });

  if (error) throw error;

  dividas = data || [];
  renderizarDividas();
}

function renderizarMovimentacoes() {
  const lista = $("lista-movimentacoes");
  if (!lista) return;

  const filtro = ($("filtro")?.value || "").toLowerCase();

  const filtradas = movimentacoes.filter((m) =>
    `${m.descricao} ${m.tipo} ${m.categoria} ${m.data}`
      .toLowerCase()
      .includes(filtro)
  );

  const receitas = movimentacoes
    .filter((m) => m.tipo === "receita")
    .reduce((soma, m) => soma + Number(m.valor), 0);

  const despesas = movimentacoes
    .filter((m) => m.tipo === "despesa")
    .reduce((soma, m) => soma + Number(m.valor), 0);

  if ($("total-receitas")) $("total-receitas").textContent = dinheiro(receitas);
  if ($("total-despesas")) $("total-despesas").textContent = dinheiro(despesas);
  if ($("saldo")) $("saldo").textContent = dinheiro(receitas - despesas);

  if ($("historico-vazio")) {
    $("historico-vazio").hidden = filtradas.length > 0;
  }

  lista.innerHTML = filtradas.map((m) => `
    <tr>
      <td>${escapar(m.descricao)}</td>
      <td>${escapar(m.categoria || "Outros")}</td>
      <td>${dataBR(m.data)}</td>
      <td>${m.tipo === "receita" ? "Receita" : "Despesa"}</td>
      <td>${dinheiro(m.valor)}</td>
      <td>
        <button type="button" data-excluir-mov="${escapar(m.id)}">
          Excluir
        </button>
      </td>
    </tr>
  `).join("");

  if ($("historico-vazio") && filtradas.length === 0) {
    $("historico-vazio").hidden = false;
  }
}

function renderizarDividas() {
  const lista = $("lista-dividas");
  if (!lista) return;

  const filtro = ($("filtro-dividas")?.value || "").toLowerCase();

  const filtradas = dividas.filter((d) =>
    `${d.descricao} ${d.status} ${d.vencimento}`
      .toLowerCase()
      .includes(filtro)
  );

  const pendentes = dividas
    .filter((d) => d.status === "pendente")
    .reduce((soma, d) => soma + Number(d.valor), 0);

  const pagas = dividas
    .filter((d) => d.status === "paga")
    .reduce((soma, d) => soma + Number(d.valor), 0);

  if ($("total-pendente")) $("total-pendente").textContent = dinheiro(pendentes);
  if ($("total-pago")) $("total-pago").textContent = dinheiro(pagas);

  if ($("quantidade-pendente")) {
    $("quantidade-pendente").textContent = dividas.filter(
      (d) => d.status === "pendente"
    ).length;
  }

  if ($("dividas-vazias")) {
    $("dividas-vazias").hidden = filtradas.length > 0;
  }

  lista.innerHTML = filtradas.map((d) => `
    <tr>
      <td>${escapar(d.descricao)}</td>
      <td>${dinheiro(d.valor)}</td>
      <td>${dataBR(d.vencimento)}</td>
      <td>${d.status === "paga" ? "Paga" : "Pendente"}</td>
      <td>
        ${d.status === "pendente" ? `
          <button type="button" data-pagar-divida="${escapar(d.id)}">
            Marcar como paga
          </button>
        ` : ""}
        <button type="button" data-excluir-divida="${escapar(d.id)}">
          Excluir
        </button>
      </td>
    </tr>
  `).join("");

  if ($("dividas-vazias") && filtradas.length === 0) {
    $("dividas-vazias").hidden = false;
  }
}

$("form-movimentacao")?.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const descricao = $("descricao")?.value.trim();
  const valor = Number($("valor")?.value);
  const tipo = $("tipo")?.value;
  const categoria = $("categoria")?.value || "Outros";
  const data = $("data")?.value;

  if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
    mostrarMensagem("mensagem", "Preencha os campos corretamente.", true);
    return;
  }

  if (!["receita", "despesa"].includes(tipo)) {
    mostrarMensagem("mensagem", "Selecione receita ou despesa.", true);
    return;
  }

  const botao = evento.submitter;
  if (botao) botao.disabled = true;

  try {
    const { error } = await supabase.from("movimentacoes").insert({
      descricao,
      valor,
      tipo,
      categoria,
      data
    });

    if (error) throw error;

    evento.target.reset();
    if ($("data")) {
      $("data").value = new Date().toLocaleDateString("en-CA");
    }

    mostrarMensagem("mensagem", "Movimentação salva com sucesso.");
    await carregarMovimentacoes();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    if (botao) botao.disabled = false;
  }
});

$("form-divida")?.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const descricao = $("divida-descricao")?.value.trim();
  const valor = Number($("divida-valor")?.value);
  const vencimento = $("divida-vencimento")?.value;

  if (!descricao || !Number.isFinite(valor) || valor <= 0 || !vencimento) {
    mostrarMensagem(
      "mensagem-divida",
      "Preencha os campos da dívida corretamente.",
      true
    );
    return;
  }

  const botao = evento.submitter;
  if (botao) botao.disabled = true;

  try {
    const { error } = await supabase.from("dividas").insert({
      descricao,
      valor,
      vencimento,
      status: "pendente"
    });

    if (error) throw error;

    evento.target.reset();
    mostrarMensagem("mensagem-divida", "Dívida salva com sucesso.");
    await carregarDividas();
  } catch (erro) {
    mostrarErro(erro, "mensagem-divida");
  } finally {
    if (botao) botao.disabled = false;
  }
});

document.addEventListener("click", async (evento) => {
  const excluirMov = evento.target.closest("[data-excluir-mov]");
  const pagarDivida = evento.target.closest("[data-pagar-divida]");
  const excluirDivida = evento.target.closest("[data-excluir-divida]");

  try {
    if (excluirMov) {
      const id = excluirMov.dataset.excluirMov;
      if (!confirm("Deseja excluir esta movimentação?")) return;

      const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await carregarMovimentacoes();
      mostrarMensagem("mensagem", "Movimentação excluída.");
    }

    if (pagarDivida) {
      const id = pagarDivida.dataset.pagarDivida;
      const hoje = new Date().toLocaleDateString("en-CA");

      const { error } = await supabase
        .from("dividas")
        .update({ status: "paga", data_pagamento: hoje })
        .eq("id", id);

      if (error) throw error;

      await carregarDividas();
      mostrarMensagem("mensagem-divida", "Dívida marcada como paga.");
    }

    if (excluirDivida) {
      const id = excluirDivida.dataset.excluirDivida;
      if (!confirm("Deseja excluir esta dívida?")) return;

      const { error } = await supabase
        .from("dividas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await carregarDividas();
      mostrarMensagem("mensagem-divida", "Dívida excluída.");
    }
  } catch (erro) {
    mostrarErro(erro, excluirDivida || pagarDivida ? "mensagem-divida" : "mensagem");
  }
});

$("filtro")?.addEventListener("input", renderizarMovimentacoes);
$("filtro")?.addEventListener("change", renderizarMovimentacoes);
$("filtro-dividas")?.addEventListener("input", renderizarDividas);
$("filtro-dividas")?.addEventListener("change", renderizarDividas);

$("btn-sair")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    mostrarErro(error);
    return;
  }

  window.location.replace("index.html");
});

async function iniciar() {
  try {
    const autenticado = await verificarSessao();
    if (!autenticado) return;

    await Promise.all([
      carregarMovimentacoes(),
      carregarDividas()
    ]);

    // Ajusta a data inicial do formulário, se houver campo de data.
    if ($("data") && !$("data").value) {
      $("data").value = new Date().toLocaleDateString("en-CA");
    }
  } catch (erro) {
    mostrarErro(erro);
  }
}

iniciar();

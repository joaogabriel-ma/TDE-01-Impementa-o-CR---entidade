// ============================================================
// Cadastro e listagem de Clientes com ViaCEP + CRUDCRUD
// ============================================================


const API_URL = "https://crudcrud.com/api/469ec39e3b444702b1ecc0d375d76e39/clientes";

const VIACEP_URL = "https://viacep.com.br/ws/";

// Elementos da página
const form = document.getElementById("form-cliente");
const campoCep = document.getElementById("cep");
const btnPesquisar = document.getElementById("btn-pesquisar");
const btnSalvar = document.getElementById("btn-salvar");
const btnAtualizar = document.getElementById("btn-atualizar");
const lista = document.getElementById("lista");
const caixaMensagem = document.getElementById("mensagem");

const campos = {
  nome: document.getElementById("nome"),
  email: document.getElementById("email"),
  cep: campoCep,
  logradouro: document.getElementById("logradouro"),
  numero: document.getElementById("numero"),
  complemento: document.getElementById("complemento"),
  bairro: document.getElementById("bairro"),
  cidade: document.getElementById("cidade"),
  uf: document.getElementById("uf"),
};

// ---------- Utilidades ----------

function mostrarMensagem(texto, tipo) {
  caixaMensagem.textContent = texto;
  caixaMensagem.className = "mensagem " + tipo;
  caixaMensagem.hidden = false;
}

function esconderMensagem() {
  caixaMensagem.hidden = true;
}

function somenteDigitos(valor) {
  return valor.replace(/\D/g, "");
}

function formatarCep(valor) {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

function endpointConfigurado() {
  return !API_URL.includes("COLE_SEU_CODIGO_AQUI");
}

function avisoSemEndpoint() {
  mostrarMensagem(
    "Falta configurar a URL da CRUDCRUD: abra o script.js e troque COLE_SEU_CODIGO_AQUI pelo código do seu endpoint.",
    "erro"
  );
}

// Máscara do CEP enquanto digita
campoCep.addEventListener("input", () => {
  campoCep.value = formatarCep(campoCep.value);
});

// ---------- Pesquisar CEP (ViaCEP) ----------

async function pesquisarCep() {
  esconderMensagem();
  const cep = somenteDigitos(campoCep.value);

  if (cep.length !== 8) {
    mostrarMensagem("Digite um CEP válido com 8 números.", "erro");
    campoCep.focus();
    return;
  }

  btnPesquisar.disabled = true;
  btnPesquisar.textContent = "Buscando...";

  try {
    const resposta = await fetch(VIACEP_URL + cep + "/json/");
    if (!resposta.ok) throw new Error("Falha na consulta ao ViaCEP.");

    const dados = await resposta.json();

    if (dados.erro) {
      mostrarMensagem("CEP não encontrado.", "erro");
      return;
    }

    campos.logradouro.value = dados.logradouro || "";
    campos.bairro.value = dados.bairro || "";
    campos.cidade.value = dados.localidade || "";
    campos.uf.value = dados.uf || "";

    campos.numero.focus();
    mostrarMensagem("Endereço preenchido. Complete o número e salve.", "info");
  } catch (erro) {
    mostrarMensagem("Não foi possível consultar o CEP. Tente novamente.", "erro");
  } finally {
    btnPesquisar.disabled = false;
    btnPesquisar.textContent = "Pesquisar";
  }
}

btnPesquisar.addEventListener("click", pesquisarCep);

// ---------- Salvar (CRUDCRUD - POST) ----------

async function salvarCliente(evento) {
  evento.preventDefault();
  esconderMensagem();

  if (!endpointConfigurado()) {
    avisoSemEndpoint();
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const cliente = {
    nome: campos.nome.value.trim(),
    email: campos.email.value.trim(),
    cep: campos.cep.value.trim(),
    logradouro: campos.logradouro.value.trim(),
    numero: campos.numero.value.trim(),
    complemento: campos.complemento.value.trim(),
    bairro: campos.bairro.value.trim(),
    cidade: campos.cidade.value.trim(),
    uf: campos.uf.value.trim().toUpperCase(),
  };

  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });

    if (!resposta.ok) throw new Error("Erro ao salvar (status " + resposta.status + ").");

    form.reset();
    mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
    await listarClientes();
  } catch (erro) {
    mostrarMensagem(
      "Não foi possível salvar. Verifique se a URL da CRUDCRUD no script.js está correta e ainda é válida (expira em 24h).",
      "erro"
    );
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = "Salvar";
  }
}

form.addEventListener("submit", salvarCliente);

// ---------- Listar (CRUDCRUD - GET) ----------

function criarLinhaVazia(texto) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 6;
  td.className = "vazio";
  td.textContent = texto;
  tr.appendChild(td);
  return tr;
}

function criarLinhaCliente(c) {
  const tr = document.createElement("tr");

  let endereco = (c.logradouro || "") + ", " + (c.numero || "s/n");
  if (c.complemento) endereco += " - " + c.complemento;

  const valores = [
    c.nome,
    c.email,
    c.cep,
    endereco,
    c.bairro,
    (c.cidade || "") + "/" + (c.uf || ""),
  ];

  valores.forEach((valor) => {
    const td = document.createElement("td");
    td.textContent = valor || "";
    tr.appendChild(td);
  });

  return tr;
}

async function listarClientes() {
  lista.replaceChildren();

  if (!endpointConfigurado()) {
    lista.appendChild(criarLinhaVazia("Configure a URL da CRUDCRUD no script.js para carregar a lista."));
    return;
  }

  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro ao listar (status " + resposta.status + ").");

    const clientes = await resposta.json();

    if (clientes.length === 0) {
      lista.appendChild(criarLinhaVazia("Nenhum cliente cadastrado ainda."));
      return;
    }

    clientes.forEach((c) => lista.appendChild(criarLinhaCliente(c)));
  } catch (erro) {
    lista.appendChild(
      criarLinhaVazia("Não foi possível carregar a lista. Confira a URL no script.js (ela expira em 24h).")
    );
  }
}

btnAtualizar.addEventListener("click", listarClientes);

// ---------- Início ----------

listarClientes();
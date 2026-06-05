// ============================================================
//  Papuli × Zunno.Digital — Gestão de Pedidos
//  Google Apps Script Web App
//
//  COMO USAR:
//  1. Crie um Google Sheets novo chamado "Papuli - Pedidos 2026"
//  2. Abra Extensions > Apps Script
//  3. Cole esse arquivo inteiro no editor
//  4. Clique em "Executar" → setupSheet() para formatar o sheet
//  5. Deploy > New deployment > Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Copie a URL e adicione no Vercel como APPS_SCRIPT_URL
// ============================================================

const SHEET_NAME = "Pedidos";

const COLUNAS = [
  "# Pedido",
  "Data",
  "Plano",
  "Valor (R$)",
  "Pagamento",
  "Nome",
  "WhatsApp",
  "Endereço",
  "Link Drive (fotos)",
  "Fotos recebidas?",
  "Status Produção",
  "Status Envio",
  "Rastreio",
  "Obs"
];

// Larguras das colunas em pixels
const LARGURAS = [130, 120, 190, 90, 140, 160, 130, 230, 210, 120, 145, 130, 160, 200];

// Índices (1-based) das colunas usadas no código
const COL_PEDIDO    = 1;
const COL_PAGAMENTO = 5;
const COL_NOME      = 6;
const COL_WHATSAPP  = 7;

// Cores do tema Papuli
const COR_HEADER_BG   = "#2b2a28";
const COR_HEADER_TEXT = "#f7efe0";
const COR_ACCENT      = "#c8302a";

// ── Setup: formata o sheet completo ─────────────────────────
function setupSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Move para primeira aba
    ss.moveActiveSheet(0);
  }

  // Limpa e escreve o cabeçalho
  sheet.clearFormats();
  sheet.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]);

  // Estilo do cabeçalho
  var header = sheet.getRange(1, 1, 1, COLUNAS.length);
  header.setBackground(COR_HEADER_BG);
  header.setFontColor(COR_HEADER_TEXT);
  header.setFontWeight("bold");
  header.setFontFamily("Arial");
  header.setFontSize(11);
  header.setHorizontalAlignment("left");
  header.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);

  // Largura das colunas
  COLUNAS.forEach(function(_, i) {
    sheet.setColumnWidth(i + 1, LARGURAS[i]);
  });

  // Congelar cabeçalho
  sheet.setFrozenRows(1);

  // Altura padrão das linhas de dados
  sheet.setRowHeightsForced(2, 500, 34);

  // Faixas alternadas nas linhas de dados
  var bandingRange = sheet.getRange(2, 1, 500, COLUNAS.length);
  var existentes   = sheet.getBandings();
  existentes.forEach(function(b) { b.remove(); });
  bandingRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);

  // ── Dropdowns ────────────────────────────────────────────
  // Coluna 10: Fotos recebidas?
  aplicarDropdown(sheet, 10, ["aguardando", "recebido", "com problema"]);
  // Coluna 11: Status Produção
  aplicarDropdown(sheet, 11, ["aguardando", "em produção", "pronto ✓"]);
  // Coluna 12: Status Envio
  aplicarDropdown(sheet, 12, ["aguardando", "postado", "entregue ✓"]);

  // ── Formatação condicional ──────────────────────────────
  var regras = [];
  var rangeStatus = sheet.getRange(2, 10, 500, 3); // Fotos / Producao / Envio

  // Verde — concluído
  ["pronto ✓", "entregue ✓", "recebido"].forEach(function(texto) {
    regras.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(texto)
        .setBackground("#c6efce")
        .setFontColor("#256c22")
        .setRanges([rangeStatus])
        .build()
    );
  });

  // Amarelo — em andamento
  ["em produção", "postado"].forEach(function(texto) {
    regras.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(texto)
        .setBackground("#fff2cc")
        .setFontColor("#7d5c00")
        .setRanges([rangeStatus])
        .build()
    );
  });

  // Vermelho — aguardando
  regras.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("aguardando")
      .setBackground("#fce8e6")
      .setFontColor("#c8302a")
      .setRanges([rangeStatus])
      .build()
  );

  // ── Coluna Pagamento (col 5): verde PAGO, amarelo aguardando ──
  var rangePgto = sheet.getRange(2, COL_PAGAMENTO, 500, 1);
  regras.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("PAGO")
      .setBackground("#c6efce")
      .setFontColor("#256c22")
      .setRanges([rangePgto])
      .build()
  );
  regras.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("aguardando")
      .setBackground("#fff2cc")
      .setFontColor("#7d5c00")
      .setRanges([rangePgto])
      .build()
  );

  sheet.setConditionalFormatRules(regras);

  // ── Formatação da coluna Valor (R$) ──────────────────────
  sheet.getRange(2, 4, 500)
    .setNumberFormat("R$ #,##0.00")
    .setFontWeight("bold")
    .setFontColor(COR_ACCENT);

  // ── Formatação da coluna # Pedido ────────────────────────
  sheet.getRange(2, 1, 500)
    .setFontFamily("Courier New")
    .setFontSize(10);

  SpreadsheetApp.flush();
  return "✓ Sheet 'Pedidos' configurado com sucesso!";
}

function aplicarDropdown(sheet, coluna, opcoes) {
  var regra = SpreadsheetApp.newDataValidation()
    .requireValueInList(opcoes)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, coluna, 500).setDataValidation(regra);
}

// ── Webhook / Checkout: registra ou atualiza pedido ──────────
// Duas fases:
//   origem "checkout" → cria a linha com Nome + WhatsApp, Pagamento "aguardando"
//   origem "webhook"  → acha a linha pelo # Pedido e marca Pagamento "PAGO ✓"
function doPost(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    var dados   = JSON.parse(e.postData.contents);
    var agora   = new Date();
    var dataStr = Utilities.formatDate(agora, "America/Sao_Paulo", "dd/MM/yyyy HH:mm");
    var origem  = dados.origem || "checkout";

    var pedidoId = (dados.pedido || "").toString().trim();
    var nome     = (dados.nome || "").toString().trim();
    var whatsapp = (dados.whatsapp || "").toString().trim();

    var plano = (dados.plano || "")
      .replace(/\s*\(Edicao Namorados 2026\)/gi, "")
      .trim();
    var total = parseFloat((dados.total || "0").toString().replace(",", ".")) || 0;

    // ── Procura linha existente pelo # Pedido ─────────────────
    var linhaExistente = 0;
    if (pedidoId) {
      var totalLinhas = sheet.getLastRow();
      if (totalLinhas >= 2) {
        var colA = sheet.getRange(2, 1, totalLinhas - 1, 1).getValues();
        for (var i = 0; i < colA.length; i++) {
          if (String(colA[i][0]).trim() === pedidoId) {
            linhaExistente = i + 2;
            break;
          }
        }
      }
    }

    // ── Linha já existe: atualiza ─────────────────────────────
    if (linhaExistente) {
      // preenche Nome/WhatsApp se vierem e estiverem vazios
      if (nome) {
        var celNome = sheet.getRange(linhaExistente, COL_NOME);
        if (!String(celNome.getValue()).trim()) celNome.setValue(nome);
      }
      if (whatsapp) {
        var celWa = sheet.getRange(linhaExistente, COL_WHATSAPP);
        if (!String(celWa.getValue()).trim()) celWa.setValue(whatsapp);
      }
      // webhook ou retorno do cliente confirmam pagamento
      if (origem === "webhook" || origem === "obrigado") {
        var celPgto = sheet.getRange(linhaExistente, COL_PAGAMENTO);
        if (String(celPgto.getValue()).indexOf("PAGO") === -1) {
          celPgto.setValue("PAGO ✓ " + dataStr);
          // Primeira confirmacao → dispara Purchase pro Meta (CAPI)
          var telCapi  = String(sheet.getRange(linhaExistente, COL_WHATSAPP).getValue()).trim() || whatsapp;
          var nomeCapi = String(sheet.getRange(linhaExistente, COL_NOME).getValue()).trim() || nome;
          var valCapi  = parseFloat(sheet.getRange(linhaExistente, 4).getValue()) || total;
          enviarPurchaseCAPI_(pedidoId, valCapi, plano, telCapi, nomeCapi);
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: "atualizado", linha: linhaExistente }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Linha nova ────────────────────────────────────────────
    var pago = (origem === "webhook" || origem === "obrigado");
    var statusPgto = pago ? ("PAGO ✓ " + dataStr) : "aguardando pgto";

    sheet.appendRow([
      pedidoId,            // # Pedido
      dataStr,             // Data
      plano,               // Plano
      total,               // Valor (R$)
      statusPgto,          // Pagamento
      nome,                // Nome
      whatsapp,            // WhatsApp
      "",                  // Endereço
      "",                  // Link Drive
      "aguardando",        // Fotos recebidas?
      "aguardando",        // Status Produção
      "aguardando",        // Status Envio
      "",                  // Rastreio
      ""                   // Obs
    ]);

    var ultimaLinha = sheet.getLastRow();
    sheet.getRange(ultimaLinha, 1, 1, COLUNAS.length)
      .setFontFamily("Arial")
      .setFontSize(10)
      .setVerticalAlignment("middle");

    // Se a linha ja nasceu paga (webhook/obrigado chegou antes do checkout), dispara CAPI
    if (pago) {
      enviarPurchaseCAPI_(pedidoId, total, plano, whatsapp, nome);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", linha: ultimaLinha }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "erro", mensagem: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Meta Conversions API (CAPI) ──────────────────────────────
// Dispara o evento "Purchase" direto pro Meta quando o pagamento confirma.
// Funciona mesmo no Pix sem retorno ao site (server-to-server).
// O token fica em: Projeto > Configuracoes (engrenagem) > Propriedades do script
//   chave: META_CAPI_TOKEN   valor: <token gerado no Gerenciador de Eventos>

var META_PIXEL_ID = "3350637735316682";
var META_API_VER  = "v21.0";

function getCapiToken_() {
  return PropertiesService.getScriptProperties().getProperty("META_CAPI_TOKEN") || "";
}

// SHA-256 em hex (exigido pelo Meta pra dados pessoais)
function sha256Hex_(str) {
  if (!str) return "";
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    str.toString().trim().toLowerCase(),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

// Telefone no formato que o Meta espera: digitos com codigo do pais (ex 5516981189075)
function normalizarTelefoneCapi_(tel) {
  var d = (tel || "").toString().replace(/\D/g, "");
  if (!d) return "";
  d = d.replace(/^0+/, "");
  if (d.length <= 11 && d.indexOf("55") !== 0) d = "55" + d;
  return d;
}

function enviarPurchaseCAPI_(pedidoId, valor, plano, telefone, nome) {
  try {
    var token = getCapiToken_();
    if (!token || !pedidoId) return;

    var userData = {};
    var telNorm = normalizarTelefoneCapi_(telefone);
    if (telNorm) userData.ph = [sha256Hex_(telNorm)];
    if (nome)    userData.fn = [sha256Hex_(nome.toString().split(" ")[0])];

    // Meta exige pelo menos 1 identificador no user_data
    if (!userData.ph && !userData.fn) return;

    var payload = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: pedidoId,            // dedup com o Pixel da pagina de obrigado
        event_source_url: "https://zunno.digital/namoradosobrigado",
        user_data: userData,
        custom_data: {
          currency: "BRL",
          value: Number(valor) || 0,
          content_name: plano || "Album Papuli",
          content_type: "product",
          order_id: pedidoId
        }
      }]
    };

    var url = "https://graph.facebook.com/" + META_API_VER + "/" +
              META_PIXEL_ID + "/events?access_token=" + encodeURIComponent(token);

    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    // nunca quebra o registro do pedido se o CAPI falhar
  }
}

// ── GET: health check ────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput("Papuli Order Logger ativo ✓")
    .setMimeType(ContentService.MimeType.TEXT);
}

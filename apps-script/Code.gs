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
const LARGURAS = [130, 120, 190, 90, 160, 130, 230, 210, 120, 145, 130, 160, 200];

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
  // Coluna 9: Fotos recebidas?
  aplicarDropdown(sheet, 9, ["aguardando", "recebido", "com problema"]);
  // Coluna 10: Status Produção
  aplicarDropdown(sheet, 10, ["aguardando", "em produção", "pronto ✓"]);
  // Coluna 11: Status Envio
  aplicarDropdown(sheet, 11, ["aguardando", "postado", "entregue ✓"]);

  // ── Formatação condicional (colunas 9–11) ───────────────
  var regras = [];
  var range  = sheet.getRange(2, 9, 500, 3);

  // Verde — concluído
  ["pronto ✓", "entregue ✓", "recebido"].forEach(function(texto) {
    regras.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(texto)
        .setBackground("#c6efce")
        .setFontColor("#256c22")
        .setRanges([range])
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
        .setRanges([range])
        .build()
    );
  });

  // Vermelho — aguardando
  regras.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("aguardando")
      .setBackground("#fce8e6")
      .setFontColor("#c8302a")
      .setRanges([range])
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

// ── Webhook: recebe pedido e adiciona linha ──────────────────
function doPost(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Cria e formata o sheet se não existir
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    var dados   = JSON.parse(e.postData.contents);
    var agora   = new Date();
    var dataStr = Utilities.formatDate(agora, "America/Sao_Paulo", "dd/MM/yyyy HH:mm");

    // Limpa o plano para ficar legível (remove "Edicao Namorados 2026" etc.)
    var plano = (dados.plano || "")
      .replace(/\s*\(Edicao Namorados 2026\)/gi, "")
      .trim();

    // Total numérico
    var total = parseFloat(
      (dados.total || "0").toString().replace(",", ".")
    ) || 0;

    sheet.appendRow([
      dados.pedido || "",  // # Pedido
      dataStr,             // Data
      plano,               // Plano
      total,               // Valor (R$)
      "",                  // Nome
      "",                  // WhatsApp
      "",                  // Endereço
      "",                  // Link Drive
      "aguardando",        // Fotos recebidas?
      "aguardando",        // Status Produção
      "aguardando",        // Status Envio
      "",                  // Rastreio
      ""                   // Obs
    ]);

    // Estilo da linha recém-adicionada
    var ultimaLinha = sheet.getLastRow();
    sheet.getRange(ultimaLinha, 1, 1, COLUNAS.length)
      .setFontFamily("Arial")
      .setFontSize(10)
      .setVerticalAlignment("middle");

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", linha: ultimaLinha }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "erro", mensagem: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET: health check ────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput("Papuli Order Logger ativo ✓")
    .setMimeType(ContentService.MimeType.TEXT);
}

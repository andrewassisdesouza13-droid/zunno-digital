// Vercel Serverless Function: webhook da InfinitePay
// Endpoint: POST /api/infinitepay-webhook
//
// A InfinitePay chama essa URL no servidor dela toda vez que um pagamento
// é CONFIRMADO — independente do cliente voltar pra pagina de obrigado.
// Isso resolve o caso do Pix (cliente paga e fecha o app sem voltar pro site).
//
// CONFIGURAR no painel InfinitePay (Configuracoes > Webhook):
//   https://zunno.digital/api/infinitepay-webhook
//
// Payload que a InfinitePay envia:
//   { order_nsu, transaction_nsu, invoice_slug, amount, paid_amount,
//     installments, capture_method, receipt_url, items: [...] }

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const body = req.body || {};

    // # Pedido = order_nsu (o mesmo que geramos ao criar o checkout)
    const pedido = body.order_nsu || body.transaction_nsu || "";

    // Plano = descricao do primeiro item
    let plano = "";
    if (Array.isArray(body.items) && body.items.length > 0) {
      plano = body.items[0].description || body.items[0].name || "";
    }

    // Valor: paid_amount (ou amount) vem em centavos
    const centavos = body.paid_amount || body.amount || 0;
    const total = (Number(centavos) / 100).toFixed(2).replace(".", ",");

    const pagamento =
      body.capture_method === "pix" ? "Pix" :
      body.capture_method === "credit_card" ? "Cartao" :
      (body.capture_method || "");

    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

    // Encaminha pro Apps Script (mesmo endpoint do log-order).
    // O Apps Script tem dedup por # Pedido, entao se a pagina de obrigado
    // ja tiver registrado, aqui nao duplica.
    if (APPS_SCRIPT_URL && pedido) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedido, plano, total, pagamento, origem: "webhook" })
        });
      } catch (e) {
        console.error("Erro ao encaminhar webhook pro Apps Script:", e);
      }
    }

    // Responde 200 rapido (InfinitePay exige < 1s)
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("webhook error:", err);
    // 200 mesmo em erro pra InfinitePay nao ficar reenviando infinitamente
    res.status(200).json({ status: "error", message: err.message });
  }
};

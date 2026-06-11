// Vercel Serverless Function: cria um link de checkout na InfinitePay
// Endpoint: POST /api/infinitepay-checkout
// Body: { plano, nome, whatsapp }

const HANDLE = "estudio-papuli";
const REDIRECT_BASE = "https://zunno.digital/namoradosobrigado";

// Preços com frete embutido (em centavos)
const PLANOS = {
  essencial: {
    description: "Box de 8 Polaroids + 3 Ferrero Rocher (Edicao Namorados 2026)",
    price: 5790,
    quantity: 1
  },
  polaroid: {
    description: "Album com 14 Figurinhas + 8 Polaroids + 3 Ferrero Rocher (Edicao Namorados 2026)",
    price: 9790,
    quantity: 1
  },
  prasempre: {
    description: "Site Personalizado do Casal (Edicao Namorados 2026)",
    price: 4990,
    quantity: 1
  }
};

// Normaliza o telefone pro formato +55DDDNUMERO
function normalizarTelefone(raw) {
  let digitos = (raw || "").replace(/\D/g, "");
  if (!digitos) return "";
  // remove zeros à esquerda
  digitos = digitos.replace(/^0+/, "");
  // se já vier com 55 na frente, mantém; senão prefixa
  if (!digitos.startsWith("55")) digitos = "55" + digitos;
  return "+" + digitos;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const { plano, nome, whatsapp } = req.body || {};
    const produto = PLANOS[plano];
    if (!produto) {
      res.status(400).json({ error: "plano invalido" });
      return;
    }

    const nomeLimpo = (nome || "").toString().trim().slice(0, 80);
    const telefone = normalizarTelefone(whatsapp);

    const orderNsu = Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    const totalStr = (produto.price / 100).toFixed(2).replace(".", ",");
    const redirectUrl = REDIRECT_BASE +
      "?pedido=" + encodeURIComponent(orderNsu) +
      "&plano=" + encodeURIComponent(produto.description) +
      "&total=" + encodeURIComponent(totalStr);

    // Monta o body da InfinitePay, com customer pra pré-preencher o checkout
    const ipBody = {
      handle: HANDLE,
      redirect_url: redirectUrl,
      webhook_url: "https://zunno.digital/api/infinitepay-webhook",
      order_nsu: orderNsu,
      items: [produto]
    };

    if (nomeLimpo || telefone) {
      ipBody.customer = {};
      if (nomeLimpo) ipBody.customer.name = nomeLimpo;
      if (telefone) ipBody.customer.phone_number = telefone;
    }

    const ipResp = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ipBody)
    });

    const text = await ipResp.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!ipResp.ok) {
      console.error("InfinitePay error", ipResp.status, data);
      res.status(502).json({ error: "infinitepay error", status: ipResp.status, body: data });
      return;
    }

    if (!data.url) {
      res.status(502).json({ error: "url ausente na resposta", body: data });
      return;
    }

    // Registra o pedido na planilha JÁ AGORA (com nome + whatsapp), status
    // "aguardando pgto". O webhook marca como PAGO quando o pagamento confirmar.
    // Nunca quebra o checkout se o log falhar.
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (APPS_SCRIPT_URL) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000); // cap de 5s pra não travar o checkout
        await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pedido: orderNsu,
            plano: produto.description,
            total: totalStr,
            nome: nomeLimpo,
            whatsapp: (whatsapp || "").toString().trim(),
            origem: "checkout"
          }),
          signal: ctrl.signal
        });
        clearTimeout(t);
      } catch (e) {
        console.error("Erro ao registrar checkout no Sheets:", e);
      }
    }

    res.status(200).json({ url: data.url, pedido: orderNsu });
  } catch (err) {
    console.error("server error", err);
    res.status(500).json({ error: "server error", message: err.message });
  }
};

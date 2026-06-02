// Vercel Serverless Function: cria um link de checkout na InfinitePay
// Endpoint: POST /api/infinitepay-checkout
// Body: { plano: "essencial" | "polaroid" | "prasempre" }

const HANDLE = "andrew-assis";
const REDIRECT_BASE = "https://zunno.digital/namoradosobrigado";

// Preços já incluem R$ 15 de frete pra cidades vizinhas
const PLANOS = {
  essencial: {
    description: "TESTE - Album de Figurinhas (Edicao Namorados 2026)",
    // !!! MODO TESTE: R$ 1,00 (100 centavos). REVERTER PARA 7290 DEPOIS DO TESTE.
    price: 100,
    quantity: 1
  },
  polaroid: {
    description: "Album de Figurinhas + 10 Polaroids (Edicao Namorados 2026) - com frete",
    price: 11290,
    quantity: 1
  },
  prasempre: {
    description: "Album + Polaroids + Site Personalizado (Edicao Namorados 2026) - com frete",
    price: 16290,
    quantity: 1
  }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const { plano } = req.body || {};
    const produto = PLANOS[plano];
    if (!produto) {
      res.status(400).json({ error: "plano invalido" });
      return;
    }

    const orderNsu = Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    const totalStr = (produto.price / 100).toFixed(2).replace(".", ",");
    const redirectUrl = REDIRECT_BASE +
      "?pedido=" + encodeURIComponent(orderNsu) +
      "&plano=" + encodeURIComponent(produto.description) +
      "&total=" + encodeURIComponent(totalStr);

    const ipResp = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: HANDLE,
        redirect_url: redirectUrl,
        order_nsu: orderNsu,
        items: [produto]
      })
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

    res.status(200).json({ url: data.url, pedido: orderNsu });
  } catch (err) {
    console.error("server error", err);
    res.status(500).json({ error: "server error", message: err.message });
  }
};

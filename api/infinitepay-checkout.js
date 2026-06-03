// Vercel Serverless Function: cria um link de checkout na InfinitePay
// Endpoint: POST /api/infinitepay-checkout
// Body: { plano: "essencial" | "polaroid" | "prasempre" }

const HANDLE = "estudio-papuli";
const REDIRECT_BASE = "https://zunno.digital/namoradosobrigado";

// Preços com frete embutido
const PLANOS = {
  essencial: {
    description: "Box de 16 Polaroids + 3 Ferrero Rocher (Edicao Namorados 2026)",
    price: 5790,
    quantity: 1
  },
  polaroid: {
    description: "Album com 14 Figurinhas + 16 Polaroids + 3 Ferrero Rocher (Edicao Namorados 2026)",
    price: 9790,
    quantity: 1
  },
  prasempre: {
    description: "Album + Polaroids + Ferrero + Site Personalizado (Edicao Namorados 2026)",
    price: 15790,
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

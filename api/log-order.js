// Vercel Serverless Function: registra pedido no Google Sheets via Apps Script
// Endpoint: POST /api/log-order
// Body: { pedido, plano, total }
// Chamado pela página namoradosobrigado.html quando há params válidos na URL

module.exports = async (req, res) => {
  // Permite apenas mesma origem
  res.setHeader("Access-Control-Allow-Origin", "https://zunno.digital");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { pedido, plano, total, origem } = req.body || {};

  if (!pedido || !plano) {
    return res.status(400).json({ error: "dados insuficientes" });
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    console.error("APPS_SCRIPT_URL não configurada nas env vars do Vercel");
    return res.status(500).json({ error: "not configured" });
  }

  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedido, plano, total, origem: origem || "obrigado" }),
      redirect: "follow"
    });

    const text = await resp.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    if (!resp.ok) {
      console.error("Apps Script error", resp.status, data);
      return res.status(502).json({ error: "apps script error", body: data });
    }

    return res.status(200).json({ status: "ok", ...data });

  } catch (err) {
    console.error("Erro ao chamar Apps Script:", err);
    return res.status(500).json({ error: err.message });
  }
};

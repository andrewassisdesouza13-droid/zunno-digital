const DEFAULT_CONFIG = {
  brand: "Zunno.Digital",
  whatsappPhone: "5500000000000",
  seo: {
    title: "Zunno.Digital | Marketing digital sob medida para garagens",
    description:
      "Estratégia, conteúdo e tráfego sob medida para garagens, revendas e multimarcas que querem transformar estoque em conversa de venda real."
  },
  messages: {
    primary: "Quero conversar com a Zunno.Digital sobre minha garagem",
    final: "Quero falar com a Zunno.Digital sobre minha garagem",
    default: "Quero falar com a Zunno.Digital"
  }
};

let activeConfig = DEFAULT_CONFIG;

const buildWhatsAppUrl = (phone, message) => {
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
};

const applyWhatsAppLinks = (config) => {
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    const messageKey = link.dataset.messageKey;
    const message = config.messages[messageKey] || link.dataset.message || config.messages.default;
    link.href = buildWhatsAppUrl(config.whatsappPhone, message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
};

const applyConfig = (config) => {
  activeConfig = config;
  document.title = config.seo.title;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = config.seo.description;
  }

  applyWhatsAppLinks(config);
};

const loadConfig = async () => {
  try {
    const response = await fetch("site.config.json", { cache: "no-store" });
    if (!response.ok) {
      return DEFAULT_CONFIG;
    }

    const externalConfig = await response.json();
    return {
      ...DEFAULT_CONFIG,
      ...externalConfig,
      seo: { ...DEFAULT_CONFIG.seo, ...externalConfig.seo },
      messages: { ...DEFAULT_CONFIG.messages, ...externalConfig.messages }
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

/* Word-by-word reveal: split heading text into spans for staggered animation */
const setupWordReveal = () => {
  document.querySelectorAll("h1, h2.section-title").forEach((el) => {
    if (el.dataset.wordsReady === "true") return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().length > 0) textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      const parts = textNode.textContent.split(/(\s+)/);
      parts.forEach((part) => {
        if (part.trim().length === 0) {
          fragment.append(document.createTextNode(part));
        } else {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = part;
          fragment.append(span);
        }
      });
      textNode.parentNode.replaceChild(fragment, textNode);
    });

    el.classList.add("has-word-reveal");
    el.dataset.wordsReady = "true";

    const words = el.querySelectorAll(".word");
    words.forEach((w, i) => {
      w.style.transitionDelay = `${Math.min(i * 50, 600)}ms`;
    });
  });
};

setupWordReveal();

const revealItems = document.querySelectorAll("[data-reveal], .has-word-reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item, index) => {
  if (!item.classList.contains("has-word-reveal")) {
    item.style.transitionDelay = `${Math.min(index * 24, 200)}ms`;
  }
  revealObserver.observe(item);
});

/* ─── Delivery section: desktop dots + mobile slider dots ─── */

const initDelivery = () => {
  const cards = [...document.querySelectorAll('.dc')];
  const desktopDots = [...document.querySelectorAll('.ddot')];
  const mobileDotsWrap = document.getElementById('deliveryMobileDots');
  const mobileDots = mobileDotsWrap ? [...mobileDotsWrap.children] : [];
  const deliveryCards = document.getElementById('deliveryCards');

  if (!cards.length) return;

  /* Desktop: update active dot based on scroll position of each sticky card */
  const updateDesktopDot = () => {
    let activeIdx = 0;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      // card is "in view" when its top is within the sticky band
      if (rect.top <= window.innerHeight * 0.55) activeIdx = i;
    });
    desktopDots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIdx);
    });
  };

  /* Mobile: scroll snap — update dots on scroll */
  const updateMobileDots = () => {
    if (!deliveryCards) return;
    const cardWidth = cards[0]?.offsetWidth || 1;
    const scrollLeft = deliveryCards.scrollLeft;
    const activeIdx = Math.round(scrollLeft / (cardWidth + 14));
    mobileDots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIdx);
    });
  };

  window.addEventListener('scroll', updateDesktopDot, { passive: true });
  deliveryCards?.addEventListener('scroll', updateMobileDots, { passive: true });

  updateDesktopDot();
  updateMobileDots();
};

initDelivery();

loadConfig().then(applyConfig);

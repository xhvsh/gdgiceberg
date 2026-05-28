const tooltipPortal = document.getElementById("tooltip-portal");
let activeCard = null;

function positionTooltip(card) {
  const rect = card.getBoundingClientRect();
  const portalW = tooltipPortal.offsetWidth || 300;
  const portalH = tooltipPortal.offsetHeight || 60;
  const margin = 10;
  const caretH = 7;

  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const showBelow = spaceAbove < portalH + caretH + margin && spaceBelow > spaceAbove;

  let top, left;
  if (showBelow) {
    top = rect.bottom + caretH + margin;
    tooltipPortal.classList.remove("caret-down");
    tooltipPortal.classList.add("caret-up");
  } else {
    top = rect.top - portalH - caretH - margin;
    tooltipPortal.classList.remove("caret-up");
    tooltipPortal.classList.add("caret-down");
  }

  left = rect.left + rect.width / 2 - portalW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - portalW - margin));

  tooltipPortal.style.top = `${top}px`;
  tooltipPortal.style.left = `${left}px`;
}

function showTooltip(card, text) {
  activeCard = card;
  const isEmpty = !text || text.trim() === "";
  tooltipPortal.innerHTML = isEmpty ? "<em>No explanation yet</em>" : text;
  tooltipPortal.setAttribute("aria-hidden", "false");

  tooltipPortal.style.visibility = "hidden";
  tooltipPortal.classList.add("visible");
  requestAnimationFrame(() => {
    positionTooltip(card);
    tooltipPortal.style.visibility = "";
  });
}

function hideTooltip() {
  tooltipPortal.classList.remove("visible");
  tooltipPortal.setAttribute("aria-hidden", "true");
  activeCard = null;
}

window.addEventListener(
  "scroll",
  () => {
    if (activeCard) positionTooltip(activeCard);
  },
  { passive: true },
);

window.addEventListener(
  "resize",
  () => {
    if (activeCard) positionTooltip(activeCard);
  },
  { passive: true },
);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".content")) hideTooltip();
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const rect = entry.target.getBoundingClientRect();
        const stagger = Math.round(rect.left / 80) * 40;
        entry.target.style.transitionDelay = `${stagger}ms`;
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 },
);

// data fetching and error handling
const container = document.getElementById("container");
const loader = document.getElementById("loader");
const errorState = document.getElementById("error-state");
const retryBtn = document.getElementById("retry-btn");

retryBtn.addEventListener("click", () => {
  errorState.hidden = true;
  loader.hidden = false;
  loader.classList.remove("hidden");
  container.innerHTML = "";
  getData();
});

async function getData() {
  try {
    const gistRes = await fetch("https://api.github.com/gists/ec578df51c8684fd9729ee86958c4dbc");
    if (!gistRes.ok) throw new Error(`Gist fetch failed: ${gistRes.status}`);

    const gistJson = await gistRes.json();
    const rawUrl = gistJson.files["api.json"].raw_url;

    const dataRes = await fetch(rawUrl);
    if (!dataRes.ok) throw new Error(`Data fetch failed: ${dataRes.status}`);

    const data = await dataRes.json();
    if (!Array.isArray(data?.data)) throw new Error("Invalid data shape");

    data.data.forEach((item) => {
      if (!item?.phrase) return;

      const hasExplanation = item.explanation && item.explanation.trim() !== "" && item.explanation !== "Samborowi nie chcialo sie dodawac wyjasnienia";

      const explanationText = hasExplanation ? item.explanation : "";

      const el = document.createElement("div");
      el.className = "content";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.textContent = item.phrase;

      if (window.matchMedia("(hover: hover)").matches) {
        el.addEventListener("mouseenter", () => showTooltip(el, explanationText));
        el.addEventListener("mouseleave", hideTooltip);
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        el.blur();
        showTooltip(el, explanationText);
      });

      container.appendChild(el);
      observer.observe(el);
    });

    loader.classList.add("hidden");
    setTimeout(() => {
      loader.hidden = true;
    }, 400);
  } catch (err) {
    console.error(err);
    loader.classList.add("hidden");
    setTimeout(() => {
      loader.hidden = true;
      errorState.hidden = false;
    }, 400);
  }
}

getData();

// back to top
const backToTop = document.getElementById("back-to-top");

window.addEventListener(
  "scroll",
  () => {
    if (window.scrollY > 400) {
      backToTop.hidden = false;
      requestAnimationFrame(() => backToTop.classList.add("visible"));
    } else {
      backToTop.classList.remove("visible");
      setTimeout(() => {
        if (!backToTop.classList.contains("visible")) backToTop.hidden = true;
      }, 280);
    }
  },
  { passive: true },
);

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

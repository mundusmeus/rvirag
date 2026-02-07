const content = document.getElementById("content");
const menuLinks = document.querySelectorAll("[data-page]");
const useIframe = window.location.protocol === "file:";
let iframe = null;
const lightbox = document.getElementById("lightbox");
const lightboxImage = lightbox?.querySelector(".lightbox__image");
const lightboxPrev = lightbox?.querySelector(".lightbox__nav--prev");
const lightboxNext = lightbox?.querySelector(".lightbox__nav--next");
const lightboxCloseTargets = lightbox?.querySelectorAll("[data-lightbox-close]") ?? [];
let lightboxItems = [];
let lightboxIndex = 0;

const setActive = (targetLink) => {
  menuLinks.forEach((link) => link.classList.remove("active"));
  if (targetLink) {
    targetLink.classList.add("active");
  }
};

const openLightbox = (index) => {
  if (!lightbox || !lightboxImage || lightboxItems.length === 0) {
    return;
  }
  lightboxIndex = index;
  const item = lightboxItems[lightboxIndex];
  lightboxImage.src = item.dataset.src;
  lightboxImage.alt = item.dataset.alt || "Nagyított kép";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) {
    return;
  }
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  document.body.classList.remove("lightbox-open");
};

const showLightboxItem = (direction) => {
  if (!lightboxItems.length) {
    return;
  }
  lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
  openLightbox(lightboxIndex);
};

const initLightbox = () => {
  if (!content || !lightbox) {
    return;
  }
  lightboxItems = Array.from(content.querySelectorAll(".lightbox-thumb"));
  lightboxItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index));
  });
};

const loadPage = async (url, pushState = true) => {
  if (!content) {
    return;
  }

  if (useIframe) {
    content.classList.add("content--iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.className = "content-frame";
      iframe.title = "Tartalom";
      content.innerHTML = "";
      content.appendChild(iframe);
    }
    iframe.src = url;
    if (pushState) {
      history.pushState({ url }, "", `#${url}`);
    }
    return;
  }

  content.classList.remove("content--iframe");
  content.innerHTML = "<div class=\"loading\">Betöltés...</div>";

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Nem található az oldal.");
    }
    const html = await response.text();
    content.innerHTML = html;
    initLightbox();
    if (pushState) {
      history.pushState({ url }, "", `#${url}`);
    }
  } catch (error) {
    content.innerHTML = `<p>Hiba történt a betöltéskor. (${error.message})</p>`;
  }
};

menuLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const url = link.dataset.page;
    setActive(link);
    loadPage(url);
  });
});

window.addEventListener("popstate", (event) => {
  const url = event.state?.url;
  if (url) {
    const target = [...menuLinks].find((link) => link.dataset.page === url);
    setActive(target);
    loadPage(url, false);
  }
});

const initialHash = window.location.hash.replace("#", "");
const initialLink = [...menuLinks].find((link) => link.dataset.page === initialHash);
if (initialHash && initialLink) {
  setActive(initialLink);
  loadPage(initialHash, false);
} else {
  const first = menuLinks[0];
  setActive(first);
  if (first) {
    loadPage(first.dataset.page, false);
  }
}

if (lightbox) {
  lightboxCloseTargets.forEach((target) => {
    target.addEventListener("click", closeLightbox);
  });

  lightboxPrev?.addEventListener("click", () => showLightboxItem(-1));
  lightboxNext?.addEventListener("click", () => showLightboxItem(1));
}

document.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("is-open")) {
    return;
  }
  if (event.key === "Escape") {
    closeLightbox();
  }
  if (event.key === "ArrowLeft") {
    showLightboxItem(-1);
  }
  if (event.key === "ArrowRight") {
    showLightboxItem(1);
  }
});

const pages = [];
const bodies = new Map();

const docEl = document.querySelector("#doc");
const crumbEl = document.querySelector("#crumb");
const navEl = document.querySelector("#nav");
const hitsEl = document.querySelector("#hits");
const vizEl = document.querySelector("#viz");
const frameEl = document.querySelector("#frame");
const pagerEl = document.querySelector("#pager");
const searchEl = document.querySelector("#q");

const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  const plain = text.replace(/<[^>]+>/g, "");
  const id = slug(plain);
  return `<h${level} id="${id}">${text}</h${level}>`;
};
renderer.code = function (code) {
  return `<pre><code>${highlight(code)}</code></pre>`;
};
renderer.link = function (href, title, text) {
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
  const mapped = mapLink(href);
  if (mapped.external) {
    return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
  return `<a href="${escapeHtml(mapped.href)}"${titleAttr}>${text}</a>`;
};
marked.setOptions({ renderer, gfm: true, headerIds: false, mangle: false });

let current = null;

boot();

async function boot() {
  const catalog = await fetch("catalog.json").then((r) => r.json());
  pages.push(...catalog.pages);
  renderNav();
  await Promise.all(pages.map(loadBody));
  const opening = parseHash() || pages[0].id;
  show(opening, { scroll: false });
  window.addEventListener("hashchange", () => {
    const next = parseHash();
    if (next) show(next, { scroll: false });
  });
  searchEl.addEventListener("input", () => renderHits(searchEl.value.trim()));
  window.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== searchEl) {
      event.preventDefault();
      searchEl.focus();
    }
  });
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!raw) return "";
  return raw.split("/")[0];
}

function anchorFromHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ""));
  const parts = raw.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : "";
}

async function loadBody(page) {
  const response = await fetch(page.file);
  const text = await response.text();
  bodies.set(page.id, text);
}

function renderNav() {
  const groups = [];
  for (const page of pages) {
    let group = groups.find((g) => g.section === page.section);
    if (!group) {
      group = { section: page.section, pages: [] };
      groups.push(group);
    }
    group.pages.push(page);
  }
  navEl.innerHTML = groups.map((group) => `
    <div class="nav-section">
      <div>${escapeHtml(group.section)}</div>
      <ul>
        ${group.pages.map((page) => `<li><button type="button" data-id="${page.id}">${escapeHtml(page.title)}</button></li>`).join("")}
      </ul>
    </div>
  `).join("");
  navEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    location.hash = button.dataset.id;
  });
}

function show(id, options) {
  const page = pages.find((item) => item.id === id) || pages[0];
  current = page;
  const markdown = bodies.get(page.id) || "_Missing chapter._";
  docEl.innerHTML = marked.parse(markdown);
  crumbEl.textContent = `${page.section}  ·  ${page.title}`;
  document.title = `${page.title} · Godot Studio Handbook`;
  for (const button of navEl.querySelectorAll("button[data-id]")) {
    if (button.dataset.id === page.id) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  if (page.sketch) {
    vizEl.hidden = false;
    const nextSrc = page.sketch;
    if (frameEl.getAttribute("src") !== nextSrc) frameEl.src = nextSrc;
  } else {
    vizEl.hidden = true;
    frameEl.removeAttribute("src");
  }
  renderPager(page);
  const anchor = anchorFromHash();
  if (anchor) {
    const target = document.getElementById(anchor);
    if (target) target.scrollIntoView();
  } else if (!options || options.scroll !== false) {
    window.scrollTo(0, 0);
  }
  if (!anchor) window.scrollTo(0, 0);
}

function renderPager(page) {
  const index = pages.indexOf(page);
  const previous = pages[index - 1];
  const next = pages[index + 1];
  pagerEl.innerHTML = `
    ${previous ? `<button type="button" data-id="${previous.id}">← ${escapeHtml(previous.title)}</button>` : "<span></span>"}
    ${next ? `<button type="button" data-id="${next.id}">${escapeHtml(next.title)} →</button>` : "<span></span>"}
  `;
  pagerEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = button.dataset.id;
    });
  });
}

function renderHits(query) {
  if (!query) {
    hitsEl.innerHTML = "";
    return;
  }
  const needle = query.toLowerCase();
  const hits = [];
  for (const page of pages) {
    const text = strip(bodies.get(page.id) || "");
    const at = text.toLowerCase().indexOf(needle);
    if (at < 0 && !page.title.toLowerCase().includes(needle)) continue;
    const excerpt = at < 0 ? page.section : excerptAt(text, at, needle.length);
    hits.push({ page, excerpt });
  }
  hitsEl.innerHTML = hits.slice(0, 12).map((hit) => `
    <li class="hit">
      <button type="button" data-id="${hit.page.id}">
        <strong>${escapeHtml(hit.page.title)}</strong>
        <span>${escapeHtml(hit.excerpt)}</span>
      </button>
    </li>
  `).join("") || `<li class="hit"><span class="empty">No matches.</span></li>`;
  hitsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      location.hash = button.dataset.id;
      searchEl.blur();
    });
  });
}

function mapLink(href) {
  if (!href || /^(https?:|mailto:)/.test(href)) return { href, external: true };
  const [pathPart, anchor] = href.split("#");
  if (!pathPart.endsWith(".md")) return { href, external: false };
  const base = current.file.replace(/[^/]*$/, "");
  const resolved = normalize(base + pathPart);
  const target = pages.find((page) => normalize(page.file) === resolved);
  if (!target) return { href, external: false };
  return { href: `#${target.id}${anchor ? "/" + slug(anchor) : ""}`, external: false };
}

function normalize(path) {
  const parts = [];
  for (const part of path.split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}

function strip(markdown) {
  return markdown.replace(/[#>*_`\[\]]/g, " ").replace(/\s+/g, " ").trim();
}

function excerptAt(text, index, length) {
  const start = Math.max(0, index - 42);
  const end = Math.min(text.length, index + length + 68);
  return `${start ? "…" : ""}${text.slice(start, end).trim()}…`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(code) {
  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\/\/.*|#.*)|(\b(?:extends|class_name|func|var|const|signal|enum|if|elif|else|for|while|match|return|await|preload|load|and|or|not|in|pass|break|continue|public|private|partial|override|void|float|int|string|bool|using|new|true|false|null|this|base|async|static|export)\b)|(\b\d+\.?\d*\b)/g;
  let html = "";
  let last = 0;
  for (const match of code.matchAll(re)) {
    html += escapeHtml(code.slice(last, match.index));
    const token = match[0];
    const kind = match[1] ? "s" : match[2] ? "c" : match[3] ? "k" : "n";
    html += `<span class="tok-${kind}">${escapeHtml(token)}</span>`;
    last = match.index + token.length;
  }
  html += escapeHtml(code.slice(last));
  return html;
}

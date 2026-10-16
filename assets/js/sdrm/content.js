// Site text for every SDRM page, from GET /api/sdrm/content. The HTML only has empty,
// marked placeholders; this module fills them once per page load.
//
// Markup (a key starting with "." is read from the current list item, "limits.x" from the form limits):
//   data-sdrm-text="give.title"           text; may use **bold**, *italic*, `code` and [links](/path/).
//                                         Hidden when the server has no value for it.
//   data-sdrm-attr="href:.href,alt:k"     attributes; href/src resolve "/path/" against the site's base URL
//   data-sdrm-modifier="sdrm__button:.tone"   adds the class sdrm__button--<tone>
//   data-sdrm-icon=".icon"                on an <svg><use>: points it at #sdrm-icon-<icon>
//   data-sdrm-current                     on a link: aria-current="page" when it points at this page
//   <template data-sdrm-list="site.nav">  one copy of the template per item, inserted before it
//   <title data-sdrm-title="give.title">  "<value> | <site.name>"; an empty key gives just the site name
import { baseurl } from "../api/config.js";
import { loadData, el, NetworkError } from "./common.js";

/** Resolves with { content, limits }; rejects when the server can't be reached. Shared by every script. */
export const siteData = loadData("/api/sdrm/content");

const SAFE_WORD = /^[a-z][a-z-]*$/;

/** "/sdrm/give/" -> "<baseurl>/sdrm/give/"; http(s) and #fragments as they are; anything else is dropped. */
function resolveUrl(value) {
  const text = String(value);
  if (/^https?:\/\//i.test(text) || text.startsWith("#")) return text;
  if (text.startsWith("/")) return baseurl + text;
  return "#";
}

/** Inline markup to DOM nodes, without innerHTML. */
function inline(text) {
  const nodes = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, strong, em, code, linkText, href] = match;
    if (strong) nodes.push(el("strong", { text: strong }));
    else if (em) nodes.push(el("em", { text: em }));
    else if (code) nodes.push(el("code", { text: code }));
    else {
      const url = resolveUrl(href);
      nodes.push(el("a", { text: linkText, attrs: /^https?:/i.test(url) ? { href: url, rel: "noopener" } : { href: url } }));
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function lookup(data, item, key) {
  if (key.startsWith(".")) return item ? item[key.slice(1)] : undefined;
  if (key.startsWith("limits.")) return data.limits[key.slice("limits.".length)];
  return data.content[key];
}

const isEmpty = (value) => value === undefined || value === null || value === "";

/** This page's path without the base URL, e.g. "/sdrm/give/". */
function pagePath(pathname) {
  const path = pathname.startsWith(baseurl) ? pathname.slice(baseurl.length) : pathname;
  return path.replace(/index\.html$/, "") || "/";
}

/** Fill every placeholder inside `root` (a document or a cloned template). */
function fill(root, data, item) {
  root.querySelectorAll("template[data-sdrm-list]").forEach((template) => {
    const items = lookup(data, item, template.dataset.sdrmList);
    template.removeAttribute("data-sdrm-list");
    if (!Array.isArray(items)) return;
    template.before(
      ...items.map((entry) => {
        const copy = template.content.cloneNode(true);
        fill(copy, data, entry);
        return copy;
      })
    );
  });

  root.querySelectorAll("[data-sdrm-text]").forEach((node) => {
    const value = lookup(data, item, node.dataset.sdrmText);
    node.removeAttribute("data-sdrm-text");
    if (isEmpty(value)) {
      node.hidden = true;
      return;
    }
    node.replaceChildren(...inline(String(value)));
  });

  root.querySelectorAll("[data-sdrm-attr]").forEach((node) => {
    node.dataset.sdrmAttr.split(",").forEach((pair) => {
      const [name, key] = pair.split(":").map((s) => s.trim());
      const value = lookup(data, item, key);
      if (isEmpty(value)) return;
      node.setAttribute(name, name === "href" || name === "src" ? resolveUrl(value) : String(value));
    });
    node.removeAttribute("data-sdrm-attr");
  });

  root.querySelectorAll("[data-sdrm-modifier]").forEach((node) => {
    const [base, key] = node.dataset.sdrmModifier.split(":");
    const value = lookup(data, item, key);
    if (SAFE_WORD.test(String(value))) node.classList.add(`${base}--${value}`);
    node.removeAttribute("data-sdrm-modifier");
  });

  root.querySelectorAll("[data-sdrm-icon]").forEach((node) => {
    const value = lookup(data, item, node.dataset.sdrmIcon);
    if (SAFE_WORD.test(String(value))) node.setAttribute("href", `#sdrm-icon-${value}`);
    node.removeAttribute("data-sdrm-icon");
  });

  root.querySelectorAll("[data-sdrm-current]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !/^https?:/i.test(href) && pagePath(new URL(href, window.location.href).pathname) === pagePath(window.location.pathname)) {
      link.setAttribute("aria-current", "page");
    }
    link.removeAttribute("data-sdrm-current");
  });
}

function setTitle(data) {
  const titleKey = document.documentElement.dataset.sdrmTitle;
  const siteName = data.content["site.name"] || "";
  const pageTitle = titleKey ? data.content[titleKey] : "";
  document.title = pageTitle ? `${pageTitle} | ${siteName}` : siteName;
}

siteData.then(
  (data) => {
    fill(document, data);
    setTitle(data);
    document.body.classList.remove("sdrm--loading");
  },
  (error) => {
    document.body.classList.remove("sdrm--loading");
    document.title = "Page couldn't load";
    // Nothing on the page works without the server: show only the alert, not empty sections
    const alert = document.querySelector("[data-sdrm-content-error]");
    document.querySelectorAll("main > *, .sdrm__footer").forEach((node) => {
      if (node !== alert && node.tagName !== "SCRIPT") node.hidden = true;
    });
    document.querySelectorAll("[data-sdrm-text]").forEach((node) => (node.hidden = true));
    if (alert) {
      alert.hidden = false;
      if (!(error instanceof NetworkError)) {
        alert.querySelector("[data-sdrm-content-error-text]").textContent = `The server answered with an error. Please refresh and try again. (${error.message})`;
      }
    }
  }
);

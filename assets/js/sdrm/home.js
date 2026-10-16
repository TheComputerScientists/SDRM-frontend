// Home: render the stat band from GET /api/sdrm/stats (placeholder numbers marked "TODO: verify").
import { loadData, el, showLoadError } from "./common.js";

const root = document.querySelector("[data-sdrm-home-stats]");

if (root) {
  init(root);
}

async function init(rootEl) {
  const list = rootEl.querySelector("#home-stats");
  const count = new Intl.NumberFormat("en-US");

  let data;
  try {
    data = await loadData("/api/sdrm/stats");
  } catch (error) {
    showLoadError(list, error);
    return;
  }

  list.replaceChildren(
    ...data.stats.map((stat) =>
      el("div", { className: "sdrm__stat" }, [
        el("span", { className: "sdrm__stat-value", text: `${count.format(stat.value)}${stat.suffix || ""}` }),
        el("span", { className: "sdrm__stat-label", text: stat.label }),
      ])
    )
  );
  list.removeAttribute("aria-busy");
}

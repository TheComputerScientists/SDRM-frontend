---
layout: sdrm
hero: custom
sdrm_page: home
permalink: /
---

{%- comment -%} Every word, link and image here comes from /api/sdrm/content (home.*), filled in by assets/js/sdrm/content.js. {%- endcomment -%}

<svg class="sdrm__visually-hidden" aria-hidden="true" focusable="false">
  <symbol id="sdrm-icon-pin" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></symbol>
  <symbol id="sdrm-icon-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4Z"/></symbol>
  <symbol id="sdrm-icon-people" viewBox="0 0 24 24"><path fill="currentColor" d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 13c-3.3 0-7 1.7-7 4v3h14v-3c0-2.3-3.7-4-7-4Zm8 0c-.5 0-1 0-1.5.1 1.5 1 2.5 2.3 2.5 3.9v3h4v-3c0-2.2-2.7-4-5-4Z"/></symbol>
</svg>

<section class="sdrm__hero" aria-labelledby="hero-title">
  <div class="sdrm__hero-inner">
    <div class="sdrm__hero-content">
      <p class="sdrm__kicker sdrm__kicker--start sdrm__kicker--light" data-sdrm-text="home.kicker"></p>
      <h1 class="sdrm__hero-title" id="hero-title" data-sdrm-text="home.title"></h1>
      <p class="sdrm__hero-text" data-sdrm-text="home.lead"></p>
      <p class="sdrm__hero-actions">
        <a class="sdrm__button sdrm__button--yellow sdrm__button--large" data-sdrm-text="home.hero.cta" data-sdrm-attr="href:home.hero.ctaHref"></a>
      </p>
    </div>
    <div class="sdrm__hero-media">
      <img class="sdrm__hero-image" alt="" data-sdrm-attr="src:home.hero.image,alt:home.hero.imageAlt" width="600" height="400">
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--cream" aria-labelledby="tools-heading">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker" data-sdrm-text="home.tools.kicker"></p>
      <h2 class="sdrm__section-heading" id="tools-heading" data-sdrm-text="home.tools.heading"></h2>
      <p class="sdrm__section-intro" data-sdrm-text="home.tools.intro"></p>
    </header>

    <div class="sdrm__feature-grid">
      <template data-sdrm-list="home.tools.cards">
        <article class="sdrm__feature-card" data-sdrm-modifier="sdrm__feature-card:.tone">
          <span class="sdrm__feature-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><use data-sdrm-icon=".icon"></use></svg>
          </span>
          <h3 class="sdrm__feature-card-title" data-sdrm-text=".title"></h3>
          <p class="sdrm__feature-card-text" data-sdrm-text=".text"></p>
          <a class="sdrm__feature-card-link" data-sdrm-attr="href:.href"><span data-sdrm-text=".link"></span> <span aria-hidden="true">→</span></a>
        </article>
      </template>
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--navy" aria-labelledby="stats-heading" data-sdrm-home-stats>
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker sdrm__kicker--light" data-sdrm-text="home.stats.kicker"></p>
      <h2 class="sdrm__section-heading" id="stats-heading" data-sdrm-text="home.stats.heading"></h2>
    </header>
    <div class="sdrm__stats sdrm__stats--band" id="home-stats" aria-busy="true">
      <p class="sdrm__stats-note">Loading numbers…</p>
    </div>
    <p class="sdrm__stats-note" data-sdrm-text="home.stats.note"></p>
  </div>
</section>

<section class="sdrm__section sdrm__section--white" aria-labelledby="about-heading">
  <div class="sdrm__container sdrm__split sdrm__split--center">
    <figure class="sdrm__figure sdrm__figure--blue">
      <img class="sdrm__figure-image" alt="" data-sdrm-attr="src:home.about.image,alt:home.about.imageAlt" width="600" height="400">
    </figure>
    <div>
      <p class="sdrm__kicker sdrm__kicker--start" data-sdrm-text="home.about.kicker"></p>
      <h2 class="sdrm__section-heading" id="about-heading" data-sdrm-text="home.about.heading"></h2>
      <p class="sdrm__text" data-sdrm-text="home.about.text"></p>
      <ul class="sdrm__checklist">
        <template data-sdrm-list="home.about.items">
          <li class="sdrm__checklist-item" data-sdrm-text=".text"></li>
        </template>
      </ul>
      <p class="sdrm__actions">
        <a class="sdrm__button sdrm__button--outline" data-sdrm-text="home.about.cta" data-sdrm-attr="href:home.about.ctaHref"></a>
      </p>
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--dots" aria-labelledby="urgent-heading">
  <div class="sdrm__container">
    <aside class="sdrm__callout">
      <h2 class="sdrm__callout-title" id="urgent-heading" data-sdrm-text="home.urgent.heading"></h2>
      <p class="sdrm__text" data-sdrm-text="home.urgent.text"></p>
      <p class="sdrm__actions">
        <template data-sdrm-list="home.urgent.buttons">
          <a class="sdrm__button" data-sdrm-modifier="sdrm__button:.tone" data-sdrm-text=".label" data-sdrm-attr="href:.href"></a>
        </template>
      </p>
    </aside>
  </div>
</section>

<script type="module" src="{{ '/assets/js/sdrm/home.js' | relative_url }}"></script>

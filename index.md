---
layout: sdrm
hero: custom
permalink: /
---
{%- comment -%}
  SDRM hub. All text and tiles come from _data/sdrm_hub.yml; edit that file, not this one.
  Tiles and the "Find help fast" row work without JavaScript or the backend (the form is a
  plain GET to the Get Help page); account.js only swaps the account and coordinator tiles.
  The other sections reuse the existing sdrm__ classes (banner, section, stats, card, split,
  callout, checklist), so the hub adds no styles of its own.
{%- endcomment -%}
{%- assign hub = site.data.sdrm_hub -%}
<section class="sdrm__banner" aria-labelledby="page-title">
  <div class="sdrm__banner-inner">
    <p class="sdrm__kicker sdrm__kicker--start sdrm__kicker--light">{{ hub.hero.kicker | escape }}</p>
    <h1 class="sdrm__banner-title" id="page-title">{{ hub.title | escape }}</h1>
    <p class="sdrm__banner-text">{{ hub.description | escape }}</p>
    <p class="sdrm__actions">
      {%- for button in hub.hero.buttons %}
      <a class="sdrm__button{% if button.style %} sdrm__button--{{ button.style }}{% endif %}" href="{{ button.url | relative_url }}">{{ button.label | escape }}</a>
      {%- endfor %}
    </p>
  </div>
</section>

<div class="ocs__container sdrm__hub">
  <header class="sdrm__section-header">
    <p class="sdrm__kicker">{{ hub.start.kicker | escape }}</p>
    <h2 class="sdrm__section-heading" id="start-heading">{{ hub.start.heading | escape }}</h2>
  </header>

  <nav aria-labelledby="start-heading">
    <div class="ocs__hub-grid">
      {%- include sdrm/tiles.html %}
    </div>
  </nav>

  <section class="ocs__card sdrm__hub-quick" aria-labelledby="quick-help-heading">
    <h2 class="ocs__section-title" id="quick-help-heading">{{ hub.quick_help.heading | escape }}</h2>
    <form class="sdrm__field-row" action="{{ hub.quick_help.url | relative_url }}" method="get">
      <div class="sdrm__field sdrm__field--grow">
        <label class="sdrm__field-label" for="quick-help-need">{{ hub.quick_help.label | escape }}</label>
        <select class="sdrm__input" id="quick-help-need" name="need">
          {%- for option in hub.quick_help.options %}
          <option value="{{ option.id | escape }}">{{ option.label | escape }}</option>
          {%- endfor %}
        </select>
      </div>
      <div class="sdrm__field">
        <button class="ocs__btn large accent fill" type="submit">{{ hub.quick_help.button | escape }}</button>
      </div>
    </form>
  </section>
</div>

<section class="sdrm__section sdrm__section--white" aria-labelledby="impact-heading">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker">{{ hub.impact.kicker | escape }}</p>
      <h2 class="sdrm__section-heading" id="impact-heading">{{ hub.impact.heading | escape }}</h2>
      <p class="sdrm__section-intro">{{ hub.impact.intro | escape }} <a href="{{ hub.impact.source_url | escape }}" rel="noopener">{{ hub.impact.source | escape }}</a></p>
    </header>
    <div class="sdrm__stats">
      {%- for stat in hub.impact.stats %}
      <div class="sdrm__stat">
        <span class="sdrm__stat-value">{{ stat.value | escape }}</span>
        <span class="sdrm__stat-label">{{ stat.label | escape }}</span>
      </div>
      {%- endfor %}
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--dots" aria-labelledby="programs-heading">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker">{{ hub.programs.kicker | escape }}</p>
      <h2 class="sdrm__section-heading" id="programs-heading">{{ hub.programs.heading | escape }}</h2>
      <p class="sdrm__section-intro">{{ hub.programs.intro | escape }}</p>
    </header>
    <div class="sdrm__grid">
      {%- for item in hub.programs.items %}
      <article class="sdrm__card sdrm__card--topline">
        <h3 class="sdrm__card-title">{{ item.title | escape }}</h3>
        <p class="sdrm__text">{{ item.text | escape }}</p>
        <p class="sdrm__actions">
          <a class="sdrm__button sdrm__button--outline" href="{{ item.url | relative_url }}">{{ item.link | escape }}</a>
        </p>
      </article>
      {%- endfor %}
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--white" aria-labelledby="help-out-heading">
  <div class="sdrm__container sdrm__split sdrm__split--center">
    <div>
      <p class="sdrm__kicker sdrm__kicker--start">{{ hub.help_out.kicker | escape }}</p>
      <h2 class="sdrm__section-heading" id="help-out-heading">{{ hub.help_out.heading | escape }}</h2>
      <p class="sdrm__text">{{ hub.help_out.intro | escape }}</p>
      <ul class="sdrm__checklist">
        {%- for item in hub.help_out.items %}
        <li class="sdrm__checklist-item">{{ item | escape }}</li>
        {%- endfor %}
      </ul>
      <p class="sdrm__actions">
        {%- for button in hub.help_out.buttons %}
        <a class="sdrm__button{% if button.style %} sdrm__button--{{ button.style }}{% endif %}" href="{{ button.url | relative_url }}">{{ button.label | escape }}</a>
        {%- endfor %}
      </p>
    </div>
    <aside class="sdrm__callout" aria-labelledby="why-heading">
      <h3 class="sdrm__callout-title" id="why-heading">{{ hub.help_out.why.title | escape }}</h3>
      <p class="sdrm__text">{{ hub.help_out.why.text | escape }}</p>
      <ul class="sdrm__checklist">
        {%- for reason in hub.help_out.why.reasons %}
        <li class="sdrm__checklist-item">{{ reason | escape }}</li>
        {%- endfor %}
      </ul>
    </aside>
  </div>
</section>

<section class="sdrm__section sdrm__section--cream" aria-labelledby="support-heading">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker">{{ hub.support.kicker | escape }}</p>
      <h2 class="sdrm__section-heading" id="support-heading">{{ hub.support.heading | escape }}</h2>
      <p class="sdrm__section-intro">{{ hub.support.intro | escape }}</p>
    </header>
    <div class="sdrm__grid sdrm__grid--two">
      <article class="sdrm__card sdrm__card--topline">
        <h3 class="sdrm__card-title">{{ hub.support.contact_label | escape }}</h3>
        <p class="sdrm__text">
          <a href="{{ hub.support.email_url | escape }}">{{ hub.support.email | escape }}</a><br>
          <a href="{{ hub.support.phone_url | escape }}">{{ hub.support.phone | escape }}</a><br>
          {{ hub.support.address | escape }}
        </p>
      </article>
      <article class="sdrm__card sdrm__card--topline">
        <h3 class="sdrm__card-title">{{ hub.support.links_label | escape }}</h3>
        <p class="sdrm__actions">
          {%- for link in hub.support.links %}
          <a class="ocs__btn small accent" href="{{ link.url | escape }}" target="_blank" rel="noopener noreferrer">{{ link.label | escape }}</a>
          {%- endfor %}
        </p>
      </article>
    </div>
  </div>
</section>

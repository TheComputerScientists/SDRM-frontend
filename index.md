---
layout: sdrm
hero: custom
permalink: /
---
{%- comment -%}
  SDRM hub. All text and tiles come from _data/sdrm_hub.yml; edit that file, not this one.
  Tiles and the "Find help fast" row work without JavaScript or the backend (the form is a
  plain GET to the Get Help page); account.js only swaps the account and coordinator tiles.
{%- endcomment -%}
{%- assign hub = site.data.sdrm_hub -%}
<div class="ocs__container sdrm__hub">
  <header class="sdrm__hub-intro">
    <h1 id="page-title">{{ hub.title | escape }}</h1>
    <p class="ocs__description">{{ hub.description | escape }}</p>
  </header>

  <nav aria-label="Site sections">
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

  <section class="ocs__card" aria-labelledby="support-heading">
    <h2 class="ocs__section-title" id="support-heading">{{ hub.support.heading | escape }}</h2>
    <p class="sdrm__text">{{ hub.support.intro | escape }}</p>
    <h3 class="sdrm__card-title">{{ hub.support.contact_label | escape }}</h3>
    <p class="sdrm__text">
      <a href="{{ hub.support.email_url | escape }}">{{ hub.support.email | escape }}</a><br>
      <a href="{{ hub.support.phone_url | escape }}">{{ hub.support.phone | escape }}</a><br>
      {{ hub.support.address | escape }}
    </p>
    <h3 class="sdrm__card-title">{{ hub.support.links_label | escape }}</h3>
    <p class="sdrm__actions">
      {%- for link in hub.support.links %}
      <a class="ocs__btn small accent" href="{{ link.url | escape }}" target="_blank" rel="noopener noreferrer">{{ link.label | escape }}</a>
      {%- endfor %}
    </p>
  </section>

</div>

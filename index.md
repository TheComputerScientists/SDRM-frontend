---
layout: sdrm
hero: custom
title: Help and Hope in San Diego
lead: A student-built guide to finding help, giving, and volunteering, inspired by the work of the San Diego Rescue Mission.
permalink: /
---

<section class="sdrm__hero" aria-labelledby="hero-title">
  <div class="sdrm__hero-inner">
    <div class="sdrm__hero-content">
      <p class="sdrm__kicker sdrm__kicker--start sdrm__kicker--light">Student project</p>
      <h1 class="sdrm__hero-title" id="hero-title">{{ page.title }}</h1>
      <p class="sdrm__hero-text">{{ page.lead }}</p>
      <p class="sdrm__hero-actions">
        <a class="sdrm__button sdrm__button--yellow sdrm__button--large" href="{{ '/sdrm/get-help/' | relative_url }}">Find help near you</a>
      </p>
    </div>
    <div class="sdrm__hero-media">
      <img class="sdrm__hero-image" src="{{ '/images/sdrm/placeholder-welcome.svg' | relative_url }}" alt="Placeholder illustration of people gathered around a community table" width="600" height="400">
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--cream" aria-labelledby="tools-heading">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker">Our commitment</p>
      <h2 class="sdrm__section-heading" id="tools-heading">Three simple ways to connect</h2>
      <p class="sdrm__section-intro">Everyone deserves a warm meal, a safe place to sleep, and a path forward. Each tool below turns placeholder data into something you can explore.</p>
    </header>

    <div class="sdrm__feature-grid">
      <article class="sdrm__feature-card sdrm__feature-card--orange">
        <span class="sdrm__feature-card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>
        </span>
        <h3 class="sdrm__feature-card-title">Get Help Now</h3>
        <p class="sdrm__feature-card-text">Filter shelter, meals, family services, and recovery programs by what you need and where you are.</p>
        <a class="sdrm__feature-card-link" href="{{ '/sdrm/get-help/' | relative_url }}">Find resources <span aria-hidden="true">→</span></a>
      </article>
      <article class="sdrm__feature-card sdrm__feature-card--red">
        <span class="sdrm__feature-card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4Z"/></svg>
        </span>
        <h3 class="sdrm__feature-card-title">Ways to Give</h3>
        <p class="sdrm__feature-card-text">See how a one-time or monthly gift could turn into meals and nights of shelter.</p>
        <a class="sdrm__feature-card-link" href="{{ '/sdrm/give/' | relative_url }}">See your impact <span aria-hidden="true">→</span></a>
      </article>
      <article class="sdrm__feature-card sdrm__feature-card--blue">
        <span class="sdrm__feature-card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM9 13c-3.3 0-7 1.7-7 4v3h14v-3c0-2.3-3.7-4-7-4Zm8 0c-.5 0-1 0-1.5.1 1.5 1 2.5 2.3 2.5 3.9v3h4v-3c0-2.2-2.7-4-5-4Z"/></svg>
        </span>
        <h3 class="sdrm__feature-card-title">Volunteer</h3>
        <p class="sdrm__feature-card-text">Pick the days and interests that suit you, then claim an open spot on a shift.</p>
        <a class="sdrm__feature-card-link" href="{{ '/sdrm/volunteer/' | relative_url }}">Find a shift <span aria-hidden="true">→</span></a>
      </article>
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--navy" aria-labelledby="stats-heading" data-sdrm-home-stats data-src="{{ '/assets/data/sdrm/stats.json' | relative_url }}">
  <div class="sdrm__container">
    <header class="sdrm__section-header">
      <p class="sdrm__kicker sdrm__kicker--light">By the numbers</p>
      <h2 class="sdrm__section-heading" id="stats-heading">What a community can do</h2>
    </header>
    <div class="sdrm__stats sdrm__stats--band" id="home-stats" aria-busy="true">
      <p class="sdrm__stats-note">Loading numbers…</p>
    </div>
    <p class="sdrm__stats-note">Placeholder numbers marked “TODO: verify” in <code>stats.json</code>. They are not real figures.</p>
  </div>
</section>

<section class="sdrm__section sdrm__section--white" aria-labelledby="about-heading">
  <div class="sdrm__container sdrm__split sdrm__split--center">
    <figure class="sdrm__figure sdrm__figure--blue">
      <img class="sdrm__figure-image" src="{{ '/images/sdrm/placeholder-volunteer.svg' | relative_url }}" alt="Placeholder illustration of a group of volunteers" width="600" height="400">
    </figure>
    <div>
      <p class="sdrm__kicker sdrm__kicker--start">Why this site exists</p>
      <h2 class="sdrm__section-heading" id="about-heading">Built by students, for learning</h2>
      <p class="sdrm__text">This class project practices accessible, data-driven web pages for a real-world cause. It is not affiliated with the San Diego Rescue Mission, and every name, rate, and shift is a placeholder.</p>
      <ul class="sdrm__checklist">
        <li class="sdrm__checklist-item">Works with a keyboard, a screen reader, and a phone.</li>
        <li class="sdrm__checklist-item">No payments and no personal information collected.</li>
        <li class="sdrm__checklist-item">All data lives in JSON files marked “TODO: verify”.</li>
      </ul>
      <p class="sdrm__actions">
        <a class="sdrm__button sdrm__button--outline" href="{{ '/sdrm/about/' | relative_url }}">About this project</a>
      </p>
    </div>
  </div>
</section>

<section class="sdrm__section sdrm__section--dots" aria-labelledby="urgent-heading">
  <div class="sdrm__container">
    <aside class="sdrm__callout">
      <h2 class="sdrm__callout-title" id="urgent-heading">Need help right now?</h2>
      <p class="sdrm__text"><strong>In an emergency, call 911.</strong> For other community services in San Diego County, you can dial 211.</p>
      <p class="sdrm__actions">
        <a class="sdrm__button sdrm__button--orange" href="{{ '/sdrm/get-help/' | relative_url }}">Get Help Now</a>
        <a class="sdrm__button sdrm__button--blue" href="{{ '/sdrm/volunteer/' | relative_url }}">Volunteer</a>
        <a class="sdrm__button sdrm__button--red" href="{{ '/sdrm/give/' | relative_url }}">Ways to Give</a>
      </p>
    </aside>
  </div>
</section>

<script type="module" src="{{ '/assets/js/sdrm/home.js' | relative_url }}"></script>

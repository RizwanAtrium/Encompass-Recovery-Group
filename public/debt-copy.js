const applyDebtCopy = () => {
  const replacements = new Map([
    ["Exceptional design, seamless collaboration.", "Clear support for debt resolution."],
    ["Design services that feel in-house, not outsourced.", "Debt relief that feels clear, structured, and human."],
    ["Senior design expertise, embedded in your team.", "Guided support for people ready to regain control and clarity over debt"],
    ["Start a project", "Check My Options"],
    ["Contact us", "Get help"],
    ["For agencies", "How it works"],
    ["Replies in 24 hours. No obligation.", "Confidential next step. No pressure."],
    ["Our Services", "Debt Relief Services"],
    ["Our services", "Debt Relief Services"],
    ["UX/UI & Digital Products", "Debt Review & Strategy"],
    ["High-Performance Websites", "Creditor Resolution Support"],
    ["Brand Identity & Positioning", "Payment Plan Guidance"],
    ["Flexible Design Support", "Financial Recovery Roadmap"],
    ["Is poor design costing you users? We fix friction. We design intuitive, human-centered interfaces that reduce churn, delight customers, and make your product a joy to use.", "Start with a clear review of your debts, goals, and options so the next step feels manageable"],
    ["Beautiful sites that perform. Whether it's a custom build or a Shopify store, we create responsive websites designed to turn visitors into customers.", "Get support for organizing creditor conversations and moving toward a practical resolution path."],
    ["We build memorable brands that stand out in crowded markets. From visual identity systems to voice and tone, we ensure your brand signals trust and drives loyalty.", "Understand payment priorities, timelines, and tradeoffs before choosing a plan that fits your situation."],
    ["Your on-demand creative department. Clear your design backlog and keep your brand evolving with our flexible, credit-based support model. No cost commitments, only pay for what you need.", "Build habits and milestones that support stability after debt relief decisions are made."],
    ["Why Ratio has trusted us with their key accounts for over 3 years.", "A calmer path from debt stress to resolution."],
    ["We've delivered for:", "Support built around:"],
    ["Testimonial", "Our approach"],
    ["I've always been very impressed with the quality, care, enthusiasm and end results of everything they've done", "Clear options, respectful support, and practical next steps for a difficult financial moment"],
    ["What we do", "Debt Resolution Showcase"],
    ["Optimising conversion without compromising luxury", "Review your debt picture with clarity"],
    ["Modernising a group of sites for a marine services provider", "See how our step-by-step process can guide you toward clarity and control"],
    ["A bold new identity for a Shopify Platinum Partner", "Move toward a realistic resolution plan"],
    ["We redesigned user journeys across the site to make them smoother and more intuitive.", "We turn a complex debt picture into a clearer sequence of choices and next steps."],
    ["Breaking key pages into modular components allowed us to build a shared design system.", "A structured process keeps balances, timing, and creditor priorities easier to review."],
    ["The new website needed to reflect Roswell's bold, confident identity while letting their work take center stage.", "The goal is a practical path that respects your situation and keeps the process understandable."],
    ["Want to see more?", "Need a clearer path?"],
    ["View Project", "Learn More"],
    ["View all case studies", "Explore Options"],
    ["Scale your team instantly. Zero overheads.", "Guidance when debt feels overwhelming."],
    ["Our talent, your brand. We help you say \"yes\" to big projects without adding permanent payroll. Get white-label, development-ready execution that integrates seamlessly into your workflow.", "We help you organize your finances, understand the process, and focus on the next practical step"],
    ["Partner with us", "Talk to us"],
    ["Direct access to expert talent", "Direct access to resolution support"],
    ["You don't deal with account managers; you speak directly to the creatives solving your problem. With every project guided by senior leadership, you get the firepower of a full agency team without the administrative bloat.", "Talk through your situation with a team focused on clarity, respect, and practical guidance"],
    ["Meet the makers", "Meet the Team"],
    ["Less Downtime. More Action.", "Less confusion. More direction."],
    ["Stop wasting your time juggling freelancers. We are a multidisciplinary on-tap team that works as a single unit. We share context, files, and skills, so you get seamless creative experiences with zero hassle.", "Bring scattered balances, due dates, and creditor questions into one streamlined process"],
    ["Our process", "See the Process"],
    ["The Salo Standard", "The Resolution Standard"],
    ["Don't limit your brand to one person's skillset. We bring the full creative suite - specialists in Brand, UI, and UX - to your project. Plus, our Salo Standard protocol means every pixel is vetted by a Design Director, guaranteeing a level of consistency a solo freelancer simply can't match.", "Our process centers on clear information, careful review, and practical debt resolution support"],
    ["Got a project in mind?", "Ready to review your options?"],
    ["Give your team the firepower it deserves", "Take the first step toward debt resolution"],
    ["Don't let limited resources or expertise hold you back. Level up your creative with design support that feels in-house, not outsourced. Get direct access to designers ready to bring your ideas to life.", "Start with a confidential conversation about debt relief. We'll guide you through the next step"],
    ["The Salo Standard protocol", "Our review process"],
    ["Latest case studies", "Debt relief overview"]
  ]);

  const normalize = value => value.replace(/\s+/g, " ").trim();
  const replaceText = value => {
    const leading = value.match(/^\s*/)?.[0] || "";
    const trailing = value.match(/\s*$/)?.[0] || "";
    const clean = normalize(value).replace(/[“”]/g, "").replace(/[’]/g, "'");
    return replacements.has(clean) ? `${leading}${replacements.get(clean)}${trailing}` : value;
  };

  document.title = "Debt Relief and Debt Resolution Support";

  const metadata = {
    description: "Debt relief and debt resolution support with clear options, practical next steps, and a respectful process.",
    "og:title": "Debt Relief and Debt Resolution Support",
    "og:description": "Clear debt relief guidance and resolution support for people ready to understand their options.",
    "twitter:title": "Debt Relief and Debt Resolution Support",
    "twitter:description": "Clear debt relief guidance and resolution support for people ready to understand their options."
  };

  Object.entries(metadata).forEach(([key, content]) => {
    const meta = document.querySelector(`meta[name="${key}"], meta[property="${key}"]`);
    if (meta) {
      meta.content = content;
    }
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(node => {
    node.nodeValue = replaceText(node.nodeValue);
  });

  const textMap = [
    ["Debt relief that feels clear, structured, and human.", "Debt relief that feels clear, structured, and human"],
    ["Guided support for people ready to regain control and clarity over debt", "Guided support for people ready to regain control and clarity over debt"],
    ["Check my options", "Check My Options"],
    ["Check My Options", "Check My Options"],
    ["Start with a clear review of your debts, goals, and options so the next step feels manageable", "Start with a clear review of your debts, goals, and options so the next step feels manageable"],
    ["Debt Resolution Showcase", "Debt Resolution Showcase"],
    ["See how our step-by-step process can guide you toward clarity and control", "See how our step-by-step process can guide you toward clarity and control"],
    ["Learn more", "Learn More"],
    ["Need a clearer path?", "Need a clearer path?"],
    ["Explore options", "Explore Options"],
    ["Guidance when debt feels overwhelming.", "Guidance when debt feels overwhelming"],
    ["We help you organize your finances, understand the process, and focus on the next practical step", "We help you organize your finances, understand the process, and focus on the next practical step"],
    ["Talk to us", "Talk to Us"],
    ["Direct access to resolution support", "Direct access to resolution support"],
    ["Talk through your situation with a team focused on clarity, respect, and practical guidance", "Talk through your situation with a team focused on clarity, respect, and practical guidance"],
    ["Meet the team", "Meet the Team"],
    ["Less confusion. More direction.", "Less confusion. More direction."],
    ["Bring scattered balances, due dates, and creditor questions into one streamlined process", "Bring scattered balances, due dates, and creditor questions into one streamlined process"],
    ["See the process", "See the Process"],
    ["The Resolution Standard", "The Resolution Standard"],
    ["Our process centers on clear information, careful review, and practical debt resolution support", "Our process centers on clear information, careful review, and practical debt resolution support"],
    ["Take the first step toward debt resolution", "Take the first step toward debt resolution"],
    ["Start with a confidential conversation about debt relief. We'll guide you through the next step", "Start with a confidential conversation about debt relief. We'll guide you through the next step"],
    ["Steve", "Steve Renshaw | Co-Founder"]
  ];

  textMap.forEach(([from, to]) => {
    [...document.querySelectorAll("h1,h2,h3,p,span,a,cite")].forEach(element => {
      if (normalize(element.textContent) === from) {
        element.textContent = to;
      }
    });
  });

  [...document.querySelectorAll("a,button,.btn")].forEach(element => {
    if (normalize(element.textContent) === "Talk to Us") {
      element.remove();
    }
  });

  if (!document.querySelector("[data-brand-logo-style]")) {
    const style = document.createElement("style");
    style.dataset.brandLogoStyle = "";
    style.textContent = `
      .brand-logo {
        display: block;
        height: clamp(3.75rem, 7vw, 5.75rem);
        width: auto;
      }
      header .start > .eyebrow {
        display: none !important;
      }
      .salo-logo {
        height: clamp(3.75rem, 7vw, 5.75rem) !important;
        width: auto !important;
      }
      #awwwards {
        display: none !important;
      }
      .HomeHero {
        background: #1a5769 !important;
        background-color: #1a5769 !important;
      }
      #background {
        background: transparent !important;
        pointer-events: none !important;
        z-index: 1 !important;
      }
      .HomeHero .cover {
        position: relative !important;
        z-index: 2 !important;
      }
      [data-ambient-cursor],
      .Cursor,
      #HomeShowcase__userCursor {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      .HomeShowcase,
      .HomeShowcaseMobile,
      .HomeShowcase__outerFrame,
      .HomeShowcase__inner {
        background: #1a5769 !important;
        background-color: #1a5769 !important;
      }
      .HomeShowcase h1,
      .HomeShowcase h2,
      .HomeShowcase h3,
      .HomeShowcaseMobile h1,
      .HomeShowcaseMobile h2,
      .HomeShowcaseMobile h3,
      .HomeShowcase p,
      .HomeShowcaseMobile p,
      .HomeShowcase .eyebrow,
      .HomeShowcaseMobile .eyebrow,
      .HomeShowcase [class*="heading"],
      .HomeShowcase [class*="title"],
      .HomeShowcase [data-font-size],
      .HomeShowcaseMobile [class*="heading"],
      .HomeShowcaseMobile [class*="title"],
      .HomeShowcaseMobile [data-font-size] {
        color: #ffffff !important;
      }
      .HomeShowcase .imageCard .anchor-border rect,
      .HomeShowcase .imageCard .anchor-border circle,
      .HomeShowcaseMobile .imageCard .anchor-border rect,
      .HomeShowcaseMobile .imageCard .anchor-border circle {
        border-color: #ffffff !important;
        color: #ffffff !important;
        fill: transparent !important;
        stroke: #ffffff !important;
      }
      .HomeShowcase .imageCard .anchor-border circle,
      .HomeShowcaseMobile .imageCard .anchor-border circle {
        fill: #ffffff !important;
      }
      .HomeShowcase .ShowcaseCard,
      .HomeShowcaseMobile .ShowcaseCard {
        background: #123f4c !important;
        background-color: #123f4c !important;
        border: 1px solid #ffffff !important;
      }
      #background,
      .background-logo-wrapper {
        color: #ffffff !important;
        border-color: #ffffff !important;
      }
      #background-canvas {
        filter: brightness(0) invert(1) !important;
      }
      body.rings-over-section #background,
      body.rings-over-section .background-logo-wrapper {
        color: #0f7f77 !important;
        border-color: #0f7f77 !important;
      }
      body.rings-over-section #background-canvas {
        filter: brightness(0) saturate(100%) invert(38%) sepia(55%) saturate(1090%) hue-rotate(132deg) brightness(87%) contrast(91%) !important;
      }
      .HomeHero h1,
      .HomeHero [data-font-size="8"],
      .HomeHero [data-font-size="9"],
      .HomeHero [data-font-size="10"] {
        color: #ffffff !important;
      }
      .HomeWheel__motionPath,
      .HomeWheel__motionPathSvg,
      .HomeQuadrants .logo,
      .HomeQuadrants .logoMask,
      .HomeQuadrants .logomark-path,
      .anchor-border rect,
      .anchor-border circle,
      .anchor-circle {
        border-color: #0f7f77 !important;
        color: #0f7f77 !important;
        stroke: #0f7f77 !important;
      }
      .HomeWheel__motionPath {
        opacity: 0 !important;
        stroke: transparent !important;
      }
      .HomeQuadrants .background {
        --color-border: #0f7f77 !important;
        background-color: #ffffff !important;
        background-image:
          linear-gradient(rgba(15, 127, 119, .34) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 127, 119, .34) 1px, transparent 1px) !important;
        background-size: 48px 48px !important;
      }
      .HomeQuadrants,
      .HomeQuadrants .quadrant {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .HomeQuadrants .content,
      .HomeQuadrants .content::before,
      .HomeQuadrants .content::after,
      .HomeQuadrants .hidden-content,
      .HomeQuadrants .hidden-content::before,
      .HomeQuadrants .hidden-content::after {
        background: transparent !important;
        box-shadow: none !important;
        filter: none !important;
      }
      .HomeQuadrants .prose,
      .HomeQuadrants .prose *,
      .HomeQuadrants p {
        color: #000000 !important;
      }
      .HomeQuadrants .center,
      .HomeQuadrants .center::before,
      .HomeQuadrants .center::after,
      #HomeQuadrants__logo,
      #HomeQuadrants__logoMask,
      .HomeQuadrants .logo,
      .HomeQuadrants .logoMask {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
        fill: transparent !important;
        filter: none !important;
        text-shadow: none !important;
      }
      .TestimonialCaseStudyBlock,
      .TestimonialCaseStudyBlock .container,
      .TestimonialCaseStudyBlock .anchor-card {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .TestimonialCaseStudyBlock p,
      .TestimonialCaseStudyBlock cite,
      .TestimonialCaseStudyBlock .eyebrow,
      .TestimonialCaseStudyBlock [data-color],
      .TestimonialCaseStudyBlock [data-font-size] {
        color: #000000 !important;
      }
      .TestimonialCaseStudyBlock img.logo,
      .TestimonialCaseStudyBlock [class*="logo"] img {
        filter: brightness(0) !important;
      }
      .HomePartner,
      .HomePartner .container,
      .HomePartner .anchor-card,
      .HomePartner .HomePartner__image {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .HomePartner p,
      .HomePartner .prose,
      .HomePartner .prose *,
      .HomePartner label,
      .HomePartner .debt-relief-form__check span {
        color: #222222 !important;
      }
      .HomePartner input {
        background: #1f1f1f !important;
        border-color: #5a5a5a !important;
        color: #ffffff !important;
      }
      .HomePartner input[type="checkbox"] {
        background: #ffffff !important;
        accent-color: #0f7f77 !important;
      }
      .HomePartner .eyebrow {
        color: #0f7f77 !important;
      }
      .HomePartner .anchor-border rect,
      .HomePartner .anchor-border circle,
      .HomePartner .anchor-circle,
      .HomePartner .divider-line {
        border-color: #0f7f77 !important;
        color: #0f7f77 !important;
        stroke: #0f7f77 !important;
      }
      .HomePartner .anchor-circle,
      .HomePartner .divider-line {
        background-color: #0f7f77 !important;
      }
      .HomeWheel {
        background: #0f7f77 !important;
        background-color: #0f7f77 !important;
      }
      .HomeWheel h2,
      .HomeWheel h3,
      .HomeWheel [data-font-size="8"],
      .HomeWheel [data-font-size="9"],
      .HomeWheel [data-font-size="10"],
      .HomeWheel .heading,
      .HomeWheel [class*="heading"],
      .HomeWheel [class*="Heading"] {
        color: #ffffff !important;
      }
      .HomeCta {
        background: #ffffff !important;
        background-color: #ffffff !important;
      }
      .HomePartner ~ .HomeWheel .HomeWheel__motionPath,
      .HomePartner ~ .HomeWheel .HomeWheel__motionPathSvg {
        border-color: #0f7f77 !important;
        color: #0f7f77 !important;
        stroke: #0f7f77 !important;
        filter: none !important;
        opacity: 1 !important;
      }
      .HomeWheel__motionPathSvg,
      .HomeWheel__motionPath {
        color: #0f7f77 !important;
        stroke: #0f7f77 !important;
        opacity: 1 !important;
      }
      #HomeHero__content,
      #HomeHero__content::before,
      #HomeHero__content::after,
      .HomeShowcase::before,
      .HomeShowcase::after,
      .HomePartner::before,
      .HomePartner::after,
      .HomeWheel::before,
      .HomeWheel::after,
      .HomeCta::before,
      .HomeCta::after {
        background: transparent !important;
        box-shadow: none !important;
        filter: none !important;
        opacity: 1 !important;
      }
      [data-reveal="blur"],
      [class*="glow"],
      [class*="Glow"],
      [class*="blur"],
      [class*="Blur"] {
        box-shadow: none !important;
        filter: none !important;
        text-shadow: none !important;
      }
      h1,
      h2,
      h3,
      .heading,
      h4,
      [class*="heading"],
      [class*="title"],
      [data-font-size="4"],
      [data-font-size="5"],
      [data-font-size="6"],
      [data-font-size="7"],
      [data-font-size="8"],
      [data-font-size="9"],
      [data-font-size="10"] {
        color: #0f6f66 !important;
      }
      .btn,
      .btn *,
      .debt-header-cta,
      .debt-header-cta *,
      .debt-relief-form__submit,
      .debt-relief-form__submit * {
        color: #ffffff !important;
      }
      .HomeHero__bottom,
      .HomeHero__bottom .marquee,
      .HomeHero__bottom .marquee__track,
      .HomeHero__bottom .marquee__content,
      .HomeHero__bottom .marquee__item {
        background: transparent !important;
        box-shadow: none !important;
        filter: none !important;
      }
      .HomeHero__bottom::before,
      .HomeHero__bottom::after,
      .HomeHero__bottom .marquee::before,
      .HomeHero__bottom .marquee::after,
      .HomeHero__bottom .marquee__track::before,
      .HomeHero__bottom .marquee__track::after {
        background: transparent !important;
        box-shadow: none !important;
      }
      .btn.primary,
      .debt-relief-form__submit {
        align-items: center !important;
        background: linear-gradient(135deg, #072f2f, #0f6f66 58%, #f6c21a) !important;
        border: 1px solid rgba(246, 194, 26, .55) !important;
        border-radius: var(--radius-sm) !important;
        box-shadow: 0 1rem 2.5rem rgba(26, 167, 217, .18), 0 0 1.5rem rgba(246, 194, 26, .16) !important;
        color: white !important;
        display: inline-flex !important;
        justify-content: center !important;
        min-height: 3.75rem !important;
        min-width: 12rem !important;
        overflow: hidden !important;
        padding: 0 1.35rem !important;
        white-space: nowrap !important;
      }
      .btn.primary *,
      .debt-relief-form__submit * {
        color: white !important;
      }
      .btn.primary .btn-bg,
      .debt-relief-form__submit .btn-bg {
        background: radial-gradient(circle at 82% 18%, rgba(246, 194, 26, .55), transparent 38%) !important;
        opacity: 1 !important;
      }
      .btn.primary::before,
      .debt-relief-form__submit::before {
        background: none !important;
      }
      .btn.primary:hover,
      .debt-relief-form__submit:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
      header .end {
        display: flex !important;
      }
      header .actions {
        display: flex !important;
        flex-shrink: 0 !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      header .actions a {
        display: inline-flex !important;
        min-width: max-content !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .debt-header-cta {
        align-items: center;
        background: linear-gradient(135deg, #072f2f, #0f6f66 58%, #f6c21a) !important;
        border: 1px solid rgba(246, 194, 26, .55) !important;
        border-radius: var(--radius-sm);
        box-shadow: 0 1rem 2.5rem rgba(26, 167, 217, .18), 0 0 1.5rem rgba(246, 194, 26, .16) !important;
        color: white !important;
        display: inline-flex;
        font: inherit;
        font-weight: 600;
        gap: .75rem;
        min-height: 3.5rem;
        padding: 0 1.5rem;
        text-decoration: none;
        white-space: nowrap;
      }
      .debt-header-cta * {
        color: white !important;
      }
      .debt-relief-form {
        display: grid;
        gap: 1rem;
        padding: clamp(1rem, 3vw, 2rem);
        width: 100%;
      }
      .debt-relief-form__grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .debt-relief-form label {
        color: var(--color-foreground-secondary);
        display: grid;
        font-size: var(--font-size--1);
        gap: .4rem;
      }
      .debt-relief-form input,
      .debt-relief-form select,
      .debt-relief-form textarea {
        background: color-mix(in oklch, var(--color-bg) 92%, white);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        color: var(--color-foreground);
        font: inherit;
        min-height: 3.25rem;
        padding: .85rem 1rem;
        width: 100%;
      }
      .debt-relief-form__check {
        align-items: center;
        display: flex !important;
        flex-direction: row;
        gap: .75rem !important;
      }
      .debt-relief-form__check input {
        accent-color: #1aa7d9;
        min-height: auto;
        width: auto;
      }
      .debt-relief-form textarea {
        min-height: 7.5rem;
        resize: vertical;
      }
      .debt-relief-form__full {
        grid-column: 1 / -1;
      }
      .debt-relief-form__submit {
        align-items: center !important;
        color: white !important;
        background: linear-gradient(135deg, #004342 0%, #0f7f77 62%, #f6c21a 100%) !important;
        border: 1px solid #f6c21a !important;
        border-radius: .25rem !important;
        box-shadow: 0 1.5rem 3rem rgba(15, 127, 119, .28) !important;
        display: inline-flex !important;
        justify-content: center !important;
        justify-self: start;
        margin-top: .5rem;
        min-height: 3.5rem !important;
        min-width: 12rem !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      .debt-relief-form__submit,
      .debt-relief-form__submit * {
        color: white !important;
      }
      @media (max-width: 48rem) {
        #background {
          height: 100svh !important;
          inset: 0 auto auto 0 !important;
          min-height: 100svh !important;
          position: absolute !important;
          width: 100% !important;
        }
        #background-canvas {
          height: 100% !important;
          width: 100% !important;
        }
        .HomeQuadrants .background {
          background-image: none !important;
        }
        .debt-relief-form__grid {
          grid-template-columns: 1fr;
        }
        header .actions,
        header .end,
        header .menu-toggle,
        #mobile-menu {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .HomeShowcaseMobile .carousel-nav {
          display: none !important;
        }
        .HomeShowcaseMobile .carousel-item {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          min-width: min(82vw, 22rem) !important;
          overflow: visible !important;
          padding: 0 !important;
        }
        .HomeShowcaseMobile .carousel-item > .h-full,
        .HomeShowcaseMobile .carousel-item .inner {
          background: transparent !important;
          box-shadow: none !important;
        }
        .HomeShowcaseMobile .carousel-item .inner {
          display: none !important;
        }
        .HomeShowcaseMobile .carousel-item .frame.image {
          --frame-ratio: 9/16 !important;
          aspect-ratio: 9/16 !important;
          border: 1px solid #ffffff !important;
          border-radius: .75rem !important;
          overflow: hidden !important;
        }
        .HomeShowcaseMobile .carousel-item .frame.image img {
          height: 100% !important;
          object-fit: cover !important;
          object-position: top center !important;
          width: 100% !important;
        }
      }
      footer .footer__bottom,
      footer .reactive-divider {
        display: none !important;
      }
      footer.footer,
      footer.section.footer,
      footer.footer .container {
        background: #0f7f77 !important;
        background-color: #0f7f77 !important;
      }
      footer.footer,
      footer.footer *,
      footer.section.footer,
      footer.section.footer * {
        color: #ffffff !important;
      }
      footer .footer__middle {
        padding-bottom: 0 !important;
      }
      a[href],
      button,
      .button,
      [class*="Button"],
      [class*="button"] {
        background: linear-gradient(135deg, #004342 0%, #0f7f77 62%, #f6c21a 100%) !important;
        border: 1px solid #f6c21a !important;
        border-radius: .25rem !important;
        box-shadow: 0 1.5rem 3rem rgba(15, 127, 119, .28) !important;
        color: #ffffff !important;
      }
      .FigmaWidget img[alt="Figma logo."] {
        display: none !important;
      }
      .FigmaWidget .icon::before,
      .FigmaWidget [class*="icon"]::before {
        align-items: center;
        background: #0b1014;
        border-radius: .55rem;
        color: #f6c21a;
        content: "$";
        display: inline-flex;
        font-size: 1.5rem;
        font-weight: 800;
        height: 2.5rem;
        justify-content: center;
        line-height: 1;
        width: 2.5rem;
      }
    `;
    document.head.append(style);
  }

  if (!window.__debtRingScrollBound) {
    window.__debtRingScrollBound = true;
    const updateRingColor = () => {
      const sections = [".HomePartner", ".HomeQuadrants", ".TestimonialCaseStudyBlock"]
        .map(selector => document.querySelector(selector))
        .filter(Boolean);
      const isOverLightSection = sections.some(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= window.innerHeight && rect.bottom >= 0;
      });
      document.body.classList.toggle("rings-over-section", isOverLightSection);
    };
    window.addEventListener("scroll", updateRingColor, { passive: true });
    window.addEventListener("resize", updateRingColor);
    updateRingColor();
    window.setTimeout(updateRingColor, 1200);
  }

  const logo = new URL("assets/encompass-logo-transparent.png", window.location.href).href;
  document.querySelectorAll(".salo-logo").forEach(svg => {
    if (svg.tagName.toLowerCase() === "img") {
      svg.src = logo;
      svg.alt = "Encompass Recovery Group";
      return;
    }
    const image = document.createElement("img");
    image.src = logo;
    image.alt = "Encompass Recovery Group";
    image.className = `${svg.getAttribute("class") || ""} brand-logo`.trim();
    svg.replaceWith(image);
  });

  document.getElementById("awwwards")?.remove();
  document.querySelectorAll('a[href*="awwwards.com"], [id="awwwards"]').forEach(element => element.remove());
  document.querySelectorAll('a[href="/services/flexi-design"] img').forEach(image => image.remove());
  document.querySelectorAll("header nav").forEach(nav => nav.remove());
  document.querySelectorAll("header .menu-toggle, #mobile-menu").forEach(element => element.remove());
  document.querySelectorAll("header .actions").forEach(actions => {
    actions.innerHTML = `<a class="debt-header-cta" href="#debt-form">Contact us <span aria-hidden="true">→</span></a>`;
  });

  document.querySelectorAll(".footer__contact").forEach(contact => {
    contact.innerHTML = `
      <a href="mailto:customercare@ergsupport.com">customercare@ergsupport.com</a>
      <a href="tel:+18777690109">+1 877-769-0109</a>
    `;
  });

  const heroLoop = document.querySelector(".HomeHero__bottom");
  const footerLoop = document.querySelector('section[data-index="5"] .marquee');
  if (heroLoop && footerLoop && !heroLoop.dataset.footerLoopCopied) {
    heroLoop.innerHTML = "";
    heroLoop.append(footerLoop.cloneNode(true));
    heroLoop.dataset.footerLoopCopied = "true";
  }

  document.querySelectorAll("a[href]").forEach(link => {
    if (link.closest("header .actions")) {
      return;
    }
    link.removeAttribute("href");
    link.setAttribute("role", "button");
    link.style.cursor = "default";
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a");
    if (link && !link.closest("header .actions")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  const teamImage = [...document.images].find(image => /Candid Team Photo|team working/i.test(`${image.alt} ${image.src}`));
  const imageContent = teamImage?.closest(".anchor-content");
  if (imageContent && !imageContent.querySelector(".debt-relief-form")) {
    imageContent.innerHTML = `
      <form class="debt-relief-form" id="debt-form">
        <div class="stack">
          <span class="eyebrow">Free debt review</span>
          <h3 class="heading" data-font-size="2" data-weight="regular">Tell us what you need help with.</h3>
        </div>
        <div class="debt-relief-form__grid">
          <label>First Name<input name="first_name" autocomplete="given-name" required></label>
          <label>Last Name<input name="last_name" autocomplete="family-name" required></label>
          <label>Your Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Your Phone Number<input name="phone" type="tel" autocomplete="tel" required></label>
          <label>State or Zip Code<input name="state_or_zip" autocomplete="address-level1 postal-code" required></label>
          <label class="debt-relief-form__check debt-relief-form__full"><input name="privacy" type="checkbox" required> <span>I read and accept the Privacy Policy</span></label>
        </div>
        <button class="btn size-md primary debt-relief-form__submit" type="submit"><span class="btn-content"><span>Submit request</span></span></button>
        <p class="debt-relief-form__status" role="status" aria-live="polite"></p>
      </form>
    `;
  }

  document.querySelectorAll(".debt-relief-form").forEach(form => {
    if (form.dataset.webhookBound) return;
    form.dataset.webhookBound = "true";
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const status = form.querySelector(".debt-relief-form__status");
      const button = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        firstName: data.first_name,
        lastName: data.last_name,
        phoneNumber: data.phone,
        email: data.email,
        stateOrZipCode: data.state_or_zip,
        source: "Encompass landing page"
      };
      try {
        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;
        const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        const endpoint = isLocal ? "https://n8n.srv1169597.hstgr.cloud/webhook/5ab2da27-fe1d-4015-a8e8-c6380d9a1fa3" : "/.netlify/functions/lead";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
        form.reset();
        if (status) status.textContent = "Thank you. Your request was submitted.";
      } catch (error) {
        if (status) status.textContent = "Unable to submit right now. Please try again.";
      } finally {
        if (button) button.disabled = false;
      }
    });
  });

  const serviceImages = [
    "21c7b551-9fca-4c88-8c0c-dbcd7b7c38c9 1.png",
    "311accad-1109-46ed-b800-39c6426f5993 1.png",
    "5f550e84-cb8b-4cba-b6e1-d1669aba86f8 1.png",
    "21c7b551-9fca-4c88-8c0c-dbcd7b7c38c9 1@2x.png"
  ].map(file => new URL(`assets/${file}`, window.location.href).href);

  document.querySelectorAll(".HomeQuadrants .quadrant__image--main img").forEach((image, index) => {
    if (serviceImages[index]) {
      image.src = serviceImages[index];
      image.srcset = "";
      image.alt = [
        "Debt review and strategy dashboard.",
        "Creditor resolution support dashboard.",
        "Payment plan guidance dashboard.",
        "Financial recovery roadmap dashboard."
      ][index];
    }
  });

  const approachImage = document.querySelector(".TestimonialCaseStudyBlock .main-image img");
  if (approachImage) {
    approachImage.src = new URL("assets/3f88046d-00b8-4970-aabe-1dfd1591722e 1.png", window.location.href).href;
    approachImage.srcset = "";
    approachImage.alt = "A calmer path from debt stress to resolution.";
  }

  const showcaseImages = [
    "6bb3860e-611e-4d75-b9df-11c7c4086ac9 1.png",
    "1e638c19-37e3-4c53-85b4-f81bf55cceff 1.png",
    "5dab121a-cfab-46de-a1ae-c6709f37fccc 1.png",
    "67f569ce-95d0-417c-b68f-a57e68e5a6d8 1.png",
    "3e8309ec-6546-4be6-999a-354850255470 1.png",
    "740fdeab-5e5c-4770-b0ab-103b1e43d2cf 1.png",
    "b6167ba8-43b0-4810-96fc-c9de4185c029 1.png",
    "c1e01d5e-29e9-4dff-9aae-f543b99878d9 1.png",
    "c814e739-bd13-4a5c-bc4d-7b716ba82f42 1.png"
  ].map(file => new URL(`assets/${file}`, window.location.href).href);

  document.querySelectorAll(".HomeShowcase .imageCard img, .HomeShowcaseMobile .imageCard img, .HomeShowcaseMobile .carousel-item .frame.image img").forEach((image, index) => {
    const src = showcaseImages[index % showcaseImages.length];
    if (src) {
      image.src = src;
      image.srcset = "";
      image.alt = "Debt relief landing page showcase.";
    }
  });

};

const runDebtCopy = () => {
  applyDebtCopy();
  window.setTimeout(applyDebtCopy, 1200);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runDebtCopy, { once: true });
} else {
  runDebtCopy();
}

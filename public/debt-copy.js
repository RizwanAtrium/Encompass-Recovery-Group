const ENCOMPASS_TRACKING_CONFIG = {
  googleTagId: "AW-10953060841",
  conversionSendTo: "AW-10953060841/69XjCMjUnb0cEOnj6eYo",
  conversionValue: 1,
  conversionCurrency: "USD"
};

const ENCOMPASS_PRIVACY_POLICY_URL = "https://www.encompassrecoverygroup.com/privacy-policy/";
const ENCOMPASS_SUBMIT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd2k2ly4XhKzd7NbPK_gOacL6BvIxD6zb32S2rFVoqAwJqQ2A/viewform?hl=en";
const getFunctionUrls = name => [
  `${window.location.origin}/.netlify/functions/${name}`,
  `${window.location.origin}/api/${name}`
];
const getFunctionUrl = name => getFunctionUrls(name)[0];

const isFunctionMissingResponse = (response, result) => response.status === 404 || result?.error === "empty_response" || /404/.test(String(result?.message || ""));

const postToFunction = async (name, payload) => {
  let lastResponse = null;
  let lastResult = null;
  for (const endpoint of getFunctionUrls(name)) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await readJsonResponse(response);
      lastResponse = response;
      lastResult = result;
      if (!isFunctionMissingResponse(response, result)) return { response, result, endpoint };
    } catch (error) {
      lastResult = { ok: false, error: "network_error", message: error?.message || String(error) };
    }
  }
  const message = name === "otp-send"
    ? "Netlify Function not found (404). Deploy the full project with Netlify build/CLI, not only the dist folder."
    : "Lead submit function not found (404). Deploy the full project with Netlify build/CLI, not only the dist folder.";
  return {
    response: lastResponse || { ok: false, status: 404 },
    result: { ...(lastResult || {}), ok: false, error: "function_not_deployed", message },
    endpoint: getFunctionUrl(name)
  };
};

const readJsonResponse = async response => {
  const text = await response.text();
  if (!text) {
    return {
      ok: false,
      error: "empty_response",
      message: response.ok
        ? "Server returned an empty response. Please redeploy Netlify functions and clear cache."
        : `Server returned empty response (${response.status}). Please check Netlify Functions logs.`
    };
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      error: "non_json_response",
      message: `Server returned non-JSON response (${response.status}). Please check Netlify Functions deploy/logs.`,
      raw: text.slice(0, 240)
    };
  }
};

const ENCOMPASS_ATTRIBUTION_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content"
];

const getTrackingConfig = () => ({
  ...ENCOMPASS_TRACKING_CONFIG,
  ...(window.ENCOMPASS_TRACKING_CONFIG || {})
});

const getCurrentPageUrl = () => {
  try {
    if (window.parent && window.parent !== window && window.parent.location.origin === window.location.origin) {
      return window.parent.location.href;
    }
  } catch (error) {}
  return window.location.href;
};

const getPageHashUrl = hash => {
  const url = new URL(getCurrentPageUrl());
  url.hash = hash.startsWith("#") ? hash : `#${hash}`;
  return url.href;
};

const storeLeadAttribution = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const saved = JSON.parse(sessionStorage.getItem("encompassLeadAttribution") || "{}");
    const next = { ...saved };
    ENCOMPASS_ATTRIBUTION_KEYS.forEach(key => {
      const value = params.get(key);
      if (value) next[key] = value;
    });
    next.landingPage = saved.landingPage || window.location.href;
    next.referrer = saved.referrer || document.referrer || "";
    next.capturedAt = saved.capturedAt || new Date().toISOString();
    sessionStorage.setItem("encompassLeadAttribution", JSON.stringify(next));
  } catch (error) {
    // Attribution is helpful for PPC, but form submission must not depend on storage.
  }
};

const getLeadAttribution = () => {
  try {
    return JSON.parse(sessionStorage.getItem("encompassLeadAttribution") || "{}");
  } catch (error) {
    return {};
  }
};

const pushTrackingEvent = (event, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  const payload = {
    event,
    form_name: "debt_relief_lead_form",
    ...params
  };
  window.dataLayer.push(payload);
  return payload;
};

const getFormLocation = form => form?.id === "debt-form-hero" ? "hero" : "footer";

const createLeadId = () => {
  try {
    const bytes = new Uint32Array(3);
    crypto.getRandomValues(bytes);
    return `lead_${Date.now()}_${[...bytes].map(value => value.toString(36)).join("")}`;
  } catch (error) {
    return `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
};

const setupLeadTracking = () => {
  const config = getTrackingConfig();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!config.googleTagId) return;
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleTagId}`;
    document.head.appendChild(script);
  }
  if (window.__encompassGoogleAdsConfigured) return;
  window.__encompassGoogleAdsConfigured = true;
  window.gtag("config", config.googleTagId);
};

const trackLeadSubmit = form => {
  const config = getTrackingConfig();
  const leadId = form.__leadId || createLeadId();
  form.__leadId = leadId;
  pushTrackingEvent("lead_submit_success", {
    form_location: getFormLocation(form),
    conversion_type: "verified_lead",
    lead_id: leadId
  });
  if (!window.gtag || form.dataset.adsConversionSent === "true") return;
  form.dataset.adsConversionSent = "true";
  if (config.conversionSendTo) {
    window.gtag("event", "conversion", {
      send_to: config.conversionSendTo,
      value: config.conversionValue,
      currency: config.conversionCurrency,
      transaction_id: leadId
    });
  }
};

const setupHeroDebtWizard = root => {
  const steps = [
    {
      key: "debtAmount",
      title: "How Much Debt Do You Have?",
      subtitle: "Find out how much you could save. Free, no-obligation consultation.",
      type: "options",
      columns: 2,
      options: ["$0– $5,000", "$5,000 – $10,000", "$10,000 – $15,000", "$15,000 – $20,000", "$20,000 – $30,000", "$30,000+"]
    },
    {
      key: "debtType",
      title: "What Types of Debt Do You Have?",
      subtitle: "Select the primary type of debt you're looking to resolve.",
      type: "options",
      columns: 2,
      options: [
        ["Payday Loans", "#2c858c", "▤"],
        ["Installment Loans", "#df3d57", "♡"],
        ["Personal Loans", "#8b54d6", "▭"],
        ["Credit Cards", "#c96b22", "▣"],
        ["Repo", "#2aa0a4", "▥"],
        ["Other / Multiple", "#6b7280", "▱"]
      ]
    },
    {
      key: "behindPayments",
      title: "Are You Behind on Any Payments?",
      subtitle: "This helps us understand your situation and find the best solution.",
      type: "options",
      columns: 1,
      options: [
        ["No, I'm current on all payments", "#25a36f", "✓"],
        ["Yes, I'm behind on some payments", "#d4be25", "○"],
        ["Yes, I'm behind on most or all payments", "#6b7280", ""]
      ]
    },
    {
      key: "hardship",
      title: "What's Causing Your Financial Hardship?",
      subtitle: "Understanding your situation helps us tailor the right debt relief program for you.",
      type: "options",
      columns: 2,
      options: [
        ["Job Loss / Reduced Income", "#d83248", "▥"],
        ["Medical Expenses", "#dd3e6c", "♡"],
        ["Divorce / Separation", "#9a6ad8", "⌘"],
        ["Over Spending", "#d09a16", "♧"],
        ["Interest Rates Too High", "#da4b54", "⌞"],
        ["Other", "#6b7280", ""]
      ]
    },
    {
      key: "state",
      title: "What State Do You Live In?",
      subtitle: "Debt relief programs vary by state. We'll match you with options available in your area.",
      type: "state"
    },
    {
      key: "loading",
      title: "Analyzing Your Debt Profile...",
      subtitle: "We're matching you with the best debt relief options based on your information.",
      type: "loading"
    },
    {
      key: "contact",
      title: "Great News — You May Qualify to Save Up to 50%!",
      subtitle: "Enter your details below to receive your free, personalized debt savings estimate. No obligation, no impact to your credit score.",
      type: "contact"
    }
  ];
  const states = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Delaware", "Florida", "Georgia", "Illinois", "Indiana", "Iowa", "Kentucky", "Louisiana", "Maine", "Maryland", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Mexico", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "South Carolina", "Tennessee", "Texas", "Utah", "Washington", "Washington, District of Columbia", "West Virginia", "Wyoming"];
  const data = {};
  let index = 0;
  const form = root.matches?.(".debt-relief-form") ? root : root.querySelector(".debt-relief-form");
  const content = form?.querySelector("[data-wizard-content]") || root.querySelector("[data-wizard-content]");
  const progressMax = steps.length - 1;
  const stepNames = ["debt_amount", "debt_type", "payment_status", "hardship_reason", "state", "loading", "contact_details"];
  const formLocation = getFormLocation(form);
  const markFormStarted = () => {
    if (form.__formStarted) return;
    form.__formStarted = true;
    pushTrackingEvent("lead_form_start", { form_location: formLocation });
  };
  const getStepPayload = () => ({
    form_location: formLocation,
    step_number: Math.min(index + 1, 6),
    step_name: stepNames[index] || steps[index]?.key || "unknown"
  });
  const trackStepView = () => {
    if (steps[index]?.type === "loading") return;
    const payload = getStepPayload();
    if (form.__lastStepView === `${payload.step_number}:${payload.step_name}`) return;
    form.__lastStepView = `${payload.step_number}:${payload.step_name}`;
    form.__lastStepNumber = payload.step_number;
    form.__lastStepName = payload.step_name;
    if (!form.__formViewed) {
      pushTrackingEvent("lead_form_view", payload);
      form.__formViewed = true;
    }
    pushTrackingEvent("lead_form_step_view", payload);
  };
  const trackAbandon = lastAction => {
    if (form.__submittedSuccess || !form.__formStarted) return;
    pushTrackingEvent("lead_form_abandon", {
      form_location: formLocation,
      last_step_number: form.__lastStepNumber || Math.min(index + 1, 7),
      last_step_name: form.__lastStepName || stepNames[index] || "unknown",
      last_action: lastAction
    });
  };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const go = nextIndex => {
    index = Math.max(0, Math.min(steps.length - 1, nextIndex));
    render();
  };
  const render = () => {
    const step = steps[index];
    const pct = Math.max(17, Math.round(((index + 1) / progressMax) * 100));
    let body = "";
    if (step.type === "options") {
      const options = step.options.map(item => Array.isArray(item) ? item : [item, "#6b7280", ""]);
      body = `
        <div class="hero-debt-wizard__options ${step.columns === 1 ? "is-single" : ""}">
          ${options.map(([label, color, icon]) => `
            <button class="hero-debt-wizard__option" type="button" data-value="${esc(label)}" style="--step-color:${color}">
              <span class="hero-debt-wizard__icon">${esc(icon)}</span>
              ${esc(label)}
              <span aria-hidden="true"></span>
            </button>
          `).join("")}
        </div>
        ${index === 0 ? `<button class="hero-debt-wizard__continue" type="button" disabled>Continue ›</button>` : ""}
        ${index > 0 ? `<button class="hero-debt-wizard__back" type="button">← Back</button>` : ""}
      `;
    } else if (step.type === "state") {
      body = `
        <select class="hero-debt-wizard__select" name="state" required>
          <option value="">Select your State</option>
          ${states.map(state => `<option value="${esc(state)}">${esc(state)}</option>`).join("")}
        </select>
        <button class="hero-debt-wizard__continue" type="button" disabled>Continue ›</button>
        <button class="hero-debt-wizard__back" type="button">← Back</button>
      `;
    } else if (step.type === "loading") {
      body = `<div class="hero-debt-wizard__loader" aria-hidden="true"></div>`;
      window.setTimeout(() => {
        if (steps[index]?.type === "loading") go(index + 1);
      }, 1800);
    } else {
      body = `
        <div class="hero-debt-wizard__fields">
          <input class="hero-debt-wizard__input" name="first_name" autocomplete="given-name" placeholder="First Name" required>
          <input class="hero-debt-wizard__input" name="last_name" autocomplete="family-name" placeholder="Last Name" required>
          <input class="hero-debt-wizard__input" name="email" type="email" autocomplete="email" placeholder="Email Address" required>
          <div class="hero-debt-wizard__phone">
            <span class="hero-debt-wizard__phone-code">US +1⌄</span>
            <input class="hero-debt-wizard__input" name="phone" type="tel" autocomplete="tel" placeholder="Enter your phone number" required>
          </div>
        </div>
        <button class="hero-debt-wizard__submit" type="submit">Get My Free Savings Estimate →</button>
        <button class="hero-debt-wizard__back" type="button">← Back</button>
        <p class="debt-relief-form__status" role="status" aria-live="polite"></p>
      `;
    }
    content.innerHTML = `
      <div class="hero-debt-wizard__topline"><span>Free debt review</span><span>Secure verification</span></div>
      <h2 class="hero-debt-wizard__title">${esc(step.title)}</h2>
      <p class="hero-debt-wizard__subtitle">${esc(step.subtitle)}</p>
      <div class="hero-debt-wizard__progress"><span class="hero-debt-wizard__bar" style="width:${pct}%"></span></div>
      ${body}
    `;
    trackStepView();
  };
  content.addEventListener("click", event => {
    const option = event.target.closest(".hero-debt-wizard__option");
    const back = event.target.closest(".hero-debt-wizard__back");
    const cont = event.target.closest(".hero-debt-wizard__continue");
    const verify = event.target.closest(".hero-debt-wizard__otp-submit");
    if (option) {
      data[steps[index].key] = option.dataset.value || option.textContent.trim();
      markFormStarted();
      pushTrackingEvent("lead_form_option_select", {
        ...getStepPayload(),
        option_label: data[steps[index].key]
      });
      content.querySelectorAll(".hero-debt-wizard__option").forEach(button => button.classList.toggle("is-selected", button === option));
      if (index === 0) {
        const button = content.querySelector(".hero-debt-wizard__continue");
        if (button) button.disabled = false;
      } else {
        window.setTimeout(() => go(index + 1), 180);
      }
    }
    if (back) {
      pushTrackingEvent("lead_form_back_click", getStepPayload());
      go(index - 1);
    }
    if (cont && !cont.disabled) {
      pushTrackingEvent("lead_form_continue_click", getStepPayload());
      const select = content.querySelector("select[name='state']");
      if (select) data.state = select.value;
      go(index + 1);
    }
    if (verify) {
      const status = content.querySelector(".debt-relief-form__status");
      const code = [...content.querySelectorAll(".hero-debt-wizard__otp-input")].map(input => input.value).join("");
      pushTrackingEvent("email_verify_click", {
        form_location: formLocation,
        step_number: 7,
        step_name: "email_verification"
      });
      verify.disabled = true;
      if (status) status.textContent = "Verifying...";
      fetch(getFunctionUrl("otp-verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.__otpEmail, code, token: form.__otpToken })
      })
        .then(response => {
          if (!response.ok) throw new Error("Invalid code");
          form.dataset.otpVerified = "true";
          return form.__submitLeadPayload?.(form.__pendingPayload);
        })
        .catch(error => {
          const message = error?.message || "Invalid verification code.";
          pushTrackingEvent("email_verify_error", {
            form_location: formLocation,
            step_number: 7,
            step_name: "email_verification",
            error_type: /expired/i.test(message) ? "expired_code" : "invalid_code"
          });
          if (status) status.textContent = "Invalid verification code.";
          verify.disabled = false;
        });
    }
  });
  content.addEventListener("input", event => {
    const input = event.target.closest(".hero-debt-wizard__otp-input");
    if (!input) return;
    const digits = input.value.replace(/\D/g, "");
    const inputs = [...content.querySelectorAll(".hero-debt-wizard__otp-input")];
    const start = inputs.indexOf(input);
    if (digits.length > 1) {
      digits.slice(0, inputs.length - start).split("").forEach((digit, offset) => {
        inputs[start + offset].value = digit;
      });
      inputs[Math.min(start + digits.length, inputs.length - 1)]?.focus?.();
      return;
    }
    input.value = digits.slice(0, 1);
    if (input.value) input.nextElementSibling?.focus?.();
  });
  content.addEventListener("paste", event => {
    const input = event.target.closest(".hero-debt-wizard__otp-input");
    if (!input) return;
    const digits = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 4);
    if (!digits) return;
    event.preventDefault();
    const inputs = [...content.querySelectorAll(".hero-debt-wizard__otp-input")];
    digits.split("").forEach((digit, index) => {
      if (inputs[index]) inputs[index].value = digit;
    });
    inputs[Math.min(digits.length, inputs.length) - 1]?.focus?.();
  });
  content.addEventListener("change", event => {
    const select = event.target.closest("select[name='state']");
    if (select) {
      data.state = select.value;
      markFormStarted();
      pushTrackingEvent("lead_form_option_select", {
        ...getStepPayload(),
        option_label: "state_selected"
      });
      const button = content.querySelector(".hero-debt-wizard__continue");
      if (button) button.disabled = !select.value;
    }
  });
  form.__heroWizardData = data;
  form.__showOtp = ({ payload, token, email, devCode }) => {
    form.__pendingPayload = payload;
    form.__otpToken = token;
    form.__otpEmail = email || payload.email;
    form.__lastStepNumber = 7;
    form.__lastStepName = "email_verification";
    pushTrackingEvent("email_verification_view", {
      form_location: formLocation,
      step_number: 7,
      step_name: "email_verification"
    });
    content.innerHTML = `
      <h2 class="hero-debt-wizard__title">Verify your email</h2>
      <p class="hero-debt-wizard__subtitle">Enter the 4-digit code sent to ${esc(form.__otpEmail || "your email")}.</p>
      <div class="hero-debt-wizard__otp">
        <input class="hero-debt-wizard__otp-input" inputmode="numeric" maxlength="1" autocomplete="one-time-code">
        <input class="hero-debt-wizard__otp-input" inputmode="numeric" maxlength="1">
        <input class="hero-debt-wizard__otp-input" inputmode="numeric" maxlength="1">
        <input class="hero-debt-wizard__otp-input" inputmode="numeric" maxlength="1">
      </div>
      <button class="hero-debt-wizard__submit hero-debt-wizard__otp-submit" type="button">Verify & Submit</button>
      <button class="hero-debt-wizard__back" type="button">← Back</button>
      <p class="debt-relief-form__status" role="status" aria-live="polite">${devCode ? `Local test code: ${esc(devCode)}` : ""}</p>
    `;
    content.querySelector(".hero-debt-wizard__otp-input")?.focus();
  };
  form.__showComplete = () => {
    form.__submittedSuccess = true;
    pushTrackingEvent("request_submitted_view", {
      form_location: formLocation,
      conversion_type: "verified_lead",
      lead_id: form.__leadId
    });
    content.innerHTML = `
      <h2 class="hero-debt-wizard__title">Request submitted</h2>
      <p class="hero-debt-wizard__subtitle">Thank you. Your email is verified and your request was submitted.</p>
      <p class="hero-debt-wizard__subtitle hero-debt-wizard__complete-copy">Share a few extra details so our review team can prepare a clearer, more personalized next step for you.</p>
      <a class="hero-debt-wizard__submit hero-debt-wizard__complete-link" href="${ENCOMPASS_SUBMIT_FORM_URL}" target="_blank" rel="noopener noreferrer">Submit Form →</a>
    `;
    content.querySelector(".hero-debt-wizard__complete-link")?.addEventListener("click", () => {
      pushTrackingEvent("post_submit_google_form_click", {
        form_location: formLocation,
        conversion_type: "secondary_google_form",
        lead_id: form.__leadId
      });
    });
  };
  if (!form.__abandonBound) {
    form.__abandonBound = true;
    window.addEventListener("pagehide", () => trackAbandon("pagehide"));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") trackAbandon("visibility_hidden");
    });
  }
  render();
};

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
    ["High-Performing Website", "Debt Resolution Support"],
    ["UI / UX", "Debt Review"],
    ["UI/UX", "Debt Review"],
    ["Brand Identity & Positioning", "Payment Plan Guidance"],
    ["Flexible Design Support", "Financial Recovery Roadmap"],
    ["Is poor design costing you users? We fix friction. We design intuitive, human-centered interfaces that reduce churn, delight customers, and make your product a joy to use.", "Start with a clear review of your debts, goals, and options so the next step feels manageable"],
    ["Beautiful sites that perform. Whether it's a custom build or a Shopify store, we create responsive websites designed to turn visitors into customers.", "Get support for organizing creditor conversations and moving toward a practical resolution path."],
    ["We build memorable brands that stand out in crowded markets. From visual identity systems to voice and tone, we ensure your brand signals trust and drives loyalty.", "Understand payment priorities, timelines, and tradeoffs before choosing a plan that fits your situation."],
    ["Your on-demand creative department. Clear your design backlog and keep your brand evolving with our flexible, credit-based support model. No cost commitments, only pay for what you need.", "Build habits and milestones that support stability after debt relief decisions are made."],
    ["Why Ratio has trusted us with their key accounts for over 3 years.", "A calmer path from debt stress to resolution."],
    ["We've delivered for:", "Support built around:"],
    ["Testimonial", "Our approach"],
    ["I've always been very impressed with the quality, care, enthusiasm and end results of everything they've done", "I was drowning in payday loan debt and didn't know where to turn. Encompass Recovery Group sat with me, explained every step, and within months my payments were cut nearly in half. For the first time in years, I feel like I can breathe again. They didn't just help me with my debt - they gave me my life back."],
    ["What we do", "Debt Resolution Showcase"],
    ["Optimising conversion without compromising luxury", "Review your debt picture with clarity"],
    ["Modernising a group of sites for a marine services provider", "See how our step-by-step process can guide you toward clarity and control"],
    ["A bold new identity for a Shopify Platinum Partner", "Move toward a realistic resolution plan"],
    ["We redesigned user journeys across the site to make them smoother and more intuitive.", "We turn a complex debt picture into a clearer sequence of choices and next steps."],
    ["Breaking key pages into modular components allowed us to build a shared design system.", "A structured process keeps balances, timing, and creditor priorities easier to review."],
    ["The new website needed to reflect Roswell's bold, confident identity while letting their work take center stage.", "The goal is a practical path that respects your situation and keeps the process understandable."],
    ["Want to see more?", ""],
    ["View Project", "Learn More"],
    ["View all case studies", "Submit Form"],
    ["Scale your team instantly. Zero overheads.", "Guidance when debt feels overwhelming."],
    ["Our talent, your brand. We help you say \"yes\" to big projects without adding permanent payroll. Get white-label, development-ready execution that integrates seamlessly into your workflow.", "We help you organize your finances, understand the process, and focus on the next practical step"],
    ["Partner with us", "Talk to us"],
    ["Direct access to expert talent", "Confidential debt review"],
    ["You don't deal with account managers; you speak directly to the creatives solving your problem. With every project guided by senior leadership, you get the firepower of a full agency team without the administrative bloat.", "Start with a clear, private review of your debt picture so every next step feels easier to understand."],
    ["Meet the makers", "See the Process"],
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
    node.nodeValue = replaceText(node.nodeValue)
      .replace(/over 9 years/gi, "over 10 years")
      .replace(/9\+\s*Years/gi, "10+ Years")
      .replace(/backin/gi, "back in")
      .replace(/&Debt/g, "& Debt")
      .replace(/ {2,}/g, " ");
  });

  document.querySelectorAll("p").forEach(paragraph => {
    if (paragraph.closest(".debt-relief-form, .hero-debt-form__chips, footer")) return;
    const text = normalize(paragraph.textContent);
    if (text && text.length > 20 && !/[.!?]"?$/.test(text)) {
      paragraph.textContent = `${text}.`;
    }
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
    ["Need a clearer path?", ""],
    ["Explore options", "Submit Form"],
    ["Guidance when debt feels overwhelming.", "Guidance when debt feels overwhelming"],
    ["We help you organize your finances, understand the process, and focus on the next practical step", "We help you organize your finances, understand the process, and focus on the next practical step"],
    ["Talk to us", "Talk to Us"],
    ["Direct access to resolution support", "Confidential debt review"],
    ["Talk through your situation with a team focused on clarity, respect, and practical guidance", "Start with a clear, private review of your debt picture so every next step feels easier to understand"],
    ["Meet the team", "See the Process"],
    ["Less confusion. More direction.", "Less confusion. More direction."],
    ["Bring scattered balances, due dates, and creditor questions into one streamlined process", "Bring scattered balances, due dates, and creditor questions into one streamlined process"],
    ["See the process", "See the Process"],
    ["The Resolution Standard", "The Resolution Standard"],
    ["Our process centers on clear information, careful review, and practical debt resolution support", "Our process centers on clear information, careful review, and practical debt resolution support"],
    ["Take the first step toward debt resolution", "Take the first step toward debt resolution"],
    ["Start with a confidential conversation about debt relief. We'll guide you through the next step", "Start with a confidential conversation about debt relief. We'll guide you through the next step"],
    ["Steve", "Maria T., Fort Lauderdale, FL | Enrolled Client | Payday Loan Consolidation Program"]
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
      .page--home > div[data-first="true"] {
        background: #1a5769 !important;
        background-color: #1a5769 !important;
      }
      .HomeHero {
        background: transparent !important;
        background-color: transparent !important;
        position: relative !important;
        z-index: 4 !important;
      }
      #background {
        background: transparent !important;
        pointer-events: none !important;
        z-index: 3 !important;
      }
      .HomeHero .cover {
        position: relative !important;
        z-index: 4 !important;
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
      .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .hidden-content,
      .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .quadrant__imageContainer {
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
      .HomeQuadrants .quadrant:hover .hidden-content,
      .HomeQuadrants .quadrant:focus .hidden-content,
      .HomeQuadrants .quadrant:focus-within .hidden-content,
      .HomeQuadrants .quadrant.is-active .hidden-content,
      .HomeQuadrants .quadrant:hover .quadrant__imageContainer,
      .HomeQuadrants .quadrant:focus .quadrant__imageContainer,
      .HomeQuadrants .quadrant:focus-within .quadrant__imageContainer,
      .HomeQuadrants .quadrant.is-active .quadrant__imageContainer {
        opacity: 1 !important;
        pointer-events: auto !important;
        visibility: visible !important;
      }
      .HomeQuadrants .quadrant:hover .hidden-content,
      .HomeQuadrants .quadrant:focus .hidden-content,
      .HomeQuadrants .quadrant:focus-within .hidden-content,
      .HomeQuadrants .quadrant.is-active .hidden-content {
        display: grid !important;
      }
      .HomeQuadrants .quadrant:hover .quadrant__imageContainer,
      .HomeQuadrants .quadrant:focus .quadrant__imageContainer,
      .HomeQuadrants .quadrant:focus-within .quadrant__imageContainer,
      .HomeQuadrants .quadrant.is-active .quadrant__imageContainer {
        display: block !important;
      }
      @media (hover: none), (pointer: coarse), (max-width: 767px) {
        .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .hidden-content,
        .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .quadrant__imageContainer,
        .HomeQuadrants .quadrant .hidden-content,
        .HomeQuadrants .quadrant .quadrant__imageContainer {
          opacity: 1 !important;
          pointer-events: auto !important;
          visibility: visible !important;
        }
        .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .hidden-content,
        .HomeQuadrants .quadrant .hidden-content {
          display: grid !important;
        }
        .HomeQuadrants .quadrant:not(.is-active):not(:hover):not(:focus):not(:focus-within) .quadrant__imageContainer,
        .HomeQuadrants .quadrant .quadrant__imageContainer {
          display: block !important;
        }
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
      body > header,
      #header {
        inset-block-start: 0 !important;
        left: 0 !important;
        position: absolute !important;
        right: 0 !important;
        top: 0 !important;
        transform: translate3d(0, 0, 0) !important;
        translate: none !important;
        z-index: 1000 !important;
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
      .showcase-submit-button {
        align-items: center !important;
        background: #175f4d !important;
        border: 1px solid rgba(255,255,255,.55) !important;
        border-radius: .55rem !important;
        color: #ffffff !important;
        display: inline-flex !important;
        font-size: clamp(1.4rem, 4vw, 3.2rem) !important;
        font-weight: 800 !important;
        justify-content: center !important;
        line-height: 1 !important;
        padding: .75rem 1.5rem !important;
        text-decoration: none !important;
        width: max-content !important;
      }
      .HomeShowcase .showcase-submit-button,
      .HomeShowcaseMobile .showcase-submit-button {
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .HomeShowcase [class*="ender"],
      .HomeShowcaseMobile header {
        text-align: center !important;
      }
      .HomeShowcase [class*="ender"] h1,
      .HomeShowcase [class*="ender"] h2,
      .HomeShowcase [class*="ender"] h3 {
        display: none !important;
      }
      .HomeShowcase [class*="ender"] .btn,
      .HomeShowcase [class*="ender"] a,
      .HomeShowcaseMobile header .btn,
      .HomeShowcaseMobile header a {
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .showcase-submit-button:hover {
        background: #0f4d3f !important;
        transform: translateY(-1px);
      }
      .HomeHero {
        min-height: 100svh !important;
        position: relative !important;
        z-index: 4 !important;
      }
      .HomeHero .cover,
      .HomeHero .cover-center,
      .HomeHero .container {
        min-height: auto !important;
        width: 100% !important;
      }
      .HomeHero .cover {
        display: grid !important;
      }
      .HomeHero .cover-center {
        display: block !important;
      }
      .HomeHero #HomeHero__content {
        align-items: center !important;
        display: flex !important;
        justify-content: center !important;
        opacity: 1 !important;
        padding: 0 !important;
        transform: none !important;
        translate: none !important;
        width: 100% !important;
        position: relative !important;
        z-index: 2 !important;
      }
      .hero-debt-form {
        animation: heroFormIn .85s cubic-bezier(.2, .8, .2, 1) both;
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        color: #1c1d2a !important;
        display: block;
        margin: 0 auto;
        max-width: 78rem;
        min-height: auto;
        overflow: visible;
        padding: clamp(1rem, 2vw, 1.25rem) clamp(1rem, 3vw, 2rem) 2rem;
        position: relative;
        width: 100%;
        z-index: 7;
      }
      .hero-debt-form::before {
        display: none !important;
      }
      .hero-debt-form__intro {
        display: none !important;
      }
      .hero-debt-form__intro::after {
        display: none !important;
      }
      .hero-debt-form__logo {
        display: grid;
        gap: .25rem;
        justify-items: center;
      }
      .hero-debt-form__logo img {
        height: auto;
        width: clamp(8.5rem, 16vw, 12.5rem);
      }
      .hero-debt-form__powered {
        color: #3b3b3b !important;
        font-size: .62rem;
        font-style: italic;
      }
      .hero-debt-form__assist {
        color: #151515 !important;
        font-size: clamp(.82rem, 1.2vw, .98rem);
        font-weight: 800;
        line-height: 1.4;
        text-align: right;
      }
      .hero-debt-form__assist a {
        align-items: center;
        color: #357c78 !important;
        display: inline-flex;
        font-size: clamp(1.1rem, 2vw, 1.55rem);
        font-weight: 500;
        gap: .35rem;
        text-decoration: underline;
      }
      .hero-debt-form__headline {
        display: none !important;
      }
      .HomeHero .hero-debt-form__title,
      .hero-debt-form__title {
        color: #000000 !important;
        font-size: clamp(1.8rem, 3.2vw, 2.45rem) !important;
        font-weight: 900 !important;
        letter-spacing: 0;
        line-height: .95 !important;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center !important;
        text-transform: uppercase;
      }
      .hero-debt-form__copy {
        color: #000000 !important;
        font-size: clamp(1.05rem, 2vw, 1.55rem);
        line-height: 1.32;
        margin: 1.15rem auto 0;
        text-align: center !important;
      }
      .hero-debt-wizard {
        background: linear-gradient(145deg, #071f26, #0f4c4e) !important;
        border: 1px solid rgba(255,255,255,.18) !important;
        border-radius: 1.15rem !important;
        box-shadow: 0 1.5rem 3.8rem rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255,255,255,.16) !important;
        margin: 0 auto;
        max-width: 43rem;
        min-height: 18rem;
        overflow: hidden;
        padding: clamp(1.15rem, 2.5vw, 1.65rem);
        position: relative;
        z-index: 1;
      }
      .anchor-content .hero-debt-wizard {
        width: min(100%, 43rem);
      }
      .hero-debt-wizard::before {
        background: linear-gradient(90deg, rgba(246,194,26,.14), transparent 34%), radial-gradient(circle at 100% 0%, rgba(255,255,255,.16), transparent 30%);
        content: "";
        inset: 0;
        pointer-events: none;
        position: absolute;
      }
      .hero-debt-wizard > * {
        position: relative;
        z-index: 1;
      }
      .hero-debt-wizard__topline {
        align-items: center;
        display: flex;
        gap: .55rem;
        justify-content: center;
        margin-bottom: .75rem;
      }
      .hero-debt-wizard__topline span {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 999px;
        color: #d9f7ef !important;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .04em;
        padding: .38rem .62rem;
        text-transform: uppercase;
      }
      .hero-debt-wizard__title {
        color: #ffffff !important;
        font-size: clamp(1.45rem, 2.6vw, 2rem) !important;
        font-weight: 900 !important;
        line-height: 1.15 !important;
        margin: 0 !important;
        text-align: center;
      }
      .hero-debt-wizard__subtitle {
        color: #ffffff !important;
        font-size: clamp(.95rem, 1.5vw, 1.08rem);
        line-height: 1.25;
        margin: .45rem auto 1.25rem;
        max-width: 37rem;
        text-align: center;
      }
      .hero-debt-wizard .hero-debt-wizard__subtitle,
      .hero-debt-wizard p.hero-debt-wizard__subtitle {
        color: #ffffff !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #ffffff !important;
      }
      .hero-debt-wizard__progress {
        background: rgba(255,255,255,.16);
        border-radius: 999px;
        height: .48rem;
        margin: 0 auto 1.15rem;
        max-width: 38.1rem;
        overflow: hidden;
      }
      .hero-debt-wizard__bar {
        background: linear-gradient(90deg, #f6c21a, #44d0a7);
        border-radius: inherit;
        display: block;
        height: 100%;
        transition: width .25s ease;
      }
      .hero-debt-wizard__options {
        display: grid;
        gap: .7rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .hero-debt-wizard__options.is-single,
      .hero-debt-wizard__fields {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr;
      }
      .hero-debt-wizard__option {
        align-items: center;
        background: rgba(255,255,255,.08) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        border-radius: .85rem !important;
        box-shadow: 0 .6rem 1.25rem rgba(0, 0, 0, .16) !important;
        color: #ffffff !important;
        cursor: pointer;
        display: flex !important;
        font: inherit;
        gap: .75rem;
        justify-content: flex-start !important;
        min-height: 3.35rem;
        padding: .7rem 1rem !important;
        text-align: left;
        transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease;
        width: 100%;
      }
      .hero-debt-wizard__icon {
        color: #f6c21a !important;
        flex: 0 0 auto;
        font-size: 1rem;
        width: 1.25rem;
      }
      .hero-debt-wizard__option span:not(.hero-debt-wizard__icon):last-child {
        border: 2px solid rgba(255,255,255,.5);
        border-radius: 50%;
        height: 1.25rem;
        margin-left: auto;
        width: 1.25rem;
      }
      .hero-debt-wizard__option:hover,
      .hero-debt-wizard__option.is-selected {
        background: rgba(255,255,255,.16) !important;
        border-color: #f6c21a !important;
        box-shadow: 0 .75rem 1.35rem rgba(0, 0, 0, .24) !important;
        transform: translateY(-1px);
      }
      .hero-debt-wizard__option.is-selected span:not(.hero-debt-wizard__icon):last-child {
        background: #f6c21a;
        border-color: #f6c21a;
        box-shadow: inset 0 0 0 .25rem #0d4a45;
      }
      .hero-debt-wizard__select,
      .hero-debt-wizard__input {
        background: rgba(255,255,255,.94) !important;
        border: 1px solid rgba(255,255,255,.35) !important;
        border-radius: .85rem !important;
        color: #171827 !important;
        -webkit-text-fill-color: #171827 !important;
        caret-color: #171827 !important;
        font: inherit;
        min-height: 3.25rem;
        padding: .78rem 1rem;
        transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        width: 100%;
      }
      .hero-debt-wizard__input::placeholder {
        color: rgba(23, 24, 39, .62) !important;
        -webkit-text-fill-color: rgba(23, 24, 39, .62) !important;
        opacity: 1 !important;
      }
      .hero-debt-wizard__input:-webkit-autofill,
      .hero-debt-wizard__input:-webkit-autofill:hover,
      .hero-debt-wizard__input:-webkit-autofill:focus,
      .hero-debt-wizard__input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #f5faf9 inset !important;
        -webkit-text-fill-color: #171827 !important;
        caret-color: #171827 !important;
        transition: background-color 9999s ease-out 0s;
      }
      .hero-debt-wizard__select:focus,
      .hero-debt-wizard__input:focus {
        background: #ffffff !important;
        border-color: #175f4d !important;
        box-shadow: 0 0 0 .2rem rgba(23, 95, 77, .12) !important;
        outline: 0;
      }
      .hero-debt-wizard__phone {
        display: grid;
        grid-template-columns: 5rem 1fr;
      }
      .hero-debt-wizard__phone-code {
        align-items: center;
        background: rgba(255,255,255,.94);
        border: 1px solid rgba(255,255,255,.35);
        border-radius: .85rem 0 0 .85rem;
        color: #171827 !important;
        display: inline-flex;
        justify-content: center;
      }
      .hero-debt-wizard__phone .hero-debt-wizard__input {
        border-left: 0 !important;
        border-radius: 0 .85rem .85rem 0 !important;
      }
      .hero-debt-wizard__otp {
        display: flex;
        gap: .75rem;
        justify-content: center;
        margin: 1rem 0;
      }
      .hero-debt-wizard__otp-input {
        background: #ffffff !important;
        border: 2px solid #d8dbe1 !important;
        border-radius: .55rem !important;
        color: #171827 !important;
        -webkit-text-fill-color: #171827 !important;
        caret-color: #171827 !important;
        font-size: 1.5rem;
        font-weight: 800;
        height: 3.4rem;
        text-align: center;
        width: 3.4rem;
      }
      .hero-debt-wizard__otp-input:focus {
        border-color: #175f4d !important;
        outline: 0;
      }
      .hero-debt-wizard__continue,
      .hero-debt-wizard__submit {
        align-items: center !important;
        background: linear-gradient(135deg, #f6c21a, #2fc09b) !important;
        border: 0 !important;
        border-radius: .9rem !important;
        color: #08252a !important;
        cursor: pointer;
        display: inline-flex !important;
        font: inherit;
        font-weight: 800 !important;
        justify-content: center !important;
        margin-top: 1.15rem;
        min-height: 3.35rem !important;
        padding: 0 1.25rem !important;
        width: 100%;
      }
      .hero-debt-wizard__continue:disabled,
      .hero-debt-wizard__submit:disabled {
        cursor: not-allowed;
        opacity: 1;
      }
      .hero-debt-wizard__complete-copy {
        margin: .6rem auto 0 !important;
        max-width: 42rem;
      }
      .hero-debt-wizard__complete-link {
        display: inline-flex !important;
        margin: 1.25rem auto 0 !important;
        max-width: 18rem !important;
        text-decoration: none !important;
      }
      .hero-debt-wizard__back {
        background: transparent !important;
        border: 0 !important;
        color: #62656d !important;
        cursor: pointer;
        display: block;
        font: inherit;
        margin: 1rem auto 0;
      }
      .hero-debt-wizard__trust {
        color: #7a7d83 !important;
        display: grid;
        font-size: 1rem;
        gap: .6rem;
        justify-items: center;
        margin: 1.15rem auto 0;
        text-align: center;
      }
      .hero-debt-wizard__badges {
        align-items: center;
        display: flex;
        gap: 1.8rem;
      }
      .hero-debt-wizard__badge {
        color: #273137 !important;
        font-size: .8rem;
        font-weight: 800;
        line-height: .95;
        text-align: center;
      }
      .hero-debt-wizard__badge strong {
        color: #b8142e !important;
        display: block;
        font-size: 1.45rem;
      }
      .hero-debt-wizard__loader {
        border: .25rem solid #e6eeee;
        border-top-color: #175f4d;
        border-radius: 50%;
        height: 3rem;
        margin: 2rem auto;
        width: 3rem;
        animation: heroSpinner .9s linear infinite;
      }
      @keyframes heroSpinner {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes heroFormIn {
        from {
          opacity: 0;
          transform: translateY(1.5rem) scale(.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes heroFormGlow {
        from {
          opacity: .55;
          transform: translate3d(-1rem, .5rem, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(1rem, -.5rem, 0);
        }
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
          background-image:
            linear-gradient(rgba(15, 127, 119, .28) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 127, 119, .28) 1px, transparent 1px) !important;
        }
        .debt-relief-form__grid {
          grid-template-columns: 1fr;
        }
        .HomeHero #HomeHero__content {
          padding: 0 !important;
        }
        .hero-debt-form {
          overflow: auto;
          padding: .75rem .9rem 1.5rem !important;
        }
        .hero-debt-form__intro {
          min-height: 4.3rem;
        }
        .hero-debt-form__title {
          font-size: 1.6rem !important;
        }
        .hero-debt-form__powered,
        .hero-debt-form__assist {
          display: none !important;
        }
        .hero-debt-wizard {
          box-shadow: 0 .9rem 1.25rem rgba(0,0,0,.07) !important;
          min-height: auto;
          padding-bottom: 1rem;
        }
        .hero-debt-wizard__options {
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
        .HomeWheel .HomeWheel__contentWrapper {
          gap: 1.35rem !important;
          padding-inline: 1rem !important;
        }
.HomeWheel .HomeWheel__contentBlock {
  background: #0f7f77 !important;
  border: 1px solid rgba(255, 255, 255, .28) !important;
  border-radius: 1rem !important;
  box-shadow: 0 .85rem 1.8rem rgba(0, 0, 0, .16) !important;
  color: #ffffff !important;
          margin: 0 auto 1.35rem !important;
          max-width: 21rem !important;
          padding: 1.25rem 1rem !important;
          width: calc(100% - 2rem) !important;
        }
        .HomeWheel .HomeWheel__motionPathSvg,
        .HomeWheel .HomeWheel__motionPath {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .HomeWheel .HomeWheel__contentBlock h2,
        .HomeWheel .HomeWheel__contentBlock h3,
        .HomeWheel .HomeWheel__contentBlock .heading,
        .HomeWheel .HomeWheel__contentBlock [class*="heading"],
        .HomeWheel .HomeWheel__contentBlock p,
        .HomeWheel .HomeWheel__contentBlock .prose,
        .HomeWheel .HomeWheel__contentBlock .prose * {
  color: #ffffff !important;
}
        .HomeWheel .HomeWheel__contentBlock .btn {
          background: #0b1014 !important;
          border: 1px solid rgba(15, 127, 119, .18) !important;
          color: #ffffff !important;
        }
        .HomeWheel .HomeWheel__contentBlock .btn * {
          color: #ffffff !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget,
        .HomeWheel .HomeWheel__contentBlock .FigmaToolWidget,
        .HomeWheel .HomeWheel__contentBlock .erg-resolution-widget {
          background: #0f7f77 !important;
          border: 1px solid rgba(15, 127, 119, .22) !important;
          box-shadow: 0 .45rem 1rem rgba(0, 0, 0, .10) !important;
          color: #123f4c !important;
          margin-inline: auto !important;
          max-width: 100% !important;
          min-height: 0 !important;
          padding: .65rem .75rem !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .inner,
        .HomeWheel .HomeWheel__contentBlock .FigmaToolWidget .inner {
          background: transparent !important;
          color: #ffffff !important;
          display: flex !important;
          gap: .5rem !important;
          min-height: 0 !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .inner {
          align-items: center !important;
          justify-content: center !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaToolWidget .inner {
          align-items: center !important;
          justify-content: center !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .content {
          color: #ffffff !important;
          line-height: 1.2 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .icon,
        .HomeWheel .HomeWheel__contentBlock .FigmaToolWidget .icon {
          align-items: center !important;
          background: #f6c21a !important;
          border-color: rgba(15, 127, 119, .22) !important;
          color: #123f4c !important;
          display: inline-flex !important;
          flex: 0 0 auto !important;
          height: 2rem !important;
          justify-content: center !important;
          min-height: 2rem !important;
          min-width: 2rem !important;
          width: 2rem !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .icon {
          background: #0b1014 !important;
          color: #f6c21a !important;
        }
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget .iconInner::before,
        .HomeWheel .HomeWheel__contentBlock .FigmaWidget [class*="iconInner"]::before {
          content: none !important;
          display: none !important;
        }
        .HomeWheel .erg-resolution-widget {
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        .HomeWheel .erg-resolution-widget__item {
          background: transparent !important;
          color: #ffffff !important;
          flex: 0 0 auto !important;
          justify-content: flex-start !important;
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
      a[href*="privacy-policy"] {
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        color: inherit !important;
        display: inline !important;
        padding: 0 !important;
        text-decoration: underline !important;
      }
      footer .footer__contact a {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
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
      .erg-team-hover {
        align-items: center !important;
        background: rgba(7, 20, 20, .86) !important;
        border: 1px solid rgba(255, 255, 255, .18) !important;
        border-radius: .6rem !important;
        display: flex !important;
        gap: .85rem !important;
        justify-content: center !important;
        padding: .65rem .85rem !important;
        position: relative !important;
        width: max-content !important;
        z-index: 8 !important;
      }
      .erg-team-person {
        cursor: pointer;
        position: relative;
      }
      .erg-team-person__avatar {
        border: 2px solid rgba(255, 255, 255, .86);
        border-radius: 999px;
        box-shadow: 0 .75rem 1.6rem rgba(0, 0, 0, .28);
        display: block;
        height: 3.2rem;
        object-fit: cover;
        width: 3.2rem;
      }
      .erg-team-person__popover {
        background: #071414;
        border: 1px solid rgba(246, 194, 26, .72);
        border-radius: 1rem;
        box-shadow: 0 1.25rem 3.5rem rgba(0, 0, 0, .45);
        color: #ffffff;
        left: 50%;
        opacity: 0;
        padding: 1rem;
        pointer-events: none;
        position: absolute;
        text-align: left;
        top: calc(100% + 1rem);
        transform: translate(-50%, -.65rem) scale(.96);
        transition: opacity .22s ease, transform .22s ease;
        width: min(21rem, 80vw);
        z-index: 40;
      }
      .erg-team-person:hover .erg-team-person__popover,
      .erg-team-person:focus-within .erg-team-person__popover,
      .erg-team-person:focus .erg-team-person__popover {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
      .erg-team-person__photo {
        border-radius: .85rem;
        display: block;
        height: 9rem;
        margin-bottom: .85rem;
        object-fit: cover;
        width: 100%;
      }
      .erg-team-person__popover h4 {
        color: #ffffff !important;
        font-size: 1.1rem;
        margin: 0 0 .25rem;
      }
      .erg-team-person__popover strong {
        color: #f6c21a !important;
        display: block;
        font-size: .85rem;
        margin-bottom: .55rem;
      }
      .erg-team-person__popover p {
        color: rgba(255, 255, 255, .78) !important;
        font-size: .86rem;
        line-height: 1.45;
        margin: 0;
      }
      .erg-resolution-widget {
        align-items: center !important;
        background: rgba(7, 20, 20, .86) !important;
        border: 1px solid rgba(246, 194, 26, .45) !important;
        border-radius: .75rem !important;
        box-shadow: 0 1rem 2.2rem rgba(0, 0, 0, .26);
        display: flex !important;
        gap: .7rem !important;
        justify-content: center !important;
        padding: .75rem .9rem !important;
        width: max-content !important;
      }
      .erg-resolution-widget__item {
        align-items: center;
        background: rgba(255,255,255,.09);
        border: 1px solid rgba(255,255,255,.12);
        border-radius: .55rem;
        color: #ffffff !important;
        display: inline-flex;
        font-size: .88rem;
        font-weight: 800;
        gap: .45rem;
        padding: .5rem .65rem;
      }
      .erg-resolution-widget__icon {
        align-items: center;
        background: #f6c21a;
        border-radius: 999px;
        color: #09292c !important;
        display: inline-flex;
        font-size: .85rem;
        height: 1.55rem;
        justify-content: center;
        width: 1.55rem;
      }
      .erg-marquee-logo {
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        filter: saturate(1.18) contrast(1.06) !important;
        max-height: 4.75rem !important;
        mix-blend-mode: multiply !important;
        object-fit: contain !important;
        opacity: 1 !important;
        padding: 0 !important;
        width: min(12rem, 34vw) !important;
      }
      .HomeHero__bottom .erg-marquee-logo {
        filter: saturate(1.18) contrast(1.06) !important;
        mix-blend-mode: multiply !important;
        opacity: 1 !important;
      }
      .marquee {
        overflow: hidden !important;
      }
      .marquee__track {
        align-items: center !important;
        display: flex !important;
        width: max-content !important;
      }
      .marquee__content {
        align-items: center !important;
        display: flex !important;
        flex: 0 0 auto !important;
        gap: clamp(2rem, 5vw, 5rem) !important;
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .marquee__item {
        align-items: center !important;
        display: flex !important;
        flex: 0 0 auto !important;
        justify-content: center !important;
        min-width: clamp(8rem, 14vw, 13rem) !important;
      }
      footer .accreditations {
        display: none !important;
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
  const lenderLogoFiles = [
    "assets/LOGO/01-clean-white-background-with-a-modern-corporate-log.png",
    "assets/LOGO/02-a-clean-logo-branding-graphic-on-a-white-backgroun.png",
    "assets/LOGO/03-a-clean-corporate-logo-image-on-a-white-background.png",
    "assets/LOGO/04-clean-white-background-with-a-crisp-corporate-logo.png",
    "assets/LOGO/05-a-clean-vector-logo-graphic-on-a-white-background.png",
    "assets/LOGO/06-a-clean-white-background-graphic-logo-design-over.png",
    "assets/LOGO/07-a-clean-white-background-with-a-flat-vector-logo-l.png",
    "assets/LOGO/08-a-clean-white-background-corporate-logo-image-ove.png",
    "assets/LOGO/09-a-clean-white-background-corporate-logo-design-ov.png",
    "assets/LOGO/10-a-clean-white-background-with-a-corporate-logo-and.png",
    "assets/LOGO/11-a-clean-white-background-with-a-flat-vector-style.png",
    "assets/LOGO/12-a-clean-white-background-corporate-logo-design-ov.png",
    "assets/LOGO/13-a-clean-white-background-corporate-logo-branding-i.png",
    "assets/LOGO/14-a-clean-white-background-logo-design-and-branding.png",
    "assets/LOGO/15-clean-white-background-logo-image-graphic-design.png",
    "assets/LOGO/16-a-clean-white-background-logo-image-overall-scene.png",
    "assets/LOGO/17-a-clean-white-background-with-a-large-modern-corpo.png",
    "assets/LOGO/18-a-clean-white-background-logo-image-graphic-overa.png",
    "assets/LOGO/19-a-clean-white-background-with-a-flat-vector-logo-f.png",
    "assets/LOGO/20-a-clean-white-background-with-a-vector-logo-design.png",
    "assets/LOGO/21-a-clean-white-background-logo-design-overall-scen.png",
    "assets/LOGO/22-a-clean-white-background-with-a-corporate-logo-des.png",
    "assets/LOGO/23-a-clean-vector-logo-on-a-white-background-overall.png",
    "assets/LOGO/24-a-clean-white-background-with-a-corporate-logo-ov.png",
    "assets/LOGO/25-a-clean-white-background-graphic-logo-image-overa.png",
    "assets/LOGO/26-a-clean-white-background-with-a-large-corporate-lo.png",
    "assets/LOGO/27-a-clean-white-background-with-a-bold-graphic-logo.png",
    "assets/LOGO/28-a-clean-white-background-with-a-large-company-logo.png",
    "assets/LOGO/29-a-clean-white-background-corporate-logo-image-ove.png",
    "assets/LOGO/30-a-clean-white-background-featuring-a-corporate-log.png",
    "assets/LOGO/31-a-clean-white-background-with-a-centered-left-lean.png",
    "assets/LOGO/32-a-clean-white-background-with-a-bold-modern-finan.png",
    "assets/LOGO/33-a-clean-white-background-logo-image-graphic-desig.png",
    "assets/LOGO/34-a-clean-white-background-with-a-vector-logo-center.png",
    "assets/LOGO/35-a-clean-white-background-image-logo-centered-wit.png",
    "assets/LOGO/36-mariner-finance-logo-design.png",
    "assets/LOGO/37-dollar-loan-center-logo-design.png",
    "assets/LOGO/38-sleek-kwikcash-logo-design.png",
    "assets/LOGO/39-minimalist-lendmark-logo-design.png",
    "assets/LOGO/40-check-city-branding-on-teal-background.png",
    "assets/LOGO/41-modern-monogram-on-teal-background.png",
    "assets/LOGO/42-a-clean-white-background-with-a-corporate-logo-bra.png",
    "assets/LOGO/43-a-clean-white-background-with-a-modern-corporate-l.png",
    "assets/LOGO/44-a-clean-white-background-with-a-corporate-logo-cen.png",
    "assets/LOGO/45-a-clean-white-background-with-a-bold-corporate-log.png"
  ];
  const renderLogoMarquee = marquee => {
    const track = marquee.querySelector(".marquee__track") || marquee;
    const items = lenderLogoFiles.map((file, index) => `
      <li class="marquee__item">
        <img class="logo erg-marquee-logo" src="${new URL(file, window.location.href).href}" alt="Lender logo ${index + 1}" loading="lazy">
      </li>
    `).join("");
    track.innerHTML = `<ul class="marquee__content">${items}</ul><ul class="marquee__content" aria-hidden="true">${items}</ul>`;
  };
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
  document.querySelectorAll("footer .accreditations").forEach(element => element.remove());
  document.querySelectorAll(".HomeHero__bottom .marquee, section[data-index='5'] .marquee").forEach(renderLogoMarquee);
  document.querySelectorAll("header nav").forEach(nav => nav.remove());
  document.querySelectorAll("header .menu-toggle, #mobile-menu").forEach(element => element.remove());
  document.querySelectorAll("header .actions").forEach(actions => {
    actions.innerHTML = `<a class="debt-header-cta" href="${getPageHashUrl("debt-form")}">Contact us <span aria-hidden="true">→</span></a>`;
  });
  const header = document.getElementById("header");
  if (header) {
    header.style.position = "absolute";
    header.style.top = "0";
    header.style.transform = "translate3d(0, 0, 0)";
    header.style.translate = "none";
  }

  document.querySelectorAll(".HomeShowcase .heading, .HomeShowcaseMobile .heading").forEach(heading => {
    if (normalize(heading.textContent) !== "Showcase") return;
    heading.innerHTML = `<a class="showcase-submit-button" href="${ENCOMPASS_SUBMIT_FORM_URL}" target="_blank" rel="noopener noreferrer">Submit Form</a>`;
  });
  document.querySelectorAll(".HomeShowcase h1, .HomeShowcase h2, .HomeShowcase h3, .HomeShowcaseMobile h1, .HomeShowcaseMobile h2, .HomeShowcaseMobile h3").forEach(heading => {
    if (/need a clearer path/i.test(heading.textContent || "")) heading.remove();
  });
  document.querySelectorAll(".HomeShowcase a, .HomeShowcase button, .HomeShowcaseMobile a, .HomeShowcaseMobile button").forEach(element => {
    if (!/learn more|view project|explore options|submit form/i.test(element.textContent || "")) return;
    if (/explore options/i.test(element.textContent || "")) element.querySelector("span") ? element.querySelector("span").textContent = "Submit Form" : element.textContent = "Submit Form";
    if (element.tagName.toLowerCase() === "a") {
      element.href = ENCOMPASS_SUBMIT_FORM_URL;
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    } else {
      element.dataset.submitFormLink = "true";
    }
  });
  if (!window.__submitFormLinkBound) {
    window.__submitFormLinkBound = true;
    document.addEventListener("click", event => {
      const button = event.target.closest?.("[data-submit-form-link='true'], .showcase-submit-button, a[href*='docs.google.com/forms']");
      if (!button || button.closest(".hero-debt-wizard__complete-link")) return;
      pushTrackingEvent("google_form_button_click", {
        form_location: button.closest(".HomeShowcase, .HomeShowcaseMobile") ? "showcase" : "end_section",
        cta_text: (button.textContent || "").trim()
      });
      if (button.matches("[data-submit-form-link='true']")) {
        event.preventDefault();
        event.stopPropagation();
        window.open(ENCOMPASS_SUBMIT_FORM_URL, "_blank", "noopener,noreferrer");
      }
    }, true);
  }

  document.querySelectorAll(".footer__contact").forEach(contact => {
    contact.innerHTML = `
      <a href="mailto:help@encompassrecoeverygroup.org">help@encompassrecoeverygroup.org</a>
      <a href="tel:+18777690109">+1 877-769-0109</a>
    `;
  });

  const heroContent = document.querySelector("#HomeHero__content");
  if (heroContent && !heroContent.querySelector(".hero-debt-form__intro")) {
    heroContent.innerHTML = `
      <div class="hero-debt-form">
        <div class="hero-debt-form__intro">
          <div class="hero-debt-form__logo">
            <img src="${new URL("assets/encompass-logo-transparent.png", window.location.href).href}" alt="Encompass Recovery Group">
            <span class="hero-debt-form__powered">powered by Solid Ground Financial</span>
          </div>
          <div class="hero-debt-form__assist">
            <div>Need Assistance?</div>
            <a href="tel:+18777022454">☎ (877) 702-2454</a>
          </div>
        </div>
        <div class="hero-debt-form__headline">
          <h1 class="hero-debt-form__title">Payday Loan Consolidation & Debt Relief – Financial Freedom Made Affordable</h1>
          <p class="hero-debt-form__copy">See If You Qualify To Lower Your Monthly Payments 40-60% Today!</p>
        </div>
        <form class="hero-debt-wizard debt-relief-form" id="debt-form-hero">
          <div data-wizard-content></div>
        </form>
      </div>
    `;
    setupHeroDebtWizard(heroContent.querySelector(".hero-debt-form"));
  }

  const heroLoop = document.querySelector(".HomeHero__bottom");
  const footerLoop = document.querySelector('section[data-index="5"] .marquee');
  if (heroLoop && footerLoop && !heroLoop.dataset.footerLoopCopied) {
    heroLoop.innerHTML = "";
    heroLoop.append(footerLoop.cloneNode(true));
    heroLoop.dataset.footerLoopCopied = "true";
  }

  document.querySelectorAll("a[href]").forEach(link => {
    const rawHref = link.getAttribute("href") || "";
    const isPrivacyLink = /privacy policy/i.test(link.textContent || "") || /privacy/i.test(rawHref);
    const isSubmitFormLink = link.classList.contains("showcase-submit-button") || rawHref.includes("docs.google.com/forms");
    if (link.closest("header .actions, .footer__contact") || isPrivacyLink || isSubmitFormLink) {
      if (link.closest("header .actions")) link.href = getPageHashUrl("debt-form");
      if (isPrivacyLink) {
        link.href = ENCOMPASS_PRIVACY_POLICY_URL;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      return;
    }
    link.removeAttribute("href");
    link.setAttribute("role", "button");
    link.style.cursor = "default";
  });
  if (!window.__debtCopyClickBound) {
    window.__debtCopyClickBound = true;
    document.addEventListener("click", event => {
      const target = event.target.closest?.("a, button, [role='button']");
      if (
        target &&
        !target.closest(".debt-relief-form, .footer__contact") &&
        !target.closest(".showcase-submit-button") &&
        !target.closest(".HomeQuadrants .quadrant") &&
        !target.closest("[class*='Cookie'], [id*='cookie'], [class*='cookie'], [aria-label*='cookie'], [data-cc], .cc-main, .cm, .pm") &&
        !target.matches("[type='submit']")
      ) {
        pushTrackingEvent("cta_click", {
          cta_text: (target.textContent || "").trim().slice(0, 80),
          cta_location: target.closest("header") ? "header" : "page"
        });
        event.preventDefault();
        event.stopPropagation();
        document.querySelector("#debt-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, true);
  }

  const testimonialQuote = document.querySelector(".TestimonialCaseStudyBlock blockquote");
  if (testimonialQuote) {
    const paragraph = testimonialQuote.querySelector("p");
    const cite = testimonialQuote.querySelector("cite");
    if (paragraph) {
      paragraph.textContent = `"I was drowning in payday loan debt and didn't know where to turn. Encompass Recovery Group sat with me, explained every step, and within months my payments were cut nearly in half. For the first time in years, I feel like I can breathe again. They didn't just help me with my debt - they gave me my life back."`;
    }
    if (cite) {
      cite.innerHTML = "Maria T., Fort Lauderdale, FL<br><span>Enrolled Client | Payday Loan Consolidation Program</span>";
    }
  }

  const teamWidget = document.querySelector(".HomeWheel .AvatarWidget");
  if (teamWidget && !teamWidget.classList.contains("erg-resolution-widget")) {
    teamWidget.className = "erg-resolution-widget";
    teamWidget.innerHTML = `
      <span class="erg-resolution-widget__item"><span class="erg-resolution-widget__icon">$</span>Debt review</span>
      <span class="erg-resolution-widget__item"><span class="erg-resolution-widget__icon">%</span>Savings estimate</span>
      <span class="erg-resolution-widget__item"><span class="erg-resolution-widget__icon">✓</span>Clear next step</span>
    `;
  }

  document.querySelectorAll(".HomeQuadrants .quadrant").forEach(quadrant => {
    if (quadrant.dataset.quadrantBound) return;
    quadrant.dataset.quadrantBound = "true";
    const isTouchQuadrants = () => window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 767px)")?.matches;
    const activate = () => {
      document.querySelectorAll(".HomeQuadrants .quadrant.is-active").forEach(item => {
        if (item !== quadrant) item.classList.remove("is-active");
      });
      quadrant.classList.add("is-active");
    };
    quadrant.addEventListener("mouseenter", activate);
    quadrant.addEventListener("focus", activate);
    quadrant.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      activate();
    });
    quadrant.addEventListener("mouseleave", () => {
      if (!isTouchQuadrants()) quadrant.classList.remove("is-active");
    });
  });
  if (!window.__homeQuadrantsActiveBound) {
    window.__homeQuadrantsActiveBound = true;
    const isTouchQuadrants = () => window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 767px)")?.matches;
    const activateQuadrant = quadrant => {
      if (!quadrant) return;
      document.querySelectorAll(".HomeQuadrants .quadrant.is-active").forEach(item => {
        if (item !== quadrant) item.classList.remove("is-active");
      });
      quadrant.classList.add("is-active");
    };
    document.addEventListener("pointerover", event => {
      activateQuadrant(event.target.closest?.(".HomeQuadrants .quadrant"));
    }, true);
    document.addEventListener("click", event => {
      const quadrant = event.target.closest?.(".HomeQuadrants .quadrant");
      if (!quadrant) return;
      event.preventDefault();
      event.stopPropagation();
      activateQuadrant(quadrant);
    }, true);
    document.addEventListener("pointerout", event => {
      const quadrant = event.target.closest?.(".HomeQuadrants .quadrant");
      if (quadrant && !isTouchQuadrants() && !quadrant.contains(event.relatedTarget)) quadrant.classList.remove("is-active");
    }, true);
  }
  const firstQuadrant = document.querySelector(".HomeQuadrants .quadrant");
  if (
    firstQuadrant &&
    window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 767px)")?.matches &&
    !document.querySelector(".HomeQuadrants .quadrant.is-active")
  ) {
    firstQuadrant.classList.add("is-active");
  }

  const teamImage = [...document.images].find(image => /Candid Team Photo|team working/i.test(`${image.alt} ${image.src}`));
  const imageContent = teamImage?.closest(".anchor-content");
  if (imageContent && !imageContent.querySelector(".debt-relief-form")) {
    imageContent.innerHTML = `
      <form class="hero-debt-wizard debt-relief-form" id="debt-form">
        <div data-wizard-content></div>
      </form>
    `;
    setupHeroDebtWizard(imageContent.querySelector(".hero-debt-wizard"));
  }

  document.querySelectorAll(".debt-relief-form").forEach(form => {
    if (form.dataset.webhookBound) return;
    form.dataset.webhookBound = "true";
    if (form.id === "debt-form-hero") {
      const syncHeroInputPaint = input => {
        input.style.color = "#09292c";
        input.style.webkitTextFillColor = "#09292c";
        input.style.caretColor = "#09292c";
        input.style.backgroundColor = "#f5faf9";
        input.style.transform = "translateZ(0)";
      };
      form.querySelectorAll("input:not([type='checkbox'])").forEach(input => {
        syncHeroInputPaint(input);
        ["input", "change", "paste", "focus", "animationstart"].forEach(type => {
          input.addEventListener(type, () => {
            syncHeroInputPaint(input);
            requestAnimationFrame(() => syncHeroInputPaint(input));
          });
        });
      });
    }
    form.__submitLeadPayload = async payload => {
      const status = form.querySelector(".debt-relief-form__status");
      const button = form.querySelector("button[type='submit'], .hero-debt-wizard__otp-submit");
      try {
        if (status) status.textContent = "Sending...";
        if (button) button.disabled = true;
        const { response, result } = await postToFunction("lead", payload);
        if (!response.ok || !result.ok) throw new Error(result.message || result.error || `Webhook failed: ${response.status}`);
        trackLeadSubmit(form);
        form.reset();
        if (form.classList.contains("hero-debt-wizard") && form.__showComplete) form.__showComplete();
        else if (status) status.textContent = "Thank you. Your request was submitted.";
      } catch (error) {
        if (status) status.textContent = error?.message || "Unable to submit right now. Please try again.";
      } finally {
        if (button) button.disabled = false;
      }
    };
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        pushTrackingEvent("lead_form_validation_error", {
          form_location: getFormLocation(form),
          step_number: 6,
          step_name: "contact_details"
        });
        form.reportValidity();
        return;
      }
      const status = form.querySelector(".debt-relief-form__status");
      const button = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form).entries());
      const wizardData = form.__heroWizardData || {};
      const payload = {
        firstName: data.first_name,
        lastName: data.last_name,
        phoneNumber: data.phone,
        email: data.email,
        stateOrZipCode: data.state_or_zip || data.state || wizardData.state,
        debtAmount: wizardData.debtAmount,
        debtType: wizardData.debtType,
        behindPayments: wizardData.behindPayments,
        hardship: wizardData.hardship,
        source: "Encompass landing page",
        pageUrl: window.location.href,
        attribution: getLeadAttribution()
      };
      pushTrackingEvent("lead_contact_submit_click", {
        form_location: getFormLocation(form),
        step_number: 6,
        step_name: "contact_details"
      });
      if (form.classList.contains("hero-debt-wizard") && form.dataset.otpVerified !== "true") {
        try {
          if (status) status.textContent = "Sending code...";
          if (button) button.disabled = true;
          const { response, result } = await postToFunction("otp-send", { email: payload.email });
          if (!response.ok || !result.ok) throw new Error(result.message || result.mailError || result.error || "OTP failed");
          form.__showOtp?.({ payload, token: result.token, email: result.email, devCode: result.devCode });
        } catch (error) {
          if (status) status.textContent = error?.message || "Unable to send verification code. Please check email SMTP settings.";
        } finally {
          if (button) button.disabled = false;
        }
        return;
      }
      await form.__submitLeadPayload(payload);
    });
  });

  const assetUrl = file => `${new URL(`assets/${file}`, window.location.href).href}?v=asset-match-2`;
  const serviceImages = [
    "5f550e84-cb8b-4cba-b6e1-d1669aba86f8 1.png",
    "311accad-1109-46ed-b800-39c6426f5993 1@2x.png",
    "21c7b551-9fca-4c88-8c0c-dbcd7b7c38c9 1.png",
    "311accad-1109-46ed-b800-39c6426f5993 1@3x.png"
  ].map(assetUrl);

  document.querySelectorAll(".HomeQuadrants .quadrant").forEach((quadrant, index) => {
    const src = serviceImages[index];
    if (!src) return;
    quadrant.querySelectorAll(".quadrant__image img").forEach(image => {
      image.src = src;
      image.srcset = "";
      image.alt = [
        "Debt review and strategy dashboard.",
        "Creditor resolution support dashboard.",
        "Payment plan guidance dashboard.",
        "Financial recovery roadmap dashboard."
      ][index];
    });
  });

  const approachImage = document.querySelector(".TestimonialCaseStudyBlock .main-image img");
  if (approachImage) {
    approachImage.src = new URL("assets/3f88046d-00b8-4970-aabe-1dfd1591722e 1.png", window.location.href).href;
    approachImage.srcset = "";
    approachImage.alt = "A calmer path from debt stress to resolution.";
  }

  const showcaseImages = [
    "b6167ba8-43b0-4810-96fc-c9de4185c029 1.png",
    "c814e739-bd13-4a5c-bc4d-7b716ba82f42 1.png",
    "c1e01d5e-29e9-4dff-9aae-f543b99878d9 1.png",
    "67f569ce-95d0-417c-b68f-a57e68e5a6d8 1.png",
    "3e8309ec-6546-4be6-999a-354850255470 1.png",
    "740fdeab-5e5c-4770-b0ab-103b1e43d2cf 1.png",
    "1e638c19-37e3-4c53-85b4-f81bf55cceff 1.png",
    "3e8309ec-6546-4be6-999a-354850255470 1.png",
    "6bb3860e-611e-4d75-b9df-11c7c4086ac9 1.png"
  ].map(assetUrl);

  document.querySelectorAll(".HomeShowcase .imageCard img, .HomeShowcaseMobile .imageCard img, .HomeShowcaseMobile .carousel-item .frame.image img").forEach((image, index) => {
    const src = showcaseImages[index % showcaseImages.length];
    if (src) {
      image.src = src;
      image.srcset = "";
      image.alt = "Debt relief landing page showcase.";
    }
  });

  document.documentElement.classList.add("debt-copy-ready");
  document.getElementById("debt-copy-preload")?.remove();
};

const runDebtCopy = () => {
  storeLeadAttribution();
  setupLeadTracking();
  applyDebtCopy();
  window.setTimeout(applyDebtCopy, 1200);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runDebtCopy, { once: true });
} else {
  runDebtCopy();
}

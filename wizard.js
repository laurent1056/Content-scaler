// wizard.js — Multi-step wizard logic, form handling, project.json builder

(() => {
  // ── State ────────────────────────────────────────────────────────────────
  const state = {
    // Step 1
    slug:        "",
    displayName: "DAILY BIBLE STUDY SERIES",
    handle:      "@BibleStudyDaily",

    // Step 2
    fileName:   "",
    sheetName:  "",
    sheetNames: [],
    headers:    [],
    sampleRows: [],

    // Step 3
    columnMapping: {},
    notesPrefix:   "CCC",

    // Step 4
    seriesLabel:   "DAILY BIBLE STUDY",
    dividerSymbol: "◆",
    endSymbol:     "✝",
    accentBright:  "#ffd264",
    panelBg:       "#05030c",

    // Step 5
    voiceId:       "WzSkyne6fIohJ1t1qnJC",
    voiceName:     "Laurent C",
    musicEnabled:  true,
    musicPrompt:   "Gregorian chant, sacred choir, soft organ, peaceful and reverent, instrumental only, no lyrics, ambient background music",

    // Step 6
    formatId:      "tiktok",
    customWidth:   "1080",
    customHeight:  "1920",
    imageProvider: "gemini",

    // Step 7
    timezone: "America/New_York",
    morning:  "07:00",
    midday:   "12:00",
    evening:  "20:00",

    // Preview helpers (from sample data if available)
    sampleTopic:    "",
    sampleHook:     "",
    sampleTeaching: "",
  };

  // ── Step Registry ─────────────────────────────────────────────────────────
  const STEPS = [
    { id: "identity",  label: "Identity",   render: renderStep1, validate: validateStep1 },
    { id: "sheet",     label: "Spreadsheet",render: renderStep2, validate: validateStep2 },
    { id: "columns",   label: "Columns",    render: renderStep3, validate: validateStep3 },
    { id: "branding",  label: "Branding",   render: renderStep4, validate: () => true },
    { id: "voice",     label: "Voice",      render: renderStep5, validate: () => true },
    { id: "format",    label: "Format",     render: renderStep6, validate: () => true },
    { id: "schedule",  label: "Schedule",   render: renderStep7, validate: () => true },
    { id: "review",    label: "Review",     render: renderStep8, validate: () => true },
  ];

  let currentStep = 0;

  // ── DOM Refs ──────────────────────────────────────────────────────────────
  const stepContent  = document.getElementById("step-content");
  const progressBar  = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const btnPrev      = document.getElementById("btn-prev");
  const btnNext      = document.getElementById("btn-next");
  const stepDots     = document.getElementById("step-dots");
  const previewCanvas = document.getElementById("preview-canvas");

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    PREVIEW.init(previewCanvas);
    buildStepDots();
    renderCurrentStep();
    PREVIEW.renderNow(state);

    btnPrev.addEventListener("click", goPrev);
    btnNext.addEventListener("click", goNext);
  }

  function buildStepDots() {
    stepDots.innerHTML = "";
    STEPS.forEach((step, i) => {
      const dot = document.createElement("div");
      dot.className = "step-dot";
      dot.title = step.label;
      dot.addEventListener("click", () => {
        if (i < currentStep) {
          currentStep = i;
          renderCurrentStep();
        }
      });
      stepDots.appendChild(dot);
    });
  }

  function updateNav() {
    const pct = ((currentStep + 1) / STEPS.length) * 100;
    progressBar.style.width = pct + "%";
    progressText.textContent = `Step ${currentStep + 1} of ${STEPS.length} — ${STEPS[currentStep].label}`;

    btnPrev.style.visibility = currentStep === 0 ? "hidden" : "visible";
    btnNext.textContent = currentStep === STEPS.length - 1 ? "Finish" : "Next →";

    document.querySelectorAll(".step-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentStep);
      dot.classList.toggle("done", i < currentStep);
    });
  }

  function renderCurrentStep() {
    updateNav();
    stepContent.innerHTML = "";
    STEPS[currentStep].render(stepContent);
    // Re-attach any listeners that live inside the rendered content
    attachChangeListeners();
    PREVIEW.update(state);
  }

  function goNext() {
    if (!STEPS[currentStep].validate()) return;
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderCurrentStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      currentStep--;
      renderCurrentStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Generic change listener ────────────────────────────────────────────────
  function attachChangeListeners() {
    stepContent.querySelectorAll("input, textarea, select").forEach(el => {
      el.addEventListener("input", () => {
        syncFromDOM();
        PREVIEW.update(state);
      });
      el.addEventListener("change", () => {
        syncFromDOM();
        PREVIEW.update(state);
      });
    });
  }

  function syncFromDOM() {
    // Step 1
    setIfExists("slug",        "input-slug",        "value");
    setIfExists("displayName", "input-display-name","value");
    setIfExists("handle",      "input-handle",      "value");

    // Step 4
    setIfExists("seriesLabel",   "input-series-label",   "value");
    setIfExists("dividerSymbol", "input-divider-symbol", "value");
    setIfExists("endSymbol",     "input-end-symbol",     "value");
    setIfExists("accentBright",  "input-accent-bright",  "value");
    setIfExists("panelBg",       "input-panel-bg",       "value");

    // Step 5
    const musicEl = document.getElementById("music-prompt");
    if (musicEl) state.musicPrompt = musicEl.value;

    // Step 6
    setIfExists("customWidth",  "input-custom-width",  "value");
    setIfExists("customHeight", "input-custom-height", "value");

    // Step 7
    setIfExists("timezone", "input-timezone", "value");
    setIfExists("morning",  "input-morning",  "value");
    setIfExists("midday",   "input-midday",   "value");
    setIfExists("evening",  "input-evening",  "value");

    // Step 3 — column mapping dropdowns
    document.querySelectorAll("[data-col-field]").forEach(sel => {
      state.columnMapping[sel.dataset.colField] = sel.value;
    });
    setIfExists("notesPrefix", "input-notes-prefix", "value");
  }

  function setIfExists(stateKey, elId, prop) {
    const el = document.getElementById(elId);
    if (el) state[stateKey] = el[prop];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function makeField(labelText, inputHtml, helpText = "") {
    return `
      <div class="field">
        <label class="field-label">${labelText}</label>
        ${inputHtml}
        ${helpText ? `<p class="field-help">${helpText}</p>` : ""}
      </div>
    `;
  }

  function makeTextInput(id, value = "", placeholder = "", type = "text") {
    return `<input class="input" type="${type}" id="${id}" value="${escHtml(value)}" placeholder="${escHtml(placeholder)}">`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function columnDropdown(field, required = true) {
    const opts = required
      ? state.headers.map((h, i) => `<option value="${i}" ${state.columnMapping[field] == i ? "selected" : ""}>${escHtml(h)}</option>`).join("")
      : `<option value="skip" ${!state.columnMapping[field] || state.columnMapping[field] === "skip" ? "selected" : ""}>— Skip —</option>` +
        state.headers.map((h, i) => `<option value="${i}" ${state.columnMapping[field] == i ? "selected" : ""}>${escHtml(h)}</option>`).join("");
    return `<select class="input" data-col-field="${field}">${opts}</select>`;
  }

  // ── STEP 1 — Project Identity ─────────────────────────────────────────────
  function renderStep1(container) {
    container.innerHTML = `
      <h2 class="step-title">Project Identity</h2>
      <p class="step-desc">Name your project and set your social handle.</p>
      ${makeField(
        "Project Slug",
        makeTextInput("input-slug", state.slug, "my-bible-series"),
        "Lowercase letters, numbers, and hyphens only. Used as folder name."
      )}
      ${makeField(
        "Display Name",
        makeTextInput("input-display-name", state.displayName, "DAILY BIBLE STUDY SERIES"),
        "Full title shown on screen and in exports."
      )}
      ${makeField(
        "Social Handle",
        makeTextInput("input-handle", state.handle, "@YourHandle"),
        "Your social media handle (shown in the video frame)."
      )}
    `;
  }

  function validateStep1() {
    syncFromDOM();
    const slugErr = validateSlug(state.slug);
    if (slugErr) {
      showError("input-slug", slugErr);
      return false;
    }
    clearError("input-slug");
    if (!state.displayName.trim()) {
      showError("input-display-name", "Display name is required.");
      return false;
    }
    clearError("input-display-name");
    return true;
  }

  // ── STEP 2 — Spreadsheet ──────────────────────────────────────────────────
  function renderStep2(container) {
    container.innerHTML = `
      <h2 class="step-title">Spreadsheet</h2>
      <p class="step-desc">Upload your .xlsx content file. We read it entirely in your browser — nothing is uploaded to any server.</p>
      <div class="field">
        <label class="field-label">Content File (.xlsx)</label>
        <label class="file-drop" id="file-drop-label">
          <div class="file-drop-icon">📄</div>
          <div class="file-drop-text">${state.fileName ? escHtml(state.fileName) : "Click or drag &amp; drop your .xlsx file"}</div>
          <input type="file" id="input-xlsx" accept=".xlsx,.xls" style="display:none">
        </label>
      </div>
      <div id="sheet-selector-area"></div>
      <div id="column-preview-area"></div>
    `;

    document.getElementById("file-drop-label").addEventListener("click", () => {
      document.getElementById("input-xlsx").click();
    });
    document.getElementById("input-xlsx").addEventListener("change", handleFileUpload);

    // Drag and drop
    const dropLabel = document.getElementById("file-drop-label");
    dropLabel.addEventListener("dragover", e => { e.preventDefault(); dropLabel.classList.add("drag-over"); });
    dropLabel.addEventListener("dragleave", () => dropLabel.classList.remove("drag-over"));
    dropLabel.addEventListener("drop", e => {
      e.preventDefault();
      dropLabel.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    if (state.sheetNames.length) renderSheetSelector();
    if (state.headers.length) renderColumnPreview();
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function processFile(file) {
    state.fileName = file.name;
    document.querySelector(".file-drop-text").textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        state.sheetNames = workbook.SheetNames;
        state.workbook = workbook;

        if (!state.sheetName || !state.sheetNames.includes(state.sheetName)) {
          state.sheetName = state.sheetNames[0];
        }

        loadSheet(state.sheetName);
        renderSheetSelector();
      } catch (err) {
        alert("Could not read file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function loadSheet(sheetName) {
    state.sheetName = sheetName;
    const ws = state.workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    state.headers = (rows[0] || []).map(String);
    state.sampleRows = rows.slice(1, 4);

    // Auto-map columns by name matching
    autoMapColumns();

    // Set preview sample data
    const topicIdx = findAutoMapIdx("topic");
    const hookIdx  = findAutoMapIdx("hook");
    const teachIdx = findAutoMapIdx("teaching");
    if (topicIdx >= 0 && state.sampleRows[0]) state.sampleTopic    = state.sampleRows[0][topicIdx] || "";
    if (hookIdx  >= 0 && state.sampleRows[0]) state.sampleHook     = state.sampleRows[0][hookIdx]  || "";
    if (teachIdx >= 0 && state.sampleRows[0]) state.sampleTeaching = state.sampleRows[0][teachIdx] || "";

    PREVIEW.update(state);
  }

  function findAutoMapIdx(field) {
    const keywords = {
      day: ["day"], post_num: ["post", "num", "number", "post_num", "postnum"],
      slot: ["slot", "time", "session"], topic: ["topic", "title", "subject"],
      hook: ["hook", "opening"], teaching: ["teaching", "content", "body", "text"],
      image_prompt: ["image", "prompt", "img"], notes: ["notes", "reference", "ref"],
      hashtags: ["hashtag", "tag"], group_level1: ["group1", "level1", "category"],
      group_level2: ["group2", "level2"],
    };
    const kws = keywords[field] || [field];
    const h = state.headers.map(x => x.toLowerCase().replace(/[^a-z0-9]/g, ""));
    for (let i = 0; i < h.length; i++) {
      if (kws.some(kw => h[i].includes(kw))) return i;
    }
    return -1;
  }

  function autoMapColumns() {
    const fields = [...SCHEMA.requiredColumns, ...SCHEMA.optionalColumns];
    fields.forEach(field => {
      if (state.columnMapping[field] === undefined) {
        const idx = findAutoMapIdx(field);
        state.columnMapping[field] = idx >= 0 ? idx : (SCHEMA.optionalColumns.includes(field) ? "skip" : 0);
      }
    });
  }

  function renderSheetSelector() {
    const area = document.getElementById("sheet-selector-area");
    if (!area) return;
    area.innerHTML = `
      <div class="field">
        <label class="field-label">Sheet</label>
        <div class="radio-group">
          ${state.sheetNames.map(name => `
            <label class="radio-card ${state.sheetName === name ? "selected" : ""}">
              <input type="radio" name="sheet" value="${escHtml(name)}" ${state.sheetName === name ? "checked" : ""}>
              <span>${escHtml(name)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
    area.querySelectorAll("input[name=sheet]").forEach(radio => {
      radio.addEventListener("change", e => {
        loadSheet(e.target.value);
        renderSheetSelector();
        renderColumnPreview();
        document.querySelectorAll("label.radio-card").forEach(c => c.classList.remove("selected"));
        e.target.closest("label.radio-card").classList.add("selected");
      });
    });
    renderColumnPreview();
  }

  function renderColumnPreview() {
    const area = document.getElementById("column-preview-area");
    if (!area || !state.headers.length) return;
    const displayHeaders = state.headers.slice(0, 8);
    const displayRows = state.sampleRows.slice(0, 3);
    area.innerHTML = `
      <div class="field">
        <label class="field-label">Column Preview (first 8 columns)</label>
        <div class="table-scroll">
          <table class="preview-table">
            <thead><tr>${displayHeaders.map(h => `<th>${escHtml(h)}</th>`).join("")}</tr></thead>
            <tbody>
              ${displayRows.map(row =>
                `<tr>${displayHeaders.map((_, i) => `<td>${escHtml(String(row[i] || ""))}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function validateStep2() {
    if (!state.fileName) {
      alert("Please upload a spreadsheet file.");
      return false;
    }
    if (!state.sheetName) {
      alert("Please select a sheet.");
      return false;
    }
    return true;
  }

  // ── STEP 3 — Column Mapping ───────────────────────────────────────────────
  function renderStep3(container) {
    const hasHeaders = state.headers.length > 0;

    if (!hasHeaders) {
      container.innerHTML = `
        <h2 class="step-title">Column Mapping</h2>
        <div class="notice notice-warn">Go back to Step 2 and upload your spreadsheet first.</div>
      `;
      return;
    }

    const notesVal = state.columnMapping["notes"];
    const hasNotes = notesVal !== undefined && notesVal !== "skip";
    const grp1Val  = state.columnMapping["group_level1"];
    const hasGrp1  = grp1Val !== undefined && grp1Val !== "skip";

    container.innerHTML = `
      <h2 class="step-title">Column Mapping</h2>
      <p class="step-desc">Match each field to a column in your spreadsheet.</p>

      <div class="mapping-section">
        <h3 class="mapping-section-title">Required Fields</h3>
        ${SCHEMA.requiredColumns.map(field => `
          <div class="field mapping-row">
            <label class="field-label mapping-label">${field.replace(/_/g, " ")}</label>
            ${columnDropdown(field, true)}
          </div>
        `).join("")}
      </div>

      <div class="mapping-section">
        <h3 class="mapping-section-title">Optional Fields</h3>
        ${SCHEMA.optionalColumns.map(field => `
          <div class="field mapping-row">
            <label class="field-label mapping-label">${field.replace(/_/g, " ")}</label>
            ${columnDropdown(field, false)}
          </div>
        `).join("")}
      </div>

      <div id="notes-prefix-field" class="${hasNotes ? "" : "hidden"}">
        ${makeField("Notes Prefix", makeTextInput("input-notes-prefix", state.notesPrefix, "CCC"),
          "Prefix shown before the notes reference in the video (e.g. CCC → 'CCC 26')")}
      </div>
    `;

    // Show/hide notes prefix when notes mapping changes
    container.querySelector("[data-col-field='notes']")?.addEventListener("change", e => {
      const show = e.target.value !== "skip";
      document.getElementById("notes-prefix-field")?.classList.toggle("hidden", !show);
      state.columnMapping["notes"] = e.target.value;
      PREVIEW.update(state);
    });
  }

  function validateStep3() {
    syncFromDOM();
    return true;
  }

  // ── STEP 4 — Branding ─────────────────────────────────────────────────────
  function renderStep4(container) {
    container.innerHTML = `
      <h2 class="step-title">Branding</h2>
      <p class="step-desc">Customize the text and symbols used throughout your videos.</p>
      ${makeField("Series Label", makeTextInput("input-series-label", state.seriesLabel, "DAILY BIBLE STUDY"), "Shown in the top bar of each frame.")}
      ${makeField("Divider Symbol", makeTextInput("input-divider-symbol", state.dividerSymbol, "◆"), "Decorative divider between sections.")}
      ${makeField("End / Closing Symbol", makeTextInput("input-end-symbol", state.endSymbol, "✝"), "Shown at the bottom-right of each frame.")}

      <details class="advanced-section">
        <summary class="advanced-toggle">Advanced Colors</summary>
        <div class="advanced-content">
          ${makeField("Accent Color", `<input class="input input-color" type="color" id="input-accent-bright" value="${escHtml(state.accentBright)}">`, "Primary gold accent color.")}
          ${makeField("Panel Background", `<input class="input input-color" type="color" id="input-panel-bg" value="${escHtml(state.panelBg)}">`, "Background panel color.")}
        </div>
      </details>
    `;
  }

  // ── STEP 5 — Voice ────────────────────────────────────────────────────────
  function renderStep5(container) {
    container.innerHTML = `
      <h2 class="step-title">Voice &amp; Music</h2>
      <p class="step-desc">Choose a voice for your narration and optional background music.</p>

      <div class="field">
        <label class="field-label">Narration Voice</label>
        <div class="voice-grid">
          ${SCHEMA.voices.map(v => `
            <label class="voice-card ${state.voiceId === v.id ? "selected" : ""}">
              <input type="radio" name="voice" value="${v.id}" ${state.voiceId === v.id ? "checked" : ""}>
              <div class="voice-name">${v.name}</div>
              <div class="voice-desc">${v.description}</div>
            </label>
          `).join("")}
          <label class="voice-card ${!SCHEMA.voices.find(v => v.id === state.voiceId) ? "selected" : ""}">
            <input type="radio" name="voice" value="custom" ${!SCHEMA.voices.find(v => v.id === state.voiceId) ? "checked" : ""}>
            <div class="voice-name">Custom Voice ID</div>
            <div class="voice-desc">Enter your own ElevenLabs voice ID</div>
          </label>
        </div>
        <div id="custom-voice-field" class="${!SCHEMA.voices.find(v => v.id === state.voiceId) ? "" : "hidden"}" style="margin-top:12px">
          <input class="input" type="text" id="input-custom-voice" placeholder="ElevenLabs Voice ID" value="${!SCHEMA.voices.find(v => v.id === state.voiceId) ? escHtml(state.voiceId) : ""}">
        </div>
      </div>

      <div class="field">
        <label class="field-label">Background Music</label>
        <div class="toggle-row">
          <label class="toggle-card ${state.musicEnabled ? "selected" : ""}">
            <input type="radio" name="music" value="yes" ${state.musicEnabled ? "checked" : ""}> Enabled
          </label>
          <label class="toggle-card ${!state.musicEnabled ? "selected" : ""}">
            <input type="radio" name="music" value="no" ${!state.musicEnabled ? "checked" : ""}> Disabled
          </label>
        </div>
      </div>

      <div id="music-prompt-field" class="${state.musicEnabled ? "" : "hidden"}">
        ${makeField(
          "Music Description / Prompt",
          `<textarea class="input input-textarea" id="music-prompt" rows="3">${escHtml(state.musicPrompt)}</textarea>`,
          "Describe the music style for AI generation."
        )}
      </div>
    `;

    // Voice radio changes
    container.querySelectorAll("input[name=voice]").forEach(radio => {
      radio.addEventListener("change", e => {
        const val = e.target.value;
        const customField = document.getElementById("custom-voice-field");
        if (val === "custom") {
          customField.classList.remove("hidden");
          state.voiceId   = document.getElementById("input-custom-voice").value || "";
          state.voiceName = "Custom";
        } else {
          customField.classList.add("hidden");
          const found = SCHEMA.voices.find(v => v.id === val);
          state.voiceId   = val;
          state.voiceName = found ? found.name : val;
        }
        container.querySelectorAll("label.voice-card").forEach(c => c.classList.remove("selected"));
        e.target.closest("label.voice-card").classList.add("selected");
      });
    });

    document.getElementById("input-custom-voice")?.addEventListener("input", e => {
      state.voiceId   = e.target.value;
      state.voiceName = "Custom";
    });

    // Music toggle
    container.querySelectorAll("input[name=music]").forEach(radio => {
      radio.addEventListener("change", e => {
        state.musicEnabled = e.target.value === "yes";
        document.getElementById("music-prompt-field").classList.toggle("hidden", !state.musicEnabled);
        container.querySelectorAll("label.toggle-card").forEach(c => c.classList.remove("selected"));
        e.target.closest("label.toggle-card").classList.add("selected");
      });
    });
  }

  // ── STEP 6 — Image Format ─────────────────────────────────────────────────
  function renderStep6(container) {
    container.innerHTML = `
      <h2 class="step-title">Image Format</h2>
      <p class="step-desc">Choose the video dimensions and image generation provider.</p>

      <div class="field">
        <label class="field-label">Format</label>
        <div class="format-grid">
          ${SCHEMA.formats.map(fmt => `
            <label class="format-card ${state.formatId === fmt.id ? "selected" : ""}">
              <input type="radio" name="format" value="${fmt.id}" ${state.formatId === fmt.id ? "checked" : ""}>
              <div class="format-ratio">${fmt.ratio}</div>
              <div class="format-label">${fmt.label}</div>
              <div class="format-dims">${fmt.id !== "custom" ? `${fmt.width}×${fmt.height}` : "Custom"}</div>
              <div class="format-aspect-box" style="${getAspectStyle(fmt)}"></div>
            </label>
          `).join("")}
        </div>

        <div id="custom-dims" class="${state.formatId === 'custom' ? '' : 'hidden'}" style="margin-top:14px; display:flex; gap:12px; align-items:center;">
          <input class="input" type="number" id="input-custom-width"  value="${state.customWidth}"  placeholder="Width"  style="width:120px">
          <span style="color:var(--fg-muted)">×</span>
          <input class="input" type="number" id="input-custom-height" value="${state.customHeight}" placeholder="Height" style="width:120px">
        </div>
      </div>

      <div class="field">
        <label class="field-label">Image Provider</label>
        <div class="provider-grid">
          ${SCHEMA.imageProviders.map(p => `
            <label class="provider-card ${state.imageProvider === p.id ? "selected" : ""}">
              <input type="radio" name="provider" value="${p.id}" ${state.imageProvider === p.id ? "checked" : ""}>
              <div class="provider-name">${p.label}</div>
              ${p.note ? `<div class="provider-note">${p.note}</div>` : ""}
            </label>
          `).join("")}
        </div>
      </div>
    `;

    // Format radios
    container.querySelectorAll("input[name=format]").forEach(radio => {
      radio.addEventListener("change", e => {
        state.formatId = e.target.value;
        document.getElementById("custom-dims").classList.toggle("hidden", state.formatId !== "custom");
        container.querySelectorAll("label.format-card").forEach(c => c.classList.remove("selected"));
        e.target.closest("label.format-card").classList.add("selected");
        PREVIEW.update(state);
      });
    });

    // Provider radios
    container.querySelectorAll("input[name=provider]").forEach(radio => {
      radio.addEventListener("change", e => {
        state.imageProvider = e.target.value;
        container.querySelectorAll("label.provider-card").forEach(c => c.classList.remove("selected"));
        e.target.closest("label.provider-card").classList.add("selected");
      });
    });
  }

  function getAspectStyle(fmt) {
    if (fmt.id === "custom") return "width:24px;height:36px;background:var(--gold);border-radius:2px;margin:4px auto 0;";
    const ratio = fmt.width / fmt.height;
    const maxH = 36;
    const maxW = 48;
    if (ratio > 1) {
      const w = maxW;
      const h = Math.round(w / ratio);
      return `width:${w}px;height:${h}px;background:var(--gold);border-radius:2px;margin:4px auto 0;`;
    } else {
      const h = maxH;
      const w = Math.round(h * ratio);
      return `width:${w}px;height:${h}px;background:var(--gold);border-radius:2px;margin:4px auto 0;`;
    }
  }

  // ── STEP 7 — Schedule ─────────────────────────────────────────────────────
  function renderStep7(container) {
    container.innerHTML = `
      <h2 class="step-title">Publishing Schedule</h2>
      <p class="step-desc">Set your timezone and the three daily posting times.</p>

      ${makeField(
        "Timezone",
        makeTextInput("input-timezone", state.timezone, "America/New_York"),
        "Common: " + SCHEMA.timezones.slice(0, 5).map(tz =>
          `<a href="#" class="tz-link" data-tz="${tz}">${tz}</a>`
        ).join(" · ")
      )}

      <div class="time-grid">
        ${makeField("Morning", `<input class="input" type="time" id="input-morning" value="${state.morning}">`)}
        ${makeField("Midday",  `<input class="input" type="time" id="input-midday"  value="${state.midday}">`)}
        ${makeField("Evening", `<input class="input" type="time" id="input-evening" value="${state.evening}">`)}
      </div>
    `;

    // Timezone quick-select links
    container.querySelectorAll(".tz-link").forEach(a => {
      a.addEventListener("click", e => {
        e.preventDefault();
        state.timezone = e.target.dataset.tz;
        document.getElementById("input-timezone").value = state.timezone;
      });
    });
  }

  // ── STEP 8 — Review & Download ────────────────────────────────────────────
  function renderStep8(container) {
    const json = buildProjectJson(state);
    const jsonStr = JSON.stringify(json, null, 2);

    const fmt = SCHEMA.formats.find(f => f.id === state.formatId) || SCHEMA.formats[0];
    const voice = SCHEMA.voices.find(v => v.id === state.voiceId);
    const provider = SCHEMA.imageProviders.find(p => p.id === state.imageProvider);

    container.innerHTML = `
      <h2 class="step-title">Review &amp; Download</h2>
      <p class="step-desc">Your configuration is ready. Download your <code>project.json</code> and place it in your project folder.</p>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-section-title">Project</div>
          <div class="summary-row"><span>Slug</span><strong>${escHtml(state.slug || "—")}</strong></div>
          <div class="summary-row"><span>Name</span><strong>${escHtml(state.displayName || "—")}</strong></div>
          <div class="summary-row"><span>Handle</span><strong>${escHtml(state.handle || "—")}</strong></div>
        </div>

        <div class="summary-card">
          <div class="summary-section-title">Spreadsheet</div>
          <div class="summary-row"><span>File</span><strong>${escHtml(state.fileName || "—")}</strong></div>
          <div class="summary-row"><span>Sheet</span><strong>${escHtml(state.sheetName || "—")}</strong></div>
          <div class="summary-row"><span>Columns</span><strong>${Object.keys(json.spreadsheet.columns).length} mapped</strong></div>
        </div>

        <div class="summary-card">
          <div class="summary-section-title">Branding</div>
          <div class="summary-row"><span>Series Label</span><strong>${escHtml(state.seriesLabel)}</strong></div>
          <div class="summary-row"><span>Divider</span><strong>${escHtml(state.dividerSymbol)}</strong></div>
          <div class="summary-row"><span>End Symbol</span><strong>${escHtml(state.endSymbol)}</strong></div>
        </div>

        <div class="summary-card">
          <div class="summary-section-title">Voice &amp; Music</div>
          <div class="summary-row"><span>Voice</span><strong>${escHtml(state.voiceName || state.voiceId)}</strong></div>
          <div class="summary-row"><span>Music</span><strong>${state.musicEnabled ? "Enabled" : "Disabled"}</strong></div>
        </div>

        <div class="summary-card">
          <div class="summary-section-title">Format &amp; Image</div>
          <div class="summary-row"><span>Format</span><strong>${fmt.label} (${fmt.ratio})</strong></div>
          <div class="summary-row"><span>Dimensions</span><strong>${json.visual.image_width}×${json.visual.image_height}</strong></div>
          <div class="summary-row"><span>Image Provider</span><strong>${provider?.label || state.imageProvider}</strong></div>
        </div>

        <div class="summary-card">
          <div class="summary-section-title">Schedule</div>
          <div class="summary-row"><span>Timezone</span><strong>${escHtml(state.timezone)}</strong></div>
          <div class="summary-row"><span>Morning</span><strong>${state.morning}</strong></div>
          <div class="summary-row"><span>Midday</span><strong>${state.midday}</strong></div>
          <div class="summary-row"><span>Evening</span><strong>${state.evening}</strong></div>
        </div>
      </div>

      <div class="download-actions">
        <button class="btn btn-primary btn-large" id="btn-download">⬇ Download project.json</button>
        <button class="btn btn-secondary" id="btn-copy">⎘ Copy to Clipboard</button>
      </div>

      <details class="json-preview-details">
        <summary class="advanced-toggle">Preview JSON</summary>
        <pre class="json-preview" id="json-preview-code">${escHtml(jsonStr)}</pre>
      </details>

      <div class="next-steps">
        <h3>Next Steps</h3>
        <ol>
          <li>Place <code>project.json</code> in your project folder.</li>
          <li>Run: <code>python3 generate_posts.py --project project.json</code></li>
          <li>See the <a href="https://github.com/laurent1056/the-magisterium" target="_blank" rel="noopener">Python backend repo</a> for setup instructions.</li>
        </ol>
      </div>
    `;

    document.getElementById("btn-download").addEventListener("click", () => {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${state.slug || "project"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("btn-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(jsonStr).then(() => {
        const btn = document.getElementById("btn-copy");
        btn.textContent = "✓ Copied!";
        setTimeout(() => btn.textContent = "⎘ Copy to Clipboard", 2000);
      });
    });
  }

  // ── Error helpers ──────────────────────────────────────────────────────────
  function showError(elId, msg) {
    clearError(elId);
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.add("input-error");
    const err = document.createElement("p");
    err.className = "field-error";
    err.textContent = msg;
    el.parentNode.insertBefore(err, el.nextSibling);
  }

  function clearError(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.remove("input-error");
    const prev = el.parentNode.querySelector(".field-error");
    if (prev) prev.remove();
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);
})();

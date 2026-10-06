/**
 * Modern Sleek Calculator Logic
 * Handles arithmetic, keyboard events, theme toggling, sound feedback, dynamic resizing & history.
 */

class Calculator {
  constructor(expressionEl, resultEl, historyListEl) {
    this.expressionEl = expressionEl;
    this.resultEl = resultEl;
    this.historyListEl = historyListEl;

    this.currentValue = '0';
    this.previousValue = null;
    this.operation = null;
    this.shouldResetScreen = false;
    this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    this.isSoundEnabled = localStorage.getItem('calc_sound') === 'true';

    this.audioCtx = null;

    this.init();
  }

  init() {
    this.updateDisplay();
    this.renderHistory();
  }

  /* ==========================================================================
     Audio Synthesis (Subtle UI Feedback)
     ========================================================================== */
  playSound(type = 'click') {
    if (!this.isSoundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'operator') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(550, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'equals') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'clear') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else {
        // Soft number click
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    } catch (e) {
      // Ignore audio failure if unsupported
    }
  }

  /* ==========================================================================
     Calculator Core Operations
     ========================================================================== */
  appendNumber(number) {
    this.playSound('click');

    if (this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') {
      this.clear();
    }

    if (this.shouldResetScreen) {
      this.currentValue = '';
      this.shouldResetScreen = false;
    }

    // Limit maximum length to avoid overflow
    if (this.currentValue.replace(/[-.]/g, '').length >= 14) return;

    if (this.currentValue === '0' || this.currentValue === '') {
      this.currentValue = number.toString();
    } else {
      this.currentValue += number.toString();
    }

    this.updateDisplay();
  }

  appendDecimal() {
    this.playSound('click');

    if (this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') {
      this.clear();
    }

    if (this.shouldResetScreen) {
      this.currentValue = '0';
      this.shouldResetScreen = false;
    }

    if (!this.currentValue.includes('.')) {
      this.currentValue = (this.currentValue || '0') + '.';
    }

    this.updateDisplay();
  }

  toggleNegate() {
    this.playSound('click');

    if (this.currentValue === '0' || this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') return;

    if (this.currentValue.startsWith('-')) {
      this.currentValue = this.currentValue.slice(1);
    } else {
      this.currentValue = '-' + this.currentValue;
    }

    this.updateDisplay();
  }

  applyPercent() {
    this.playSound('click');

    if (this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') return;

    const num = parseFloat(this.currentValue);
    if (isNaN(num)) return;

    let res;
    if (this.previousValue !== null && this.operation) {
      // Calculate percent relative to previous operand
      const prev = parseFloat(this.previousValue);
      res = (prev * num) / 100;
    } else {
      res = num / 100;
    }

    this.currentValue = this.formatResult(res);
    this.updateDisplay();
  }

  chooseOperation(operator) {
    this.playSound('operator');

    if (this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') {
      this.clear();
      return;
    }

    if (this.operation !== null && !this.shouldResetScreen) {
      this.compute(false);
    }

    this.previousValue = this.currentValue;
    this.operation = operator;
    this.shouldResetScreen = true;

    this.updateDisplay();
    this.highlightActiveOperator(operator);
  }

  compute(isFinal = true) {
    let result;
    const prev = parseFloat(this.previousValue);
    const curr = parseFloat(this.currentValue);

    if (isNaN(prev) || isNaN(curr) || this.operation === null) return;

    const expressionStr = `${this.formatDisplayNumber(this.previousValue)} ${this.operation} ${this.formatDisplayNumber(this.currentValue)}`;

    switch (this.operation) {
      case '+':
        result = this.safeAdd(prev, curr);
        break;
      case '-':
        result = this.safeSubtract(prev, curr);
        break;
      case '×':
      case '*':
        result = this.safeMultiply(prev, curr);
        break;
      case '÷':
      case '/':
        if (curr === 0) {
          this.currentValue = 'Cannot divide by 0';
          this.previousValue = null;
          this.operation = null;
          this.shouldResetScreen = true;
          this.updateDisplay();
          return;
        }
        result = this.safeDivide(prev, curr);
        break;
      default:
        return;
    }

    const formattedResult = this.formatResult(result);

    if (isFinal) {
      this.playSound('equals');
      this.addHistory(expressionStr, formattedResult);
      this.expressionEl.textContent = `${expressionStr} =`;
      this.resultEl.classList.add('calculated');
      setTimeout(() => this.resultEl.classList.remove('calculated'), 300);

      this.currentValue = formattedResult;
      this.operation = null;
      this.previousValue = null;
      this.shouldResetScreen = true;
    } else {
      this.currentValue = formattedResult;
      this.previousValue = formattedResult;
    }

    this.updateDisplay();
    this.highlightActiveOperator(null);
  }

  /* Safe math helpers for floating point inaccuracies */
  safeAdd(a, b) {
    const factor = Math.pow(10, Math.max(this.getDecimals(a), this.getDecimals(b)));
    return (Math.round(a * factor) + Math.round(b * factor)) / factor;
  }
  safeSubtract(a, b) {
    const factor = Math.pow(10, Math.max(this.getDecimals(a), this.getDecimals(b)));
    return (Math.round(a * factor) - Math.round(b * factor)) / factor;
  }
  safeMultiply(a, b) {
    const factor = Math.pow(10, this.getDecimals(a) + this.getDecimals(b));
    return (Math.round(a * Math.pow(10, this.getDecimals(a))) * Math.round(b * Math.pow(10, this.getDecimals(b)))) / factor;
  }
  safeDivide(a, b) {
    return a / b;
  }
  getDecimals(num) {
    const str = num.toString();
    if (str.indexOf('.') !== -1) {
      return str.split('.')[1].length;
    }
    return 0;
  }

  formatResult(number) {
    if (typeof number === 'string') return number;
    if (!isFinite(number)) return 'Error';

    // Round safely to avoid 0.0000000000000004 issues
    const rounded = parseFloat(number.toPrecision(12));
    const str = rounded.toString();

    // Check if exponent notation needed
    if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
      return rounded.toExponential(6).replace('e+', 'e');
    }

    return str;
  }

  deleteDigit() {
    this.playSound('click');

    if (this.shouldResetScreen || this.currentValue === 'Error' || this.currentValue === 'Cannot divide by 0') {
      this.currentValue = '0';
      this.shouldResetScreen = false;
      this.updateDisplay();
      return;
    }

    if (this.currentValue.length === 1 || (this.currentValue.length === 2 && this.currentValue.startsWith('-'))) {
      this.currentValue = '0';
    } else {
      this.currentValue = this.currentValue.slice(0, -1);
    }

    this.updateDisplay();
  }

  clear() {
    this.playSound('clear');
    this.currentValue = '0';
    this.previousValue = null;
    this.operation = null;
    this.shouldResetScreen = false;
    this.expressionEl.textContent = '0';
    this.highlightActiveOperator(null);
    this.updateDisplay();
  }

  /* ==========================================================================
     Display Formatting & Font Scaling
     ========================================================================== */
  formatDisplayNumber(numStr) {
    if (!numStr) return '0';
    if (numStr === 'Error' || numStr === 'Cannot divide by 0') return numStr;

    if (numStr.includes('e')) return numStr;

    const parts = numStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    let formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (decimalPart !== undefined) {
      return `${formattedInt}.${decimalPart}`;
    }
    return formattedInt;
  }

  updateDisplay() {
    this.resultEl.textContent = this.formatDisplayNumber(this.currentValue);

    if (this.operation !== null && this.previousValue !== null) {
      this.expressionEl.textContent = `${this.formatDisplayNumber(this.previousValue)} ${this.operation}`;
    } else if (!this.expressionEl.textContent.includes('=')) {
      this.expressionEl.textContent = '0';
    }

    // Dynamic Font Scaling
    const length = this.resultEl.textContent.length;
    if (length > 14) {
      this.resultEl.style.fontSize = '1.4rem';
    } else if (length > 10) {
      this.resultEl.style.fontSize = '1.8rem';
    } else if (length > 7) {
      this.resultEl.style.fontSize = '2.1rem';
    } else {
      this.resultEl.style.fontSize = '2.5rem';
    }
  }

  highlightActiveOperator(operator) {
    document.querySelectorAll('.btn-operator').forEach(btn => {
      if (operator && btn.getAttribute('data-value') === operator) {
        btn.classList.add('op-selected');
      } else {
        btn.classList.remove('op-selected');
      }
    });
  }

  /* ==========================================================================
     History Management
     ========================================================================== */
  addHistory(expression, result) {
    const item = { expr: expression, val: result, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    this.history.unshift(item);
    if (this.history.length > 30) this.history.pop();
    localStorage.setItem('calc_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyListEl) return;
    if (this.history.length === 0) {
      this.historyListEl.innerHTML = `
        <div class="empty-history">
          <i class="ph ph-calculator"></i>
          <p>No calculations yet</p>
        </div>
      `;
      return;
    }

    this.historyListEl.innerHTML = this.history.map((item, index) => `
      <div class="history-item" data-index="${index}" title="Click to use ${item.val}">
        <div class="history-expr">${item.expr} =</div>
        <div class="history-val">${this.formatDisplayNumber(item.val)}</div>
      </div>
    `).join('');

    // Attach click listener to restore items
    this.historyListEl.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-index');
        const selected = this.history[idx];
        if (selected) {
          this.currentValue = selected.val;
          this.shouldResetScreen = true;
          this.updateDisplay();
          toggleHistoryPanel(false);
          showToast(`Loaded ${selected.val}`);
        }
      });
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('calc_history');
    this.renderHistory();
    showToast('History cleared');
  }
}

/* ==========================================================================
   UI Event Bindings & Helpers
   ========================================================================== */
const expressionEl = document.getElementById('expression-display');
const resultEl = document.getElementById('result-display');
const historyListEl = document.getElementById('history-list');
const historyPanel = document.getElementById('history-panel');
const historyToggleBtn = document.getElementById('history-toggle-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
const displaySection = document.getElementById('display-section');
const copyBtn = document.getElementById('copy-btn');
const toastEl = document.getElementById('toast');

const calc = new Calculator(expressionEl, resultEl, historyListEl);

/* Keypad Button Clicks */
document.getElementById('keypad').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  createRipple(e, btn);

  const action = btn.getAttribute('data-action');
  const value = btn.getAttribute('data-value');

  switch (action) {
    case 'number':
      calc.appendNumber(value);
      break;
    case 'operator':
      calc.chooseOperation(value);
      break;
    case 'decimal':
      calc.appendDecimal();
      break;
    case 'equals':
      calc.compute(true);
      break;
    case 'clear':
      calc.clear();
      break;
    case 'delete':
      calc.deleteDigit();
      break;
    case 'percent':
      calc.applyPercent();
      break;
    case 'negate':
      calc.toggleNegate();
      break;
  }
});

/* Ripple Effect for Buttons */
function createRipple(event, button) {
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(circle);
}

/* Keyboard Input Support */
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  let btnToHighlight = null;

  if (e.key >= '0' && e.key <= '9') {
    calc.appendNumber(e.key);
    btnToHighlight = document.getElementById(`btn-${e.key}`);
  } else if (e.key === '.') {
    calc.appendDecimal();
    btnToHighlight = document.getElementById('btn-decimal');
  } else if (e.key === '+' || e.key === '-') {
    calc.chooseOperation(e.key);
    btnToHighlight = e.key === '+' ? document.getElementById('btn-add') : document.getElementById('btn-subtract');
  } else if (e.key === '*') {
    calc.chooseOperation('×');
    btnToHighlight = document.getElementById('btn-multiply');
  } else if (e.key === '/') {
    e.preventDefault();
    calc.chooseOperation('÷');
    btnToHighlight = document.getElementById('btn-divide');
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    calc.compute(true);
    btnToHighlight = document.getElementById('btn-equals');
  } else if (e.key === 'Backspace') {
    calc.deleteDigit();
    btnToHighlight = document.getElementById('btn-delete');
  } else if (e.key === 'Escape') {
    if (historyPanel.classList.contains('open')) {
      toggleHistoryPanel(false);
    } else {
      calc.clear();
      btnToHighlight = document.getElementById('btn-clear');
    }
  } else if (e.key.toLowerCase() === 'c') {
    calc.clear();
    btnToHighlight = document.getElementById('btn-clear');
  } else if (e.key === '%') {
    calc.applyPercent();
    btnToHighlight = document.getElementById('btn-percent');
  }

  if (btnToHighlight) {
    btnToHighlight.classList.add('active-key');
    setTimeout(() => btnToHighlight.classList.remove('active-key'), 150);
  }
});

/* History Panel Toggle */
function toggleHistoryPanel(forceState = null) {
  const isOpen = forceState !== null ? forceState : !historyPanel.classList.contains('open');
  if (isOpen) {
    historyPanel.classList.add('open');
    historyPanel.setAttribute('aria-hidden', 'false');
    historyToggleBtn.classList.add('active');
  } else {
    historyPanel.classList.remove('open');
    historyPanel.setAttribute('aria-hidden', 'true');
    historyToggleBtn.classList.remove('active');
  }
}

historyToggleBtn.addEventListener('click', () => toggleHistoryPanel());
if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
}
clearHistoryBtn.addEventListener('click', () => calc.clearHistory());

// Close history panel if clicked outside
document.addEventListener('click', (e) => {
  if (historyPanel.classList.contains('open') &&
      !historyPanel.contains(e.target) &&
      !historyToggleBtn.contains(e.target)) {
    toggleHistoryPanel(false);
  }
});

/* Sound Feedback Toggle */
function updateSoundUI() {
  if (calc.isSoundEnabled) {
    soundIcon.className = 'ph ph-speaker-high';
    soundToggleBtn.classList.add('active');
  } else {
    soundIcon.className = 'ph ph-speaker-slash';
    soundToggleBtn.classList.remove('active');
  }
}

soundToggleBtn.addEventListener('click', () => {
  calc.isSoundEnabled = !calc.isSoundEnabled;
  localStorage.setItem('calc_sound', calc.isSoundEnabled);
  updateSoundUI();
  showToast(calc.isSoundEnabled ? 'Sound feedback ON' : 'Sound feedback OFF');
  if (calc.isSoundEnabled) calc.playSound('click');
});
updateSoundUI();

/* Theme Toggle (Dark / Light) */
const currentTheme = localStorage.getItem('calc_theme') || 'dark';
applyTheme(currentTheme);

function applyTheme(theme) {
  document.body.className = theme === 'light' ? 'theme-light' : 'theme-dark';
  if (theme === 'light') {
    themeIcon.className = 'ph ph-moon';
  } else {
    themeIcon.className = 'ph ph-sun';
  }
  localStorage.setItem('calc_theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const isLight = document.body.classList.contains('theme-light');
  applyTheme(isLight ? 'dark' : 'light');
  showToast(isLight ? 'Switched to Dark Mode' : 'Switched to Light Mode');
});

/* Copy Result to Clipboard */
async function copyResult() {
  const text = calc.currentValue;
  if (text === 'Error' || text === 'Cannot divide by 0') return;

  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${text} to clipboard!`);
  } catch (err) {
    // Fallback if clipboard API is restricted
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(`Copied ${text}!`);
  }
}

displaySection.addEventListener('click', copyResult);
copyBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  copyResult();
});

/* Toast Notification Utility */
let toastTimeout;
function showToast(msg) {
  toastEl.innerHTML = `<i class="ph ph-check-circle"></i> ${msg}`;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2200);
}

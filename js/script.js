/* =============================================
   LANDING PAGE - ANIMATED BACKGROUND
============================================= */
(function() {
  const bg = document.getElementById('landing-bg');
  const colors = ['#4DEEEA', '#8B5CF6', '#2DD4BF'];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'bg-shape';
    const size = 30 + Math.random() * 90;
    el.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${6 + Math.random()*14}s;
      animation-delay:${-Math.random()*14}s;
      border-radius:${Math.random() > 0.5 ? '50%' : '8px'};
    `;
    bg.appendChild(el);
  }
})();

/* =============================================
   MODAL
============================================= */
function openModal() {
  closeModal();
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
  document.getElementById('customize-overlay')?.classList.add('hidden');
}
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

function setCustomizePanel(panelId) {
  document.querySelectorAll('.customize-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === panelId);
  });
}

function moveCustomizeControls() {
  const characterSelect = document.querySelector('.character-select');
  const characterSlot = document.getElementById('character-selection-slot');
  const isLandingCharacterPicker = characterSelect?.closest('#character-options');
  if (characterSelect && characterSlot && characterSelect.parentElement !== characterSlot && !isLandingCharacterPicker) {
    characterSelect.classList.add('modal-character-select');
    characterSlot.appendChild(characterSelect);
  }

  const worldSelect = document.getElementById('world-select');
  const worldSlot = document.getElementById('world-selection-slot');
  if (worldSelect && worldSlot && worldSelect.parentElement !== worldSlot) {
    worldSelect.classList.add('modal-world-select');
    worldSlot.appendChild(worldSelect);
  }
}

function openCustomizeMenu() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
  moveCustomizeControls();
  updateWorldCards();
  setCustomizePanel('customize-menu-panel');
  document.getElementById('customize-overlay')?.classList.remove('hidden');
}

function openWorldSelection() {
  moveCustomizeControls();
  updateWorldCards();
  setCustomizePanel('world-selection-panel');
  document.getElementById('customize-overlay')?.classList.remove('hidden');
}

function openCharacterSelection() {
  if (document.getElementById('character-options')) {
    toggleLandingPanel('character');
    return;
  }
  moveCustomizeControls();
  selectCharacter(selectedCharacter);
  setCustomizePanel('character-selection-panel');
  document.getElementById('customize-overlay')?.classList.remove('hidden');
}

document.getElementById('customize-overlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* =============================================
   CHARACTER SELECTION
============================================= */
let selectedCharacter = localStorage.getItem('takbomathbo_character') || 'male';
let selectionFeedbackTimer = null;
let selectionFeedbackCard = null;
let selectionFeedbackPanel = null;

function showSelectionFeedback(card, panelName) {
  if (!card) return;

  const panel = card.closest('.setup-panel');
  selectionFeedbackCard?.classList.remove('selection-confirmed');
  selectionFeedbackPanel?.classList.remove('selection-confirmed');
  card.classList.remove('selection-confirmed');
  // Reflow lets the feedback replay when a player taps the same option again.
  void card.offsetWidth;
  card.classList.add('selection-confirmed');
  panel?.classList.add('selection-confirmed');
  selectionFeedbackCard = card;
  selectionFeedbackPanel = panel;

  clearTimeout(selectionFeedbackTimer);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const delay = reducedMotion ? 0 : 460;
  selectionFeedbackTimer = setTimeout(() => {
    card.classList.remove('selection-confirmed');
    panel?.classList.remove('selection-confirmed');
    selectionFeedbackCard = null;
    selectionFeedbackPanel = null;
    if (panel?.classList.contains('is-expanded') && panel.dataset.panel === panelName) {
      toggleLandingPanel(panelName);
    }
  }, delay);
}

function selectCharacter(type) {
  selectedCharacter = type === 'female' ? 'female' : 'male';
  localStorage.setItem('takbomathbo_character', selectedCharacter);

  const maleBtn = document.getElementById('char-male');
  const femaleBtn = document.getElementById('char-female');
  if (!maleBtn || !femaleBtn) return;

  maleBtn.classList.toggle('selected', selectedCharacter === 'male');
  femaleBtn.classList.toggle('selected', selectedCharacter === 'female');
  maleBtn.setAttribute('aria-pressed', selectedCharacter === 'male' ? 'true' : 'false');
  femaleBtn.setAttribute('aria-pressed', selectedCharacter === 'female' ? 'true' : 'false');
  updateLandingSessionSummary();
  showSelectionFeedback(selectedCharacter === 'female' ? femaleBtn : maleBtn, 'character');
}

/* =============================================
   WORLD PROGRESSION
============================================= */
const WORLD_DEFINITIONS = {
  city: { id: 'city', name: 'City', levelMin: 1, levelMax: 2 },
  barangay: { id: 'barangay', name: 'Barangay', levelMin: 3, levelMax: 4 },
  school: { id: 'school', name: 'School', levelMin: 5, levelMax: 7 }
};

/* The original game contains these three world labels, but no external
   geographic dataset. Keep them as the available, valid session hierarchy. */
const LOCATION_DATA = [{
  id: 'mathbo-world', province: 'City', barangays: [{ id: 'barangay', name: 'Barangay', schools: [{ id: 'school', name: 'School' }] }]
}];
const LEVEL_CONFIG = [
  ['Addition', 'Basic addition with numbers that grow in difficulty.', 'Easy'],
  ['Subtraction', 'Subtract without negative answers at first.', 'Easy'],
  ['Multiplication', 'Practice the times tables.', 'Medium'],
  ['Division', 'Solve exact division problems.', 'Medium'],
  ['Fill in the Blank', 'Find the missing number.', 'Medium'],
  ['Integers', 'Add and subtract positive and negative integers.', 'Hard'],
  ['Algebra', 'Find the value of x.', 'Hard']
].map(([name, description, difficulty], index) => ({ number: index + 1, name, description, difficulty }));

const sessionConfig = { province: '', barangay: '', school: '', level: null, background: '' };
const LANDING_BACKGROUNDS = {
  city: { name: 'City Route', image: 'assets/stages/stage-city.svg' },
  barangay: { name: 'Barangay Run', image: 'assets/stages/stage-barangay.svg' },
  school: { name: 'Campus Rush', image: 'assets/stages/stage-campus.svg' }
};
function updateLandingSessionSummary() {
  const levelStatus = document.getElementById('landing-level-status');
  if (levelStatus) levelStatus.textContent = sessionConfig.level ? `Level ${sessionConfig.level} napili` : 'Wala pang napili';
  const backgroundStatus = document.getElementById('background-status');
  if (backgroundStatus) backgroundStatus.textContent = sessionConfig.background ? `${WORLD_DEFINITIONS[sessionConfig.background].name} napili` : 'Wala pang napili';
  const levelSummary = document.getElementById('levels-summary');
  const selectedLevel = LEVEL_CONFIG.find(level => level.number === sessionConfig.level);
  if (levelSummary) levelSummary.textContent = selectedLevel ? `Level ${selectedLevel.number}: ${selectedLevel.name}` : 'Choose a level';
  const backgroundSummary = document.getElementById('background-summary');
  const backgroundThumb = document.getElementById('background-summary-thumb');
  const selectedBackground = LANDING_BACKGROUNDS[sessionConfig.background];
  if (backgroundSummary) backgroundSummary.textContent = selectedBackground?.name || 'Choose a background';
  if (backgroundThumb) {
    backgroundThumb.hidden = !selectedBackground;
    if (selectedBackground) backgroundThumb.src = selectedBackground.image;
  }
  const characterSummary = document.getElementById('character-summary');
  const characterThumb = document.getElementById('character-summary-thumb');
  if (characterSummary) characterSummary.textContent = selectedCharacter === 'female' ? 'Female' : 'Male';
  if (characterThumb) characterThumb.src = selectedCharacter === 'female' ? 'assets/images/female.png' : 'assets/images/male.png';
}
function toggleLandingPanel(panelName) {
  const panels = document.querySelectorAll('.setup-panel');
  const requested = document.querySelector(`.setup-panel[data-panel="${panelName}"]`);
  if (!requested) return;
  const shouldExpand = !requested.classList.contains('is-expanded');
  panels.forEach(panel => {
    const expanded = shouldExpand && panel === requested;
    const options = panel.querySelector('.setup-panel-options');
    panel.classList.toggle('is-expanded', expanded);
    panel.querySelector('.setup-panel-trigger')?.setAttribute('aria-expanded', String(expanded));
    options?.setAttribute('aria-hidden', String(!expanded));
    if (options) options.inert = !expanded;
  });
  document.getElementById('landing')?.classList.toggle('has-expanded-panel', shouldExpand);
}
function selectBackground(background) {
  if (!WORLD_DEFINITIONS[background]) return;
  sessionConfig.background = background;
  document.querySelectorAll('.background-card').forEach(card => {
    const selected = card.dataset.background === background;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  const landingBg = document.getElementById('landing-bg');
  if (landingBg) {
    landingBg.classList.remove('preview-city', 'preview-barangay', 'preview-school');
    landingBg.classList.add(`preview-${background}`);
  }
  document.getElementById('landing-validation').textContent = '';
  updateLandingSessionSummary();
  showSelectionFeedback(document.querySelector(`.background-card[data-background="${background}"]`), 'background');
}
function locationLabel() { return [sessionConfig.province, sessionConfig.barangay, sessionConfig.school].filter(Boolean).join(' · '); }
function selectLevel(number) {
  sessionConfig.level = number;
  document.querySelectorAll('.level-card').forEach(card => {
    const selected = Number(card.dataset.level) === number;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  document.getElementById('landing-validation').textContent = '';
  updateLandingSessionSummary();
  showSelectionFeedback(document.querySelector(`.level-card[data-level="${number}"]`), 'levels');
}
function renderLandingLevelCards() {
  const container = document.getElementById('landing-level-cards');
  if (!container) return;
  container.innerHTML = LEVEL_CONFIG.map(level => `<button class="level-card ${sessionConfig.level === level.number ? 'selected' : ''}" type="button" data-level="${level.number}" onclick="selectLevel(${level.number})" aria-pressed="${sessionConfig.level === level.number ? 'true' : 'false'}"><span class="level-card-title">Level ${level.number}: ${level.name}</span><span class="selected-mark" aria-hidden="true">✓</span></button>`).join('');
}
function startSelectedLevel() {
  const missing = [!sessionConfig.level && 'level', !sessionConfig.background && 'background'].filter(Boolean);
  if (missing.length) {
    const message = `Piliin muna ang ${missing.join(', ')} bago magsimula.`;
    const landingValidation = document.getElementById('landing-validation');
    if (landingValidation) landingValidation.textContent = message;
    return;
  }
  showScreen('game-screen'); document.getElementById('pause-screen').classList.add('hidden'); Game.start();
}
function replayLevel() { if (sessionConfig.level && sessionConfig.background) startSelectedLevel(); else goToMenu(); }

let selectedWorldCard = 'city';

function getWorldForLevel(levelValue) {
  if (levelValue >= 5) return 'school';
  if (levelValue >= 3) return 'barangay';
  return 'city';
}

function updateWorldCards() {
  selectedWorldCard = 'city';
  const landingBg = document.getElementById('landing-bg');
  if (landingBg) {
    landingBg.classList.remove('preview-city', 'preview-barangay', 'preview-school');
    landingBg.classList.add('preview-city');
  }

  Object.values(WORLD_DEFINITIONS).forEach(world => {
    const card = document.getElementById(`world-card-${world.id}`);
    if (!card) return;
    const isSelected = world.id === 'city';
    const status = card.querySelector('.world-status');
    let range = card.querySelector('.world-range');
    if (!range) {
      range = document.createElement('span');
      range.className = 'world-range';
      card.querySelector('.world-name')?.after(range);
    }

    card.classList.toggle('locked', false);
    card.classList.toggle('unlocked', true);
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    card.setAttribute('aria-disabled', 'false');
    if (range) range.textContent = `Levels ${world.levelMin}-${world.levelMax}`;
    if (status) status.textContent = world.id === 'city' ? 'Start here' : 'Auto-switches in game';
  });
}

function selectWorldCard(worldId) {
  selectedWorldCard = 'city';
  updateWorldCards();
}

function getSelectedWorldStartLevel() {
  selectedWorldCard = 'city';
  return 1;
}

function drawCharacterPreview(canvasId, type) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isFemale = type === 'female';
  const hw = 22;
  const hh = 31;
  const skinColor = '#FFCC80';
  const skinShade = '#F4B46D';
  const shirtColor = isFemale ? '#F48FB1' : '#FF7043';
  const shirtShade = isFemale ? '#EC407A' : '#E85D2B';
  const hairDark = '#090A14';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, 73);

  ctx.save();
  ctx.scale(1, 0.25);
  const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, hw * 0.95);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.26)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, hw, hw * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.translate(0, -8);

  ctx.fillStyle = '#2EAD4D';
  ctx.beginPath();
  ctx.roundRect(-hw*0.88, -hh*0.44, hw*0.42, hh*0.76, 7);
  ctx.fill();
  ctx.fillStyle = '#1B8F3C';
  ctx.beginPath();
  ctx.roundRect(-hw*0.75, -hh*0.16, hw*0.18, hh*0.22, 4);
  ctx.fill();

  if (isFemale) {
    const longHairGrad = ctx.createLinearGradient(0, -hh*1.5, 0, -hh*0.2);
    longHairGrad.addColorStop(0, '#292A46');
    longHairGrad.addColorStop(0.48, '#151628');
    longHairGrad.addColorStop(1, '#070812');
    ctx.fillStyle = longHairGrad;
    ctx.beginPath();
    ctx.moveTo(-hw*0.64, -hh*1.0);
    ctx.bezierCurveTo(-hw*0.72, -hh*1.38, -hw*0.38, -hh*1.56, hw*0.03, -hh*1.52);
    ctx.bezierCurveTo(hw*0.48, -hh*1.49, hw*0.72, -hh*1.2, hw*0.62, -hh*0.85);
    ctx.bezierCurveTo(hw*0.68, -hh*0.55, hw*0.44, -hh*0.18, hw*0.16, -hh*0.12);
    ctx.bezierCurveTo(hw*0.08, -hh*0.48, hw*0.13, -hh*0.76, hw*0.04, -hh*0.96);
    ctx.bezierCurveTo(-hw*0.04, -hh*0.74, -hw*0.06, -hh*0.44, -hw*0.18, -hh*0.13);
    ctx.bezierCurveTo(-hw*0.48, -hh*0.22, -hw*0.74, -hh*0.55, -hw*0.64, -hh*1.0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.roundRect(-hw*0.45, hh*0.24, hw*0.22, hh*0.54, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-hw*0.02, hh*0.22, hw*0.22, hh*0.54, 5);
  ctx.fill();

  if (isFemale) {
    ctx.fillStyle = '#F06292';
    ctx.beginPath();
    ctx.moveTo(-hw*0.6, -hh*0.02);
    ctx.lineTo(hw*0.22, -hh*0.02);
    ctx.lineTo(hw*0.36, hh*0.34);
    ctx.lineTo(-hw*0.72, hh*0.34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#D81B60';
    ctx.lineWidth = hw * 0.035;
    ctx.beginPath();
    ctx.moveTo(-hw*0.42, hh*0.02);
    ctx.lineTo(-hw*0.5, hh*0.28);
    ctx.moveTo(-hw*0.12, hh*0.02);
    ctx.lineTo(-hw*0.16, hh*0.29);
    ctx.moveTo(hw*0.12, hh*0.02);
    ctx.lineTo(hw*0.16, hh*0.28);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1976D2';
    ctx.beginPath();
    ctx.roundRect(-hw*0.58, -hh*0.02, hw*0.38, hh*0.36, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-hw*0.16, -hh*0.02, hw*0.36, hh*0.34, 5);
    ctx.fill();
    ctx.fillStyle = '#0D47A1';
    ctx.beginPath();
    ctx.roundRect(-hw*0.52, hh*0.18, hw*0.27, hh*0.08, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-hw*0.1, hh*0.18, hw*0.25, hh*0.08, 3);
    ctx.fill();
  }

  ctx.fillStyle = '#263238';
  ctx.beginPath();
  ctx.roundRect(-hw*0.56, hh*0.76, hw*0.38, hh*0.14, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-hw*0.08, hh*0.76, hw*0.38, hh*0.14, 4);
  ctx.fill();

  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(-hw*0.58, -hh*0.58, hw*0.82, hh*0.74, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 50, 20, 0.18)';
  ctx.lineWidth = hw * 0.04;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(-hw*0.46, -hh*0.48, hw*0.16, hh*0.5, 5);
  ctx.fill();
  ctx.strokeStyle = shirtShade;
  ctx.lineWidth = hw * 0.035;
  ctx.beginPath();
  ctx.moveTo(-hw*0.44, -hh*0.18);
  ctx.quadraticCurveTo(-hw*0.38, -hh*0.06, -hw*0.42, hh*0.06);
  ctx.moveTo(hw*0.06, -hh*0.22);
  ctx.quadraticCurveTo(hw*0.12, -hh*0.04, hw*0.08, hh*0.08);
  ctx.stroke();

  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.roundRect(-hw*0.13, -hh*0.72, hw*0.24, hh*0.22, 5);
  ctx.fill();
  ctx.fillStyle = '#FFE0B2';
  ctx.beginPath();
  ctx.moveTo(-hw*0.36, -hh*0.58);
  ctx.lineTo(-hw*0.1, -hh*0.42);
  ctx.lineTo(-hw*0.24, -hh*0.34);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-hw*0.1, -hh*0.42);
  ctx.lineTo(hw*0.14, -hh*0.56);
  ctx.lineTo(hw*0.04, -hh*0.34);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(-hw*0.56, -hh*0.38);
  ctx.rotate(-0.28);
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(-hw*0.1, 0, hw*0.22, hw*0.23, 4);
  ctx.fill();
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.roundRect(-hw*0.08, hw*0.18, hw*0.17, hw*0.34, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, hw*0.53, hw*0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(hw*0.05, hw*0.52);
  if (isFemale) {
    ctx.translate(hw*0.18, hw*0.02);
    ctx.rotate(40 * Math.PI / 180);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = hw * 0.035;
    ctx.beginPath();
    ctx.roundRect(-hw*0.22, -hw*0.2, hw*0.44, hw*0.62, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(102,187,106,0.86)';
    ctx.beginPath();
    ctx.roundRect(-hw*0.19, -hw*0.01, hw*0.38, hw*0.38, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = hw * 0.02;
    ctx.beginPath();
    ctx.moveTo(-hw*0.25, -hw*0.27);
    ctx.lineTo(hw*0.08, hw*0.32);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(-hw*0.25, -hw*0.29, hw*0.5, hw*0.09, 3);
    ctx.fill();
  } else {
    ctx.rotate(-0.55);
    ctx.fillStyle = '#FFD600';
    ctx.beginPath();
    ctx.roundRect(-hw*0.08, -hw*0.08, hw*0.16, hw*0.72, 3);
    ctx.fill();
    ctx.fillStyle = '#F57F17';
    ctx.beginPath();
    ctx.moveTo(-hw*0.08, hw*0.64);
    ctx.lineTo(hw*0.08, hw*0.64);
    ctx.lineTo(0, hw*0.84);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.arc(0, hw*0.84, hw*0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.roundRect(-hw*0.08, -hw*0.18, hw*0.16, hw*0.13, 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.ellipse(-hw*0.5, -hh*0.91, hw*0.12, hh*0.16, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hw*0.5, -hh*0.91, hw*0.12, hh*0.16, 0.08, 0, Math.PI * 2);
  ctx.fill();

  const faceGrad = ctx.createLinearGradient(0, -hh*1.42, 0, -hh*0.43);
  faceGrad.addColorStop(0, '#FFD9A3');
  faceGrad.addColorStop(0.65, skinColor);
  faceGrad.addColorStop(1, skinShade);
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.moveTo(0, -hh*1.42);
  ctx.bezierCurveTo(hw*0.45, -hh*1.4, hw*0.58, -hh*1.12, hw*0.52, -hh*0.84);
  ctx.bezierCurveTo(hw*0.47, -hh*0.58, hw*0.22, -hh*0.45, 0, -hh*0.43);
  ctx.bezierCurveTo(-hw*0.22, -hh*0.45, -hw*0.47, -hh*0.58, -hw*0.52, -hh*0.84);
  ctx.bezierCurveTo(-hw*0.58, -hh*1.12, -hw*0.45, -hh*1.4, 0, -hh*1.42);
  ctx.closePath();
  ctx.fill();

  const hairGrad = ctx.createLinearGradient(0, -hh*1.54, 0, -hh*0.94);
  hairGrad.addColorStop(0, '#292A46');
  hairGrad.addColorStop(0.5, '#151628');
  hairGrad.addColorStop(1, hairDark);
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(-hw*0.55, -hh*1.04);
  ctx.bezierCurveTo(-hw*0.52, -hh*1.34, -hw*0.26, -hh*1.52, hw*0.05, -hh*1.49);
  ctx.bezierCurveTo(hw*0.38, -hh*1.47, hw*0.58, -hh*1.23, hw*0.52, -hh*0.96);
  ctx.bezierCurveTo(hw*0.36, -hh*1.05, hw*0.18, -hh*1.06, -hw*0.04, -hh*1.0);
  ctx.bezierCurveTo(-hw*0.24, -hh*0.94, -hw*0.43, -hh*0.94, -hw*0.55, -hh*1.04);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = hw * 0.035;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw*0.2, -hh*1.34);
  ctx.quadraticCurveTo(-hw*0.08, -hh*1.18, -hw*0.2, -hh*1.02);
  ctx.moveTo(hw*0.12, -hh*1.34);
  ctx.quadraticCurveTo(hw*0.24, -hh*1.17, hw*0.14, -hh*1.01);
  ctx.stroke();

  if (isFemale) {
    ctx.fillStyle = '#F06292';
    ctx.strokeStyle = '#C2185B';
    ctx.lineWidth = hw * 0.025;
    ctx.beginPath();
    ctx.moveTo(hw*0.25, -hh*1.28);
    ctx.quadraticCurveTo(hw*0.43, -hh*1.42, hw*0.5, -hh*1.22);
    ctx.quadraticCurveTo(hw*0.38, -hh*1.18, hw*0.25, -hh*1.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw*0.55, -hh*1.25);
    ctx.quadraticCurveTo(hw*0.72, -hh*1.36, hw*0.72, -hh*1.14);
    ctx.quadraticCurveTo(hw*0.58, -hh*1.14, hw*0.55, -hh*1.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = hairDark;
  ctx.beginPath();
  ctx.ellipse(-hw*0.22, -hh*0.91, hw*0.085, hh*0.075, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hw*0.22, -hh*0.91, hw*0.085, hh*0.075, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-hw*0.19, -hh*0.94, hw*0.026, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hw*0.25, -hh*0.94, hw*0.026, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = 'rgba(239, 117, 92, 0.22)';
  ctx.beginPath();
  ctx.ellipse(-hw*0.32, -hh*0.76, hw*0.11, hh*0.055, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hw*0.32, -hh*0.76, hw*0.11, hh*0.055, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = hw * 0.055;
  ctx.beginPath();
  ctx.moveTo(-hw*0.18, -hh*0.67);
  ctx.quadraticCurveTo(0, -hh*0.56, hw*0.2, -hh*0.67);
  ctx.stroke();

  ctx.restore();
}

function drawCharacterPreviews() {
  drawCharacterPreview('male-preview', 'male');
  drawCharacterPreview('female-preview', 'female');
}

/* =============================================
   SCREEN MANAGEMENT
============================================= */
function showScreen(id) {
  ['landing','game-screen','gameover-screen','completion-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (s === 'game-screen') {
      el.classList.toggle('hidden', s !== id);
    } else {
      el.classList.toggle('hidden', s !== id);
    }
  });

  if (id === 'landing') {
    playLandingMusic();
  } else {
    stopLandingMusic();
  }
}

function goToMenu() {
  Game.stop();
  document.getElementById('pause-screen').classList.add('hidden');
  showScreen('landing');
  updateHighScoreDisplay();
}

/* =============================================
   AUDIO ENGINE (Web Audio API)
============================================= */
const Audio = (() => {
  let ctx = null;
  function init() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  }
  function beep(freq, dur, type='sine', vol=0.3) {
    try {
      init();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch(e) {}
  }
  return {
    correct() {
      beep(523, 0.12, 'sine', 0.3);
      setTimeout(() => beep(784, 0.18, 'sine', 0.25), 120);
      setTimeout(() => beep(1047, 0.22, 'sine', 0.2), 260);
    },
    wrong() {
      beep(220, 0.08, 'sawtooth', 0.3);
      setTimeout(() => beep(180, 0.18, 'sawtooth', 0.2), 80);
    },
    jump() { beep(440, 0.08, 'sine', 0.15); setTimeout(() => beep(660, 0.1, 'sine', 0.12), 80); },
    levelup() {
      [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f, 0.18, 'sine', 0.25), i*100));
    },
    hit() { beep(100, 0.35, 'sawtooth', 0.4); }
  };
})();

/* =============================================
   QUESTION GENERATOR
============================================= */
const Questions = (() => {
  const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const DIFFICULTY_TIMERS = {
    1: { easy: 5, medium: 8, hard: 11 },
    2: { easy: 6, medium: 9, hard: 12 },
    3: { easy: 7, medium: 10, hard: 13 },
    4: { easy: 8, medium: 11, hard: 14 },
    5: { easy: 9, medium: 12, hard: 15 },
    6: { easy: 10, medium: 13, hard: 16 },
    7: { easy: 11, medium: 14, hard: 17 }
  };

  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function difficultyForProgress(levelProgress) {
    if (levelProgress < 5) return 'easy';
    if (levelProgress < 10) return 'medium';
    return 'hard';
  }

  function timerFor(level, difficulty) {
    return DIFFICULTY_TIMERS[level]?.[difficulty] || 8;
  }

  function formatIntegerTerm(value) {
    return value < 0 ? `(${value})` : `${value}`;
  }

  function withMeta(problem, level, difficulty, skill) {
    return {
      ...problem,
      difficulty,
      difficultyLabel: DIFFICULTY_LABELS[difficulty],
      timer: timerFor(level, difficulty),
      skill
    };
  }

  function binaryQuestion(a, op, b, ans, integerFormat = false) {
    const left = integerFormat ? formatIntegerTerm(a) : `${a}`;
    const right = integerFormat ? formatIntegerTerm(b) : `${b}`;
    return { q: `${left} ${op} ${right} = ?`, ans };
  }

  function addition(difficulty) {
    if (difficulty === 'easy') {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      return binaryQuestion(a, '+', b, a + b);
    }
    if (difficulty === 'medium') {
      const a = randInt(10, 49);
      const b = randInt(6, 29);
      return binaryQuestion(a, '+', b, a + b);
    }
    const terms = Math.random() < 0.45
      ? [randInt(20, 99), randInt(20, 99), randInt(5, 39)]
      : [randInt(100, 199), randInt(25, 99)];
    return { q: `${terms.join(' + ')} = ?`, ans: terms.reduce((sum, value) => sum + value, 0) };
  }

  function hasBorrowing(a, b) {
    let top = a;
    let bottom = b;
    while (top > 0 || bottom > 0) {
      if (top % 10 < bottom % 10) return true;
      top = Math.floor(top / 10);
      bottom = Math.floor(bottom / 10);
    }
    return false;
  }

  function borrowCount(a, b) {
    let count = 0;
    let borrow = 0;
    while (a > 0 || b > 0) {
      const topDigit = (a % 10) - borrow;
      const bottomDigit = b % 10;
      borrow = topDigit < bottomDigit ? 1 : 0;
      if (borrow) count++;
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return count;
  }

  function subtraction(difficulty) {
    if (difficulty === 'easy') {
      let a, b;
      do {
        a = randInt(12, 49);
        b = randInt(2, Math.min(29, a - 1));
      } while (hasBorrowing(a, b));
      return binaryQuestion(a, '-', b, a - b);
    }
    if (difficulty === 'medium') {
      let a, b;
      do {
        a = randInt(31, 89);
        b = randInt(12, a - 2);
      } while (borrowCount(a, b) !== 1);
      return binaryQuestion(a, '-', b, a - b);
    }
    let a, b;
    do {
      a = randInt(120, 399);
      b = randInt(48, a - 15);
    } while (borrowCount(a, b) < 2);
    return binaryQuestion(a, '-', b, a - b);
  }

  function multiplication(difficulty) {
    if (difficulty === 'easy') {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      return binaryQuestion(a, '×', b, a * b);
    }
    if (difficulty === 'medium') {
      const a = randInt(6, 12);
      const b = randInt(6, 12);
      return binaryQuestion(a, '×', b, a * b);
    }
    const a = randInt(11, 19);
    const b = Math.random() < 0.5 ? randInt(7, 12) : randInt(13, 15);
    return binaryQuestion(a, '×', b, a * b);
  }

  function division(difficulty) {
    if (difficulty === 'easy') {
      const divisor = randInt(2, 9);
      const quotient = randInt(2, 9);
      return binaryQuestion(divisor * quotient, '÷', divisor, quotient);
    }
    if (difficulty === 'medium') {
      const divisor = randInt(4, 12);
      const quotient = randInt(5, 12);
      return binaryQuestion(divisor * quotient, '÷', divisor, quotient);
    }
    const divisor = randInt(6, 15);
    const quotient = randInt(8, 18);
    return binaryQuestion(divisor * quotient, '÷', divisor, quotient);
  }

  function fillBlank(difficulty) {
    const type = difficulty === 'easy' ? pick(['add', 'sub']) : pick(['add', 'sub', 'mul']);
    if (type === 'add') {
      const missing = randInt(difficulty === 'hard' ? 20 : 3, difficulty === 'easy' ? 9 : difficulty === 'medium' ? 25 : 60);
      const shown = randInt(difficulty === 'hard' ? 15 : 2, difficulty === 'easy' ? 9 : difficulty === 'medium' ? 25 : 70);
      if (difficulty === 'hard') {
        const adjust = randInt(3, 12);
        return { q: `__ + ${shown} - ${adjust} = ${missing + shown - adjust}`, ans: missing };
      }
      if (difficulty === 'medium' && Math.random() < 0.5) {
        return { q: `${missing + shown} = __ + ${shown}`, ans: missing };
      }
      return Math.random() < 0.5
        ? { q: `__ + ${shown} = ${missing + shown}`, ans: missing }
        : { q: `${shown} + __ = ${missing + shown}`, ans: missing };
    }
    if (type === 'sub') {
      const missing = randInt(difficulty === 'hard' ? 18 : 3, difficulty === 'easy' ? 9 : difficulty === 'medium' ? 24 : 55);
      const ans = randInt(difficulty === 'hard' ? 15 : 2, difficulty === 'easy' ? 9 : difficulty === 'medium' ? 25 : 65);
      if (difficulty === 'hard') {
        const adjust = randInt(2, 9);
        return { q: `${missing + ans + adjust} - __ + ${adjust} = ${ans}`, ans: missing + adjust * 2 };
      }
      return { q: `${missing + ans} - __ = ${ans}`, ans: missing };
    }
    const factor = randInt(difficulty === 'hard' ? 6 : 2, difficulty === 'medium' ? 9 : 12);
    const missing = randInt(difficulty === 'hard' ? 8 : 2, difficulty === 'medium' ? 9 : 12);
    if (difficulty === 'hard') {
      const offset = randInt(5, 18);
      return { q: `__ × ${factor} + ${offset} = ${missing * factor + offset}`, ans: missing };
    }
    return difficulty === 'medium' && Math.random() < 0.5
      ? { q: `__ × ${factor} = ${missing * factor}`, ans: missing }
      : { q: `${factor} × __ = ${missing * factor}`, ans: missing };
  }

  function nonZeroInteger(limit, sign = null) {
    const value = randInt(1, limit);
    if (sign === 'positive') return value;
    if (sign === 'negative') return -value;
    return value * (Math.random() < 0.5 ? -1 : 1);
  }

  function integers(difficulty) {
    if (difficulty === 'easy') {
      const negativeFirst = Math.random() < 0.5;
      const a = nonZeroInteger(9, negativeFirst ? 'negative' : 'positive');
      const b = randInt(1, 9);
      const op = negativeFirst ? '+' : '-';
      return binaryQuestion(a, op, b, op === '+' ? a + b : a - b, true);
    }
    if (difficulty === 'medium') {
      const a = nonZeroInteger(12);
      const b = nonZeroInteger(12, a > 0 ? 'negative' : 'positive');
      const op = Math.random() < 0.5 ? '+' : '-';
      return binaryQuestion(a, op, b, op === '+' ? a + b : a - b, true);
    }
    const a = nonZeroInteger(15);
    const b = nonZeroInteger(15);
    const c = nonZeroInteger(10);
    const op = pick(['+', '-']);
    const secondOp = pick(['+', '-']);
    const ans = op === '+' ? a + b : a - b;
    const finalAns = secondOp === '+' ? ans + c : ans - c;
    return { q: `${formatIntegerTerm(a)} ${op} ${formatIntegerTerm(b)} ${secondOp} ${formatIntegerTerm(c)} = ?`, ans: finalAns };
  }

  function algebra(difficulty) {
    const x = randInt(2, difficulty === 'hard' ? 12 : 10);
    const n = randInt(2, difficulty === 'easy' ? 9 : 14);

    if (difficulty === 'easy') {
      const type = pick(['add', 'sub', 'mul']);
      if (type === 'add') return { q: `x + ${n} = ${x + n}`, ans: x };
      if (type === 'sub') return { q: `x - ${n} = ${x - n}`, ans: x };
      const coefficient = randInt(2, 6);
      return { q: `${coefficient}x = ${coefficient * x}`, ans: x };
    }

    const coefficient = randInt(2, difficulty === 'medium' ? 7 : 9);
    if (difficulty === 'medium') {
      return Math.random() < 0.5
        ? { q: `${coefficient}x + ${n} = ${coefficient * x + n}`, ans: x }
        : { q: `${coefficient}x - ${n} = ${coefficient * x - n}`, ans: x };
    }

    const rightX = randInt(1, coefficient - 1);
    const leftConstant = randInt(3, 16);
    const rightConstant = coefficient * x + leftConstant - rightX * x;
    return { q: `${coefficient}x + ${leftConstant} = ${rightX}x + ${rightConstant}`, ans: x };
  }

  function levelProblem(level, difficulty) {
    if (level === 1) return withMeta(addition(difficulty), level, difficulty, 'Addition');
    if (level === 2) return withMeta(subtraction(difficulty), level, difficulty, 'Subtraction');
    if (level === 3) return withMeta(multiplication(difficulty), level, difficulty, 'Multiplication');
    if (level === 4) return withMeta(division(difficulty), level, difficulty, 'Division');
    if (level === 5) return withMeta(fillBlank(difficulty), level, difficulty, 'Fill in the Blank');
    if (level === 6) return withMeta(integers(difficulty), level, difficulty, 'Integers');
    return withMeta(algebra(difficulty), level, difficulty, 'Algebra');
  }

  function wrongAnswerCandidates(ans, level) {
    const near = Math.max(2, Math.min(7, Math.ceil(Math.abs(ans) * 0.18)));
    const candidates = [];
    for (let offset = -near; offset <= near; offset++) {
      if (offset !== 0) candidates.push(ans + offset);
    }
    if (level === 3) candidates.push(ans + 3, ans - 3, ans + 4, ans - 4);
    if (level === 4) candidates.push(ans + 1, ans - 1, ans + 2, ans - 2);
    if (level === 6) candidates.push(-ans, ans + 5, ans - 5);
    return shuffle(candidates);
  }

  function generate(level, levelProgress = 0) {
    const difficulty = difficultyForProgress(levelProgress);
    const { q, ans, timer, difficultyLabel, skill } = levelProblem(level, difficulty);

    const allowNegativeChoices = level === 6;
    const choices = new Set([ans]);
    const candidates = wrongAnswerCandidates(ans, level);
    for (const wrong of candidates) {
      if (choices.size >= 4) break;
      if (!allowNegativeChoices && wrong < 0) continue;
      if (wrong !== ans) choices.add(wrong);
    }
    while (choices.size < 4) {
      const offset = choices.size + 1;
      const fallback = ans + offset * (ans < 0 ? -1 : 1);
      choices.add(!allowNegativeChoices && fallback < 0 ? offset : fallback);
    }

    const arr = shuffle(Array.from(choices));
    const correctIdx = arr.indexOf(ans);
    return { question: q, choices: arr, correctIdx, difficulty, difficultyLabel, timer, skill };
  }

  return { generate, timers: DIFFICULTY_TIMERS };
})();

/* =============================================
   GAME ENGINE
============================================= */
const Game = (() => {
  // Canvas & context
  let canvas, ctx;
  let W, H;

  // Game state
  let state = 'idle'; // idle | running | question_active | paused | gameover
  let stateBeforePause = 'running';
  let pauseBtn = null;
  let pauseHitboxDebugEl = null;
  let pauseButtonRect = null;
  let pauseDebugEnabled = false;
  let lastPauseToggleAt = 0;
  let score = 0;
  let lives = 3;
  let level = 1;
  let levelCorrectCount = 0;
  let combo = 0;
  let correctCount = 0;
  let frameId = null;
  let loopRunId = 0;
  let lastTime = 0;
  let questionTimer = 0;
  let questionTimeout = 8; // Current question timer; each generated equation can override this.
  // Every independently selected math level begins at the original Level 1 pace.
  // Values are viewport-relative so the established responsive game balance remains intact.
  const INITIAL_PLAYER_SPEED = 0.16;
  const INITIAL_SPEED_MULTIPLIER = 1;
  const INITIAL_OBSTACLE_INTERVAL = 3.5;
  let speedMultiplier = INITIAL_SPEED_MULTIPLIER;
  let obstacleSpawnTimer = 0;
  let obstacleInterval = INITIAL_OBSTACLE_INTERVAL;
  let comboTimer = 0;
  let comboDashActive = false;
  let comboDashTimer = 0;
  const comboDashDuration = 5;
  const comboDashBoost = 2.8;
  let comboDashFxTimer = 0;
  let dashStreakTimer = 0;
  let nextComboDashCombo = 5;
  let invincible = false;
  let invincibleTimer = 0;
  let shakeTimer = 0;
  let bgX = 0;
  let cloudX = [0, 0, 0];
  let clouds = [];
  let parallaxWorld = null;
  let currentWorld = 'city';
  let lastWorldTransitionShown = 'city';
  let trafficVehicles = [];
  let trafficSpawnTimers = [0, 0];
  let trafficNextSpawns = [1.2, 1.8];
  let birds = [];
  let birdSpawnTimer = 0;
  let nextBirdSpawn = 3;
  let stars = [];
  let shootingStars = [];
  let shootingStarTimer = 4;
  let dayNightClock = 0;
  let nightLevel = 0;
  let particles = [];
  let particlePool = [];
  let scoreDisplayEl = null;
  let timerBarEl = null;
  let questionPanelEl = null;
  let questionTextEl = null;
  let comboPopupEl = null;
  let levelBadgeEl = null;
  let pauseScreenEl = null;
  let gameScreenEl = null;
  let storySequenceEl = null;
  let answerButtons = [];
  let answerTextEls = [];
  let lastScoreDisplay = null;
  let lastTimerPct = null;
  let lastTimerBand = null;
  let flagImage = null;
  let flagImageReady = false;
  let initialized = false;
  let resizeRaf = 0;
  let questionHideTimer = null;
  let damageEndTimer = null;
  let worldTransitionTimer = null;
  let levelBadgeTimer = null;
  const visiblePostScratch = [];
  const MAX_PARTICLES = 96;
  const MAX_BIRDS = 14;
  const MAX_TRAFFIC = 4;
  const MAX_LIGHT_POOL_POSTS = 5;
  const PERFORMANCE_DPR_LIMIT = 1.5;
  const DAY_NIGHT_PHASE_SECONDS = 60;
  const DAY_NIGHT_TRANSITION_SECONDS = 9;

  // Active question
  let activeQuestion = null;
  let activeObstacle = null; // Reference to the obstacle with the active question
  let answered = false;

  function clearGameTimeouts() {
    clearTimeout(questionHideTimer);
    clearTimeout(damageEndTimer);
    clearTimeout(comboTimer);
    clearTimeout(worldTransitionTimer);
    clearTimeout(levelBadgeTimer);
    questionHideTimer = null;
    damageEndTimer = null;
    comboTimer = 0;
    worldTransitionTimer = null;
    levelBadgeTimer = null;
  }

  function stopLoop() {
    loopRunId++;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = null;
  }

  function startLoop() {
    stopLoop();
    lastTime = performance.now();
    const runId = loopRunId;
    frameId = requestAnimationFrame(ts => loop(ts, runId));
  }

  // Player object
  const Player = {
    x: 0, y: 0,
    w: 0, h: 0,
    vy: 0,
    jumping: false,
    onGround: true,
    frame: 0,
    frameTimer: 0,
    runFrames: 8,
    hitTimer: 0,
    blinkTimer: 0,

    init() {
      this.w = Math.min(W * 0.09, 56);
      this.h = this.w * 1.3;
      this.x = W * 0.18;
      this.y = groundY() - this.h;
    },

    jump(force = false, obstacle = null) {
      if (force || this.onGround) {
        const gravity = H * 1.8;
        const minClearance = obstacle ? obstacle.h + this.h * 0.45 : H * 0.22;
        const baseJumpHeight = Math.min(H * 0.34, Math.max(H * 0.24, minClearance));
        const jumpHeight = getResponsiveJumpHeight(baseJumpHeight, gravity, obstacle);
        this.vy = -Math.sqrt(2 * gravity * jumpHeight);
        this.jumping = true;
        this.onGround = false;
        Audio.jump();
      }
    },

    update(dt) {
      // Gravity
      const gravity = H * 1.8; // Swabeng gravity (1.8) para sa natural na bagsak
      if (!this.onGround) {
        this.vy += gravity * dt;
        this.y += this.vy * dt; // Fixed: Smooth movement physics
      }
      const gy = groundY() - this.h;
      if (this.y >= gy) {
        this.y = gy;
        this.vy = 0;
        this.onGround = true;
        this.jumping = false;
      }

      // Animation frame
      this.frameTimer += dt;
      if (this.frameTimer > (comboDashActive ? 0.045 : 0.1)) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % this.runFrames;
      }

      if (this.hitTimer > 0) this.hitTimer -= dt;
      if (this.blinkTimer > 0) this.blinkTimer -= dt;
    },

    draw() {
      if (invincible && Math.floor(invincibleTimer * 10) % 2 === 0) return;
      if (comboDashActive) drawDashTrail(this);

      const hw = this.w / 2, hh = this.h / 2;
      const legSwing = Math.sin(this.frame / this.runFrames * Math.PI * 2) * (this.onGround ? 12 : 0);
      const armSwing = Math.cos(this.frame / this.runFrames * Math.PI * 2) * (this.onGround ? 14 : 0);

      // Squash/stretch
      let sx = 1, sy = 1;
      let rotation = 0;

      if (!this.onGround) {
        // Mas banayad na squash/stretch para hindi magmukhang naglalaho
        const stretchAmount = Math.max(-0.2, Math.min(0.2, this.vy / (H * 3)));
        sy = 1 - stretchAmount; 
        sx = 1 + stretchAmount * 0.3;
        rotation = stretchAmount * 0.4; // Bahagyang pagkiling habang nasa ere
      } else {
        const bounce = Math.abs(Math.sin(this.frame / this.runFrames * Math.PI)) * 0.08;
        sy = 1 - bounce;
        sx = 1 + bounce * 0.5;
      }

      const shoeBottomLocal = hh * 0.91 + Math.abs(legSwing) * 0.18;
      const footGroundOffset = this.h / 2 - shoeBottomLocal * sy;

      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2 + footGroundOffset);
      ctx.scale(sx, sy);
      ctx.rotate(rotation);

      // Shadow
      ctx.save();
      ctx.scale(1, 0.25);
      ctx.translate(0, hh * 4 + 4);
      const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, hw * 0.9);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.ellipse(0, 0, hw * 0.9, hw * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();
      ctx.restore();

      // Body (character)
      // Body color depends on hit state
      const isFemale = selectedCharacter === 'female';
      const shirtColor = this.hitTimer > 0 ? '#EF5350' : (isFemale ? '#F48FB1' : '#FF7043');
      const shirtShade = this.hitTimer > 0 ? '#D84343' : (isFemale ? '#EC407A' : '#E85D2B');
      const shortsColor = '#1976D2';
      const shortsShade = '#0D47A1';
      const skinColor = '#FFCC80';
      const skinShade = '#F4B46D';
      const outlineColor = 'rgba(120, 50, 20, 0.18)';

      // Backpack behind the body
      ctx.fillStyle = '#2EAD4D';
      ctx.beginPath();
      ctx.roundRect(-hw*0.82, -hh*0.5, hw*0.34, hh*0.68, 7);
      ctx.fill();
      ctx.fillStyle = '#1B8F3C';
      ctx.beginPath();
      ctx.roundRect(-hw*0.72, -hh*0.27, hw*0.16, hh*0.2, 4);
      ctx.fill();

      // Side arm: same size as the pencil arm, kept slightly behind
      ctx.save();
      ctx.translate(hw*0.16, -hh*0.38);
      ctx.rotate((-armSwing * 3.7 + 18) * Math.PI / 180);
      ctx.fillStyle = this.hitTimer > 0 ? 'rgba(239, 83, 80, 0.9)' : (isFemale ? 'rgba(244, 143, 177, 0.92)' : 'rgba(255, 112, 67, 0.9)');
      ctx.beginPath();
      ctx.roundRect(-hw*0.08, -hw*0.02, hw*0.22, hw*0.27, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 204, 128, 0.94)';
      ctx.beginPath();
      ctx.roundRect(-hw*0.08, hw*0.2, hw*0.17, hw*0.36, 5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 204, 128, 0.94)';
      ctx.beginPath();
      ctx.arc(0, hw*0.58, hw*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Slim legs and shorts
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.roundRect(-hw*0.44, hh*0.22, hw*0.2, hh*0.55 + legSwing * 0.22, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-hw*0.02, hh*0.2, hw*0.2, hh*0.55 - legSwing * 0.22, 5);
      ctx.fill();
      if (isFemale) {
        ctx.fillStyle = '#F06292';
        ctx.beginPath();
        ctx.moveTo(-hw*0.58, -hh*0.03);
        ctx.lineTo(hw*0.2, -hh*0.03);
        ctx.lineTo(hw*0.32, hh*0.34);
        ctx.lineTo(-hw*0.7, hh*0.34);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#D81B60';
        ctx.lineWidth = hw * 0.035;
        ctx.beginPath();
        ctx.moveTo(-hw*0.43, hh*0.02);
        ctx.lineTo(-hw*0.5, hh*0.28);
        ctx.moveTo(-hw*0.16, hh*0.02);
        ctx.lineTo(-hw*0.2, hh*0.29);
        ctx.moveTo(hw*0.08, hh*0.02);
        ctx.lineTo(hw*0.12, hh*0.28);
        ctx.stroke();
      } else {
        ctx.fillStyle = shortsColor;
        ctx.beginPath();
        ctx.roundRect(-hw*0.58, -hh*0.02, hw*0.38, hh*0.36, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-hw*0.16, -hh*0.02, hw*0.36, hh*0.34, 5);
        ctx.fill();
        ctx.fillStyle = shortsShade;
        ctx.beginPath();
        ctx.roundRect(-hw*0.52, hh*0.18, hw*0.27, hh*0.08, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-hw*0.1, hh*0.18, hw*0.25, hh*0.08, 3);
        ctx.fill();
      }

      // Small shoes
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.roundRect(-hw*0.54, hh*0.77 + legSwing * 0.18, hw*0.36, hh*0.14, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-hw*0.08, hh*0.77 - legSwing * 0.18, hw*0.36, hh*0.14, 4);
      ctx.fill();

      // Slim shirt body
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.roundRect(-hw*0.58, -hh*0.58, hw*0.82, hh*0.74, 9);
      ctx.fill();
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = hw * 0.04;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(-hw*0.46, -hh*0.48, hw*0.16, hh*0.5, 5);
      ctx.fill();
      ctx.strokeStyle = shirtShade;
      ctx.lineWidth = hw * 0.035;
      ctx.beginPath();
      ctx.moveTo(-hw*0.44, -hh*0.18);
      ctx.quadraticCurveTo(-hw*0.38, -hh*0.06, -hw*0.42, hh*0.06);
      ctx.moveTo(hw*0.06, -hh*0.22);
      ctx.quadraticCurveTo(hw*0.12, -hh*0.04, hw*0.08, hh*0.08);
      ctx.stroke();

      // Neck
      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.roundRect(-hw*0.13, -hh*0.72, hw*0.24, hh*0.22, 5);
      ctx.fill();

      // Simple shirt collar
      ctx.fillStyle = '#FFE0B2';
      ctx.beginPath();
      ctx.moveTo(-hw*0.36, -hh*0.58);
      ctx.lineTo(-hw*0.1, -hh*0.42);
      ctx.lineTo(-hw*0.24, -hh*0.34);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-hw*0.1, -hh*0.42);
      ctx.lineTo(hw*0.14, -hh*0.56);
      ctx.lineTo(hw*0.04, -hh*0.34);
      ctx.closePath();
      ctx.fill();

      // Front arm and held item
      ctx.save();
      ctx.translate(-hw*0.56, -hh*0.38);
      ctx.rotate((armSwing - 25) * Math.PI / 180);
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.roundRect(-hw*0.1, 0, hw*0.22, hw*0.23, 4);
      ctx.fill();
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.roundRect(-hw*0.08, hw*0.18, hw*0.17, hw*0.34, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, hw*0.53, hw*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(hw*0.05, hw*0.52);
      if (isFemale) {
        // Transparent iced matcha cup
        ctx.translate(hw*0.18, hw*0.02);
        ctx.rotate(40 * Math.PI / 180);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = hw * 0.035;
        ctx.beginPath();
        ctx.roundRect(-hw*0.22, -hw*0.2, hw*0.44, hw*0.62, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(102,187,106,0.86)';
        ctx.beginPath();
        ctx.roundRect(-hw*0.19, -hw*0.01, hw*0.38, hw*0.38, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.72)';
        ctx.lineWidth = hw * 0.02;
        ctx.beginPath();
        ctx.moveTo(-hw*0.25, -hw*0.27);
        ctx.lineTo(hw*0.08, hw*0.32);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(-hw*0.25, -hw*0.29, hw*0.5, hw*0.09, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.beginPath();
        ctx.arc(-hw*0.07, hw*0.06, hw*0.05, 0, Math.PI * 2);
        ctx.arc(hw*0.08, hw*0.13, hw*0.045, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Yellow pencil
        ctx.rotate(-0.55);
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.roundRect(-hw*0.08, -hw*0.08, hw*0.16, hw*0.72, 3);
        ctx.fill();
        ctx.fillStyle = '#F57F17';
        ctx.beginPath();
        ctx.moveTo(-hw*0.08, hw*0.64);
        ctx.lineTo(hw*0.08, hw*0.64);
        ctx.lineTo(0, hw*0.84);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(0, hw*0.84, hw*0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF8A80';
        ctx.beginPath();
        ctx.roundRect(-hw*0.08, -hw*0.18, hw*0.16, hw*0.13, 2);
        ctx.fill();
      }
      ctx.restore();

      if (isFemale) {
        // Long hair behind the face
        const longHairGrad = ctx.createLinearGradient(0, -hh*1.5, 0, -hh*0.24);
        longHairGrad.addColorStop(0, '#292A46');
        longHairGrad.addColorStop(0.48, '#151628');
        longHairGrad.addColorStop(1, '#070812');
        ctx.fillStyle = longHairGrad;
        ctx.beginPath();
        ctx.moveTo(-hw*0.62, -hh*1.03);
        ctx.bezierCurveTo(-hw*0.7, -hh*1.36, -hw*0.38, -hh*1.55, hw*0.02, -hh*1.52);
        ctx.bezierCurveTo(hw*0.45, -hh*1.5, hw*0.7, -hh*1.24, hw*0.62, -hh*0.9);
        ctx.bezierCurveTo(hw*0.68, -hh*0.58, hw*0.46, -hh*0.22, hw*0.18, -hh*0.16);
        ctx.bezierCurveTo(hw*0.1, -hh*0.5, hw*0.16, -hh*0.74, hw*0.08, -hh*0.94);
        ctx.bezierCurveTo(-hw*0.02, -hh*0.74, -hw*0.04, -hh*0.46, -hw*0.16, -hh*0.16);
        ctx.bezierCurveTo(-hw*0.48, -hh*0.24, -hw*0.72, -hh*0.56, -hw*0.62, -hh*1.03);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = hw * 0.035;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-hw*0.38, -hh*1.28);
        ctx.quadraticCurveTo(-hw*0.52, -hh*0.78, -hw*0.36, -hh*0.3);
        ctx.moveTo(hw*0.34, -hh*1.2);
        ctx.quadraticCurveTo(hw*0.46, -hh*0.72, hw*0.3, -hh*0.28);
        ctx.stroke();
      }

      // Ears behind the head
      ctx.fillStyle = skinShade;
      ctx.beginPath();
      ctx.ellipse(-hw*0.5, -hh*0.91, hw*0.12, hh*0.16, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hw*0.5, -hh*0.91, hw*0.12, hh*0.16, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(191, 96, 44, 0.35)';
      ctx.lineWidth = hw * 0.035;
      ctx.beginPath();
      ctx.arc(-hw*0.5, -hh*0.9, hw*0.06, -1.2, 1.4);
      ctx.arc(hw*0.5, -hh*0.9, hw*0.06, 1.8, 4.4);
      ctx.stroke();

      // Soft kid face shape
      const faceGrad = ctx.createLinearGradient(0, -hh*1.42, 0, -hh*0.43);
      faceGrad.addColorStop(0, '#FFD9A3');
      faceGrad.addColorStop(0.65, skinColor);
      faceGrad.addColorStop(1, skinShade);
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(0, -hh*1.42);
      ctx.bezierCurveTo(hw*0.45, -hh*1.4, hw*0.58, -hh*1.12, hw*0.52, -hh*0.84);
      ctx.bezierCurveTo(hw*0.47, -hh*0.58, hw*0.22, -hh*0.45, 0, -hh*0.43);
      ctx.bezierCurveTo(-hw*0.22, -hh*0.45, -hw*0.47, -hh*0.58, -hw*0.52, -hh*0.84);
      ctx.bezierCurveTo(-hw*0.58, -hh*1.12, -hw*0.45, -hh*1.4, 0, -hh*1.42);
      ctx.closePath();
      ctx.fill();

      // Rounded, layered kid hair
      const hairDark = '#090A14';
      const hairMid = '#292A46';
      const hairLight = '#565878';
      const hairGrad = ctx.createLinearGradient(0, -hh*1.54, 0, -hh*0.94);
      hairGrad.addColorStop(0, hairMid);
      hairGrad.addColorStop(0.5, '#151628');
      hairGrad.addColorStop(1, hairDark);
      ctx.fillStyle = hairGrad;
      ctx.beginPath();
      ctx.moveTo(-hw*0.55, -hh*1.04);
      ctx.bezierCurveTo(-hw*0.52, -hh*1.34, -hw*0.26, -hh*1.52, hw*0.05, -hh*1.49);
      ctx.bezierCurveTo(hw*0.38, -hh*1.47, hw*0.58, -hh*1.23, hw*0.52, -hh*0.96);
      ctx.bezierCurveTo(hw*0.36, -hh*1.05, hw*0.18, -hh*1.06, -hw*0.04, -hh*1.0);
      ctx.bezierCurveTo(-hw*0.24, -hh*0.94, -hw*0.43, -hh*0.94, -hw*0.55, -hh*1.04);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(41,42,70,0.72)';
      ctx.beginPath();
      ctx.moveTo(-hw*0.43, -hh*1.16);
      ctx.quadraticCurveTo(-hw*0.27, -hh*1.44, -hw*0.05, -hh*1.2);
      ctx.quadraticCurveTo(hw*0.09, -hh*1.53, hw*0.27, -hh*1.18);
      ctx.quadraticCurveTo(hw*0.43, -hh*1.35, hw*0.43, -hh*1.02);
      ctx.quadraticCurveTo(hw*0.16, -hh*1.13, -hw*0.08, -hh*1.03);
      ctx.quadraticCurveTo(-hw*0.28, -hh*0.96, -hw*0.43, -hh*1.16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = hw * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw*0.48, -hh*1.08);
      ctx.quadraticCurveTo(-hw*0.34, -hh*0.95, -hw*0.18, -hh*1.02);
      ctx.moveTo(hw*0.34, -hh*1.18);
      ctx.quadraticCurveTo(hw*0.45, -hh*1.07, hw*0.42, -hh*0.95);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = hw * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw*0.2, -hh*1.34);
      ctx.quadraticCurveTo(-hw*0.08, -hh*1.18, -hw*0.2, -hh*1.02);
      ctx.moveTo(hw*0.12, -hh*1.34);
      ctx.quadraticCurveTo(hw*0.24, -hh*1.17, hw*0.14, -hh*1.01);
      ctx.stroke();

      ctx.fillStyle = `rgba(86,88,120,0.3)`;
      ctx.beginPath();
      ctx.ellipse(-hw*0.31, -hh*1.24, hw*0.045, hh*0.18, -0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(hw*0.17, -hh*1.27, hw*0.035, hh*0.16, -0.15, 0, Math.PI * 2);
      ctx.fill();

      if (isFemale) {
        ctx.fillStyle = '#F06292';
        ctx.strokeStyle = '#C2185B';
        ctx.lineWidth = hw * 0.025;
        ctx.beginPath();
        ctx.moveTo(hw*0.25, -hh*1.28);
        ctx.quadraticCurveTo(hw*0.43, -hh*1.42, hw*0.5, -hh*1.22);
        ctx.quadraticCurveTo(hw*0.38, -hh*1.18, hw*0.25, -hh*1.28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hw*0.55, -hh*1.25);
        ctx.quadraticCurveTo(hw*0.72, -hh*1.36, hw*0.72, -hh*1.14);
        ctx.quadraticCurveTo(hw*0.58, -hh*1.14, hw*0.55, -hh*1.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#AD1457';
        ctx.beginPath();
        ctx.arc(hw*0.52, -hh*1.24, hw*0.055, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eyebrows
      ctx.strokeStyle = hairDark;
      ctx.lineWidth = hw * 0.045;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-hw*0.34, -hh*1.02);
      ctx.quadraticCurveTo(-hw*0.24, -hh*1.06, -hw*0.12, -hh*1.03);
      ctx.moveTo(hw*0.12, -hh*1.03);
      ctx.quadraticCurveTo(hw*0.24, -hh*1.06, hw*0.34, -hh*1.02);
      ctx.stroke();

      // Eyes, cheeks, nose, and mouth
      if (this.hitTimer > 0) {
        ctx.fillStyle = hairDark;
        ctx.font = `bold ${hw*0.34}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('x', -hw*0.22, -hh*0.91);
        ctx.fillText('x', hw*0.22, -hh*0.91);
      } else {
        ctx.fillStyle = hairDark;
        ctx.beginPath();
        ctx.ellipse(-hw*0.22, -hh*0.91, hw*0.085, hh*0.075, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hw*0.22, -hh*0.91, hw*0.085, hh*0.075, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-hw*0.19, -hh*0.94, hw*0.026, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hw*0.25, -hh*0.94, hw*0.026, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(239, 117, 92, 0.22)';
      ctx.beginPath();
      ctx.ellipse(-hw*0.32, -hh*0.76, hw*0.11, hh*0.055, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(hw*0.32, -hh*0.76, hw*0.11, hh*0.055, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(191, 96, 44, 0.55)';
      ctx.lineWidth = hw * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hw*0.03, -hh*0.88);
      ctx.quadraticCurveTo(hw*0.08, -hh*0.79, -hw*0.02, -hh*0.76);
      ctx.stroke();

      ctx.strokeStyle = '#BF360C';
      ctx.lineWidth = hw * 0.055;
      ctx.beginPath();
      if (this.hitTimer > 0) {
        ctx.arc(0, -hh*0.67, hw*0.18, 0, Math.PI);
      } else {
        ctx.moveTo(-hw*0.18, -hh*0.67);
        ctx.quadraticCurveTo(0, -hh*0.56, hw*0.2, -hh*0.67);
      }
      ctx.stroke();

      ctx.restore();
    }
  };

  // Obstacles array
  const obstacles = [];

  class Obstacle {
    constructor() {
      this.w = Math.min(W * 0.09, 60);
      this.h = Math.min(W * 0.11, 70) + Math.random() * Math.min(W * 0.04, 30);
      this.x = W + this.w;
      this.y = groundY() - this.h;
      this.speed = W * INITIAL_PLAYER_SPEED * speedMultiplier;
      this.question = null;
      this.questionShown = false;
      this.passed = false;
      this.progressCounted = false;
      this.colorBase = `hsl(${Math.floor(Math.random() * 60) + 330},80%,50%)`;
      this.eyeAnim = 0;
      this.wobble = 0;
      this.world = currentWorld || getWorldForLevel(level);
      this.skin = this.world === 'barangay'
        ? ['trashBag', 'roadBarrier', 'crate'][Math.floor(Math.random() * 3)]
        : this.world === 'school'
          ? ['stackedBooks', 'schoolCone', 'lockerBox'][Math.floor(Math.random() * 3)]
        : 'default';
      if (this.world === 'school') {
        const size = Math.min(W * 0.095, 64);
        if (this.skin === 'stackedBooks') {
          this.w = size * 1.08;
          this.h = size * 0.92;
        } else if (this.skin === 'schoolCone') {
          this.w = size * 0.9;
          this.h = size * 1.08;
        } else {
          this.w = size * 1.05;
          this.h = size * 1.0;
        }
        this.y = groundY() - this.h;
      }
    }

    update(dt) {
      if (this.smashed) {
        this.smashT += dt;
        this.vy += H * 1.18 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.spin * dt;
        this.wobble = Math.sin(this.smashT * 28) * 3;
        return this.smashT > 0.72 || this.y > H + this.h || this.x > W + this.w * 2;
      }
      this.x -= this.speed * getWorldSpeedMultiplier() * dt;
      this.eyeAnim += dt * 3;
      this.wobble = Math.sin(this.eyeAnim * 0.8) * 2;
      return this.x < -this.w - 10;
    }

    drawBarangaySkin() {
      const w = this.w;
      const h = this.h;
      const ground = h * 0.5;

      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(0, ground + h * 0.015, w * 0.52, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.skin === 'trashBag') {
        ctx.fillStyle = '#1B1B1F';
        ctx.beginPath();
        ctx.roundRect(-w * 0.48, ground - h * 0.78, w * 0.96, h * 0.78, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.11)';
        ctx.beginPath();
        ctx.ellipse(-w * 0.16, ground - h * 0.43, w * 0.16, h * 0.24, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#101014';
        ctx.beginPath();
        ctx.moveTo(-w * 0.16, ground - h * 0.78);
        ctx.lineTo(0, ground - h * 1.0);
        ctx.lineTo(w * 0.16, ground - h * 0.78);
        ctx.closePath();
        ctx.fill();
      } else if (this.skin === 'roadBarrier') {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-w * 0.48, ground - h * 0.18, w * 0.18, h * 0.18);
        ctx.fillRect(w * 0.3, ground - h * 0.18, w * 0.18, h * 0.18);
        ctx.fillStyle = '#F57C00';
        ctx.beginPath();
        ctx.roundRect(-w * 0.55, ground - h * 0.74, w * 1.1, h * 0.5, 6);
        ctx.fill();
        ctx.fillStyle = '#FFF3E0';
        for (let i = -1; i <= 1; i++) {
          ctx.save();
          ctx.translate(i * w * 0.26, ground - h * 0.49);
          ctx.rotate(-0.45);
          ctx.fillRect(-w * 0.045, -h * 0.22, w * 0.09, h * 0.44);
          ctx.restore();
        }
      } else if (this.skin === 'parkedTricycle') {
        drawTricycle(0, ground, Math.max(0.92, w / 52), 2, 0);
      } else {
        ctx.save();
        ctx.rotate(-0.08);
        ctx.fillStyle = '#8D5A33';
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = Math.max(2, w * 0.045);
        const plankH = h * 0.115;
        const stackBottom = ground;
        for (let i = 0; i < 4; i++) {
          const py = stackBottom - (4 - i) * h * 0.18;
          ctx.fillStyle = i % 2 ? '#A66A3C' : '#8D5A33';
          ctx.beginPath();
          ctx.roundRect(-w * 0.52 + i * w * 0.035, py, w * 0.96, plankH, 3);
          ctx.fill();
          ctx.stroke();
        }
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = Math.max(2, w * 0.05);
        ctx.beginPath();
        ctx.moveTo(-w * 0.42, ground - h * 0.76);
        ctx.lineTo(w * 0.34, ground - h * 0.04);
        ctx.moveTo(w * 0.42, ground - h * 0.74);
        ctx.lineTo(-w * 0.34, ground - h * 0.06);
        ctx.stroke();
        ctx.restore();
      }

      const ew = w * 0.14;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-w * 0.16, -h * 0.1 + this.wobble, ew, ew * 1.05, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.16, -h * 0.1 + this.wobble, ew, ew * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.arc(-w * 0.16, -h * 0.1 + this.wobble, ew * 0.45, 0, Math.PI * 2);
      ctx.arc(w * 0.16, -h * 0.1 + this.wobble, ew * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    drawSchoolSkin() {
      const w = this.w;
      const h = this.h;
      const ground = h * 0.5;

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, ground + h * 0.018, w * 0.55, h * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.skin === 'stackedBooks') {
        const colors = ['#1976D2', '#FBC02D', '#D84315', '#388E3C'];
        for (let i = 0; i < 4; i++) {
          const bookH = h * 0.16;
          const bookW = w * (0.82 + (i % 2) * 0.12);
          const bx = -bookW * 0.5 + (i % 2 ? -w * 0.03 : w * 0.03);
          const by = ground - bookH * (i + 1) - h * 0.03;
          ctx.fillStyle = colors[(i + Math.floor(this.eyeAnim)) % colors.length];
          ctx.beginPath();
          ctx.roundRect(bx, by, bookW, bookH, 5);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.72)';
          ctx.fillRect(bx + bookW * 0.08, by + bookH * 0.28, bookW * 0.22, bookH * 0.12);
          ctx.fillStyle = 'rgba(0,0,0,0.13)';
          ctx.fillRect(bx, by + bookH * 0.76, bookW, bookH * 0.1);
        }
      } else if (this.skin === 'schoolCone') {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-w * 0.48, ground - h * 0.12, w * 0.96, h * 0.12);
        ctx.fillStyle = '#F57C00';
        ctx.beginPath();
        ctx.moveTo(0, ground - h * 0.95);
        ctx.lineTo(-w * 0.36, ground - h * 0.12);
        ctx.lineTo(w * 0.36, ground - h * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFF8E1';
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-w * 0.19, ground - h * 0.58);
        ctx.lineTo(w * 0.19, ground - h * 0.58);
        ctx.lineTo(w * 0.25, ground - h * 0.45);
        ctx.lineTo(-w * 0.25, ground - h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.roundRect(-w * 0.44, ground - h * 0.34, w * 0.88, h * 0.18, 5);
        ctx.fill();
        ctx.fillStyle = '#263238';
        ctx.font = `900 ${Math.max(8, w * 0.16)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SLOW', 0, ground - h * 0.25, w * 0.78);
      } else {
        ctx.fillStyle = '#546E7A';
        ctx.beginPath();
        ctx.roundRect(-w * 0.42, ground - h * 0.86, w * 0.84, h * 0.86, 6);
        ctx.fill();
        ctx.fillStyle = '#78909C';
        ctx.fillRect(-w * 0.02, ground - h * 0.86, w * 0.04, h * 0.86);
        ctx.fillStyle = '#ECEFF1';
        [-0.22, 0.18].forEach(px => {
          ctx.fillRect(w * px, ground - h * 0.66, w * 0.16, h * 0.035);
          ctx.fillRect(w * px, ground - h * 0.42, w * 0.16, h * 0.035);
        });
        ctx.fillStyle = '#263238';
        ctx.fillRect(-w * 0.32, ground - h * 0.18, w * 0.22, h * 0.04);
        ctx.fillRect(w * 0.1, ground - h * 0.18, w * 0.22, h * 0.04);
      }

      const ew = w * 0.13;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-w * 0.15, -h * 0.12 + this.wobble, ew, ew * 1.05, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.15, -h * 0.12 + this.wobble, ew, ew * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#17212B';
      ctx.beginPath();
      ctx.arc(-w * 0.15, -h * 0.12 + this.wobble, ew * 0.45, 0, Math.PI * 2);
      ctx.arc(w * 0.15, -h * 0.12 + this.wobble, ew * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    draw() {
      ctx.save();
      ctx.translate(this.x + this.w/2, this.y + this.h/2);
      if (this.smashed) {
        const fade = clamp01(1 - this.smashT / 0.72);
        ctx.globalAlpha *= fade;
        ctx.rotate(this.rotation || 0);
        const squash = 1 + Math.sin(this.smashT * Math.PI) * 0.08;
        ctx.scale(squash, 1 / squash);
      }

      if (this.world === 'barangay') {
        this.drawBarangaySkin();
        if (this.question && this.questionShown && !this.passed) {
          const bw = Math.max(this.w * 2.2, 100);
          const bh = this.h * 0.45;
          const bx = -bw/2;
          const by = -this.h/2 - bh - 12;
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.strokeStyle = '#FFD600';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 10);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.beginPath();
          ctx.moveTo(-8, -this.h/2 - 6);
          ctx.lineTo(8, -this.h/2 - 6);
          ctx.lineTo(0, -this.h/2 + 2);
          ctx.fill();
          ctx.fillStyle = '#1a1a2e';
          ctx.font = `bold ${Math.max(bh*0.38, 13)}px 'Fredoka One', cursive`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(this.question.question, 0, by + bh/2);
        }
        ctx.restore();
        return;
      }

      if (this.world === 'school') {
        this.drawSchoolSkin();
        if (this.question && this.questionShown && !this.passed) {
          const bw = Math.max(this.w * 2.2, 100);
          const bh = this.h * 0.45;
          const bx = -bw/2;
          const by = -this.h/2 - bh - 12;
          ctx.fillStyle = 'rgba(255,255,255,0.96)';
          ctx.strokeStyle = '#1976D2';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 10);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.96)';
          ctx.beginPath();
          ctx.moveTo(-8, -this.h/2 - 6);
          ctx.lineTo(8, -this.h/2 - 6);
          ctx.lineTo(0, -this.h/2 + 2);
          ctx.fill();
          ctx.fillStyle = '#17212B';
          ctx.font = `bold ${Math.max(bh*0.38, 13)}px 'Fredoka One', cursive`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(this.question.question, 0, by + bh/2);
        }
        ctx.restore();
        return;
      }

      // Body
      const grad = ctx.createLinearGradient(-this.w/2, -this.h/2, this.w/2, this.h/2);
      grad.addColorStop(0, '#EF5350');
      grad.addColorStop(1, '#B71C1C');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-this.w/2, -this.h/2, this.w, this.h, 10);
      ctx.fill();

      // Shading
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(-this.w/2, -this.h/2, this.w*0.45, this.h, 10);
      ctx.fill();

      // Eyes (angry!)
      const ew = this.w * 0.18;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(-this.w*0.18, -this.h*0.25 + this.wobble, ew, ew*1.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.w*0.18, -this.h*0.25 + this.wobble, ew, ew*1.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      ctx.ellipse(-this.w*0.18, -this.h*0.25 + this.wobble, ew*0.5, ew*0.7, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.w*0.18, -this.h*0.25 + this.wobble, ew*0.5, ew*0.7, -0.3, 0, Math.PI*2); ctx.fill();

      // Angry eyebrows
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = this.w * 0.07; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-this.w*0.32, -this.h*0.38 + this.wobble);
      ctx.lineTo(-this.w*0.05, -this.h*0.32 + this.wobble);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.w*0.32, -this.h*0.38 + this.wobble);
      ctx.lineTo(this.w*0.05, -this.h*0.32 + this.wobble);
      ctx.stroke();

      // Mouth
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = this.w * 0.07;
      ctx.beginPath();
      ctx.arc(0, -this.h*0.05, this.w*0.22, 0, Math.PI); ctx.stroke();

      // Math problem bubble
      if (this.question && this.questionShown && !this.passed) {
        const bw = Math.max(this.w * 2.2, 100);
        const bh = this.h * 0.45;
        const bx = -bw/2;
        const by = -this.h/2 - bh - 12;

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 10);
        ctx.fill(); ctx.stroke();

        // Triangle pointer
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.moveTo(-8, -this.h/2 - 6);
        ctx.lineTo(8, -this.h/2 - 6);
        ctx.lineTo(0, -this.h/2 + 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a2e';
        ctx.font = `bold ${Math.max(bh*0.38, 13)}px 'Fredoka One', cursive`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.question.question, 0, by + bh/2);
      }

      ctx.restore();
    }
  }

  // Cloud data
  function createCloudSprite(c) {
    if (typeof document === 'undefined') return null;

    const pad = Math.ceil(c.r * 0.8);
    const sprite = document.createElement('canvas');
    sprite.width = Math.ceil(c.width + pad * 2);
    sprite.height = Math.ceil(c.height * 2.2 + pad * 2);
    const sctx = sprite.getContext('2d');
    if (!sctx) return null;

    const cx = sprite.width / 2;
    const cy = sprite.height / 2 - c.height * 0.12;
    const baseY = cy + c.height * 0.28;
    const left = cx - c.width * 0.5;

    const shadow = sctx.createLinearGradient(0, cy - c.height, 0, cy + c.height);
    shadow.addColorStop(0, 'rgba(255,255,255,0.94)');
    shadow.addColorStop(0.58, 'rgba(245,250,255,0.88)');
    shadow.addColorStop(1, 'rgba(195,214,231,0.46)');
    sctx.fillStyle = shadow;
    sctx.beginPath();
    sctx.ellipse(cx, baseY, c.width * 0.52, c.height * 0.46, 0, 0, Math.PI * 2);
    sctx.fill();

    [
      [-0.42, 0.03, 0.46],
      [-0.2, -0.26, 0.56],
      [0.08, -0.35, 0.68],
      [0.38, -0.18, 0.5],
      [0.55, 0.04, 0.36]
    ].forEach((p, i) => {
      const wobble = Math.sin(c.puffSeed + i * 1.9) * c.r * 0.05;
      const px = cx + p[0] * c.width + wobble;
      const py = cy + p[1] * c.height;
      const pr = c.r * p[2];
      const puffGrad = sctx.createRadialGradient(px - pr * 0.28, py - pr * 0.32, 0, px, py, pr * 1.15);
      puffGrad.addColorStop(0, 'rgba(255,255,255,0.98)');
      puffGrad.addColorStop(0.52, 'rgba(252,254,255,0.92)');
      puffGrad.addColorStop(1, 'rgba(209,225,240,0.48)');
      sctx.fillStyle = puffGrad;
      sctx.beginPath();
      sctx.arc(px, py, pr, 0, Math.PI * 2);
      sctx.fill();
    });

    sctx.globalAlpha = 0.26;
    sctx.fillStyle = '#7A93A8';
    sctx.beginPath();
    sctx.ellipse(cx + c.width * 0.02, baseY + c.height * 0.16, c.width * 0.38, c.height * 0.16, 0, 0, Math.PI * 2);
    sctx.fill();

    sctx.globalAlpha = 0.38;
    sctx.fillStyle = '#FFFFFF';
    sctx.beginPath();
    sctx.ellipse(left + c.width * 0.38, cy - c.height * 0.3, c.width * 0.23, c.height * 0.14, -0.12, 0, Math.PI * 2);
    sctx.fill();
    return sprite;
  }

  function initClouds() {
    clouds.length = 0;
    const cloudCount = Math.max(4, Math.min(7, Math.round(W / 210)));
    for (let i = 0; i < cloudCount; i++) {
      const r = W * (0.045 + Math.random() * 0.045);
      const cloud = {
        x: Math.random() * W,
        y: H * (0.07 + Math.random() * 0.22),
        r,
        width: r * (2.9 + Math.random() * 1.1),
        height: r * (0.9 + Math.random() * 0.35),
        speed: W * (0.008 + Math.random() * 0.012),
        puffSeed: Math.random() * Math.PI * 2,
        opacity: 0.72 + Math.random() * 0.18
      };
      cloud.sprite = createCloudSprite(cloud);
      clouds.push(cloud);
    }
  }

  function makeParallaxRng(seed) {
    let value = seed >>> 0;
    return function() {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function pickWeightedType(rng, entries) {
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    let roll = rng() * total;
    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return entries[0][0];
  }

  function getWorldTheme(worldId) {
    const themes = {
      city: {
        seed: 90210,
        signTexts: [
          "I hate math talaga",
          "Math ahead, good luck",
          "Bawal Madaya!",
          "Uyy! Philippines!",
          "500m to portal",
          "1km ahead",
          "Lagi na lang may math!",
          "Kupal ka ba boss!",
          "To see is to believe"
        ],
        farTypes: [['tree', 62], ['windmill', 12], ['house', 16], ['barn', 10]],
        midTypes: [['fence', 52], ['bush', 22], ['house', 26]],
        frontTypes: [['grass', 64], ['plant', 20], ['rock', 16]]
      },
      barangay: {
        seed: 42103,
        signTexts: [],
        farTypes: [['barangayRoof', 34], ['distantBuilding', 30], ['wirePost', 10], ['house', 20]],
        midTypes: [['basketballCourt', 11], ['sariStore', 18], ['barangayHall', 7], ['barangayHouse', 18], ['gate', 12], ['laundryLine', 10], ['alley', 7], ['fence', 12]],
        frontTypes: [['pottedPlant', 30], ['bench', 13], ['shortFence', 16], ['tireStack', 7], ['roadsideBarrier', 6], ['neatHollowBlocks', 9], ['plasticChair', 8]]
      },
      school: {
        seed: 71257,
        signTexts: [],
        farTypes: [['campusBlock', 44], ['schoolBuilding', 34], ['schoolRooftop', 22]],
        midTypes: [['schoolBuilding', 22], ['classroom', 20], ['schoolHallway', 18], ['schoolGate', 8], ['bulletinBoard', 7], ['campusFence', 13]],
        frontTypes: [['campusBench', 22], ['schoolPlant', 28], ['schoolLamp', 20], ['campusRailing', 18], ['schoolSign', 8]]
      }
    };
    return themes[worldId] || themes.city;
  }

  function initParallaxWorld() {
    currentWorld = sessionConfig.background || currentWorld || getWorldForLevel(level);
    const theme = getWorldTheme(currentWorld);
    const rng = makeParallaxRng(Math.round(W * 31 + H * 17 + theme.seed));
    const repeatW = Math.max(W * 3.2, 1500);
    const farTerrain = {
      horizonY: groundY() - H * (currentWorld === 'school' ? 0.17 : currentWorld === 'barangay' ? 0.145 : 0.2),
      baseY: groundY() - H * (currentWorld === 'school' ? 0.07 : currentWorld === 'barangay' ? 0.075 : 0.105),
      ampA: H * (currentWorld === 'school' ? 0.0015 : currentWorld === 'barangay' ? 0.003 : 0.018),
      ampB: H * (currentWorld === 'school' ? 0.001 : currentWorld === 'barangay' ? 0.002 : 0.012),
      phaseA: rng() * Math.PI * 2,
      phaseB: rng() * Math.PI * 2
    };
    const sampleFarTerrainY = (x) => {
      const nx = x / repeatW;
      const terrainWave =
        Math.sin(nx * Math.PI * 2 * 2.2 + farTerrain.phaseA) * farTerrain.ampA +
        Math.sin(nx * Math.PI * 2 * 5.1 + farTerrain.phaseB) * farTerrain.ampB;
      return lerp(farTerrain.horizonY, farTerrain.baseY + terrainWave, 0.76);
    };
    const midTerrain = {
      horizonY: groundY() - H * (currentWorld === 'school' ? 0.04 : currentWorld === 'barangay' ? 0.035 : 0.055),
      baseY: roadTopY() - H * (currentWorld === 'school' ? 0.014 : currentWorld === 'barangay' ? 0.012 : 0.006),
      ampA: H * (currentWorld === 'school' ? 0.0015 : currentWorld === 'barangay' ? 0.0025 : 0.009),
      ampB: H * (currentWorld === 'school' ? 0.001 : currentWorld === 'barangay' ? 0.0015 : 0.005),
      phaseA: rng() * Math.PI * 2,
      phaseB: rng() * Math.PI * 2
    };
    const sampleMidTerrainY = (x) => {
      const nx = x / repeatW;
      const terrainWave =
        Math.sin(nx * Math.PI * 2 * 2.7 + midTerrain.phaseA) * midTerrain.ampA +
        Math.sin(nx * Math.PI * 2 * 6.4 + midTerrain.phaseB) * midTerrain.ampB;
      return lerp(midTerrain.horizonY, midTerrain.baseY + terrainWave, 0.82);
    };
    const signTexts = theme.signTexts;

    const mountains = currentWorld === 'barangay' || currentWorld === 'school' ? [] : Array.from({ length: 10 }, (_, i) => ({
      x: (i / 10) * repeatW + (rng() - 0.5) * W * 0.16,
      w: W * (0.32 + rng() * 0.24),
      h: H * (0.16 + rng() * 0.15),
      y: groundY() - H * (0.2 + rng() * 0.04),
      shade: rng()
    }));

    const hills = currentWorld === 'barangay' || currentWorld === 'school' ? [] : Array.from({ length: 12 }, (_, i) => ({
      x: (i / 12) * repeatW + (rng() - 0.5) * W * 0.12,
      w: W * (0.32 + rng() * 0.22),
      h: H * (0.09 + rng() * 0.07),
      y: groundY() - H * (0.11 + rng() * 0.04),
      shade: rng()
    }));

    const farProps = [];
    const schoolFarBackgroundProps = [];
    if (currentWorld === 'school') {
      const campusCount = 18;
      for (let i = 0; i < campusCount; i++) {
        const slotW = repeatW / campusCount;
        const openGap = i % 7 === 3;
        const x = i * slotW + slotW * (0.16 + rng() * 0.42);
        schoolFarBackgroundProps.push({
          type: openGap ? 'campusGap' : ['schoolSkyline', 'campusBlock', 'schoolBuilding', 'schoolRooftop', 'schoolSkyline'][i % 5],
          x,
          y: groundY() - H * (0.082 + rng() * 0.011),
          s: openGap ? 0.7 + rng() * 0.18 : 0.92 + rng() * 0.42,
          variant: Math.floor(rng() * 5),
          phase: rng() * Math.PI * 2
        });
      }
      schoolFarBackgroundProps.sort((a, b) => a.y - b.y);
    }

    const farPropCount = currentWorld === 'school' ? 22 : currentWorld === 'barangay' ? 26 : 34;
    for (let i = 0; i < farPropCount; i++) {
      const slotW = repeatW / farPropCount;
      const x = currentWorld === 'school' || currentWorld === 'barangay'
        ? i * slotW + slotW * (0.22 + rng() * 0.48)
        : rng() * repeatW;
      const depth = rng();
      farProps.push({
        type: pickWeightedType(rng, theme.farTypes),
        x,
        depth,
        y: sampleFarTerrainY(x),
        s: currentWorld === 'school' ? 0.62 + depth * 0.26 + rng() * 0.14 : 0.5 + depth * 0.34 + rng() * 0.22,
        variant: Math.floor(rng() * 5),
        phase: rng() * Math.PI * 2
      });
    }
    const farFlagAnchors = currentWorld === 'city'
      ? ['house', 'windmill']
      : currentWorld === 'barangay'
        ? ['openBarangay', 'openBarangay']
        : currentWorld === 'school'
          ? ['campusGround', 'campusGround', 'campusGround', 'campusGround']
          : [];
    for (let i = 0; i < farFlagAnchors.length; i++) {
      const sectionW = repeatW / farFlagAnchors.length;
      const x = i * sectionW + sectionW * (currentWorld === 'school' ? 0.24 + rng() * 0.18 : 0.32 + rng() * 0.25);
      const depth = 0.72 + rng() * 0.22;
      const anchor = farFlagAnchors[i];
      farProps.push({
        type: 'flag',
        anchor,
        x,
        depth,
        y: sampleFarTerrainY(x) + (currentWorld === 'school' ? H * 0.003 : 0),
        s: currentWorld === 'school' ? 0.56 + rng() * 0.08 : 0.78 + depth * 0.18 + rng() * 0.08,
        variant: Math.floor(rng() * 5),
        phase: rng() * Math.PI * 2,
        side: 1
      });
    }
    farProps.sort((a, b) => a.y - b.y);

    const midProps = [];
    const postCount = currentWorld === 'school' ? 20 : currentWorld === 'barangay' ? 24 : 18;
    for (let i = 0; i < postCount; i++) {
      const x = i * (repeatW / postCount) + rng() * W * 0.08;
      midProps.push({ type: 'post', x, y: sampleMidTerrainY(x), groundOffset: 0, variant: i % 3, phase: rng() * Math.PI * 2 });
    }
    signTexts.forEach((text, i) => {
      const x = (i + 0.45 + rng() * 0.18) * (repeatW / signTexts.length);
      midProps.push({
        type: 'sign',
        x,
        y: sampleMidTerrainY(x),
        groundOffset: -H * 0.002,
        s: 0.75 + rng() * 0.55,
        variant: Math.floor(rng() * 5),
        text,
        phase: rng() * Math.PI * 2
      });
    });
    const midSceneryCount = currentWorld === 'school' ? 24 : currentWorld === 'barangay' ? 34 : 18;
    for (let i = 0; i < midSceneryCount; i++) {
      const slotW = repeatW / midSceneryCount;
      const x = currentWorld === 'school' || currentWorld === 'barangay'
        ? i * slotW + slotW * (0.18 + rng() * 0.58)
        : rng() * repeatW;
      const type = pickWeightedType(rng, theme.midTypes);
      midProps.push({
        type,
        x,
        y: sampleMidTerrainY(x),
        groundOffset: ['house', 'sariStore', 'barangayHall', 'basketballCourt', 'classroom', 'schoolGate', 'locker', 'chalkboard', 'barangayHouse', 'gate', 'laundryLine', 'alley', 'schoolBuilding', 'schoolHallway', 'bulletinBoard', 'campusFence'].includes(type) ? H * 0.002 : type === 'bush' ? H * 0.001 : 0,
        s: currentWorld === 'school' ? 0.84 + rng() * 0.34 : currentWorld === 'barangay' ? 0.78 + rng() * 0.34 : 0.75 + rng() * 0.55,
        variant: Math.floor(rng() * 5),
        phase: rng() * Math.PI * 2
      });
    }
    midProps.sort((a, b) => a.x - b.x);

    const frontDetails = [];
    const vergeTop = groundY() + H * 0.008;
    const vergeBottom = groundY() + (H - groundY()) * 0.1;
    const barangayRoadsideTop = roadTopY() - H * 0.024;
    const barangayRoadsideBottom = roadTopY() - H * 0.003;
    const frontCount = currentWorld === 'school' ? 30 : currentWorld === 'barangay' ? 34 : 58;
    for (let i = 0; i < frontCount; i++) {
      const type = pickWeightedType(rng, theme.frontTypes);
      frontDetails.push({
        type,
        x: rng() * repeatW,
        y: currentWorld === 'barangay' || currentWorld === 'school' ? lerp(barangayRoadsideTop, barangayRoadsideBottom, rng()) : lerp(vergeTop, vergeBottom, rng()),
        s: 0.7 + rng() * 1.1,
        variant: Math.floor(rng() * 5),
        phase: rng() * Math.PI * 2
      });
    }

    const barangayFarBuildings = [];
    if (currentWorld === 'barangay') {
      const farBuildingCount = 18;
      for (let i = 0; i < farBuildingCount; i++) {
        const slotW = repeatW / farBuildingCount;
        const x = i * slotW + slotW * (0.2 + rng() * 0.5);
        barangayFarBuildings.push({
          x,
          y: groundY() - H * (0.083 + rng() * 0.012),
          w: H * (0.1 + rng() * 0.09),
          h: H * (0.075 + rng() * 0.09),
          variant: Math.floor(rng() * 5),
          phase: rng() * Math.PI * 2
        });
      }
    }

    parallaxWorld = {
      repeatW,
      time: 0,
      offsets: { veryFar: 0, far: 0, mid: 0, front: 0 },
      farTerrain,
      midTerrain,
      mountains,
      hills,
      barangayFarBuildings,
      schoolFarBackgroundProps,
      farProps,
      midProps,
      midPostProps: midProps.filter(p => p.type === 'post'),
      midSceneryProps: midProps.filter(p => p.type !== 'post'),
      frontDetails
    };
  }

  function scheduleNextBirdSpawn(initial = false) {
    birdSpawnTimer = 0;
    const calmGap = initial ? 2 + Math.random() * 3 : 5 + Math.random() * 9;
    const cinematicPause = Math.random() < 0.08 ? 9 + Math.random() * 10 : 0;
    nextBirdSpawn = calmGap + cinematicPause;
  }

  function resetBirds() {
    birds.length = 0;
    scheduleNextBirdSpawn(true);
  }

  function initStars() {
    stars.length = 0;
    const starCount = Math.max(45, Math.min(90, Math.round(W / 16)));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * W,
        y: H * (0.035 + Math.random() * 0.56),
        r: 0.7 + Math.random() * 1.8,
        glow: 0.35 + Math.random() * 0.65,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.55 + Math.random() * 1.3
      });
    }
    shootingStars.length = 0;
    shootingStarTimer = 2.5 + Math.random() * 4;
  }

  function resetDayNightCycle() {
    dayNightClock = 0;
    nightLevel = 0;
    shootingStars.length = 0;
    shootingStarTimer = 4;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function easeInOut(t) {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    if (hex.startsWith('rgb')) {
      const parts = hex.match(/\d+/g);
      return {
        r: Number(parts?.[0] || 0),
        g: Number(parts?.[1] || 0),
        b: Number(parts?.[2] || 0)
      };
    }
    const value = parseInt(hex.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function mixHex(a, b, t) {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    const r = Math.round(lerp(ca.r, cb.r, t));
    const g = Math.round(lerp(ca.g, cb.g, t));
    const bl = Math.round(lerp(ca.b, cb.b, t));
    return `rgb(${r},${g},${bl})`;
  }

  const Weather = {
    states: {
      sunny: {
        skyTop: '#1565C0', skyMid: '#2E9DE5', skyHorizon: '#4FC3F7',
        light: 1, desaturate: 0, cloudDensity: 0.55, cloudDark: 0, rain: 0, fog: 0,
        wind: 0.18, wet: 0, bird: 1, warm: 0.18, sunset: 0, storm: 0, glow: 0
      },
      cloudy: {
        skyTop: '#5F7F9A', skyMid: '#8DA8B8', skyHorizon: '#B5C8D1',
        light: 0.74, desaturate: 0.26, cloudDensity: 1.1, cloudDark: 0.34, rain: 0, fog: 0.08,
        wind: 0.28, wet: 0, bird: 0.72, warm: 0, sunset: 0, storm: 0, glow: 0.08
      },
      rain: {
        skyTop: '#344960', skyMid: '#587084', skyHorizon: '#8193A0',
        light: 0.56, desaturate: 0.36, cloudDensity: 1.32, cloudDark: 0.58, rain: 0.58, fog: 0.16,
        wind: 0.48, wet: 0.8, bird: 0.08, warm: 0, sunset: 0, storm: 0, glow: 0.35
      },
      fog: {
        skyTop: '#97AEB8', skyMid: '#BFCBD0', skyHorizon: '#DEE5E4',
        light: 0.78, desaturate: 0.42, cloudDensity: 0.92, cloudDark: 0.12, rain: 0, fog: 0.78,
        wind: 0.12, wet: 0.1, bird: 0.32, warm: 0, sunset: 0, storm: 0, glow: 0.18
      },
      windy: {
        skyTop: '#2678B6', skyMid: '#57A8D8', skyHorizon: '#96D4EA',
        light: 0.9, desaturate: 0.08, cloudDensity: 0.86, cloudDark: 0.12, rain: 0, fog: 0.04,
        wind: 1, wet: 0, bird: 0.82, warm: 0.08, sunset: 0, storm: 0, glow: 0.05
      },
      sunset: {
        skyTop: '#4E69A8', skyMid: '#E58A82', skyHorizon: '#FFC46A',
        light: 0.86, desaturate: 0.05, cloudDensity: 0.72, cloudDark: 0.08, rain: 0, fog: 0.1,
        wind: 0.22, wet: 0, bird: 0.9, warm: 0.68, sunset: 1, storm: 0, glow: 0.15
      },
      storm: {
        skyTop: '#151B2B', skyMid: '#2B3344', skyHorizon: '#4F5A68',
        light: 0.36, desaturate: 0.5, cloudDensity: 1.55, cloudDark: 0.86, rain: 1, fog: 0.24,
        wind: 1.18, wet: 1, bird: 0, warm: 0, sunset: 0, storm: 1, glow: 0.8
      }
    },
    currentName: 'sunny',
    targetName: 'sunny',
    current: null,
    timer: 0,
    nextChange: 150,
    transitionSeconds: 42,
    rainDrops: [],
    splashes: [],
    leaves: [],
    splashPool: [],
    leafPool: [],
    lightning: 0,
    lightningTimer: 8,
    init() {
      this.currentName = 'sunny';
      this.targetName = 'sunny';
      this.current = { ...this.states.sunny };
      this.timer = 0;
      this.nextChange = this.randomChangeDelay();
      this.rainDrops.length = 0;
      this.splashes.length = 0;
      this.leaves.length = 0;
      this.splashPool.length = 0;
      this.leafPool.length = 0;
      this.lightning = 0;
      this.lightningTimer = 5 + Math.random() * 9;
    },
    randomChangeDelay() {
      return 180;
    },
    chooseNext() {
      const from = this.targetName;
      const weighted = {
        sunny: [['cloudy', 4], ['windy', 2], ['sunset', 2], ['fog', 1], ['rain', 1]],
        cloudy: [['sunny', 2], ['rain', 3], ['fog', 2], ['windy', 2], ['sunset', 1], ['storm', 0.35]],
        rain: [['cloudy', 3], ['fog', 2], ['sunny', 1], ['storm', 0.42], ['windy', 1]],
        fog: [['cloudy', 3], ['sunny', 2], ['rain', 1], ['windy', 1]],
        windy: [['sunny', 2], ['cloudy', 2], ['rain', 1], ['sunset', 1], ['storm', 0.26]],
        sunset: [['cloudy', 2], ['sunny', 2], ['fog', 1], ['rain', 0.8]],
        storm: [['rain', 4], ['cloudy', 3], ['fog', 1]]
      }[from] || [];
      const total = weighted.reduce((sum, item) => sum + item[1], 0);
      let roll = Math.random() * total;
      for (const [name, weight] of weighted) {
        roll -= weight;
        if (roll <= 0) return name;
      }
      return from === 'sunny' ? 'cloudy' : 'sunny';
    },
    update(dt, freezeWorld = false) {
      if (!this.current) this.init();
      const target = this.states[this.targetName];
      const t = 1 - Math.pow(0.001, dt / this.transitionSeconds);
      Object.keys(target).forEach(key => {
        if (typeof target[key] === 'number') this.current[key] = lerp(this.current[key], target[key], t);
        else this.current[key] = mixHex(this.current[key] || target[key], target[key], t);
      });
      if (!freezeWorld) {
        this.timer += dt;
        if (this.timer >= this.nextChange) {
          this.timer = 0;
          this.currentName = this.targetName;
          this.targetName = this.chooseNext();
          this.nextChange = this.randomChangeDelay();
        }
      }
      this.updateLightning(dt, freezeWorld);
    },
    updateLightning(dt, freezeWorld) {
      this.lightning = Math.max(0, this.lightning - dt * 2.8);
      if (freezeWorld || this.current.storm < 0.35) return;
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightning = 0.55 + Math.random() * 0.45;
        this.lightningTimer = 4 + Math.random() * 11;
      }
    },
    effect(name) {
      return this.current ? this.current[name] || 0 : 0;
    },
    cloudSpeedMultiplier() {
      return 1 + this.effect('wind') * 1.8 + this.effect('storm') * 0.7;
    },
    worldSpeedMultiplier() {
      return 1 + this.effect('wind') * 0.08;
    },
    swayMultiplier() {
      return 1 + this.effect('wind') * 2.8 + this.effect('storm') * 0.8;
    },
    lightVisibility(nightVis) {
      return clamp01(Math.max(nightVis, this.effect('rain') * 0.48, this.effect('storm') * 0.82, this.effect('fog') * 0.24) + this.effect('glow') * 0.18);
    }
  };

  function updateDayNightCycle(dt) {
    if (dt <= 0) return;
    dayNightClock += dt;

    const targetNight = Math.floor(dayNightClock / DAY_NIGHT_PHASE_SECONDS) % 2;
    const step = dt / DAY_NIGHT_TRANSITION_SECONDS;
    if (Math.abs(targetNight - nightLevel) <= step) {
      nightLevel = targetNight;
    } else {
      nightLevel += Math.sign(targetNight - nightLevel) * step;
    }
    nightLevel = clamp01(nightLevel);
  }

  function drawRealisticSun(x, y, r) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const outerGlow = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 3.2);
    outerGlow.addColorStop(0, 'rgba(255,246,179,0.92)');
    outerGlow.addColorStop(0.28, 'rgba(255,204,80,0.42)');
    outerGlow.addColorStop(0.62, 'rgba(255,154,46,0.14)');
    outerGlow.addColorStop(1, 'rgba(255,154,46,0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 / 18) * i;
      const inner = r * 1.25;
      const outer = r * (1.75 + (i % 2) * 0.22);
      ctx.strokeStyle = 'rgba(255,224,102,0.18)';
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
      ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    const core = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, 0, x, y, r);
    core.addColorStop(0, '#FFFDE7');
    core.addColorStop(0.34, '#FFE66D');
    core.addColorStop(0.72, '#FFC233');
    core.addColorStop(1, '#F9A825');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRealisticMoon(x, y, r, alpha) {
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.1);
    glow.addColorStop(0, 'rgba(230,238,255,0.62)');
    glow.addColorStop(0.42, 'rgba(154,181,255,0.16)');
    glow.addColorStop(1, 'rgba(154,181,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    const body = ctx.createRadialGradient(x - r * 0.24, y - r * 0.3, 0, x, y, r);
    body.addColorStop(0, '#FFFFFF');
    body.addColorStop(0.55, '#DCE6F7');
    body.addColorStop(1, '#AAB8D4');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(122,135,164,0.22)';
    [[-0.28, -0.14, 0.18], [0.22, 0.16, 0.13], [-0.05, 0.36, 0.1]].forEach(c => {
      ctx.beginPath();
      ctx.arc(x + r * c[0], y + r * c[1], r * c[2], 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawRealisticCloud(c) {
    if (c.sprite) {
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.drawImage(c.sprite, c.x - c.sprite.width / 2, c.y - c.sprite.height / 2);
      ctx.restore();
      return;
    }

    const baseY = c.y + c.height * 0.28;
    const left = c.x - c.width * 0.5;

    ctx.save();
    ctx.globalAlpha = c.opacity;

    const shadow = ctx.createLinearGradient(0, c.y - c.height, 0, c.y + c.height);
    shadow.addColorStop(0, 'rgba(255,255,255,0.94)');
    shadow.addColorStop(0.58, 'rgba(245,250,255,0.88)');
    shadow.addColorStop(1, 'rgba(195,214,231,0.46)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(c.x, baseY, c.width * 0.52, c.height * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    const puffs = [
      [-0.42, 0.03, 0.46],
      [-0.2, -0.26, 0.56],
      [0.08, -0.35, 0.68],
      [0.38, -0.18, 0.5],
      [0.55, 0.04, 0.36]
    ];

    puffs.forEach((p, i) => {
      const wobble = Math.sin(c.puffSeed + i * 1.9) * c.r * 0.05;
      const px = c.x + p[0] * c.width + wobble;
      const py = c.y + p[1] * c.height;
      const pr = c.r * p[2];
      const puffGrad = ctx.createRadialGradient(px - pr * 0.28, py - pr * 0.32, 0, px, py, pr * 1.15);
      puffGrad.addColorStop(0, 'rgba(255,255,255,0.98)');
      puffGrad.addColorStop(0.52, 'rgba(252,254,255,0.92)');
      puffGrad.addColorStop(1, 'rgba(209,225,240,0.48)');
      ctx.fillStyle = puffGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = c.opacity * 0.26;
    ctx.fillStyle = '#7A93A8';
    ctx.beginPath();
    ctx.ellipse(c.x + c.width * 0.02, baseY + c.height * 0.16, c.width * 0.38, c.height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = c.opacity * 0.38;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(left + c.width * 0.38, c.y - c.height * 0.3, c.width * 0.23, c.height * 0.14, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnBirdFlock(largeFlock = false) {
    if (!W || !H) return;
    if (birds.length >= MAX_BIRDS) return;

    const roll = Math.random();
    const desiredCount = largeFlock ? 5 + Math.floor(Math.random() * 3) : roll < 0.5 ? 1 : 2 + Math.floor(Math.random() * 3);
    const count = Math.min(desiredCount, MAX_BIRDS - birds.length);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const baseY = H * (0.08 + Math.random() * 0.3);
    const startX = dir === 1 ? -W * (0.08 + Math.random() * 0.08) : W * (1.08 + Math.random() * 0.08);
    const skyDepth = clamp01((baseY - H * 0.06) / (groundY() * 0.36));
    const baseScale = lerp(0.42, 0.94, skyDepth);
    const baseSpeed = W * (0.04 + Math.random() * 0.055) * lerp(0.82, 1.18, skyDepth);

    for (let i = 0; i < count; i++) {
      const row = i % 3;
      const wing = 4 + Math.random() * 3.5;
      birds.push({
        x: startX - dir * (i * W * (0.025 + Math.random() * 0.022)),
        y: baseY + (row - 1) * H * 0.018 + (Math.random() - 0.5) * H * 0.035,
        dir,
        scale: baseScale * (0.82 + Math.random() * 0.3),
        speed: baseSpeed * (0.82 + Math.random() * 0.34),
        bobAmp: H * (0.004 + Math.random() * 0.008),
        bobSpeed: 1.1 + Math.random() * 1.4,
        flapSpeed: wing,
        phase: Math.random() * Math.PI * 2,
        age: 0,
        blur: 0,
        glow: Math.random() < 0.12 ? 0.2 + Math.random() * 0.22 : 0
      });
    }
  }

  function drawBird(bird, daylight) {
    const wingBeat = Math.sin(bird.phase + bird.age * bird.flapSpeed);
    const x = bird.x;
    const y = bird.y + Math.sin(bird.phase * 0.7 + bird.age * bird.bobSpeed) * bird.bobAmp;
    const s = Math.max(0.28, bird.scale);
    const bodyW = 13 * s;
    const bodyH = 5.2 * s;
    const wingLift = (-2.8 - wingBeat * 7.2) * s;
    const wingBack = (-4.2 + wingBeat * 1.5) * s;
    const wingTipX = -bodyW * 0.2 + wingBack;
    const wingTipY = wingLift;
    const tailSpread = (2.1 + Math.abs(wingBeat) * 0.9) * s;
    const alpha = daylight * (0.36 + bird.scale * 0.28);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(bird.dir, 1);
    ctx.globalAlpha = alpha;

    if (bird.blur > 0) {
      ctx.filter = `blur(${bird.blur}px)`;
    }

    if (bird.glow > 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,238,170,${bird.glow * daylight})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyW * 1.25, bodyH * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = '#1D2A35';

    // Side-profile wing: anchored on the upper body and flapping vertically.
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.16, -bodyH * 0.14);
    ctx.quadraticCurveTo(wingTipX * 0.78, wingTipY * 0.72, wingTipX, wingTipY);
    ctx.quadraticCurveTo(-bodyW * 0.42, wingTipY * 0.2 + bodyH * 0.35, -bodyW * 0.05, bodyH * 0.22);
    ctx.quadraticCurveTo(bodyW * 0.12, bodyH * 0.08, -bodyW * 0.16, -bodyH * 0.14);
    ctx.fill();

    // Streamlined side body, head, beak, and tail all face the flight direction.
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW * 0.52, bodyH * 0.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(bodyW * 0.55, -bodyH * 0.13, bodyH * 0.42, bodyH * 0.36, 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#263746';
    ctx.beginPath();
    ctx.moveTo(bodyW * 0.9, -bodyH * 0.16);
    ctx.lineTo(bodyW * 1.2, -bodyH * 0.03);
    ctx.lineTo(bodyW * 0.9, bodyH * 0.11);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1D2A35';
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.52, -bodyH * 0.05);
    ctx.lineTo(-bodyW * 1.0, -tailSpread);
    ctx.lineTo(-bodyW * 0.86, bodyH * 0.02);
    ctx.lineTo(-bodyW * 1.02, tailSpread);
    ctx.lineTo(-bodyW * 0.48, bodyH * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function updateAndDrawBirds(dt, daylight, freezeWorld = false) {
    const worldDt = freezeWorld ? 0 : dt;

    if (daylight > 0.38 && !freezeWorld) {
      birdSpawnTimer += dt;
      if (birdSpawnTimer >= nextBirdSpawn && birds.length < MAX_BIRDS) {
        spawnBirdFlock(Math.random() < 0.07);
        scheduleNextBirdSpawn();
      }
    } else if (daylight <= 0.08) {
      scheduleNextBirdSpawn(true);
    }

    for (let i = birds.length - 1; i >= 0; i--) {
      const bird = birds[i];
      bird.age += worldDt;
      bird.x += bird.dir * bird.speed * worldDt;
      bird.y += Math.sin(bird.age * 0.55 + bird.phase) * H * 0.002 * worldDt;

      const margin = W * 0.16;
      if ((bird.dir === 1 && bird.x > W + margin) || (bird.dir === -1 && bird.x < -margin)) {
        birds.splice(i, 1);
        continue;
      }

      drawBird(bird, daylight);
    }
  }

  function drawStars(nightVis, dt) {
    if (nightVis <= 0.01) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    stars.forEach(star => {
      star.twinkle += dt * star.speed;
      const pulse = 0.62 + Math.sin(star.twinkle) * 0.26 + Math.sin(star.twinkle * 0.43) * 0.12;
      const alpha = clamp01(nightVis * star.glow * pulse);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function spawnShootingStar() {
    const startX = W * (0.22 + Math.random() * 0.72);
    const startY = H * (0.06 + Math.random() * 0.28);
    shootingStars.push({
      x: startX,
      y: startY,
      vx: -W * (0.55 + Math.random() * 0.25),
      vy: H * (0.34 + Math.random() * 0.18),
      life: 0.72 + Math.random() * 0.38,
      age: 0,
      length: Math.min(W, H) * (0.11 + Math.random() * 0.06)
    });
  }

  function drawShootingStars(nightVis, dt) {
    if (nightVis > 0.62 && dt > 0) {
      shootingStarTimer -= dt;
      if (shootingStarTimer <= 0) {
        spawnShootingStar();
        shootingStarTimer = 3.5 + Math.random() * 6;
      }
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.age += dt;
      if (star.age >= star.life || nightVis <= 0.04) {
        shootingStars.splice(i, 1);
        continue;
      }

      star.x += star.vx * dt;
      star.y += star.vy * dt;
      const lifeAlpha = Math.sin((star.age / star.life) * Math.PI);
      const alpha = nightVis * lifeAlpha;
      const angle = Math.atan2(star.vy, star.vx);
      const tailX = star.x - Math.cos(angle) * star.length;
      const tailY = star.y - Math.sin(angle) * star.length;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const trail = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      trail.addColorStop(0, `rgba(157,196,255,0)`);
      trail.addColorStop(0.55, `rgba(181,216,255,${0.26 * alpha})`);
      trail.addColorStop(1, `rgba(255,255,255,${0.95 * alpha})`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = Math.max(1.2, Math.min(W, H) * 0.004);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, Math.max(1.5, Math.min(W, H) * 0.006), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function groundY() { return H * 0.78; }

  function roadTopY() {
    return groundY() + (H - groundY()) * 0.12;
  }

  function trafficLaneY(lane) {
    const roadTop = roadTopY();
    const roadH = H - roadTop;
    return roadTop + roadH * (lane === 0 ? 0.37 : 0.78);
  }

  function drawRoadSurface(nightVis) {
    const gy = groundY();
    const roadTop = roadTopY();
    const wet = Weather.effect('wet');
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, H);
    if (currentWorld === 'barangay') {
      roadGrad.addColorStop(0, mixHex(mixHex('#575B5F', '#3B444B', wet), '#27292F', nightVis));
      roadGrad.addColorStop(0.52, mixHex(mixHex('#44474B', '#2A3137', wet), '#1E2026', nightVis));
      roadGrad.addColorStop(1, mixHex(mixHex('#35383B', '#1B2025', wet), '#14151A', nightVis));
    } else if (currentWorld === 'school') {
      roadGrad.addColorStop(0, mixHex(mixHex('#66737B', '#45515A', wet), '#2A3038', nightVis));
      roadGrad.addColorStop(0.52, mixHex(mixHex('#56636B', '#353F47', wet), '#20262D', nightVis));
      roadGrad.addColorStop(1, mixHex(mixHex('#465159', '#273039', wet), '#161B22', nightVis));
    } else {
      roadGrad.addColorStop(0, mixHex(mixHex('#5D4037', '#394048', wet), '#2B242B', nightVis));
      roadGrad.addColorStop(0.52, mixHex(mixHex('#4A302B', '#252A31', wet), '#201C25', nightVis));
      roadGrad.addColorStop(1, mixHex(mixHex('#3E2723', '#171B22', wet), '#15131A', nightVis));
    }
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadTop, W, H - roadTop);

    if (nightVis > 0.01) {
      const ambient = ctx.createLinearGradient(0, roadTop, 0, H);
      ambient.addColorStop(0, `rgba(98,126,176,${0.12 * nightVis})`);
      ambient.addColorStop(0.48, `rgba(53,72,111,${0.08 * nightVis})`);
      ambient.addColorStop(1, `rgba(7,10,18,${0.2 * nightVis})`);
      ctx.fillStyle = ambient;
      ctx.fillRect(0, roadTop, W, H - roadTop);
    }

    if (wet > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const wetSheen = ctx.createLinearGradient(0, roadTop, W, H);
      wetSheen.addColorStop(0, `rgba(154,205,255,${0.1 * wet})`);
      wetSheen.addColorStop(0.42, `rgba(255,255,255,${0.06 * wet})`);
      wetSheen.addColorStop(1, `rgba(78,119,165,${0.08 * wet})`);
      ctx.fillStyle = wetSheen;
      ctx.fillRect(0, roadTop, W, H - roadTop);

      ctx.globalAlpha = wet * 0.42;
      ctx.strokeStyle = 'rgba(210,235,255,0.55)';
      ctx.lineWidth = Math.max(1, H * 0.002);
      const roadH = H - roadTop;
      for (let i = 0; i < 10; i++) {
        const y = roadTop + roadH * (0.14 + i * 0.083);
        const x = ((bgX * (0.8 + i * 0.04)) + i * W * 0.173) % W;
        ctx.beginPath();
        ctx.moveTo(x - W * 0.09, y);
        ctx.lineTo(x + W * 0.1, y + H * 0.005);
        ctx.stroke();
      }
      ctx.restore();
    }

    const edgeGrad = ctx.createLinearGradient(0, gy, 0, roadTop + H * 0.01);
    if (currentWorld === 'barangay') {
      edgeGrad.addColorStop(0, `rgba(188,174,151,${lerp(0.58, 0.28, nightVis)})`);
      edgeGrad.addColorStop(0.58, `rgba(111,97,84,${lerp(0.56, 0.24, nightVis)})`);
    } else if (currentWorld === 'school') {
      edgeGrad.addColorStop(0, `rgba(236,244,245,${lerp(0.55, 0.26, nightVis)})`);
      edgeGrad.addColorStop(0.58, `rgba(126,143,151,${lerp(0.52, 0.22, nightVis)})`);
    } else {
      edgeGrad.addColorStop(0, `rgba(102,187,106,${lerp(0.45, 0.18, nightVis)})`);
      edgeGrad.addColorStop(0.58, `rgba(93,64,55,${lerp(0.52, 0.24, nightVis)})`);
    }
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, gy, W, roadTop - gy + H * 0.012);

    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.08, 0.03, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, roadTop);
    ctx.lineTo(W, roadTop);
    ctx.stroke();
  }

  function drawRoadMarkings(nightVis) {
    const roadTop = roadTopY();
    const roadH = H - roadTop;
    const centerY = roadTop + roadH * 0.57;
    const edgeAlpha = lerp(0.34, 0.2, nightVis);
    const laneAlpha = lerp(0.52, 0.38, nightVis);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(245,246,232,${edgeAlpha})`;
    ctx.lineWidth = Math.max(1.4, H * 0.003);
    ctx.beginPath();
    ctx.moveTo(0, roadTop + roadH * 0.12);
    ctx.lineTo(W, roadTop + roadH * 0.12);
    ctx.moveTo(0, H - roadH * 0.08);
    ctx.lineTo(W, H - roadH * 0.08);
    ctx.stroke();

    ctx.setLineDash([Math.max(28, W * 0.035), Math.max(34, W * 0.045)]);
    ctx.lineDashOffset = -bgX;
    ctx.strokeStyle = `rgba(255,221,117,${laneAlpha})`;
    ctx.lineWidth = Math.max(2.2, H * 0.005);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (nightVis > 0.01) {
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(255,224,142,${0.18 * nightVis})`;
      ctx.lineWidth = Math.max(5, H * 0.01);
      ctx.setLineDash([Math.max(28, W * 0.035), Math.max(34, W * 0.045)]);
      ctx.lineDashOffset = -bgX;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(W, centerY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function resetTraffic() {
    trafficVehicles.length = 0;
    trafficSpawnTimers = [0, 0];
    trafficNextSpawns = [0.2, 0.35];
  }

  function seedTraffic() {
    resetTraffic();
    for (let lane = 0; lane < 2; lane++) {
      if (spawnTrafficVehicle(lane)) {
        const car = trafficVehicles[trafficVehicles.length - 1];
        car.x = lane === 0 ? W * (0.08 + Math.random() * 0.24) : W * (0.66 + Math.random() * 0.22);
      }
      scheduleTrafficSpawn(lane);
    }
  }

  function trafficDirection(lane) {
    return lane === 0 ? 1 : -1;
  }

  function scheduleTrafficSpawn(lane) {
    trafficNextSpawns[lane] = lane === 0
      ? 1.45 + Math.random() * 1.45 + (Math.random() < 0.16 ? Math.random() * 1.35 : 0)
      : 1.05 + Math.random() * 1.2 + (Math.random() < 0.12 ? Math.random() * 0.9 : 0);
  }

  function trafficBaseSpeed(lane) {
    return lane === 0
      ? W * (0.20 + Math.random() * 0.040)
      : W * (0.45 + Math.random() * 0.8);
  }

  function canSpawnTraffic(lane, dir, minGap) {
    return !trafficVehicles.some(v => {
      if (v.lane !== lane) return false;
      return dir > 0 ? v.x < minGap : v.x > W - minGap;
    });
  }

  function spawnTrafficVehicle(lane) {
    if (trafficVehicles.length >= MAX_TRAFFIC) return false;

    const dir = trafficDirection(lane);
    const roadH = H - roadTopY();
    const laneScale = lane === 0 ? 0.98 : 1.08;
    const scale = laneScale * (0.96 + Math.random() * 0.14);
    const w = Math.max(104, Math.min(W * 0.23, roadH * 1.04 * scale));
    const h = Math.max(42, Math.min(roadH * 0.46, w * 0.42));
    const margin = Math.max(W * 0.12, w * 1.25);
    const spawnX = dir > 0 ? -margin : W + margin;
    const minGap = Math.max(W * 0.23, w * 2.25);

    if (!canSpawnTraffic(lane, dir, minGap)) return false;

    trafficVehicles.push({
      type: 'car',
      lane,
      dir,
      x: spawnX,
      y: trafficLaneY(lane),
      w,
      h,
      speed: trafficBaseSpeed(lane),
      color: ['#EF5350', '#42A5F5', '#FFCA28', '#66BB6A', '#AB47BC', '#FF7043', '#26A69A', '#5C6BC0'][Math.floor(Math.random() * 8)],
      accent: ['#FFF8E1', '#E3F2FD', '#263238', '#FCE4EC'][Math.floor(Math.random() * 4)],
      age: Math.random() * 2,
      wobble: Math.random() * Math.PI * 2
    });
    return true;
  }

  function updateTraffic(dt) {
    if (dt <= 0) return;
    for (let lane = 0; lane < 2; lane++) {
      trafficSpawnTimers[lane] += dt;
      if (trafficSpawnTimers[lane] >= trafficNextSpawns[lane]) {
        if (spawnTrafficVehicle(lane)) {
          trafficSpawnTimers[lane] = 0;
          scheduleTrafficSpawn(lane);
        } else {
          trafficSpawnTimers[lane] = trafficNextSpawns[lane] - 0.35;
        }
      }
    }

    for (let i = trafficVehicles.length - 1; i >= 0; i--) {
      const v = trafficVehicles[i];
      v.dir = trafficDirection(v.lane);
      v.age += dt;
      const pulse = Math.sin(v.age * 1.7 + v.wobble) * 0.035;
      v.x += v.dir * v.speed * (1 + pulse) * dt;
      v.y = trafficLaneY(v.lane);
      if ((v.dir > 0 && v.x > W + v.w * 1.8) || (v.dir < 0 && v.x < -v.w * 1.8)) {
        trafficVehicles.splice(i, 1);
      }
    }

    for (let lane = 0; lane < 2; lane++) {
      const dir = trafficDirection(lane);
      const laneVehicles = [];
      for (let i = 0; i < trafficVehicles.length; i++) {
        if (trafficVehicles[i].lane === lane) laneVehicles.push(trafficVehicles[i]);
      }
      laneVehicles.sort((a, b) => dir > 0 ? b.x - a.x : a.x - b.x);
      for (let i = 1; i < laneVehicles.length; i++) {
        const front = laneVehicles[i - 1];
        const back = laneVehicles[i];
        const minGap = (front.w + back.w) * 0.55 + W * 0.035;
        const actualGap = dir > 0 ? front.x - back.x : back.x - front.x;
        if (actualGap < minGap) {
          back.x = dir > 0 ? front.x - minGap : front.x + minGap;
        }
      }
    }
  }

  function drawVehicleWheels(v, wheelY, wheelR, positions, nightVis) {
    positions.forEach(px => {
      ctx.fillStyle = mixHex('#263238', '#080A0D', nightVis);
      ctx.beginPath();
      ctx.arc(px, wheelY, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = mixHex('#B0BEC5', '#3A4650', nightVis);
      ctx.lineWidth = Math.max(1, wheelR * 0.22);
      ctx.beginPath();
      ctx.arc(px, wheelY, wheelR * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(px, wheelY);
      ctx.rotate(v.age * v.speed * 0.08 * v.dir);
      ctx.beginPath();
      ctx.moveTo(-wheelR * 0.42, 0);
      ctx.lineTo(wheelR * 0.42, 0);
      ctx.moveTo(0, -wheelR * 0.42);
      ctx.lineTo(0, wheelR * 0.42);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawTrafficHeadlights(v, nightVis) {
    const lightVis = Weather.lightVisibility(nightVis);
    if (lightVis <= 0.03) return;

    const yBob = Math.sin(v.age * 5.5 + v.wobble) * H * 0.0015;
    const wheelR = Math.max(6, v.h * 0.2);
    const baseY = v.y + yBob;
    const bodyY = baseY - v.h;
    const frontX = v.x + v.dir * v.w * 0.49;
    const lampY = bodyY + v.h * 0.55;
    const beamLen = Math.min(W * 0.34, v.w * 2.6);
    const beamH = Math.max(v.h * 1.05, H * 0.07);
    const roadTop = roadTopY();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, roadTop - H * 0.035, W, H - roadTop + H * 0.035);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    const grad = ctx.createLinearGradient(frontX, lampY, frontX + v.dir * beamLen, lampY + H * 0.01);
    grad.addColorStop(0, `rgba(255,239,178,${0.34 * lightVis})`);
    grad.addColorStop(0.34, `rgba(255,213,121,${0.18 * lightVis})`);
    grad.addColorStop(1, 'rgba(255,213,121,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(frontX, lampY - v.h * 0.12);
    ctx.lineTo(frontX + v.dir * beamLen, lampY - beamH * 0.42);
    ctx.lineTo(frontX + v.dir * beamLen, lampY + beamH * 0.58);
    ctx.lineTo(frontX, lampY + v.h * 0.18);
    ctx.closePath();
    ctx.fill();

    const poolX = frontX + v.dir * beamLen * 0.42;
    const pool = ctx.createRadialGradient(poolX, baseY + wheelR * 0.42, 0, poolX, baseY + wheelR * 0.42, beamLen * 0.58);
    pool.addColorStop(0, `rgba(255,220,136,${0.2 * lightVis})`);
    pool.addColorStop(0.42, `rgba(255,178,73,${0.1 * lightVis})`);
    pool.addColorStop(1, 'rgba(255,178,73,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(poolX, baseY + wheelR * 0.42, beamLen * 0.5, beamH * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    const glassGlow = ctx.createRadialGradient(frontX, lampY, 0, frontX, lampY, v.h * 0.34);
    glassGlow.addColorStop(0, `rgba(255,246,197,${0.95 * lightVis})`);
    glassGlow.addColorStop(0.36, `rgba(255,206,94,${0.44 * lightVis})`);
    glassGlow.addColorStop(1, 'rgba(255,206,94,0)');
    ctx.fillStyle = glassGlow;
    ctx.beginPath();
    ctx.arc(frontX, lampY, v.h * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawVehicleLightDetails(v, nightVis) {
    const lightVis = Weather.lightVisibility(nightVis);
    if (lightVis <= 0.03) return;
    const yBob = Math.sin(v.age * 5.5 + v.wobble) * H * 0.0015;
    const baseY = v.y + yBob;
    const bodyY = baseY - v.h;
    const frontX = v.w * 0.43;
    const rearX = -v.w * 0.47;
    const lampY = bodyY + v.h * 0.55;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,242,178,${0.78 * lightVis})`;
    ctx.beginPath();
    ctx.roundRect(frontX - v.w * 0.012, lampY - v.h * 0.055, v.w * 0.04, v.h * 0.095, 3);
    ctx.fill();
    ctx.fillStyle = `rgba(255,76,72,${0.68 * lightVis})`;
    ctx.beginPath();
    ctx.roundRect(rearX - v.w * 0.012, lampY - v.h * 0.045, v.w * 0.035, v.h * 0.085, 3);
    ctx.fill();
    ctx.restore();
  }

  function drawTrafficVehicle(v, nightVis) {
    const yBob = Math.sin(v.age * 5.5 + v.wobble) * H * 0.0015;
    const wheelR = Math.max(6, v.h * 0.2);
    const baseY = v.y + yBob;
    const bodyY = baseY - v.h;

    ctx.save();
    ctx.translate(v.x, 0);
    ctx.scale(v.dir, 1);

    ctx.fillStyle = `rgba(0,0,0,${lerp(0.18, 0.28, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(0, baseY + wheelR * 0.45, v.w * 0.52, wheelR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(197,151,83,${lerp(0.12, 0.05, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(-v.w * 0.55, baseY + wheelR * 0.3, v.w * 0.16, wheelR * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyColor = mixHex(v.color, '#25212A', nightVis);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-v.w * 0.49, bodyY + v.h * 0.34, v.w * 0.98, v.h * 0.43, 8);
    ctx.roundRect(-v.w * 0.26, bodyY + v.h * 0.11, v.w * 0.54, v.h * 0.4, 9);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${lerp(0.14, 0.04, nightVis)})`;
    ctx.beginPath();
    ctx.roundRect(-v.w * 0.42, bodyY + v.h * 0.4, v.w * 0.28, v.h * 0.1, 5);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${lerp(0.35, 0.12, nightVis)})`;
    ctx.fillRect(-v.w * 0.16, bodyY + v.h * 0.18, v.w * 0.18, v.h * 0.18);
    ctx.fillRect(v.w * 0.06, bodyY + v.h * 0.2, v.w * 0.17, v.h * 0.16);

    ctx.fillStyle = v.accent;
    ctx.globalAlpha = lerp(0.9, 0.45, nightVis);
    ctx.fillRect(v.w * 0.42, bodyY + v.h * 0.5, v.w * 0.035, v.h * 0.08);
    ctx.fillStyle = '#EF5350';
    ctx.fillRect(-v.w * 0.47, bodyY + v.h * 0.52, v.w * 0.035, v.h * 0.08);
    ctx.globalAlpha = 1;

    drawVehicleWheels(v, baseY, wheelR, [-v.w * 0.32, v.w * 0.32], nightVis);
    drawVehicleLightDetails(v, nightVis);
    ctx.restore();
  }

  function drawTraffic(dt, nightVis, freezeWorld = false) {
    const roadTop = roadTopY();
    const roadH = H - roadTop;
    const worldDt = freezeWorld ? 0 : dt;
    updateTraffic(worldDt);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, roadTop - roadH * 0.12, W, roadH * 1.12);
    ctx.clip();

    for (let lane = 0; lane < 2; lane++) {
      for (let i = 0; i < trafficVehicles.length; i++) {
        const v = trafficVehicles[i];
        if (v.lane === lane) drawTrafficHeadlights(v, nightVis);
      }
    }
    for (let lane = 0; lane < 2; lane++) {
      for (let i = 0; i < trafficVehicles.length; i++) {
        const v = trafficVehicles[i];
        if (v.lane === lane) drawTrafficVehicle(v, nightVis);
      }
    }
    ctx.restore();
  }

  function drawLooped(items, offset, drawItem) {
    if (!parallaxWorld) return;
    const repeatW = parallaxWorld.repeatW;
    const loopOffset = ((offset % repeatW) + repeatW) % repeatW;
    for (let pass = -1; pass <= 1; pass++) {
      const shift = pass * repeatW - loopOffset;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const x = item.x + shift;
        if (x > -W * 0.35 && x < W * 1.35) drawItem(item, x);
      }
    }
  }

  function drawMountain(item, x, nightVis) {
    const y = item.y;
    const w = item.w;
    const h = item.h;
    const color = item.shade > 0.5 ? mixHex('#9DC9DE', '#263A54', nightVis) : mixHex('#B1D3E2', '#2B405C', nightVis);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.56, groundY());
    ctx.lineTo(x - w * 0.2, y + h * 0.18);
    ctx.lineTo(x + w * 0.02, y - h);
    ctx.lineTo(x + w * 0.24, y + h * 0.06);
    ctx.lineTo(x + w * 0.55, groundY());
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${lerp(0.36, 0.05, nightVis)})`;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.02, y - h);
    ctx.lineTo(x - w * 0.07, y - h * 0.56);
    ctx.lineTo(x + w * 0.04, y - h * 0.68);
    ctx.lineTo(x + w * 0.13, y - h * 0.46);
    ctx.closePath();
    ctx.fill();
  }

  function drawHill(item, x, nightVis) {
    ctx.fillStyle = item.shade > 0.5 ? mixHex('#78B986', '#203E32', nightVis) : mixHex('#91C88E', '#274833', nightVis);
    ctx.beginPath();
    ctx.ellipse(x, item.y + item.h * 0.8, item.w * 0.55, item.h, 0, Math.PI, 0, true);
    ctx.lineTo(x + item.w * 0.55, groundY());
    ctx.lineTo(x - item.w * 0.55, groundY());
    ctx.closePath();
    ctx.fill();
  }

  function getFarTerrainY(worldX) {
    if (!parallaxWorld?.farTerrain) return groundY() - H * 0.12;
    const terrain = parallaxWorld.farTerrain;
    const repeatW = parallaxWorld.repeatW;
    const nx = ((worldX % repeatW) + repeatW) % repeatW / repeatW;
    const wave =
      Math.sin(nx * Math.PI * 2 * 2.2 + terrain.phaseA) * terrain.ampA +
      Math.sin(nx * Math.PI * 2 * 5.1 + terrain.phaseB) * terrain.ampB;
    return lerp(terrain.horizonY, terrain.baseY + wave, 0.76);
  }

  function drawFarTerrain(offset, nightVis, overlayOnly = false) {
    if (!parallaxWorld?.farTerrain) return;
    const terrain = parallaxWorld.farTerrain;
    const step = Math.max(24, W / 34);
    const startX = -step;
    const endX = W + step;

    ctx.save();
    ctx.beginPath();
    for (let sx = startX; sx <= endX; sx += step) {
      const y = getFarTerrainY(sx + offset);
      if (sx === startX) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }

    if (overlayOnly) {
      ctx.lineTo(endX, terrain.baseY + H * 0.035);
      ctx.lineTo(startX, terrain.baseY + H * 0.035);
      ctx.closePath();
      const coverGrad = ctx.createLinearGradient(0, terrain.horizonY, 0, terrain.baseY + H * 0.045);
      coverGrad.addColorStop(0, `rgba(97,147,83,${lerp(0.34, 0.16, nightVis)})`);
      coverGrad.addColorStop(1, `rgba(55,107,61,${lerp(0.72, 0.3, nightVis)})`);
      ctx.fillStyle = coverGrad;
      ctx.fill();
    } else {
      ctx.lineTo(endX, groundY());
      ctx.lineTo(startX, groundY());
      ctx.closePath();
      const landGrad = ctx.createLinearGradient(0, terrain.horizonY, 0, groundY());
      landGrad.addColorStop(0, mixHex('#A8D28F', '#273C31', nightVis));
      landGrad.addColorStop(0.42, mixHex('#7DB66B', '#21372C', nightVis));
      landGrad.addColorStop(1, mixHex('#5A9A55', '#1D3328', nightVis));
      ctx.fillStyle = landGrad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.16, 0.04, nightVis)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let sx = startX; sx <= endX; sx += step) {
        const y = getFarTerrainY(sx + offset);
        if (sx === startX) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFarBaseScrub(x, y, s, variant, nightVis) {
    const w = H * (0.038 + (variant % 3) * 0.006) * s;
    const h = H * 0.014 * s;
    ctx.save();
    ctx.translate(x, y + h * 0.2);
    ctx.fillStyle = mixHex(['#5B9B50', '#6AAE59', '#4E8C47'][variant % 3], '#1A2E22', nightVis);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.08, 0.02, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(-w * 0.22, -h * 0.16, w * 0.34, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function getMidTerrainY(worldX) {
    if (!parallaxWorld?.midTerrain) return groundY() - H * 0.01;
    const terrain = parallaxWorld.midTerrain;
    const repeatW = parallaxWorld.repeatW;
    const nx = ((worldX % repeatW) + repeatW) % repeatW / repeatW;
    const wave =
      Math.sin(nx * Math.PI * 2 * 2.7 + terrain.phaseA) * terrain.ampA +
      Math.sin(nx * Math.PI * 2 * 6.4 + terrain.phaseB) * terrain.ampB;
    return lerp(terrain.horizonY, terrain.baseY + wave, 0.82);
  }

  function drawMidTerrain(offset, nightVis, overlayOnly = false) {
    if (!parallaxWorld?.midTerrain) return;
    const terrain = parallaxWorld.midTerrain;
    const step = Math.max(18, W / 42);
    const startX = -step;
    const endX = W + step;
    const bottomY = roadTopY() - H * 0.006;

    ctx.save();
    ctx.beginPath();
    for (let sx = startX; sx <= endX; sx += step) {
      const y = getMidTerrainY(sx + offset);
      if (sx === startX) ctx.moveTo(sx, y);
      else ctx.lineTo(sx, y);
    }

    if (overlayOnly) {
      ctx.lineTo(endX, bottomY);
      ctx.lineTo(startX, bottomY);
      ctx.closePath();
      const coverGrad = ctx.createLinearGradient(0, terrain.horizonY, 0, bottomY);
      coverGrad.addColorStop(0, `rgba(113,151,74,${lerp(0.12, 0.06, nightVis)})`);
      coverGrad.addColorStop(0.5, `rgba(76,133,58,${lerp(0.28, 0.12, nightVis)})`);
      coverGrad.addColorStop(1, `rgba(93,64,55,${lerp(0.24, 0.1, nightVis)})`);
      ctx.fillStyle = coverGrad;
      ctx.fill();
    } else {
      ctx.lineTo(endX, bottomY);
      ctx.lineTo(startX, bottomY);
      ctx.closePath();
      const terrainGrad = ctx.createLinearGradient(0, terrain.horizonY, 0, bottomY);
      terrainGrad.addColorStop(0, mixHex('#91C86E', '#263B2A', nightVis));
      terrainGrad.addColorStop(0.62, mixHex('#68A95C', '#213627', nightVis));
      terrainGrad.addColorStop(1, mixHex('#8B6A45', '#2A211C', nightVis));
      ctx.fillStyle = terrainGrad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.12, 0.035, nightVis)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let sx = startX; sx <= endX; sx += step) {
        const y = getMidTerrainY(sx + offset);
        if (sx === startX) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMidBaseBlend(x, y, s, variant, nightVis, wide = false) {
    const w = H * (wide ? 0.072 : 0.04) * s;
    const h = H * 0.014 * s;
    ctx.save();
    ctx.translate(x, y + h * 0.12);
    ctx.fillStyle = `rgba(0,0,0,${lerp(0.18, 0.28, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.12, w * 0.95, h * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex(['#5F9F4C', '#76AD51', '#598A45'][variant % 3], '#18291F', nightVis);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc((i - 1) * w * 0.28, -h * (0.05 + i * 0.05), h * (0.85 + (i % 2) * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStylizedTree(x, y, s, variant, nightVis, phase) {
    const sway = Math.sin((parallaxWorld?.time || 0) * (1.2 + Weather.effect('wind') * 1.1) + phase) * s * 1.8 * Weather.swayMultiplier();
    const trunkH = H * 0.055 * s;
    const trunkW = Math.max(4, H * 0.012 * s);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway * 0.002);
    ctx.fillStyle = mixHex('#7A4B2A', '#261B18', nightVis);
    ctx.beginPath();
    ctx.roundRect(-trunkW * 0.5, -trunkH, trunkW, trunkH, trunkW * 0.35);
    ctx.fill();

    const greens = ['#2E7D32', '#3FA34D', '#4CAF50', '#28703A', '#5AA858'];
    ctx.fillStyle = mixHex(greens[variant % greens.length], '#182D22', nightVis);
    if (variant % 2 === 0) {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -trunkH - H * (0.07 + i * 0.035) * s);
        ctx.lineTo(-H * (0.045 - i * 0.007) * s, -trunkH + H * (-0.01 + i * 0.018) * s);
        ctx.lineTo(H * (0.045 - i * 0.007) * s, -trunkH + H * (-0.01 + i * 0.018) * s);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      const r = H * 0.04 * s;
      [[0, -1.25, 1.05], [-0.55, -0.85, 0.86], [0.52, -0.82, 0.82], [0.02, -0.62, 0.92]].forEach(p => {
        ctx.beginPath();
        ctx.arc(p[0] * r, -trunkH + p[1] * r, r * p[2], 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawSmallHouse(x, y, s, variant, nightVis, barn = false) {
    const w = H * (barn ? 0.09 : 0.075) * s;
    const h = H * (barn ? 0.065 : 0.055) * s;
    const wallColors = barn ? ['#B94A3D', '#C85C43'] : ['#F6D6A7', '#E7BE8B', '#DDE7C7'];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.6, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex(wallColors[variant % wallColors.length], barn ? '#3F2427' : '#3B3130', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 4);
    ctx.fill();
    ctx.fillStyle = mixHex(barn ? '#6D2B29' : '#B94735', '#221A22', nightVis);
    ctx.beginPath();
    ctx.moveTo(-w * 0.58, -h);
    ctx.lineTo(0, -h * 1.58);
    ctx.lineTo(w * 0.58, -h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mixHex('#FFF3A8', '#3B4255', nightVis);
    ctx.globalAlpha = lerp(0.75, 0.45, nightVis);
    ctx.fillRect(-w * 0.29, -h * 0.68, w * 0.18, h * 0.2);
    ctx.fillRect(w * 0.15, -h * 0.68, w * 0.18, h * 0.2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = mixHex('#70452F', '#17131A', nightVis);
    ctx.fillRect(-w * 0.08, -h * 0.48, w * 0.18, h * 0.48);
    ctx.restore();
  }

  function drawWindmill(x, y, s, nightVis, phase) {
    const towerH = H * 0.12 * s;
    const bladeR = H * 0.035 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#D9D0B6', '#2F3440', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.beginPath();
    ctx.moveTo(-towerH * 0.12, 0);
    ctx.lineTo(0, -towerH);
    ctx.lineTo(towerH * 0.12, 0);
    ctx.stroke();
    ctx.translate(0, -towerH);
    ctx.rotate((parallaxWorld?.time || 0) * 0.8 + phase);
    ctx.strokeStyle = mixHex('#F2E7C9', '#384052', nightVis);
    ctx.lineWidth = Math.max(1.5, H * 0.003 * s);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bladeR, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bladeR * 0.48, -bladeR * 0.08);
      ctx.lineTo(bladeR, 0);
      ctx.lineTo(bladeR * 0.48, bladeR * 0.08);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSariSariStore(x, y, s, variant, nightVis) {
    const w = H * 0.11 * s;
    const h = H * 0.07 * s;
    const colors = ['#FFCA28', '#80DEEA', '#F48FB1'];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.62, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex(colors[variant % colors.length], '#332832', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 5);
    ctx.fill();
    ctx.fillStyle = mixHex('#E53935', '#261417', nightVis);
    ctx.fillRect(-w * 0.55, -h * 1.12, w * 1.1, h * 0.22);
    ctx.fillStyle = mixHex('#FFF8E1', '#303848', nightVis);
    ctx.fillRect(-w * 0.36, -h * 0.72, w * 0.28, h * 0.28);
    ctx.fillRect(w * 0.1, -h * 0.72, w * 0.26, h * 0.28);
    ctx.fillStyle = mixHex('#4E342E', '#151116', nightVis);
    ctx.fillRect(-w * 0.04, -h * 0.5, w * 0.16, h * 0.5);
    ctx.fillStyle = mixHex('#263238', '#11151C', nightVis);
    ctx.font = `900 ${Math.max(8, H * 0.018 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STORE', 0, -h * 0.96, w * 0.72);
    ctx.restore();
  }

  function drawBarangayHall(x, y, s, variant, nightVis) {
    const w = H * 0.14 * s;
    const h = H * 0.078 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.64, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex('#D7CCC8', '#343038', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 5);
    ctx.fill();
    ctx.fillStyle = mixHex('#6D4C41', '#1E1718', nightVis);
    ctx.fillRect(-w * 0.58, -h * 1.16, w * 1.16, h * 0.22);
    ctx.fillStyle = mixHex('#FFF59D', '#394258', nightVis);
    for (let i = -1; i <= 1; i++) ctx.fillRect(i * w * 0.22 - w * 0.06, -h * 0.66, w * 0.12, h * 0.22);
    ctx.fillStyle = mixHex('#37474F', '#12161C', nightVis);
    ctx.font = `900 ${Math.max(8, H * 0.014 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('HALL', 0, -h * 1.01, w * 0.82);
    ctx.restore();
  }

  function drawBasketballCourt(x, y, s, variant, nightVis) {
    const w = H * 0.15 * s;
    const poleH = H * 0.09 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#546E7A', '#20242B', nightVis);
    ctx.lineWidth = Math.max(3, H * 0.006 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, 0);
    ctx.lineTo(-w * 0.18, -poleH);
    ctx.lineTo(w * 0.18, -poleH);
    ctx.lineTo(w * 0.18, 0);
    ctx.stroke();
    ctx.strokeStyle = mixHex('#FF7043', '#352126', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.strokeRect(-w * 0.08, -poleH * 0.86, w * 0.16, poleH * 0.13);
    ctx.beginPath();
    ctx.arc(0, -poleH * 0.68, w * 0.07, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = mixHex('#A5D6A7', '#243426', nightVis);
    ctx.fillRect(-w * 0.55, -H * 0.006 * s, w * 1.1, H * 0.012 * s);
    ctx.restore();
  }

  function drawTricycle(x, y, s, variant, nightVis) {
    const w = H * 0.105 * s;
    const h = H * 0.052 * s;
    const wheelR = h * 0.18;
    const colors = ['#26A69A', '#EF5350', '#42A5F5', '#FFCA28'];
    ctx.save();
    ctx.translate(x, y - wheelR);
    ctx.fillStyle = mixHex(colors[variant % colors.length], '#252431', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.42, -h * 0.78, w * 0.48, h * 0.42, 5);
    ctx.roundRect(w * 0.05, -h * 0.66, w * 0.42, h * 0.32, 4);
    ctx.fill();
    ctx.strokeStyle = mixHex('#263238', '#101218', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.36);
    ctx.lineTo(w * 0.34, -h * 0.36);
    ctx.stroke();
    ctx.fillStyle = mixHex('#212121', '#08090C', nightVis);
    [-w * 0.24, w * 0.28, w * 0.48].forEach(px => {
      ctx.beginPath();
      ctx.arc(px, 0, wheelR, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawClassroomBuilding(x, y, s, variant, nightVis) {
    const w = H * 0.16 * s;
    const h = H * 0.082 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.62, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex(variant % 2 ? '#FFE082' : '#B3E5FC', '#2E3340', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 4);
    ctx.fill();
    ctx.fillStyle = mixHex('#607D8B', '#151A22', nightVis);
    ctx.fillRect(-w * 0.55, -h * 1.12, w * 1.1, h * 0.18);
    ctx.fillStyle = mixHex('#E3F2FD', '#3A4356', nightVis);
    for (let i = 0; i < 4; i++) ctx.fillRect(-w * 0.38 + i * w * 0.22, -h * 0.72, w * 0.14, h * 0.24);
    ctx.fillStyle = mixHex('#455A64', '#11151C', nightVis);
    ctx.fillRect(-w * 0.06, -h * 0.46, w * 0.13, h * 0.46);
    ctx.restore();
  }

  function drawSchoolGate(x, y, s, variant, nightVis) {
    const w = H * 0.15 * s;
    const h = H * 0.1 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#ECEFF1', '#2B3038', nightVis);
    ctx.fillRect(-w * 0.52, -h, w * 0.12, h);
    ctx.fillRect(w * 0.4, -h, w * 0.12, h);
    ctx.fillStyle = mixHex('#CFD8DC', '#20242B', nightVis);
    ctx.fillRect(-w * 0.6, -h, w * 1.2, h * 0.16);
    ctx.strokeStyle = mixHex('#455A64', '#151A20', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.14, 0);
      ctx.lineTo(i * w * 0.14, -h * 0.72);
      ctx.stroke();
    }
    ctx.fillStyle = mixHex('#263238', '#11151C', nightVis);
    ctx.font = `900 ${Math.max(8, H * 0.014 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCHOOL', 0, -h * 0.9, w * 0.72);
    ctx.restore();
  }

  function drawLocker(x, y, s, variant, nightVis) {
    const w = H * 0.07 * s;
    const h = H * 0.1 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex(['#42A5F5', '#EF5350', '#66BB6A'][variant % 3], '#252A36', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.32, 0.08, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = mixHex('#ECEFF1', '#3A4350', nightVis);
    ctx.fillRect(-w * 0.32, -h * 0.72, w * 0.18, h * 0.04);
    ctx.fillRect(w * 0.14, -h * 0.72, w * 0.18, h * 0.04);
    ctx.restore();
  }

  function drawBooks(x, y, s, variant, nightVis) {
    const w = H * 0.08 * s;
    const h = H * 0.012 * s;
    const colors = ['#EF5350', '#42A5F5', '#FFCA28'];
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = mixHex(colors[(variant + i) % colors.length], '#25242F', nightVis);
      ctx.fillRect(-w * 0.5 + i * w * 0.08, -h * (i + 1), w, h);
    }
    ctx.restore();
  }

  function drawChalkboard(x, y, s, variant, nightVis) {
    const w = H * 0.12 * s;
    const h = H * 0.06 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#2E7D32', '#132119', nightVis);
    ctx.fillRect(-w * 0.5, -h, w, h);
    ctx.strokeStyle = mixHex('#8D6E63', '#261C18', nightVis);
    ctx.lineWidth = Math.max(3, H * 0.005 * s);
    ctx.strokeRect(-w * 0.5, -h, w, h);
    ctx.fillStyle = `rgba(255,255,255,${lerp(0.82, 0.35, nightVis)})`;
    ctx.font = `900 ${Math.max(9, H * 0.018 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('x + 2 = ?', 0, -h * 0.45, w * 0.82);
    ctx.restore();
  }

  function drawLargeSchoolBuilding(x, y, s, variant, nightVis, distant = false) {
    const w = H * (distant ? 0.24 : 0.3) * s;
    const floors = distant ? 2 + (variant % 2) : 3;
    const h = H * (distant ? 0.13 : 0.18) * s;
    const lightVis = Weather.lightVisibility(nightVis);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(0,0,0,${distant ? 0.1 : 0.18})`;
    ctx.beginPath();
    ctx.ellipse(0, H * 0.004 * s, w * 0.66, H * 0.014 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mixHex('#D8DEE2', '#222933', nightVis);
    ctx.fillRect(-w * 0.55, -h * 0.02, w * 1.1, h * 0.055);
    ctx.fillStyle = mixHex(['#DCE8F2', '#F0E1C5', '#D8E6D0'][variant % 3], '#252B35', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h, 5);
    ctx.fill();
    ctx.fillStyle = mixHex('#607D8B', '#151A22', nightVis);
    ctx.fillRect(-w * 0.54, -h * 1.08, w * 1.08, h * 0.1);
    ctx.fillStyle = mixHex('#455A64', '#12161D', nightVis);
    ctx.fillRect(-w * 0.12, -h * 0.3, w * 0.24, h * 0.3);
    const cols = distant ? 6 : 8;
    const rows = floors;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = -w * 0.39 + c * (w * 0.78 / Math.max(1, cols - 1));
        const wy = -h * 0.82 + r * (h * 0.19);
        const lit = lightVis > 0.04 && ((c + r + variant) % 3 !== 0);
        ctx.fillStyle = lit ? `rgba(255,230,142,${0.34 + 0.34 * lightVis})` : mixHex('#B8D7E6', '#2D3948', nightVis);
        ctx.fillRect(wx, wy, w * 0.07, h * 0.1);
      }
    }
    ctx.fillStyle = mixHex('#263238', '#11151C', nightVis);
    ctx.font = `900 ${Math.max(9, H * 0.014 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    if (!distant) ctx.fillText(['SCIENCE', 'MATH', 'CLASSROOM'][variant % 3], 0, -h * 0.9, w * 0.5);
    ctx.restore();
  }

  function drawSchoolSkylineBlock(x, y, s, variant, nightVis) {
    const w = H * (0.34 + (variant % 3) * 0.045) * s;
    const h = H * (0.145 + (variant % 2) * 0.035) * s;
    const wingW = w * (0.32 + (variant % 2) * 0.08);
    const lightVis = Weather.lightVisibility(nightVis);
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = `rgba(0,0,0,${lerp(0.1, 0.18, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(0, H * 0.006 * s, w * 0.68, H * 0.015 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mixHex('#A9BAC1', '#252D37', nightVis);
    ctx.fillRect(-w * 0.58, -h * 0.03, w * 1.16, h * 0.07);

    const body = mixHex(['#D7E2E6', '#E7D8BF', '#D3E2D4'][variant % 3], '#27303A', nightVis);
    const roof = mixHex(['#607D8B', '#546E7A', '#7A6B5A'][variant % 3], '#151A22', nightVis);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(-w * 0.24, -h * 1.08, w * 0.48, h * 1.08, 4);
    ctx.roundRect(-w * 0.5, -h * 0.78, wingW, h * 0.78, 4);
    ctx.roundRect(w * 0.5 - wingW, -h * 0.72, wingW, h * 0.72, 4);
    ctx.fill();

    ctx.fillStyle = roof;
    ctx.fillRect(-w * 0.28, -h * 1.17, w * 0.56, h * 0.09);
    ctx.fillRect(-w * 0.54, -h * 0.86, wingW * 1.1, h * 0.09);
    ctx.fillRect(w * 0.5 - wingW * 1.05, -h * 0.8, wingW * 1.1, h * 0.09);

    const cols = 8;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        const px = -w * 0.43 + c * (w * 0.86 / (cols - 1));
        const py = -h * 0.58 + r * h * 0.17;
        const lit = lightVis > 0.04 && ((c + r + variant) % 4 !== 0);
        ctx.fillStyle = lit ? `rgba(255,231,154,${0.25 + 0.3 * lightVis})` : mixHex('#B9D5DF', '#303B49', nightVis);
        ctx.fillRect(px, py, w * 0.045, h * 0.075);
      }
    }

    ctx.fillStyle = mixHex('#455A64', '#131820', nightVis);
    ctx.fillRect(-w * 0.05, -h * 0.28, w * 0.1, h * 0.28);
    ctx.restore();
  }

  function drawSchoolHallway(x, y, s, variant, nightVis) {
    const w = H * 0.24 * s;
    const h = H * 0.095 * s;
    const lightVis = Weather.lightVisibility(nightVis);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#C5D4DD', '#222832', nightVis);
    ctx.fillRect(-w * 0.5, -h, w, h);
    ctx.fillStyle = mixHex('#ECEFF1', '#2B3038', nightVis);
    ctx.fillRect(-w * 0.5, -h, w, h * 0.12);
    ctx.fillStyle = mixHex('#78909C', '#171C24', nightVis);
    for (let i = 0; i < 5; i++) {
      const px = -w * 0.42 + i * w * 0.21;
      ctx.fillRect(px, -h, w * 0.045, h);
      if (lightVis > 0.05) {
        const glow = ctx.createRadialGradient(px + w * 0.02, -h * 0.72, 0, px + w * 0.02, -h * 0.72, h * 0.45);
        glow.addColorStop(0, `rgba(255,231,150,${0.28 * lightVis})`);
        glow.addColorStop(1, 'rgba(255,231,150,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px + w * 0.02, -h * 0.72, h * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = mixHex('#78909C', '#171C24', nightVis);
      }
    }
    ctx.restore();
  }

  function drawBulletinBoard(x, y, s, variant, nightVis) {
    const w = H * 0.1 * s;
    const h = H * 0.066 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#795548', '#211818', nightVis);
    ctx.fillRect(-w * 0.54, -h * 1.08, w * 1.08, h * 1.08);
    ctx.fillStyle = mixHex('#FFF8C4', '#3A352B', nightVis);
    ctx.fillRect(-w * 0.45, -h, w * 0.9, h * 0.78);
    ['#EF5350', '#42A5F5', '#66BB6A'].forEach((color, i) => {
      ctx.fillStyle = mixHex(color, '#262A32', nightVis);
      ctx.fillRect(-w * 0.34 + i * w * 0.24, -h * 0.82, w * 0.16, h * 0.32);
    });
    ctx.restore();
  }

  function drawCampusFence(x, y, s, variant, nightVis) {
    const w = H * 0.16 * s;
    const h = H * 0.065 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#607D8B', '#151A20', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.68);
    ctx.lineTo(w * 0.5, -h * 0.68);
    ctx.moveTo(-w * 0.5, -h * 0.36);
    ctx.lineTo(w * 0.5, -h * 0.36);
    for (let i = -4; i <= 4; i++) {
      ctx.moveTo(i * w * 0.12, 0);
      ctx.lineTo(i * w * 0.12, -h);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSchoolFarBackground(offset, nightVis) {
    if (!parallaxWorld?.schoolFarBackgroundProps) return;
    const top = groundY() - H * 0.245;
    const base = groundY() - H * 0.086;
    const bottom = groundY() - H * 0.026;
    ctx.save();
    const haze = ctx.createLinearGradient(0, top, 0, base);
    haze.addColorStop(0, `rgba(198,216,225,${lerp(0.11, 0.05, nightVis)})`);
    haze.addColorStop(1, `rgba(142,162,172,${lerp(0.18, 0.08, nightVis)})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, top, W, bottom - top);

    const ground = ctx.createLinearGradient(0, base - H * 0.006, 0, bottom);
    ground.addColorStop(0, mixHex('#E4ECEE', '#343C46', nightVis));
    ground.addColorStop(0.52, mixHex('#C7D3D7', '#29313A', nightVis));
    ground.addColorStop(1, mixHex('#A9B8BE', '#20262F', nightVis));
    ctx.fillStyle = ground;
    ctx.beginPath();
    ctx.moveTo(0, base - H * 0.006);
    for (let sx = 0; sx <= W; sx += Math.max(40, W / 16)) {
      ctx.lineTo(sx, base + Math.sin((sx + offset * 0.08) * 0.01) * H * 0.002);
    }
    ctx.lineTo(W, bottom);
    ctx.lineTo(0, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = mixHex('#CAD5D9', '#252D36', nightVis);
    ctx.fillRect(0, base - H * 0.014, W, H * 0.016);
    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.18, 0.06, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, base - H * 0.014);
    ctx.lineTo(W, base - H * 0.014);
    ctx.stroke();

    const slabW = Math.max(92, W * 0.13);
    const slabOffset = ((offset * 0.16) % slabW + slabW) % slabW;
    ctx.strokeStyle = `rgba(86,103,112,${lerp(0.16, 0.06, nightVis)})`;
    ctx.lineWidth = 1;
    for (let x = -slabOffset; x < W + slabW; x += slabW) {
      ctx.beginPath();
      ctx.moveTo(x, base - H * 0.004);
      ctx.lineTo(x + slabW * 0.16, bottom - H * 0.004);
      ctx.stroke();
    }

    const pathW = Math.max(150, W * 0.2);
    const pathOffset = ((offset * 0.12) % pathW + pathW) % pathW;
    ctx.fillStyle = `rgba(246,249,247,${lerp(0.15, 0.05, nightVis)})`;
    for (let x = -pathOffset; x < W + pathW; x += pathW) {
      ctx.beginPath();
      ctx.moveTo(x + pathW * 0.24, bottom);
      ctx.lineTo(x + pathW * 0.43, base - H * 0.002);
      ctx.lineTo(x + pathW * 0.56, base - H * 0.002);
      ctx.lineTo(x + pathW * 0.4, bottom);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = lerp(0.78, 0.54, nightVis);
    drawLooped(parallaxWorld.schoolFarBackgroundProps, offset, (item, x) => {
      if (item.type === 'campusGap') {
        drawCampusGroundPad(x, item.y, H * 0.18 * item.s, item.s, nightVis, 'wide');
        drawStylizedTree(x - H * 0.026 * item.s, item.y, item.s * 0.28, item.variant, nightVis, item.phase);
        drawCampusFence(x + H * 0.02 * item.s, item.y, item.s * 0.36, item.variant, nightVis);
        return;
      }
      drawCampusGroundPad(x, item.y, H * 0.24 * item.s, item.s, nightVis, 'wide');
      if (item.type === 'schoolSkyline') drawSchoolSkylineBlock(x, item.y, item.s * 0.72, item.variant, nightVis);
      if (item.type === 'campusBlock') drawLargeSchoolBuilding(x, item.y, item.s * 0.72, item.variant, nightVis, true);
      if (item.type === 'schoolBuilding') drawLargeSchoolBuilding(x, item.y, item.s * 0.66, item.variant, nightVis, true);
      if (item.type === 'schoolRooftop') drawLargeSchoolBuilding(x, item.y, item.s * 0.54, item.variant, nightVis, true);
      if (item.type === 'classroom') drawClassroomBuilding(x, item.y, item.s * 0.7, item.variant, nightVis);
    });
    ctx.restore();
  }

  function drawSchoolCampusBand(offset, nightVis, overlayOnly = false, includeDistant = true) {
    const distantTop = groundY() - H * 0.155;
    const distantBottom = groundY() - H * 0.055;
    const top = groundY() - H * 0.024;
    const bottom = roadTopY();
    ctx.save();

    if (includeDistant) {
      const farGrad = ctx.createLinearGradient(0, distantTop, 0, distantBottom);
      if (overlayOnly) {
        farGrad.addColorStop(0, `rgba(210,222,225,${lerp(0.08, 0.035, nightVis)})`);
        farGrad.addColorStop(1, `rgba(108,121,128,${lerp(0.14, 0.06, nightVis)})`);
      } else {
        farGrad.addColorStop(0, mixHex('#D8E3E7', '#303842', nightVis));
        farGrad.addColorStop(0.56, mixHex('#BFCBD0', '#29313A', nightVis));
        farGrad.addColorStop(1, mixHex('#9CABAE', '#20272F', nightVis));
      }
      ctx.fillStyle = farGrad;
      ctx.fillRect(0, distantTop, W, distantBottom - distantTop);
      if (!overlayOnly) {
        const pathW = Math.max(70, W * 0.12);
        const pathOffset = ((offset * 0.2) % pathW + pathW) % pathW;
        ctx.fillStyle = `rgba(245,248,246,${lerp(0.22, 0.08, nightVis)})`;
        for (let x = -pathOffset; x < W + pathW; x += pathW) {
          ctx.beginPath();
          ctx.moveTo(x + pathW * 0.2, distantBottom);
          ctx.lineTo(x + pathW * 0.44, distantTop);
          ctx.lineTo(x + pathW * 0.58, distantTop);
          ctx.lineTo(x + pathW * 0.36, distantBottom);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = `rgba(255,255,255,${lerp(0.2, 0.06, nightVis)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, distantTop);
        ctx.lineTo(W, distantTop + Math.sin(offset * 0.0015) * H * 0.002);
        ctx.moveTo(0, distantBottom);
        ctx.lineTo(W, distantBottom);
        ctx.stroke();
      }

      const connector = ctx.createLinearGradient(0, distantBottom, 0, top);
      if (overlayOnly) {
        connector.addColorStop(0, `rgba(166,184,190,${lerp(0.1, 0.04, nightVis)})`);
        connector.addColorStop(1, `rgba(108,121,128,${lerp(0.16, 0.06, nightVis)})`);
      } else {
        connector.addColorStop(0, mixHex('#B8C7CC', '#29313A', nightVis));
        connector.addColorStop(0.52, mixHex('#A7B8BE', '#252D35', nightVis));
        connector.addColorStop(1, mixHex('#93A4AB', '#20272F', nightVis));
      }
      ctx.fillStyle = connector;
      ctx.beginPath();
      ctx.moveTo(0, distantBottom - H * 0.002);
      for (let sx = 0; sx <= W; sx += Math.max(48, W / 12)) {
        ctx.lineTo(sx, distantBottom + Math.sin((sx + offset * 0.16) * 0.008) * H * 0.003);
      }
      ctx.lineTo(W, top + H * 0.004);
      ctx.lineTo(0, top + H * 0.004);
      ctx.closePath();
      ctx.fill();

      if (!overlayOnly) {
        ctx.strokeStyle = `rgba(255,255,255,${lerp(0.16, 0.05, nightVis)})`;
        ctx.beginPath();
        ctx.moveTo(0, distantBottom);
        ctx.lineTo(W, distantBottom);
        ctx.stroke();
      }
    }

    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    if (overlayOnly) {
      grad.addColorStop(0, `rgba(188,204,210,${lerp(0.14, 0.07, nightVis)})`);
      grad.addColorStop(1, `rgba(93,104,110,${lerp(0.2, 0.1, nightVis)})`);
    } else {
      grad.addColorStop(0, mixHex('#DDE7EA', '#313842', nightVis));
      grad.addColorStop(0.45, mixHex('#C4D0D4', '#29303A', nightVis));
      grad.addColorStop(1, mixHex('#9AA7AE', '#20262F', nightVis));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, W, bottom - top);
    if (!overlayOnly) {
      const slabH = H * 0.018;
      ctx.fillStyle = mixHex('#EEF3F4', '#3A4149', nightVis);
      ctx.fillRect(0, roadTopY() - slabH, W, slabH);
      ctx.fillStyle = mixHex('#7D8B93', '#222831', nightVis);
      ctx.fillRect(0, roadTopY() - H * 0.004, W, H * 0.008);
      const tileW = Math.max(42, W * 0.058);
      const scroll = ((offset * 0.36) % tileW + tileW) % tileW;
      ctx.strokeStyle = `rgba(76,88,96,${lerp(0.28, 0.18, nightVis)})`;
      for (let x = -scroll; x < W + tileW; x += tileW) {
        ctx.beginPath();
        ctx.moveTo(x, roadTopY() - slabH);
        ctx.lineTo(x + H * 0.008, roadTopY() - H * 0.004);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBarangayRoof(x, y, s, variant, nightVis) {
    const w = H * 0.11 * s;
    const h = H * 0.055 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex(['#C7A27A', '#B0BEC5', '#D7CCC8'][variant % 3], '#2E3037', nightVis);
    ctx.fillRect(-w * 0.45, -h, w * 0.9, h);
    ctx.fillStyle = mixHex(['#8D3C2F', '#607D8B', '#795548'][variant % 3], '#19171C', nightVis);
    ctx.beginPath();
    ctx.moveTo(-w * 0.56, -h);
    ctx.lineTo(-w * 0.1, -h * 1.45);
    ctx.lineTo(w * 0.56, -h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255,245,165,${lerp(0.24, 0.46, nightVis)})`;
    ctx.fillRect(-w * 0.28, -h * 0.65, w * 0.16, h * 0.18);
    ctx.fillRect(w * 0.12, -h * 0.65, w * 0.16, h * 0.18);
    ctx.restore();
  }

  function drawDistantBarangayBuilding(item, x, nightVis) {
    const w = item.w || H * (0.1 + (item.variant % 3) * 0.025) * (item.s || 1);
    const h = item.h || H * (0.075 + (item.variant % 4) * 0.018) * (item.s || 1);
    const y = item.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex(['#D7CCC8', '#C5CAE9', '#BCAAA4', '#CFD8DC'][item.variant % 4], '#252A32', nightVis);
    ctx.fillRect(-w * 0.5, -h, w, h);
    ctx.fillStyle = mixHex(['#8D6E63', '#607D8B', '#A1887F'][item.variant % 3], '#17181E', nightVis);
    ctx.beginPath();
    ctx.moveTo(-w * 0.56, -h);
    ctx.lineTo(0, -h * 1.25);
    ctx.lineTo(w * 0.56, -h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255,236,150,${lerp(0.18, 0.5, nightVis)})`;
    for (let i = -1; i <= 1; i++) ctx.fillRect(i * w * 0.22 - w * 0.04, -h * 0.62, w * 0.08, h * 0.16);
    ctx.restore();
  }

  function drawBarangayFarLayer(offset, nightVis) {
    const skyBase = groundY() - H * 0.19;
    const bottom = groundY() - H * 0.02;
    const deckY = groundY() - H * 0.082;
    ctx.save();
    const haze = ctx.createLinearGradient(0, skyBase, 0, bottom);
    haze.addColorStop(0, `rgba(119,139,151,${lerp(0.12, 0.2, nightVis)})`);
    haze.addColorStop(1, `rgba(90,72,60,${lerp(0.18, 0.1, nightVis)})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, skyBase, W, bottom - skyBase);
    ctx.fillStyle = mixHex('#8F8478', '#2A292D', nightVis);
    ctx.fillRect(0, deckY, W, bottom - deckY);
    ctx.fillStyle = mixHex('#B0A293', '#343036', nightVis);
    ctx.fillRect(0, deckY - H * 0.008, W, H * 0.012);
    ctx.strokeStyle = `rgba(57,48,44,${lerp(0.35, 0.2, nightVis)})`;
    ctx.lineWidth = 1;
    const blockW = Math.max(54, W * 0.08);
    const blockOffset = 0;
    for (let x = -blockOffset; x < W + blockW; x += blockW) {
      ctx.beginPath();
      ctx.moveTo(x, deckY - H * 0.008);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    drawLooped(parallaxWorld.barangayFarBuildings || [], offset * 0.82, (item, x) => drawDistantBarangayBuilding(item, x, nightVis));

    const wireY = groundY() - H * 0.205;
    ctx.strokeStyle = `rgba(37,43,49,${lerp(0.46, 0.34, nightVis)})`;
    ctx.lineWidth = Math.max(1.2, H * 0.0022);
    for (let line = 0; line < 4; line++) {
      ctx.beginPath();
      for (let sx = -20; sx <= W + 20; sx += W / 8) {
        const y = wireY + line * H * 0.012 + Math.sin(sx * 0.012 + line) * H * 0.006;
        if (sx === -20) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBarangayStreetBand(offset, nightVis, overlayOnly = false) {
    const top = groundY() - H * 0.02;
    const bottom = roadTopY();
    ctx.save();
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    if (overlayOnly) {
      grad.addColorStop(0, `rgba(110,90,70,${lerp(0.16, 0.08, nightVis)})`);
      grad.addColorStop(1, `rgba(70,58,52,${lerp(0.2, 0.1, nightVis)})`);
    } else {
      grad.addColorStop(0, mixHex('#9E8D72', '#302A2B', nightVis));
      grad.addColorStop(0.48, mixHex('#8D7D69', '#282529', nightVis));
      grad.addColorStop(1, mixHex('#6D5B50', '#211D20', nightVis));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, W, bottom - top);
    if (!overlayOnly) {
      const slabH = H * 0.018;
      ctx.fillStyle = mixHex('#B8AA94', '#373337', nightVis);
      ctx.fillRect(0, roadTopY() - slabH, W, slabH);
      ctx.fillStyle = mixHex('#7E6B5D', '#252225', nightVis);
      ctx.fillRect(0, roadTopY() - H * 0.004, W, H * 0.008);
      ctx.strokeStyle = `rgba(45,38,34,${lerp(0.32, 0.22, nightVis)})`;
      ctx.lineWidth = 1;
      const tileW = Math.max(44, W * 0.065);
      const scroll = ((offset * 0.34) % tileW + tileW) % tileW;
      for (let x = -scroll; x < W + tileW; x += tileW) {
        ctx.beginPath();
        ctx.moveTo(x, roadTopY() - slabH);
        ctx.lineTo(x + H * 0.012, roadTopY() - H * 0.004);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = `rgba(255,255,255,${lerp(0.14, 0.05, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(W, top + Math.sin(offset * 0.002) * H * 0.003);
    ctx.stroke();
    ctx.restore();
  }

  function drawBarangayGroundPad(x, y, w, s, nightVis, kind = 'slab') {
    const padW = Math.max(H * 0.07 * s, w);
    const padH = H * (kind === 'vehicle' ? 0.012 : 0.016) * s;
    ctx.save();
    ctx.fillStyle = kind === 'vehicle'
      ? `rgba(0,0,0,${lerp(0.18, 0.3, nightVis)})`
      : mixHex('#B8A58C', '#302C2E', nightVis);
    ctx.beginPath();
    ctx.ellipse(x, y + padH * 0.25, padW * 0.55, padH, 0, 0, Math.PI * 2);
    ctx.fill();
    if (kind !== 'vehicle') {
      ctx.fillStyle = mixHex('#7B6A5F', '#242124', nightVis);
      ctx.fillRect(x - padW * 0.5, y - padH * 0.2, padW, padH * 0.45);
    }
    ctx.restore();
  }

  function drawCampusGroundPad(x, y, w, s, nightVis, kind = 'slab') {
    const padW = Math.max(H * 0.08 * s, w);
    const padH = H * (kind === 'wide' ? 0.018 : 0.013) * s;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${lerp(0.09, 0.18, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(x, y + padH * 0.24, padW * 0.52, padH * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    const slab = ctx.createLinearGradient(0, y - padH * 0.45, 0, y + padH * 0.45);
    slab.addColorStop(0, mixHex('#F2F6F6', '#3A4149', nightVis));
    slab.addColorStop(1, mixHex('#B9C6CB', '#252B33', nightVis));
    ctx.fillStyle = slab;
    ctx.beginPath();
    ctx.roundRect(x - padW * 0.5, y - padH * 0.42, padW, padH * 0.82, Math.max(3, padH * 0.24));
    ctx.fill();
    ctx.strokeStyle = `rgba(76,88,96,${lerp(0.28, 0.16, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - padW * 0.42, y - padH * 0.02);
    ctx.lineTo(x + padW * 0.42, y - padH * 0.02);
    ctx.stroke();
    ctx.restore();
  }

  function drawCampusBaseBlend(x, y, s, variant, nightVis, wide = false) {
    const w = H * (wide ? 0.09 : 0.052) * s;
    const h = H * 0.013 * s;
    ctx.save();
    ctx.translate(x, y + h * 0.1);
    ctx.fillStyle = `rgba(0,0,0,${lerp(0.12, 0.24, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.15, w, h * 0.66, 0, 0, Math.PI * 2);
    ctx.fill();
    const curb = ctx.createLinearGradient(0, -h * 0.55, 0, h * 0.32);
    curb.addColorStop(0, mixHex('#EEF3F4', '#39414A', nightVis));
    curb.addColorStop(1, mixHex('#AAB8BE', '#222931', nightVis));
    ctx.fillStyle = curb;
    ctx.beginPath();
    ctx.roundRect(-w * 0.72, -h * 0.4, w * 1.44, h * 0.54, Math.max(2, h * 0.22));
    ctx.fill();
    ctx.fillStyle = mixHex(['#4E9D62', '#5AA56B', '#438B58'][variant % 3], '#18271E', nightVis);
    for (let i = 0; i < 3; i++) {
      const px = (i - 1) * w * 0.34;
      ctx.beginPath();
      ctx.arc(px, -h * (0.16 + (i % 2) * 0.06), h * (0.52 + (i % 2) * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBarangayRoadsideOverlay(offset, nightVis) {
    const curbTop = roadTopY() - H * 0.022;
    const curbBottom = roadTopY() + H * 0.002;
    ctx.save();
    const curb = ctx.createLinearGradient(0, curbTop, 0, curbBottom);
    curb.addColorStop(0, mixHex('#C7B89F', '#39353A', nightVis));
    curb.addColorStop(0.68, mixHex('#A08F7B', '#302D31', nightVis));
    curb.addColorStop(1, mixHex('#6B625B', '#232226', nightVis));
    ctx.fillStyle = curb;
    ctx.fillRect(0, curbTop, W, curbBottom - curbTop);

    ctx.strokeStyle = `rgba(245,238,220,${lerp(0.3, 0.12, nightVis)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, curbTop);
    ctx.lineTo(W, curbTop);
    ctx.stroke();

    ctx.strokeStyle = `rgba(33,29,27,${lerp(0.36, 0.22, nightVis)})`;
    const tileW = Math.max(42, W * 0.06);
    const scroll = ((offset * 0.72) % tileW + tileW) % tileW;
    for (let x = -scroll; x < W + tileW; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, curbTop);
      ctx.lineTo(x + H * 0.01, curbBottom);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBarangayHouse(x, y, s, variant, nightVis) {
    drawSmallHouse(x, y, s * 0.94, variant, nightVis);
    const w = H * 0.08 * s;
    const h = H * 0.055 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#4E342E', '#161216', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.56, -h * 0.18);
    ctx.lineTo(w * 0.56, -h * 0.18);
    ctx.stroke();
    ctx.fillStyle = mixHex('#EF5350', '#331A21', nightVis);
    ctx.fillRect(-w * 0.45, -h * 0.28, w * 0.18, h * 0.1);
    ctx.fillStyle = mixHex('#42A5F5', '#1B2735', nightVis);
    ctx.fillRect(-w * 0.2, -h * 0.28, w * 0.18, h * 0.1);
    ctx.fillStyle = mixHex('#FFF59D', '#393444', nightVis);
    ctx.fillRect(w * 0.05, -h * 0.28, w * 0.22, h * 0.1);
    ctx.restore();
  }

  function drawBarangayGate(x, y, s, variant, nightVis) {
    const w = H * 0.11 * s;
    const h = H * 0.07 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#455A64', '#13171D', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.strokeRect(-w * 0.5, -h, w, h);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * w * 0.13, 0);
      ctx.lineTo(i * w * 0.13, -h);
      ctx.stroke();
    }
    ctx.fillStyle = mixHex('#BCAAA4', '#2A2527', nightVis);
    ctx.fillRect(-w * 0.6, -h * 1.08, w * 0.12, h * 1.08);
    ctx.fillRect(w * 0.48, -h * 1.08, w * 0.12, h * 1.08);
    ctx.restore();
  }

  function drawLaundryLine(x, y, s, variant, nightVis) {
    const w = H * 0.16 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#37474F', '#11151B', nightVis);
    ctx.lineWidth = Math.max(1.5, H * 0.003 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(-w * 0.5, -H * 0.078 * s);
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, -H * 0.078 * s);
    ctx.stroke();
    ctx.fillStyle = mixHex('#5D4037', '#1A1414', nightVis);
    ctx.fillRect(-w * 0.54, -H * 0.004 * s, w * 0.08, H * 0.006 * s);
    ctx.fillRect(w * 0.46, -H * 0.004 * s, w * 0.08, H * 0.006 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -H * 0.075 * s);
    ctx.quadraticCurveTo(0, -H * 0.062 * s, w * 0.5, -H * 0.075 * s);
    ctx.stroke();
    const colors = ['#EF5350', '#42A5F5', '#FFF59D', '#AB47BC'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = mixHex(colors[(variant + i) % colors.length], '#2B2630', nightVis);
      ctx.fillRect(-w * 0.36 + i * w * 0.22, -H * 0.073 * s, w * 0.11, H * 0.028 * s);
    }
    ctx.restore();
  }

  function drawAlley(x, y, s, variant, nightVis) {
    const w = H * 0.08 * s;
    const h = H * 0.11 * s;
    ctx.save();
    ctx.translate(x, y);
    const grad = ctx.createLinearGradient(0, -h, 0, 0);
    grad.addColorStop(0, mixHex('#37474F', '#0D1118', nightVis));
    grad.addColorStop(1, mixHex('#212121', '#07080B', nightVis));
    ctx.fillStyle = grad;
    ctx.fillRect(-w * 0.5, -h, w, h);
    ctx.fillStyle = `rgba(255,224,130,${0.12 + Weather.lightVisibility(nightVis) * 0.16})`;
    ctx.fillRect(-w * 0.18, -h * 0.88, w * 0.36, h * 0.05);
    ctx.restore();
  }

  function drawMotorcycle(x, y, s, variant, nightVis) {
    const w = H * 0.085 * s;
    const h = H * 0.035 * s;
    const wheelR = h * 0.32;
    ctx.save();
    ctx.translate(x, y - wheelR);
    ctx.strokeStyle = mixHex('#263238', '#08090C', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    [-w * 0.28, w * 0.28].forEach(px => {
      ctx.beginPath();
      ctx.arc(px, 0, wheelR, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.strokeStyle = mixHex(['#EF5350', '#42A5F5', '#FFCA28'][variant % 3], '#252431', nightVis);
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h * 0.15);
    ctx.lineTo(-w * 0.04, -h * 0.58);
    ctx.lineTo(w * 0.2, -h * 0.18);
    ctx.lineTo(w * 0.42, -h * 0.58);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(-w * 0.06, -h * 0.74, w * 0.28, h * 0.16);
    ctx.restore();
  }

  function drawPlasticChair(x, y, s, variant, nightVis) {
    const w = H * 0.038 * s;
    const h = H * 0.046 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex(['#EF5350', '#42A5F5', '#66BB6A'][variant % 3], '#242733', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.004 * s);
    ctx.strokeRect(-w * 0.45, -h, w * 0.9, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, -h * 0.5);
    ctx.lineTo(-w * 0.45, 0);
    ctx.moveTo(w * 0.35, -h * 0.5);
    ctx.lineTo(w * 0.45, 0);
    ctx.moveTo(-w * 0.25, -h * 0.45);
    ctx.lineTo(w * 0.35, -h * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  function drawPottedPlant(x, y, s, variant, nightVis) {
    const potW = H * 0.034 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#A0522D', '#2B1814', nightVis);
    ctx.beginPath();
    ctx.roundRect(-potW * 0.45, -potW * 0.38, potW * 0.9, potW * 0.38, 3);
    ctx.fill();
    ctx.fillStyle = mixHex('#2E7D32', '#122719', nightVis);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * potW * 0.12, -potW * 0.55, potW * 0.14, potW * 0.34, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRoadsideBench(x, y, s, variant, nightVis) {
    const w = H * 0.095 * s;
    const h = H * 0.036 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#8D6E63', '#2A211F', nightVis);
    ctx.fillRect(-w * 0.5, -h * 0.7, w, h * 0.16);
    ctx.fillRect(-w * 0.44, -h * 0.42, w * 0.88, h * 0.14);
    ctx.strokeStyle = mixHex('#4E342E', '#161212', nightVis);
    ctx.lineWidth = Math.max(2, H * 0.003 * s);
    ctx.beginPath();
    ctx.moveTo(-w * 0.38, -h * 0.28);
    ctx.lineTo(-w * 0.42, 0);
    ctx.moveTo(w * 0.38, -h * 0.28);
    ctx.lineTo(w * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawShortFenceDetail(x, y, s, variant, nightVis) {
    drawFence(x, y, s * 0.72, variant, nightVis);
  }

  function drawTireStack(x, y, s, variant, nightVis) {
    const r = H * 0.015 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = mixHex('#263238', '#08090C', nightVis);
    ctx.lineWidth = Math.max(3, H * 0.005 * s);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -r * (0.6 + i * 0.82), r * 1.15, r * 0.58, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoadsideBarrierDetail(x, y, s, variant, nightVis) {
    const w = H * 0.08 * s;
    const h = H * 0.04 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#F9A825', '#3B2B1A', nightVis);
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h, w, h * 0.45, 4);
    ctx.fill();
    ctx.fillStyle = mixHex('#FFF8E1', '#4A4136', nightVis);
    ctx.fillRect(-w * 0.32, -h * 0.92, w * 0.14, h * 0.3);
    ctx.fillRect(w * 0.08, -h * 0.92, w * 0.14, h * 0.3);
    ctx.fillStyle = mixHex('#5D4037', '#191413', nightVis);
    ctx.fillRect(-w * 0.36, -h * 0.55, w * 0.08, h * 0.55);
    ctx.fillRect(w * 0.28, -h * 0.55, w * 0.08, h * 0.55);
    ctx.restore();
  }

  function drawNeatHollowBlocks(x, y, s, variant, nightVis) {
    const blockW = H * 0.032 * s;
    const blockH = H * 0.018 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#B0B0B0', '#34363A', nightVis);
    ctx.strokeStyle = mixHex('#757575', '#202226', nightVis);
    ctx.lineWidth = Math.max(1, H * 0.002 * s);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const bx = (col - 1.5) * blockW + row * blockW * 0.22;
        const by = -blockH * (row + 1);
        ctx.fillRect(bx, by, blockW * 0.92, blockH * 0.86);
        ctx.strokeRect(bx, by, blockW * 0.92, blockH * 0.86);
      }
    }
    ctx.restore();
  }

  function drawPuddle(x, y, s, variant, nightVis) {
    ctx.save();
    ctx.fillStyle = `rgba(116,171,205,${lerp(0.32, 0.18, nightVis)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, H * 0.032 * s, H * 0.008 * s, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRoadCrack(x, y, s, variant, nightVis) {
    ctx.strokeStyle = `rgba(31,27,24,${lerp(0.45, 0.32, nightVis)})`;
    ctx.lineWidth = Math.max(1, H * 0.002 * s);
    ctx.beginPath();
    ctx.moveTo(x - H * 0.024 * s, y);
    ctx.lineTo(x - H * 0.008 * s, y - H * 0.006 * s);
    ctx.lineTo(x + H * 0.01 * s, y + H * 0.002 * s);
    ctx.lineTo(x + H * 0.028 * s, y - H * 0.005 * s);
    ctx.stroke();
  }

  function drawPhilippineFlag(x, y, s, variant, nightVis, phase, anchor = 'house', side = 1) {
    const time = parallaxWorld?.time || 0;
    const rain = Weather.effect('rain');
    const storm = Weather.effect('storm');
    const wind = Weather.effect('wind');
    const lightVis = Weather.lightVisibility(nightVis);
    const poleH = H * 0.15 * s;
    const poleW = Math.max(3, H * 0.006 * s);
    const flagW = H * 0.105 * s;
    const aspect = flagImageReady && flagImage?.naturalWidth ? flagImage.naturalHeight / flagImage.naturalWidth : 0.5;
    const flagH = flagW * aspect;
    const attachY = -poleH + flagH * 0.1;
    const flagDir = 1;
    const anchorOffset = H * 0.07 * s * -flagDir;

    ctx.save();
    ctx.translate(x, y);

    if (anchor === 'house') {
      drawSmallHouse(anchorOffset, 0, s * 0.72, variant, nightVis);
    } else if (anchor === 'windmill') {
      drawWindmill(anchorOffset, 0, s * 0.66, nightVis, phase + 1.7);
    } else if (anchor === 'barangayHall') {
      drawBarangayHall(anchorOffset, 0, s * 0.66, variant, nightVis);
    } else if (anchor === 'sariStore') {
      drawSariSariStore(anchorOffset, 0, s * 0.62, variant, nightVis);
    } else if (anchor === 'openBarangay') {
      drawBarangayGroundPad(anchorOffset * 0.2, 0, H * 0.12 * s, s * 0.8, nightVis);
      drawFence(anchorOffset * 0.45, 0, s * 0.45, variant, nightVis);
    } else if (anchor === 'schoolBuilding' || anchor === 'campusBlock') {
      drawLargeSchoolBuilding(anchorOffset, 0, s * 0.56, variant, nightVis, true);
    } else if (anchor === 'schoolGate') {
      drawSchoolGate(anchorOffset, 0, s * 0.66, variant, nightVis);
    } else if (anchor === 'campusGround') {
      drawCampusGroundPad(anchorOffset * 0.25, 0, H * 0.12 * s, s * 0.78, nightVis);
    } else {
      drawStylizedTree(anchorOffset, 0, s * 0.72, variant, nightVis, phase + 2.3);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(0, H * 0.003 * s, H * 0.034 * s, H * 0.008 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const poleGrad = ctx.createLinearGradient(-poleW, -poleH, poleW, 0);
    poleGrad.addColorStop(0, mixHex('#D8C79B', '#3A3340', nightVis));
    poleGrad.addColorStop(0.5, mixHex('#8D6740', '#20191D', nightVis));
    poleGrad.addColorStop(1, mixHex('#5A3C25', '#120F11', nightVis));
    ctx.strokeStyle = poleGrad;
    ctx.lineWidth = poleW;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.004 * s);
    ctx.lineTo(0, -poleH);
    ctx.stroke();

    if (lightVis > 0.04) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(flagDir * flagW * 0.38, attachY + flagH * 0.38, 0, flagDir * flagW * 0.38, attachY + flagH * 0.38, flagW * 0.95);
      glow.addColorStop(0, `rgba(255,229,156,${0.12 * lightVis})`);
      glow.addColorStop(0.5, `rgba(255,196,92,${0.05 * lightVis})`);
      glow.addColorStop(1, 'rgba(255,196,92,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(flagDir * flagW * 0.36, attachY + flagH * 0.38, flagW * 0.76, flagH * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (flagImageReady && flagImage) {
      ctx.save();
      ctx.translate(flagDir * poleW * 0.35, attachY);

      const strips = 18;
      const stripW = flagW / strips;
      const weatherPower = 0.7 + wind * 1.45 + storm * 0.9;
      const amp = H * s * (0.0032 + wind * 0.0048 + rain * 0.0018 + storm * 0.0045);
      const heavySag = rain * H * 0.0032 * s + storm * H * 0.0015 * s;
      const frequency = 1.55 + wind * 0.85 + storm * 0.55;
      const speed = 2.2 + wind * 2.25 + storm * 2.1;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i <= strips; i++) {
        const p = i / strips;
        const edge = Math.sin(time * speed + phase + p * Math.PI * frequency) * amp * p;
        const flutter = Math.sin(time * (speed * 1.42) + phase * 0.7 + p * Math.PI * 3.3) * amp * 0.35 * p;
        ctx.lineTo(p * flagW, edge + flutter + heavySag * p);
      }
      for (let i = strips; i >= 0; i--) {
        const p = i / strips;
        const edge = Math.sin(time * speed + phase + p * Math.PI * frequency) * amp * p;
        const flutter = Math.sin(time * (speed * 1.42) + phase * 0.7 + p * Math.PI * 3.3) * amp * 0.35 * p;
        ctx.lineTo(p * flagW, flagH + edge + flutter + heavySag * p);
      }
      ctx.closePath();
      ctx.clip();

      for (let i = 0; i < strips; i++) {
        const p = i / (strips - 1);
        const sx = i * (flagImage.naturalWidth / strips);
        const sw = Math.min(Math.ceil(flagImage.naturalWidth / strips), flagImage.naturalWidth - sx);
        const dx = i * stripW;
        const wave = Math.sin(time * speed + phase + p * Math.PI * frequency) * amp * p;
        const flutter = Math.sin(time * (speed * 1.42) + phase * 0.7 + p * Math.PI * 3.3) * amp * 0.35 * p;
        const xPush = Math.sin(time * (speed * 0.72) + phase + p * Math.PI * 2.1) * weatherPower * p;
        const yPush = wave + flutter + heavySag * p;
        const stretch = 1 + Math.sin(time * speed + phase + p * Math.PI * 2) * 0.018 * p * weatherPower;
        ctx.drawImage(flagImage, sx, 0, sw, flagImage.naturalHeight, dx + xPush, yPush, stripW * 1.25, flagH * stretch);
      }

      const shadeAlpha = rain * 0.16 + storm * 0.18 + nightVis * 0.22;
      if (shadeAlpha > 0.01) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(25,34,48,${shadeAlpha})`;
        ctx.fillRect(0, -amp * 1.5, flagW + amp * 2, flagH + amp * 3 + heavySag);
      }
      if (nightVis > 0.02 || lightVis > 0.04) {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255,232,164,${0.08 * lightVis + 0.045 * nightVis})`;
        ctx.fillRect(0, -amp, flagW, flagH + amp * 2);
      }
      ctx.restore();
    }

    ctx.fillStyle = mixHex('#C8B17C', '#352B30', nightVis);
    ctx.beginPath();
    ctx.arc(0, -poleH, poleW * 1.15, 0, Math.PI * 2);
    ctx.fill();

    drawMidBaseBlend(0, 0, s * 0.6, variant, nightVis);
    ctx.restore();
  }

  function drawBush(x, y, s, variant, nightVis) {
    const r = H * 0.018 * s;
    ctx.fillStyle = mixHex(['#43A047', '#5FAF4F', '#2E8B45'][variant % 3], '#182F21', nightVis);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + (i - 1.5) * r * 0.72, y - r * (0.45 + (i % 2) * 0.24), r * (0.88 + (i % 2) * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFence(x, y, s, variant, nightVis) {
    const segW = H * 0.12 * s;
    const postH = H * (0.052 + (variant % 2) * 0.008) * s;
    const postW = Math.max(4, H * 0.01 * s);
    ctx.strokeStyle = mixHex('#9C6B3E', '#2C211C', nightVis);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = Math.max(3, H * 0.006 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - segW * 0.5, y - postH * 0.68);
    ctx.lineTo(x + segW * 0.5, y - postH * 0.8);
    ctx.moveTo(x - segW * 0.5, y - postH * 0.38);
    ctx.lineTo(x + segW * 0.5, y - postH * 0.5);
    ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.roundRect(x + i * segW * 0.42 - postW * 0.5, y - postH, postW, postH, postW * 0.3);
      ctx.fill();
    }
  }

  function drawRoadSign(x, y, s, text, variant, nightVis) {
    const maxW = Math.min(W * 0.22, 174) * s;
    const h = Math.max(30, H * 0.042 * s);
    const postH = H * 0.052 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = mixHex('#7B5132', '#1F1714', nightVis);
    ctx.fillRect(-3 * s, -postH, 6 * s, postH);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 2, maxW * 0.36, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = variant % 3 === 0 ? '#FFF8D7' : variant % 3 === 1 ? '#DFF4FF' : '#EAF7D5';
    ctx.strokeStyle = mixHex('#5D4037', '#171717', nightVis);
    ctx.lineWidth = Math.max(2, 2.5 * s);
    ctx.beginPath();
    ctx.roundRect(-maxW * 0.5, -postH - h, maxW, h, 7 * s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#263238';
    ctx.font = `900 ${Math.max(10, 13 * s)}px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const clean = text.length > 22 ? text.slice(0, 22) : text;
    ctx.fillText(clean, 0, -postH - h * 0.5, maxW * 0.9);
    ctx.restore();
  }

  function getVisibleElectricPosts(offset) {
    if (!parallaxWorld) return visiblePostScratch;
    const posts = parallaxWorld.midPostProps || [];
    const repeatW = parallaxWorld.repeatW;
    const loopOffset = ((offset % repeatW) + repeatW) % repeatW;
    visiblePostScratch.length = 0;
    for (let pass = -1; pass <= 1; pass++) {
      const shift = pass * repeatW - loopOffset;
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const x = post.x + shift;
        if (x > -W * 0.18 && x < W * 1.18) {
          post.sx = x;
          post.baseY = getMidTerrainY(x + offset);
          visiblePostScratch.push(post);
        }
      }
    }
    visiblePostScratch.sort((a, b) => a.sx - b.sx);
    return visiblePostScratch;
  }

  function drawElectricPostLightPools(offset, nightVis) {
    const lightVis = Weather.lightVisibility(nightVis);
    if (lightVis <= 0.03) return;
    const visible = getVisibleElectricPosts(offset) || [];
    const roadTop = roadTopY();
    const roadH = H - roadTop;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, roadTop - roadH * 0.08, W, roadH * 1.08);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';

    const step = visible.length > MAX_LIGHT_POOL_POSTS ? Math.ceil(visible.length / MAX_LIGHT_POOL_POSTS) : 1;
    for (let i = 0; i < visible.length; i += step) {
      const post = visible[i];
      const h = H * (0.17 + (post.variant % 2) * 0.018);
      const sway = Math.sin((parallaxWorld.time * 1.45) + post.phase) * 2.2;
      const topX = post.sx + sway;
      const topY = post.baseY - h + h * 0.15;
      const poolY = roadTop + roadH * 0.36;
      const poolW = Math.max(W * 0.16, H * 0.36);
      const poolH = Math.max(H * 0.055, roadH * 0.28);

      const beam = ctx.createLinearGradient(topX, topY, topX, poolY);
      beam.addColorStop(0, `rgba(255,206,92,${0.16 * lightVis})`);
      beam.addColorStop(0.52, `rgba(255,190,84,${0.06 * lightVis})`);
      beam.addColorStop(1, 'rgba(255,190,84,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(topX - H * 0.018, topY);
      ctx.lineTo(topX - poolW * 0.34, poolY + poolH * 0.2);
      ctx.lineTo(topX + poolW * 0.34, poolY + poolH * 0.2);
      ctx.lineTo(topX + H * 0.018, topY);
      ctx.closePath();
      ctx.fill();

      const pool = ctx.createRadialGradient(topX, poolY, 0, topX, poolY, poolW * 0.58);
      pool.addColorStop(0, `rgba(255,212,119,${0.28 * lightVis})`);
      pool.addColorStop(0.38, `rgba(255,157,54,${0.12 * lightVis})`);
      pool.addColorStop(1, 'rgba(255,157,54,0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(topX, poolY, poolW * 0.58, poolH, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawElectricPosts(offset, nightVis) {
    if (!parallaxWorld) return;
    const visible = getVisibleElectricPosts(offset) || [];

    ctx.save();
    visible.forEach((post, i) => {
      const h = H * (0.17 + (post.variant % 2) * 0.018);
      const sway = Math.sin((parallaxWorld.time * (1.45 + Weather.effect('wind') * 0.7)) + post.phase) * 2.2 * Weather.swayMultiplier();
      const topX = post.sx + sway;
      const topY = post.baseY - h;
      const next = visible[i + 1];
      if (next && next.sx - post.sx < W * 0.42) {
        const nextH = H * (0.17 + (next.variant % 2) * 0.018);
        const nextTopX = next.sx + Math.sin((parallaxWorld.time * (1.45 + Weather.effect('wind') * 0.7)) + next.phase) * 2.2 * Weather.swayMultiplier();
        const nextTopY = next.baseY - nextH;
        ctx.strokeStyle = `rgba(43,49,57,${lerp(0.58, 0.35, nightVis)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topX, topY + h * 0.16);
        ctx.quadraticCurveTo((topX + nextTopX) * 0.5, topY + h * 0.26 + Math.sin(parallaxWorld.time * 1.7) * 2, nextTopX, nextTopY + nextH * 0.16);
        ctx.stroke();
      }
      ctx.strokeStyle = mixHex('#6D4C41', '#1D1717', nightVis);
      ctx.lineWidth = Math.max(5, H * 0.009);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(post.sx, post.baseY + H * 0.006);
      ctx.lineTo(topX, topY);
      ctx.stroke();
      ctx.lineWidth = Math.max(3, H * 0.006);
      ctx.beginPath();
      ctx.moveTo(topX - H * 0.035, topY + h * 0.12);
      ctx.lineTo(topX + H * 0.035, topY + h * 0.12);
      ctx.stroke();
      ctx.fillStyle = mixHex('#F7F0CE', '#30384B', nightVis);
      ctx.beginPath();
      ctx.arc(topX - H * 0.038, topY + h * 0.15, H * 0.006, 0, Math.PI * 2);
      ctx.arc(topX + H * 0.038, topY + h * 0.15, H * 0.006, 0, Math.PI * 2);
      ctx.fill();
      const lightVis = Weather.lightVisibility(nightVis);
      if (lightVis > 0.03) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        [-H * 0.038, H * 0.038].forEach(dx => {
          const bulbX = topX + dx;
          const bulbY = topY + h * 0.15;
          const glow = ctx.createRadialGradient(bulbX, bulbY, H * 0.003, bulbX, bulbY, H * 0.075);
          glow.addColorStop(0, `rgba(255,238,173,${0.88 * lightVis})`);
          glow.addColorStop(0.26, `rgba(255,190,74,${0.34 * lightVis})`);
          glow.addColorStop(1, 'rgba(255,190,74,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(bulbX, bulbY, H * 0.075, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        ctx.fillStyle = `rgba(255,237,175,${0.9 * lightVis})`;
        ctx.beginPath();
        ctx.arc(topX - H * 0.038, topY + h * 0.15, H * 0.0065, 0, Math.PI * 2);
        ctx.arc(topX + H * 0.038, topY + h * 0.15, H * 0.0065, 0, Math.PI * 2);
        ctx.fill();
      }
      drawMidBaseBlend(post.sx, post.baseY, 0.78, post.variant, nightVis);
    });
    ctx.restore();
  }

  function drawFrontDetail(item, x, nightVis) {
    if (item.type === 'rock') {
      ctx.fillStyle = mixHex('#8D8A75', '#2F302C', nightVis);
      ctx.beginPath();
      ctx.ellipse(x, item.y, H * 0.012 * item.s, H * 0.007 * item.s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (item.type === 'tire') {
      ctx.strokeStyle = mixHex('#263238', '#08090C', nightVis);
      ctx.lineWidth = Math.max(3, H * 0.006 * item.s);
      ctx.beginPath();
      ctx.arc(x, item.y - H * 0.006 * item.s, H * 0.014 * item.s, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    if (item.type === 'bench') {
      drawBarangayGroundPad(x, item.y, H * 0.095 * item.s, item.s, nightVis);
      drawRoadsideBench(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'shortFence') {
      drawBarangayGroundPad(x, item.y, H * 0.09 * item.s, item.s, nightVis);
      drawShortFenceDetail(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'tireStack') {
      drawBarangayGroundPad(x, item.y, H * 0.055 * item.s, item.s, nightVis);
      drawTireStack(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'roadsideBarrier') {
      drawBarangayGroundPad(x, item.y, H * 0.08 * item.s, item.s, nightVis);
      drawRoadsideBarrierDetail(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'neatHollowBlocks') {
      drawBarangayGroundPad(x, item.y, H * 0.09 * item.s, item.s, nightVis);
      drawNeatHollowBlocks(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'tricycle') {
      drawBarangayGroundPad(x, item.y, H * 0.1 * item.s, item.s, nightVis, 'vehicle');
      drawTricycle(x, item.y, item.s * 0.82, item.variant, nightVis);
      return;
    }
    if (item.type === 'motorcycle') {
      drawBarangayGroundPad(x, item.y, H * 0.085 * item.s, item.s, nightVis, 'slab');
      drawMotorcycle(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'streetSign') {
      drawBarangayGroundPad(x, item.y, H * 0.06 * item.s, item.s, nightVis);
      const labels = currentWorld === 'school'
        ? ['SCHOOL ZONE', 'SLOW DOWN', 'CROSSING', 'CAMPUS']
        : ['KANTO', 'SLOW', 'HALL', 'COURT'];
      drawRoadSign(x, item.y, item.s * 0.7, labels[item.variant % labels.length], item.variant, nightVis);
      return;
    }
    if (item.type === 'campusBench') {
      drawBarangayGroundPad(x, item.y, H * 0.095 * item.s, item.s, nightVis);
      drawRoadsideBench(x, item.y, item.s * 0.92, item.variant, nightVis);
      return;
    }
    if (item.type === 'schoolPlant') {
      drawBarangayGroundPad(x, item.y, H * 0.045 * item.s, item.s, nightVis);
      drawPottedPlant(x, item.y, item.s * 0.9, item.variant, nightVis);
      return;
    }
    if (item.type === 'schoolLamp') {
      drawBarangayGroundPad(x, item.y, H * 0.04 * item.s, item.s, nightVis);
      const lightVis = Weather.lightVisibility(nightVis);
      const h = H * 0.1 * item.s;
      ctx.save();
      ctx.translate(x, item.y);
      ctx.strokeStyle = mixHex('#455A64', '#12161D', nightVis);
      ctx.lineWidth = Math.max(3, H * 0.005 * item.s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h);
      ctx.stroke();
      ctx.fillStyle = mixHex('#ECEFF1', '#30384B', nightVis);
      ctx.beginPath();
      ctx.arc(0, -h, H * 0.011 * item.s, 0, Math.PI * 2);
      ctx.fill();
      if (lightVis > 0.04) {
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(0, -h, 0, 0, -h, H * 0.09 * item.s);
        glow.addColorStop(0, `rgba(255,235,160,${0.52 * lightVis})`);
        glow.addColorStop(1, 'rgba(255,235,160,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -h, H * 0.09 * item.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (item.type === 'schoolSign') {
      drawBarangayGroundPad(x, item.y, H * 0.06 * item.s, item.s, nightVis);
      drawRoadSign(x, item.y, item.s * 0.72, ['SCHOOL ZONE', 'SLOW DOWN', 'STUDENT XING', 'CAMPUS AREA'][item.variant % 4], item.variant, nightVis);
      return;
    }
    if (item.type === 'campusRailing') {
      drawBarangayGroundPad(x, item.y, H * 0.08 * item.s, item.s, nightVis);
      drawCampusFence(x, item.y, item.s * 0.72, item.variant, nightVis);
      return;
    }
    if (item.type === 'flagPole') {
      drawPhilippineFlag(x, item.y, item.s * 0.58, item.variant, nightVis, item.phase, currentWorld === 'school' ? 'schoolGate' : 'barangayHall', 1);
      return;
    }
    if (item.type === 'pottedPlant') {
      drawBarangayGroundPad(x, item.y, H * 0.045 * item.s, item.s, nightVis);
      drawPottedPlant(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'plasticChair') {
      drawBarangayGroundPad(x, item.y, H * 0.052 * item.s, item.s, nightVis);
      drawPlasticChair(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'puddle') {
      if (currentWorld === 'barangay') item.y = Math.min(item.y, roadTopY() - H * 0.004);
      drawPuddle(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'roadCrack') {
      if (currentWorld === 'barangay') item.y = Math.min(item.y, roadTopY() - H * 0.004);
      drawRoadCrack(x, item.y, item.s, item.variant, nightVis);
      return;
    }
    if (item.type === 'book') {
      drawBooks(x, item.y, item.s * 0.78, item.variant, nightVis);
      return;
    }
    if (item.type === 'chalk') {
      ctx.fillStyle = `rgba(245,245,245,${lerp(0.78, 0.34, nightVis)})`;
      ctx.beginPath();
      ctx.roundRect(x - H * 0.018 * item.s, item.y - H * 0.004 * item.s, H * 0.036 * item.s, H * 0.006 * item.s, 3);
      ctx.fill();
      return;
    }
    const sway = Math.sin((parallaxWorld?.time || 0) * (2.1 + Weather.effect('wind') * 2.2) + item.phase) * H * 0.004 * item.s * Weather.swayMultiplier();
    ctx.strokeStyle = mixHex(item.type === 'plant' ? '#2E7D32' : '#4CAF50', '#142719', nightVis);
    ctx.lineWidth = Math.max(1.2, H * 0.003 * item.s);
    ctx.lineCap = 'round';
    const blades = item.type === 'plant' ? 4 : 3;
    for (let i = 0; i < blades; i++) {
      const spread = (i - (blades - 1) / 2) * H * 0.008 * item.s;
      ctx.beginPath();
      ctx.moveTo(x + spread * 0.2, item.y);
      ctx.quadraticCurveTo(x + spread + sway, item.y - H * 0.025 * item.s, x + spread * 1.2 + sway, item.y - H * 0.045 * item.s);
      ctx.stroke();
    }
  }

  function updateParallaxWorld(dt) {
    if (!parallaxWorld) initParallaxWorld();
    if (!parallaxWorld || dt <= 0) return;
    parallaxWorld.time += dt;
    const baseSpeed = W * INITIAL_PLAYER_SPEED * speedMultiplier * getWorldSpeedMultiplier() * Weather.worldSpeedMultiplier();
    parallaxWorld.offsets.veryFar += baseSpeed * 0.08 * dt;
    parallaxWorld.offsets.far += baseSpeed * 0.24 * dt;
    parallaxWorld.offsets.mid += baseSpeed * 0.58 * dt;
    parallaxWorld.offsets.front += baseSpeed * 1.08 * dt;
  }

  function drawParallaxWorld(dt, nightVis, freezeWorld = false) {
    if (!parallaxWorld) initParallaxWorld();
    updateParallaxWorld(freezeWorld ? 0 : dt);
    const o = parallaxWorld.offsets;

    const isBarangay = currentWorld === 'barangay';
    const isSchool = currentWorld === 'school';

      if (isBarangay) {
        drawBarangayFarLayer(o.veryFar * 0.72, nightVis);
    } else if (isSchool) {
      drawSchoolFarBackground(o.veryFar * 0.72, nightVis);
    } else {
      drawLooped(parallaxWorld.mountains, o.veryFar, (item, x) => drawMountain(item, x, nightVis));
      drawLooped(parallaxWorld.hills, o.veryFar * 1.35, (item, x) => drawHill(item, x, nightVis));
    }

    if (isBarangay) drawBarangayStreetBand(o.far, nightVis);
    else if (isSchool) drawSchoolCampusBand(o.far, nightVis, false, false);
    else drawFarTerrain(o.far, nightVis);
    const farPropOffset = isBarangay ? o.veryFar * 1.12 : o.far;
    drawLooped(parallaxWorld.farProps, farPropOffset, (item, x) => {
      if (isBarangay && ['house', 'barangayRoof', 'distantBuilding', 'sariStore', 'barangayHall'].includes(item.type)) {
        drawBarangayGroundPad(x, item.y, H * 0.13 * item.s, item.s, nightVis);
      }
      if (isSchool && ['classroom', 'campusBlock', 'schoolBuilding', 'schoolRooftop', 'schoolGate'].includes(item.type)) {
        drawCampusGroundPad(x, item.y, H * 0.18 * item.s, item.s, nightVis, item.type === 'campusBlock' || item.type === 'schoolBuilding' ? 'wide' : 'slab');
      }
      if (item.type === 'tree') drawStylizedTree(x, item.y, item.s * 0.72, item.variant, nightVis, item.phase);
      if (item.type === 'windmill') drawWindmill(x, item.y, item.s * 0.76, nightVis, item.phase);
      if (item.type === 'house') drawSmallHouse(x, item.y, item.s * 0.7, item.variant, nightVis);
      if (item.type === 'barn') drawSmallHouse(x, item.y, item.s * 0.72, item.variant, nightVis, true);
      if (item.type === 'barangayRoof') drawBarangayRoof(x, item.y, item.s, item.variant, nightVis);
      if (item.type === 'distantBuilding') drawDistantBarangayBuilding(item, x, nightVis);
      if (item.type === 'wirePost') drawBarangayRoof(x, item.y, item.s * 0.72, item.variant, nightVis);
      if (item.type === 'sariStore') drawSariSariStore(x, item.y, item.s * 0.68, item.variant, nightVis);
      if (item.type === 'barangayHall') drawBarangayHall(x, item.y, item.s * 0.7, item.variant, nightVis);
      if (item.type === 'classroom') drawClassroomBuilding(x, item.y, item.s * 0.7, item.variant, nightVis);
      if (item.type === 'campusBlock') drawLargeSchoolBuilding(x, item.y, item.s * 0.72, item.variant, nightVis, true);
      if (item.type === 'schoolBuilding') drawLargeSchoolBuilding(x, item.y, item.s * 0.68, item.variant, nightVis, true);
      if (item.type === 'schoolRooftop') drawLargeSchoolBuilding(x, item.y, item.s * 0.54, item.variant, nightVis, true);
      if (item.type === 'schoolGate') drawSchoolGate(x, item.y, item.s * 0.7, item.variant, nightVis);
      if (item.type === 'locker') drawLocker(x, item.y, item.s * 0.68, item.variant, nightVis);
      if (item.type === 'flag') drawPhilippineFlag(x, item.y, item.s * 0.82, item.variant, nightVis, item.phase, item.anchor, item.side);
      if (!isBarangay && !isSchool) drawFarBaseScrub(x, item.y, item.s, item.variant, nightVis);
    });
    if (isBarangay) drawBarangayStreetBand(o.far, nightVis, true);
    else if (isSchool) drawSchoolCampusBand(o.far, nightVis, true, false);
    else drawFarTerrain(o.far, nightVis, true);

    if (isBarangay) drawBarangayStreetBand(o.mid, nightVis);
    else if (isSchool) drawSchoolCampusBand(o.mid, nightVis, false, false);
    else drawMidTerrain(o.mid, nightVis);
    drawElectricPosts(o.mid, nightVis);
    drawLooped(parallaxWorld.midSceneryProps, o.mid, (item, x) => {
      const baseY = getMidTerrainY(x + o.mid) + (item.groundOffset || 0);
      if (isBarangay && ['fence', 'house', 'barangayHouse', 'gate', 'laundryLine', 'alley', 'sariStore', 'barangayHall', 'basketballCourt', 'tricycle'].includes(item.type)) {
        drawBarangayGroundPad(x, baseY, H * 0.12 * item.s, item.s, nightVis, item.type === 'tricycle' ? 'vehicle' : 'slab');
      }
      if (isSchool && ['classroom', 'schoolBuilding', 'schoolHallway', 'schoolGate', 'bulletinBoard', 'campusFence', 'locker', 'chalkboard'].includes(item.type)) {
        drawCampusGroundPad(x, baseY, H * 0.14 * item.s, item.s, nightVis, ['schoolBuilding', 'schoolHallway', 'classroom'].includes(item.type) ? 'wide' : 'slab');
      }
      if (item.type === 'fence') {
        drawFence(x, baseY, item.s, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s * 0.65, item.variant, nightVis);
      }
      if (item.type === 'bush') drawBush(x, baseY, item.s, item.variant, nightVis);
      if (item.type === 'house') {
        drawSmallHouse(x, baseY, item.s * 0.82, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s, item.variant, nightVis, true);
      }
      if (item.type === 'barangayHouse') {
        drawBarangayHouse(x, baseY, item.s, item.variant, nightVis);
      }
      if (item.type === 'sign') {
        drawRoadSign(x, baseY, item.s, item.text, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s * 0.55, item.variant, nightVis);
      }
      if (item.type === 'gate') drawBarangayGate(x, baseY, item.s, item.variant, nightVis);
      if (item.type === 'laundryLine') drawLaundryLine(x, baseY, item.s, item.variant, nightVis);
      if (item.type === 'alley') drawAlley(x, baseY, item.s, item.variant, nightVis);
      if (item.type === 'sariStore') {
        drawSariSariStore(x, baseY, item.s * 0.86, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s, item.variant, nightVis, true);
      }
      if (item.type === 'barangayHall') {
        drawBarangayHall(x, baseY, item.s * 0.86, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s, item.variant, nightVis, true);
      }
      if (item.type === 'basketballCourt') {
        drawBasketballCourt(x, baseY, item.s, item.variant, nightVis);
        drawMidBaseBlend(x, baseY, item.s * 0.75, item.variant, nightVis);
      }
      if (item.type === 'tricycle') {
        drawTricycle(x, baseY, item.s, item.variant, nightVis);
      }
      if (item.type === 'classroom') {
        drawClassroomBuilding(x, baseY, item.s * 0.86, item.variant, nightVis);
        if (isSchool) drawCampusBaseBlend(x, baseY, item.s, item.variant, nightVis, true);
        else drawMidBaseBlend(x, baseY, item.s, item.variant, nightVis, true);
      }
      if (item.type === 'schoolBuilding') {
        drawLargeSchoolBuilding(x, baseY, item.s * 0.72, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 1.12, item.variant, nightVis, true);
      }
      if (item.type === 'schoolHallway') {
        drawSchoolHallway(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.96, item.variant, nightVis, true);
      }
      if (item.type === 'schoolGate') {
        drawSchoolGate(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.78, item.variant, nightVis);
      }
      if (item.type === 'bulletinBoard') {
        drawBulletinBoard(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.66, item.variant, nightVis);
      }
      if (item.type === 'campusFence') {
        drawCampusFence(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.72, item.variant, nightVis);
      }
      if (item.type === 'locker') {
        drawLocker(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.55, item.variant, nightVis);
      }
      if (item.type === 'books') drawBooks(x, baseY, item.s, item.variant, nightVis);
      if (item.type === 'chalkboard') {
        drawChalkboard(x, baseY, item.s, item.variant, nightVis);
        drawCampusBaseBlend(x, baseY, item.s * 0.72, item.variant, nightVis);
      }
    });
    if (isBarangay) drawBarangayStreetBand(o.mid, nightVis, true);
    else if (isSchool) drawSchoolCampusBand(o.mid, nightVis, true, false);
    else drawMidTerrain(o.mid, nightVis, true);
    if (isBarangay) drawBarangayRoadsideOverlay(o.front, nightVis);
    if (isSchool) drawSchoolCampusBand(o.front, nightVis, true, false);
  }

  function drawFrontParallaxDetails(nightVis) {
    if (!parallaxWorld) return;
    const isBarangay = currentWorld === 'barangay';
    const isCampusRoadside = isBarangay || currentWorld === 'school';
    const clipTop = isCampusRoadside ? roadTopY() - H * 0.04 : groundY() - H * 0.04;
    const clipBottom = isCampusRoadside ? roadTopY() + H * 0.004 : roadTopY() - 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, clipTop, W, clipBottom - clipTop);
    ctx.clip();
    drawLooped(parallaxWorld.frontDetails, parallaxWorld.offsets.front, (item, x) => drawFrontDetail(item, x, nightVis));
    ctx.restore();
  }

  function drawNightAtmosphere(nightVis) {
    if (nightVis <= 0.02) return;

    ctx.save();
    const haze = ctx.createLinearGradient(0, groundY() * 0.18, 0, H);
    if (currentWorld === 'barangay') {
      haze.addColorStop(0, `rgba(66,62,91,${0.04 * nightVis})`);
      haze.addColorStop(0.48, `rgba(128,89,54,${0.05 * nightVis})`);
      haze.addColorStop(1, `rgba(28,18,20,${0.12 * nightVis})`);
    } else if (currentWorld === 'school') {
      haze.addColorStop(0, `rgba(52,76,112,${0.04 * nightVis})`);
      haze.addColorStop(0.48, `rgba(76,102,126,${0.05 * nightVis})`);
      haze.addColorStop(1, `rgba(15,22,33,${0.13 * nightVis})`);
    } else {
      haze.addColorStop(0, `rgba(55,76,124,${0.04 * nightVis})`);
      haze.addColorStop(0.48, `rgba(87,106,145,${0.055 * nightVis})`);
      haze.addColorStop(1, `rgba(20,24,38,${0.12 * nightVis})`);
    }
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'screen';
    const time = parallaxWorld?.time || 0;
    const count = Math.max(6, Math.min(10, Math.round(W / 140)));
    for (let i = 0; i < count; i++) {
      const seed = i * 97.13;
      const x = ((seed * 43 + time * (8 + (i % 4) * 2.3)) % (W + 90)) - 45;
      const y = groundY() - H * (0.07 + ((i * 37) % 100) / 100 * 0.28) + Math.sin(time * 1.4 + seed) * H * 0.01;
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + seed);
      const alpha = nightVis * (0.08 + pulse * 0.17);
      const r = Math.max(2.5, H * (0.006 + (i % 3) * 0.0015));
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
      if (currentWorld === 'barangay') {
        glow.addColorStop(0, `rgba(255,205,118,${alpha * 1.1})`);
        glow.addColorStop(0.35, `rgba(255,143,74,${alpha * 0.46})`);
        glow.addColorStop(1, 'rgba(255,143,74,0)');
      } else if (currentWorld === 'school') {
        glow.addColorStop(0, `rgba(255,235,170,${alpha * 0.9})`);
        glow.addColorStop(0.35, `rgba(150,205,255,${alpha * 0.38})`);
        glow.addColorStop(1, 'rgba(150,205,255,0)');
      } else {
        glow.addColorStop(0, `rgba(255,239,135,${alpha})`);
        glow.addColorStop(0.35, `rgba(143,255,194,${alpha * 0.42})`);
        glow.addColorStop(1, 'rgba(143,255,194,0)');
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWeatherColorGrade(nightVis) {
    const desat = Weather.effect('desaturate');
    const rain = Weather.effect('rain');
    const storm = Weather.effect('storm');
    const warm = Weather.effect('warm') + Weather.effect('sunset') * 0.18;
    const lightning = Weather.lightning || 0;

    ctx.save();
    if (desat > 0.01 || rain > 0.01 || storm > 0.01) {
      ctx.fillStyle = `rgba(26,34,46,${0.18 * desat + 0.08 * rain + 0.12 * storm})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (warm > 0.01 && nightVis < 0.8) {
      const glow = ctx.createLinearGradient(0, H * 0.08, W, H);
      glow.addColorStop(0, `rgba(255,158,92,${0.08 * warm})`);
      glow.addColorStop(0.55, `rgba(255,202,112,${0.05 * warm})`);
      glow.addColorStop(1, 'rgba(255,202,112,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }
    if (lightning > 0.01) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(196,222,255,${0.34 * lightning})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function drawWeatherDistantHaze() {
    const fog = Weather.effect('fog');
    const rain = Weather.effect('rain');
    if (fog <= 0.01 && rain <= 0.01) return;

    ctx.save();
    const top = groundY() * 0.12;
    const haze = ctx.createLinearGradient(0, top, 0, groundY());
    haze.addColorStop(0, `rgba(224,235,234,${0.05 * fog + 0.02 * rain})`);
    haze.addColorStop(0.48, `rgba(217,228,228,${0.22 * fog + 0.06 * rain})`);
    haze.addColorStop(1, `rgba(226,232,226,${0.36 * fog + 0.04 * rain})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, top, W, groundY() - top);
    ctx.restore();
  }

  function updateWeatherParticles(dt, freezeWorld) {
    const rain = Weather.effect('rain');
    const wind = Weather.effect('wind');
    const storm = Weather.effect('storm');
    const leafTarget = Math.round((wind > 0.45 ? 16 : 7) * wind);
    const rainTarget = Math.round(lerp(0, 118, rain));

    if (!freezeWorld) {
      while (Weather.rainDrops.length < rainTarget) {
        Weather.rainDrops.push({
          x: Math.random() * W,
          y: Math.random() * H,
          len: H * (0.035 + Math.random() * 0.035),
          speed: H * (1.45 + Math.random() * 1.1 + storm * 0.9),
          drift: W * (0.12 + wind * 0.22),
          alpha: 0.18 + Math.random() * 0.24
        });
      }
      while (Weather.leaves.length < leafTarget) {
        const leaf = Weather.leafPool.pop() || {};
        leaf.x = -W * 0.05 - Math.random() * W * 0.25;
        leaf.y = H * (0.18 + Math.random() * 0.48);
        leaf.vx = W * (0.18 + wind * 0.36 + Math.random() * 0.12);
        leaf.vy = H * (-0.02 + Math.random() * 0.08);
        leaf.size = Math.max(5, H * (0.008 + Math.random() * 0.007));
        leaf.rot = Math.random() * Math.PI * 2;
        leaf.spin = (Math.random() - 0.5) * 5;
        leaf.color = ['#C7772E', '#D9A03B', '#8FAE42', '#B95736'][Math.floor(Math.random() * 4)];
        Weather.leaves.push(leaf);
      }
    }

    for (let i = Weather.rainDrops.length - 1; i >= 0; i--) {
      const d = Weather.rainDrops[i];
      if (!freezeWorld) {
        d.x += d.drift * dt;
        d.y += d.speed * dt;
        if (d.y > roadTopY() && Math.random() < 0.018 * rain && Weather.splashes.length < 28) {
          const splash = Weather.splashPool.pop() || {};
          splash.x = d.x;
          splash.y = d.y;
          splash.t = 0;
          splash.life = 0.22 + Math.random() * 0.12;
          splash.r = H * (0.004 + Math.random() * 0.005);
          Weather.splashes.push(splash);
        }
        if (d.y > H + d.len || d.x > W + W * 0.16) {
          d.x = Math.random() * W - W * 0.14;
          d.y = -Math.random() * H * 0.45;
        }
      }
      if (i >= rainTarget) Weather.rainDrops.splice(i, 1);
    }

    for (let i = Weather.splashes.length - 1; i >= 0; i--) {
      const s = Weather.splashes[i];
      if (!freezeWorld) s.t += dt;
      if (s.t > s.life) {
        Weather.splashPool.push(s);
        Weather.splashes.splice(i, 1);
      }
    }

    for (let i = Weather.leaves.length - 1; i >= 0; i--) {
      const leaf = Weather.leaves[i];
      if (!freezeWorld) {
        leaf.x += leaf.vx * dt;
        leaf.y += (leaf.vy + Math.sin((parallaxWorld?.time || 0) + leaf.rot) * H * 0.04) * dt;
        leaf.rot += leaf.spin * dt;
      }
      if (leaf.x > W * 1.12 || leaf.y > groundY() || i >= leafTarget) {
        Weather.leafPool.push(leaf);
        Weather.leaves.splice(i, 1);
      }
    }
  }

  function drawWeatherForeground(dt, freezeWorld = false) {
    updateWeatherParticles(dt, freezeWorld);
    const rain = Weather.effect('rain');
    const fog = Weather.effect('fog');
    if (Weather.leaves.length) {
      ctx.save();
      Weather.leaves.forEach(leaf => {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rot);
        ctx.globalAlpha = 0.32 + Weather.effect('wind') * 0.28;
        ctx.fillStyle = leaf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 0.75, leaf.size * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    if (rain > 0.02) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(214,232,255,${0.18 + rain * 0.16})`;
      ctx.lineWidth = Math.max(1, H * 0.002);
      Weather.rainDrops.forEach(d => {
        ctx.globalAlpha = d.alpha * rain;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.drift * 0.026, d.y + d.len);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(225,242,255,${0.32 * rain})`;
      Weather.splashes.forEach(s => {
        const p = s.t / s.life;
        ctx.globalAlpha = (1 - p) * rain;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r * (1 + p * 2.6), s.r * (0.28 + p * 0.28), 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    if (fog > 0.02) {
      ctx.save();
      const bands = Math.max(3, Math.min(6, Math.round(W / 230)));
      for (let i = 0; i < bands; i++) {
        const y = groundY() * (0.35 + i * 0.105);
        const x = (((parallaxWorld?.time || 0) * (8 + i * 2) + i * W * 0.37) % (W + W * 0.4)) - W * 0.2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, W * 0.42);
        g.addColorStop(0, `rgba(232,238,236,${0.11 * fog})`);
        g.addColorStop(1, 'rgba(232,238,236,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, W * 0.42, H * 0.075, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function resize() {
    const viewport = window.visualViewport || window;
    const cssW = Math.max(320, Math.round(viewport.width || window.innerWidth));
    const cssH = Math.max(320, Math.round(viewport.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE_DPR_LIMIT);
    const nextCanvasW = Math.round(cssW * dpr);
    const nextCanvasH = Math.round(cssH * dpr);

    if (W === cssW && H === cssH && canvas.width === nextCanvasW && canvas.height === nextCanvasH) return false;

    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = nextCanvasW;
    canvas.height = nextCanvasH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    W = cssW; H = cssH;
    Player.init();
    initClouds();
    initParallaxWorld();
    seedTraffic();
    resetBirds();
    initStars();
    return true;
  }

  /* --- DRAW SCENE --- */
  function drawBackground(dt, freezeWorld = false) {
    updateDayNightCycle(dt);
    Weather.update(dt, freezeWorld);
    const nightVis = easeInOut(nightLevel);
    const worldDt = freezeWorld ? 0 : dt;
    const weatherLight = Weather.effect('light');
    const weatherSky = Weather.current || Weather.states.sunny;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY());
    skyGrad.addColorStop(0, mixHex(weatherSky.skyTop, '#07111F', nightVis));
    skyGrad.addColorStop(0.58, mixHex(weatherSky.skyMid, '#111A33', nightVis));
    skyGrad.addColorStop(1, mixHex(weatherSky.skyHorizon, '#18223D', nightVis));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY());

    if (weatherLight < 0.98) {
      const shade = ctx.createLinearGradient(0, 0, 0, groundY());
      shade.addColorStop(0, `rgba(11,18,32,${(1 - weatherLight) * 0.18})`);
      shade.addColorStop(1, `rgba(11,18,32,${(1 - weatherLight) * 0.08})`);
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, groundY());
    }

    if (nightVis > 0.01) {
      const horizonGlow = ctx.createLinearGradient(0, groundY() * 0.35, 0, groundY());
      horizonGlow.addColorStop(0, `rgba(255,255,255,0)`);
      horizonGlow.addColorStop(1, `rgba(77,105,157,${0.18 * nightVis})`);
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, W, groundY());
    }

    drawStars(nightVis, dt);
    drawShootingStars(nightVis, dt);

    // Sun and moon
    const sunR = Math.min(W, H) * 0.06;
    const sunY = lerp(H * 0.11, groundY() + sunR * 2.4, nightVis);
    const moonR = sunR * 0.78;
    const moonY = lerp(groundY() + moonR * 2.8, H * 0.13, nightVis);

    ctx.save();
    ctx.globalAlpha = clamp01(1 - nightVis * 1.15) * clamp01(weatherLight + 0.12) * clamp01(1 - Weather.effect('cloudDark') * 0.45);
    drawRealisticSun(W * 0.85, sunY, sunR);
    ctx.restore();
    drawRealisticMoon(W * 0.8, moonY, moonR, clamp01((nightVis - 0.08) / 0.92));

    updateAndDrawBirds(worldDt, clamp01(1 - nightVis * 1.35) * Weather.effect('bird'), freezeWorld);

    // Clouds
    clouds.forEach(c => {
      c.x -= c.speed * getWorldSpeedMultiplier() * Weather.cloudSpeedMultiplier() * worldDt;
      if (c.x < -c.width) c.x = W + c.width;
      const originalOpacity = c.opacity;
      c.opacity = originalOpacity * clamp01(1 - nightVis * 1.22) * clamp01(Weather.effect('cloudDensity'));
      drawRealisticCloud(c);
      if (Weather.effect('cloudDark') > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = Weather.effect('cloudDark') * c.opacity * 0.24;
        ctx.fillStyle = '#415060';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + c.height * 0.1, c.width * 0.56, c.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      c.opacity = originalOpacity;
    });

    drawParallaxWorld(worldDt, nightVis, freezeWorld);
    drawWeatherDistantHaze();

    // Ground
    const groundH = H - groundY();
    const groundGrad = ctx.createLinearGradient(0, groundY(), 0, H);
    if (currentWorld === 'barangay') {
      groundGrad.addColorStop(0, mixHex('#9E9E9E', '#34343A', nightVis));
      groundGrad.addColorStop(0.1, mixHex('#B0A08B', '#302C2D', nightVis));
      groundGrad.addColorStop(0.1, mixHex('#5A5048', '#242126', nightVis));
      groundGrad.addColorStop(1, mixHex('#332F2E', '#121114', nightVis));
    } else if (currentWorld === 'school') {
      groundGrad.addColorStop(0, mixHex('#DDE7EA', '#333C45', nightVis));
      groundGrad.addColorStop(0.12, mixHex('#B7C4CA', '#2B333B', nightVis));
      groundGrad.addColorStop(0.12, mixHex('#7E8A91', '#222831', nightVis));
      groundGrad.addColorStop(1, mixHex('#4E5A61', '#151A20', nightVis));
    } else {
      groundGrad.addColorStop(0, mixHex(mixHex('#66BB6A', '#5F855B', Weather.effect('desaturate')), '#25472F', nightVis));
      groundGrad.addColorStop(0.12, mixHex(mixHex('#43A047', '#476D49', Weather.effect('desaturate')), '#1E3929', nightVis));
      groundGrad.addColorStop(0.12, mixHex('#5D4037', '#241C23', nightVis));
      groundGrad.addColorStop(1, mixHex('#3E2723', '#120E13', nightVis));
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY(), W, groundH);

    // Ground line decoration
    ctx.strokeStyle = currentWorld === 'barangay' ? mixHex('#B0A08B', '#2E2B2C', nightVis) : currentWorld === 'school' ? mixHex('#ECEFF1', '#303842', nightVis) : mixHex('#388E3C', '#182B21', nightVis); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY()); ctx.lineTo(W, groundY()); ctx.stroke();

    if (currentWorld !== 'barangay' && currentWorld !== 'school') drawFrontParallaxDetails(nightVis);
    drawRoadSurface(nightVis);

    // Scrolling road markings
    bgX = (bgX + (W * 0.18 * speedMultiplier * getWorldSpeedMultiplier() * worldDt)) % 80;
    if (parallaxWorld) drawElectricPostLightPools(parallaxWorld.offsets.mid, nightVis);
    drawRoadMarkings(nightVis);
    if (currentWorld === 'barangay' || currentWorld === 'school') drawFrontParallaxDetails(nightVis);

    drawTraffic(worldDt, nightVis, freezeWorld);
    drawNightAtmosphere(nightVis);
    drawWeatherColorGrade(nightVis);
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      if (p.t > p.life) {
        const removed = particles[i];
        particles.splice(i, 1);
        if (particlePool.length < MAX_PARTICLES) particlePool.push(removed);
        continue;
      }
      const prog = p.t / p.life;
      ctx.save();
      ctx.globalAlpha = 1 - prog;
      const x = p.x + p.vx * p.t;
      const gravity = p.kind === 'streak' || p.kind === 'ring' ? 0 : 200;
      const y = p.y + p.vy * p.t + 0.5 * gravity * p.t * p.t;
      if (p.kind === 'shard') {
        ctx.translate(x, y);
        ctx.rotate((p.rotation || 0) + (p.spin || 0) * p.t);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);
      } else if (p.kind === 'streak') {
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - p.len * (1 - prog * 0.35), y + p.tilt);
        ctx.stroke();
      } else if (p.kind === 'ring') {
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size * (1 - prog));
        ctx.beginPath();
        ctx.ellipse(x, y, p.rx * prog, p.ry * prog, p.rot || 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(p.char, x, y);
      }
      ctx.restore();
    }
  }

  function getWorldSpeedMultiplier() {
    return comboDashActive ? comboDashBoost : 1;
  }

  function getObstacleSpawnInterval() {
    return obstacleInterval / getWorldSpeedMultiplier();
  }

  function drawDashTrail(player) {
    const cx = player.x + player.w * 0.5;
    const cy = player.y + player.h * 0.52;
    const boostPulse = comboDashActive ? clamp01(comboDashTimer / comboDashDuration) : 0;
    const trailLength = player.w * (3.15 + 0.45 * Math.sin((comboDashDuration - comboDashTimer) * 16));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createLinearGradient(cx - trailLength, cy, cx + player.w, cy);
    grad.addColorStop(0, 'rgba(255,214,0,0)');
    grad.addColorStop(0.3, `rgba(255,214,0,${0.28 + boostPulse * 0.12})`);
    grad.addColorStop(0.72, 'rgba(255,255,255,0.38)');
    grad.addColorStop(1, 'rgba(79,195,247,0.74)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - trailLength, cy - player.h * 0.24);
    ctx.lineTo(cx + player.w * 0.75, cy - player.h * 0.12);
    ctx.lineTo(cx + player.w * 0.75, cy + player.h * 0.12);
    ctx.lineTo(cx - trailLength, cy + player.h * 0.24);
    ctx.closePath();
    ctx.fill();

    const time = parallaxWorld?.time || 0;
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.48 - i * 0.07})`;
      ctx.lineWidth = Math.max(2, player.w * (0.05 - i * 0.008));
      ctx.beginPath();
      const lineY = cy + (i - 2) * player.h * 0.13 + Math.sin(time * 18 + i) * player.h * 0.025;
      ctx.moveTo(cx - trailLength * (0.88 - i * 0.09), lineY);
      ctx.lineTo(cx - player.w * 0.08, lineY - player.h * 0.04);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawComboDashOverlay(dt) {
    if (comboDashFxTimer <= 0 && !comboDashActive) return;
    if (comboDashFxTimer > 0) comboDashFxTimer = Math.max(0, comboDashFxTimer - dt);
    const t = clamp01(comboDashFxTimer / 0.5);
    const cx = Player.x + Player.w * 0.72;
    const cy = Player.y + Player.h * 0.48;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    if (t > 0) {
      const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * (0.18 + (1 - t) * 0.18));
      flash.addColorStop(0, `rgba(255,255,255,${0.36 * t})`);
      flash.addColorStop(0.28, `rgba(255,214,0,${0.26 * t})`);
      flash.addColorStop(1, 'rgba(79,195,247,0)');
      ctx.fillStyle = flash;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = `rgba(255,255,255,${0.52 * t})`;
      ctx.lineWidth = Math.max(2, H * 0.006 * t);
      ctx.beginPath();
      ctx.ellipse(cx, cy, Player.w * (1.05 + (1 - t) * 1.5), Player.h * (0.72 + (1 - t) * 0.9), -0.12, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (comboDashActive) {
      const alpha = clamp01(comboDashTimer / 0.36);
      const speedLineCount = Math.max(6, Math.min(14, Math.round(W / 90)));
      ctx.lineCap = 'round';
      for (let i = 0; i < speedLineCount; i++) {
        const seed = i * 83.37;
        const scroll = ((parallaxWorld?.time || 0) * (W * 0.75 + i * 18) + seed * 19) % (W + W * 0.35);
        const x = W - scroll + W * 0.2;
        const y = groundY() * (0.32 + ((i * 29) % 55) / 100);
        const len = W * (0.08 + (i % 4) * 0.018);
        ctx.strokeStyle = `rgba(255,255,255,${0.13 * alpha})`;
        ctx.lineWidth = Math.max(1, H * (0.002 + (i % 3) * 0.0008));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - len, y + H * 0.006);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function emitParticle(p) {
    if (particles.length >= MAX_PARTICLES) {
      const old = particles.shift();
      if (old && particlePool.length < MAX_PARTICLES) particlePool.push(old);
    }
    const particle = particlePool.pop() || p;
    if (particle !== p) {
      for (const key in particle) delete particle[key];
      Object.assign(particle, p);
    }
    particles.push(particle);
  }

  function spawnParticles(x, y, correct) {
    const chars = correct ? ['⭐','✨','🌟','💫','🎉'] : ['💔','😤','❌'];
    const count = correct ? 5 : 4;
    for (let i = 0; i < count; i++) {
      emitParticle({
        x, y, t: 0, life: 0.8,
        char: chars[Math.floor(Math.random() * chars.length)],
        vx: (Math.random() - 0.5) * 160,
        vy: -80 - Math.random() * 80,
        size: 18 + Math.random() * 14,
        color: correct ? '#FFD600' : '#EF5350'
      });
    }
  }

  function spawnObstacleBreak(obs) {
    Audio.hit();
    shakeTimer = Math.max(shakeTimer, comboDashActive ? 0.22 : 0.16);
    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h / 2;
    const colors = ['#EF5350', '#B71C1C', '#FFD600', '#FF8F00', '#FFFFFF'];

    for (let i = 0; i < 12; i++) {
      emitParticle({
        kind: 'shard',
        x: cx, y: cy, t: 0, life: 0.65 + Math.random() * 0.35,
        vx: 80 + Math.random() * 260,
        vy: -180 + Math.random() * 260,
        size: 6 + Math.random() * 12,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 18,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    for (let i = 0; i < 5; i++) {
      emitParticle({
        x: cx, y: cy, t: 0, life: 0.75,
        char: ['+', '-', 'x', '='][Math.floor(Math.random() * 4)],
        vx: 120 + Math.random() * 220,
        vy: -150 + Math.random() * 190,
        size: 18 + Math.random() * 10,
        color: '#FFD600'
      });
    }

    for (let i = 0; i < 3; i++) {
      emitParticle({
        kind: 'ring',
        x: cx, y: cy, t: 0, life: 0.34 + i * 0.05,
        vx: 0,
        vy: 0,
        rx: obs.w * (0.7 + i * 0.22),
        ry: obs.h * (0.44 + i * 0.12),
        size: Math.max(2, H * 0.005),
        rot: -0.16 + i * 0.13,
        color: i === 0 ? 'rgba(255,255,255,0.82)' : 'rgba(79,195,247,0.62)'
      });
    }
  }

  function spawnComboDashActivationEffects() {
    comboDashFxTimer = 0.5;
    dashStreakTimer = 0;
    shakeTimer = Math.max(shakeTimer, 0.18);
    const cx = Player.x + Player.w * 0.86;
    const cy = Player.y + Player.h * 0.46;

    for (let i = 0; i < 14; i++) {
      emitParticle({
        kind: 'streak',
        x: cx + Math.random() * Player.w * 0.55,
        y: cy + (Math.random() - 0.5) * Player.h * 1.05,
        t: 0,
        life: 0.28 + Math.random() * 0.18,
        vx: -W * (0.36 + Math.random() * 0.34),
        vy: (Math.random() - 0.5) * H * 0.05,
        len: W * (0.055 + Math.random() * 0.065),
        tilt: (Math.random() - 0.5) * H * 0.014,
        size: Math.max(1.5, H * (0.003 + Math.random() * 0.003)),
        color: Math.random() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(79,195,247,0.78)'
      });
    }

    emitParticle({
      kind: 'ring',
      x: cx,
      y: cy,
      t: 0,
      life: 0.42,
      vx: 0,
      vy: 0,
      rx: Player.w * 1.8,
      ry: Player.h * 0.95,
      size: Math.max(2.5, H * 0.007),
      rot: -0.1,
      color: 'rgba(255,245,190,0.9)'
    });
  }

  function emitComboDashStreaks(dt) {
    if (!comboDashActive) return;
    dashStreakTimer -= dt;
    if (dashStreakTimer > 0) return;
    dashStreakTimer = 0.045;
    const cx = Player.x + Player.w * 0.9;
    const cy = Player.y + Player.h * (0.25 + Math.random() * 0.58);
    emitParticle({
      kind: 'streak',
      x: cx + Math.random() * Player.w * 0.6,
      y: cy,
      t: 0,
      life: 0.22 + Math.random() * 0.08,
      vx: -W * (0.42 + Math.random() * 0.2),
      vy: (Math.random() - 0.5) * H * 0.04,
      len: W * (0.045 + Math.random() * 0.04),
      tilt: (Math.random() - 0.5) * H * 0.01,
      size: Math.max(1.2, H * (0.002 + Math.random() * 0.0025)),
      color: Math.random() < 0.62 ? 'rgba(255,255,255,0.68)' : 'rgba(255,214,0,0.64)'
    });
  }

  /* --- QUESTION HANDLING --- */
  function resetAnswerButtons({ enable = true, blur = true } = {}) {
    for (let i = 0; i < 4; i++) {
      const btn = answerButtons[i];
      if (!btn) continue;
      btn.classList.remove('correct-flash', 'wrong-flash');
      btn.disabled = !enable;
      if (blur) btn.blur();
    }

    if (blur && document.activeElement instanceof HTMLElement && document.activeElement.classList.contains('ans-btn')) {
      document.activeElement.blur();
    }
  }

  function showQuestion(obs) {
    clearTimeout(questionHideTimer);
    questionHideTimer = null;
    activeQuestion = obs.question;
    activeObstacle = obs;
    answered = false;
    questionTimeout = Math.max(3, Number(obs.question.timer) || questionTimeout);
    questionTimer = questionTimeout;

    resetAnswerButtons();
    if (questionPanelEl) {
      questionPanelEl.dataset.difficulty = obs.question.difficulty || 'medium';
      questionPanelEl.setAttribute(
        'aria-label',
        `${obs.question.difficultyLabel || 'Medium'} ${obs.question.skill || 'math'} question. ${questionTimeout.toFixed(1)} seconds.`
      );
    }
    if (questionTextEl) questionTextEl.textContent = obs.question.question;
    for (let i = 0; i < 4; i++) {
      if (answerTextEls[i]) answerTextEls[i].textContent = obs.question.choices[i];
    }
    if (questionPanelEl) questionPanelEl.classList.remove('hidden');
    updateQuestionTimerUI(1);
    state = 'question_active'; // PAUSE THE GAME
    lastTime = performance.now(); // Reset lastTime to get accurate dt for timer
  }

  function hideQuestion(resumeGame = true) {
    clearTimeout(questionHideTimer);
    questionHideTimer = null;
    if (questionPanelEl) {
      questionPanelEl.classList.add('hidden');
      questionPanelEl.dataset.difficulty = '';
      questionPanelEl.removeAttribute('aria-label');
    }
    resetAnswerButtons();
    activeQuestion = null; // Clear active question
    activeObstacle = null;
    answered = false;
    lastTimerPct = null;
    lastTimerBand = null;
    if (resumeGame) {
      state = 'running'; // RESUME THE GAME
      lastTime = performance.now(); // Reset lastTime to get accurate dt for game elements
    }
  }

  function updateQuestionTimerUI(ratio) {
    if (!timerBarEl) return;

    const pct = Math.max(0, Math.min(1, ratio)) * 100;
    const roundedPct = Math.round(pct * 10) / 10;
    const band = ratio <= 0.22 ? 'danger' : ratio <= 0.45 ? 'warn' : 'ok';

    if (lastTimerPct !== roundedPct) {
      timerBarEl.style.width = roundedPct + '%';
      lastTimerPct = roundedPct;
    }
    if (lastTimerBand !== band) {
      timerBarEl.style.background = band === 'danger'
        ? 'linear-gradient(90deg, #EF5350, #FF7043)'
        : band === 'warn'
          ? 'linear-gradient(90deg, #FFD600, #FF8F00)'
          : 'linear-gradient(90deg, #43A047, #7CB342)';
      timerBarEl.style.boxShadow = band === 'danger' ? '0 0 12px rgba(239,83,80,0.8)' : 'none';
      lastTimerBand = band;
    }
  }

  function selectAnswer(idx) {
    if (answered || !activeQuestion || (state !== 'running' && state !== 'question_active')) return;
    answered = true;

    const correct = idx === activeQuestion.correctIdx;

    const btn = answerButtons[idx];
    if (btn) {
      btn.classList.add(correct ? 'correct-flash' : 'wrong-flash');
      btn.blur();
    }

    for (let i = 0; i < 4; i++) {
      if (answerButtons[i]) answerButtons[i].disabled = true;
    }
    if (document.activeElement instanceof HTMLElement && document.activeElement.classList.contains('ans-btn')) {
      document.activeElement.blur();
    }

    if (correct) {
      // Mark as passed agad para hindi mabawasan ng life kahit medyo dikit sa collision
      if (activeObstacle) {
        activeObstacle.passed = true;
        activeObstacle.progressCounted = true;
      }
      Audio.correct();
      score += level <= 4 ? 10 : 20;
      combo++;
      correctCount++;
      levelCorrectCount++;
      if (combo === nextComboDashCombo) {
        startComboDash(activeObstacle);
        nextComboDashCombo += 5;
      } else {
        Player.jump(true, activeObstacle); // Arc na sapat para malagpasan ang active obstacle
      }
      state = 'running'; // Resume agad para sabay ang obstacle movement at jump arc
      // Combo display
      if (combo > 1 && !comboDashActive) showCombo(combo);

      spawnParticles(Player.x + Player.w, Player.y, true);
      updateHUD();
    } else {
      Audio.wrong();
      combo = 0;
      nextComboDashCombo = 5;
      state = 'running'; // Tuloy ang takbo; collision sa obstacle ang magbabawas ng buhay
      spawnParticles(Player.x + Player.w, Player.y, false);
    }

    // Completion stops the session synchronously through updateHUD; do not
    // leave a late callback that could revive the running state.
    if (state === 'complete') return;

    clearTimeout(questionHideTimer);
    questionHideTimer = setTimeout(() => {
      questionHideTimer = null;
      hideQuestion(); // Siguraduhing tatawagin ito para bumalik ang state sa 'running'
    }, 300); // Short delay for visual feedback before hiding question and resuming
  }

  function showCombo(n) {
    const el = comboPopupEl;
    if (!el) return;
    el.classList.remove('combo-dash-pop');
    el.textContent = n >= 5 ? `${n}x COMBO! 🔥🔥` : n >= 3 ? `${n}x COMBO! 🔥` : `${n}x Combo!`;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,-50%) scale(1.2)';
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
    }, 1200);
  }

  function startComboDash(firstObstacle = null) {
    comboDashActive = true;
    comboDashTimer = comboDashDuration;
    Player.y = groundY() - Player.h;
    Player.vy = 0;
    Player.onGround = true;
    Player.jumping = false;
    showComboDash();
    spawnComboDashActivationEffects();
    spawnParticles(Player.x + Player.w, Player.y + Player.h * 0.45, true);
    if (firstObstacle) smashObstacle(firstObstacle);
  }

  function showComboDash() {
    const el = comboPopupEl;
    if (!el) return;
    el.textContent = '5x COMBO DASH!';
    el.classList.remove('combo-dash-pop');
    void el.offsetWidth;
    el.classList.add('combo-dash-pop');
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,-50%) scale(1.3)';
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.classList.remove('combo-dash-pop');
    }, 1800);
  }

  function updateComboDash(dt) {
    if (!comboDashActive) return;
    comboDashTimer -= dt;
    emitComboDashStreaks(dt);
    if (comboDashTimer <= 0) {
      comboDashActive = false;
      comboDashTimer = 0;
      dashStreakTimer = 0;
    }
  }

  function countDashClearedObstacle(obs) {
    if (!obs || obs.progressCounted || !obs.question) return;
    obs.progressCounted = true;
    score += level <= 4 ? 10 : 20;
    correctCount++;
    levelCorrectCount++;
    updateHUD();
  }

  function smashObstacle(obs) {
    if (!obs || obs.smashed) return;
    countDashClearedObstacle(obs);
    obs.smashed = true;
    obs.passed = true;
    obs.questionShown = false;
    obs.smashT = 0;
    obs.vx = W * (0.42 + Math.random() * 0.2);
    obs.vy = -H * (0.34 + Math.random() * 0.2);
    obs.rotation = 0;
    obs.spin = (Math.random() < 0.5 ? -1 : 1) * (7.5 + Math.random() * 5.5);
    spawnObstacleBreak(obs);
    if (activeObstacle === obs) {
      activeObstacle = null;
      activeQuestion = null;
    }
  }

  function takeDamage() {
    if (invincible) return;
    lives--;
    Audio.hit();
    Player.hitTimer = 0.5;
    invincible = true;
    invincibleTimer = 2;
    shakeTimer = 0.4;
    updateLivesHUD();
    if (lives <= 0 && !damageEndTimer) {
      damageEndTimer = setTimeout(() => {
        damageEndTimer = null;
        endGame();
      }, 600);
    }
  }

  /* --- LEVEL SYSTEM --- */
  const LEVEL_CORRECT_TARGET = 15;

  function showWorldTransition(worldId) {
    const world = WORLD_DEFINITIONS[worldId];
    if (!world || worldId === 'city') return;
    let el = document.getElementById('world-transition');
    if (!el) {
      el = document.createElement('div');
      el.id = 'world-transition';
      el.innerHTML = '<span></span>';
      document.body.appendChild(el);
    }
    const label = el.querySelector('span');
    if (label) label.textContent = `${world.name.toUpperCase()} WORLD`;
    el.classList.remove('show', 'to-barangay', 'to-school');
    el.classList.add(`to-${worldId}`);
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(worldTransitionTimer);
    worldTransitionTimer = setTimeout(() => {
      worldTransitionTimer = null;
      el.classList.remove('show', 'to-barangay', 'to-school');
    }, 2900);
  }

  function syncWorldForLevel(showTransition = false) {
    const nextWorld = sessionConfig.background || getWorldForLevel(level);
    if (nextWorld !== currentWorld) {
      currentWorld = nextWorld;
      parallaxWorld = null;
      initParallaxWorld();
      seedTraffic();
    }
    if (showTransition && nextWorld !== lastWorldTransitionShown) {
      lastWorldTransitionShown = nextWorld;
      showWorldTransition(nextWorld);
    }
  }

  function checkLevelUp() {
    if (levelCorrectCount >= LEVEL_CORRECT_TARGET) completeLevel();
  }

  /* --- HUD UPDATES --- */
  function updateHUD() {
    if (!scoreDisplayEl) scoreDisplayEl = document.getElementById('score-display');
    if (scoreDisplayEl && lastScoreDisplay !== score) {
      scoreDisplayEl.textContent = score;
      lastScoreDisplay = score;
    }
    checkLevelUp();
  }

  function updateLivesHUD() {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`h${i}`);
      if (heart) heart.classList.toggle('lost', i > lives);
    }
  }

  /* --- COLLISION DETECTION --- */
  function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.passed) continue;

      if (comboDashActive) {
        const dashReach = Player.x + Player.w * 1.35;
        if (dashReach > obs.x && Player.x < obs.x + obs.w) {
          smashObstacle(obs);
        }
        continue;
      }

      // Show question when obstacle is close enough
      if (!obs.questionShown && obs.x < getObstacleQuestionTriggerX(obs) && obs.x > W * 0.1) {
        if (!activeQuestion) {
          obs.questionShown = true;
          showQuestion(obs); // This will set state to 'question_active'
        } // else: an active question is already being displayed
      }

      // Pixel collision (simple AABB with padding)
      const pad = Player.w * 0.25;
      if (
        Player.x + pad < obs.x + obs.w - pad &&
        Player.x + Player.w - pad > obs.x + pad &&
        Player.y + Player.h * 0.15 < obs.y + obs.h &&
        Player.y + Player.h > obs.y
      ) {
        if (!obs.passed) {
          obs.passed = true;
          takeDamage();
        }
      }
    }
  }

  function isResponsiveStopSpacingActive() {
    const hasCoarsePointer = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(pointer: coarse)').matches;

    return W < 900 || (hasCoarsePointer && W < 1180);
  }

  function getObstacleQuestionTriggerX(obs) {
    const desktopTriggerX = W * 0.26;
    if (!isResponsiveStopSpacingActive()) return desktopTriggerX;

    const compactness = clamp01((900 - W) / 580);
    const viewportGapRatio = W < 520 ? 0.055 : W < 760 ? 0.05 : 0.04;
    const responsiveGap = Math.max(
      W * viewportGapRatio,
      Player.w * (0.42 + compactness * 0.18),
      obs.w * 0.36
    );
    const balancedTriggerX = Player.x + Player.w + responsiveGap;
    const maxResponsiveTriggerX = W * (W < 520 ? 0.34 : 0.32);

    return Math.min(Math.max(desktopTriggerX, balancedTriggerX), maxResponsiveTriggerX);
  }

  function getResponsiveJumpHeight(baseJumpHeight, gravity, obstacle) {
    if (!obstacle || !isResponsiveStopSpacingActive()) return baseJumpHeight;

    const compactness = clamp01((900 - W) / 580);
    const obstacleSpeed = Math.max(
      W * 0.12,
      (obstacle.speed || 0) * getWorldSpeedMultiplier()
    );
    const currentGap = Math.max(0, obstacle.x - (Player.x + Player.w));
    const postObstacleLandingBuffer = Math.max(
      W * (W < 520 ? 0.035 : 0.025),
      Player.w * (0.24 + compactness * 0.1)
    );
    const clearanceTravel = currentGap
      + obstacle.w * (1.28 + compactness * 0.14)
      + Player.w * (0.38 + compactness * 0.22)
      + postObstacleLandingBuffer;
    const targetAirTime = Math.min(1.56, Math.max(0.86, clearanceTravel / obstacleSpeed));
    const travelHeight = gravity * targetAirTime * targetAirTime / 8;
    const responsiveClearanceHeight = obstacle.h + Player.h * (0.72 + compactness * 0.15);
    const responsiveMaxHeight = H * (W < 520 ? 0.445 : 0.415);

    return Math.min(
      responsiveMaxHeight,
      Math.max(baseJumpHeight, travelHeight, responsiveClearanceHeight)
    );
  }

  /* --- MAIN LOOP --- */
  function loop(ts, runId) {
    if (runId !== loopRunId) return;
    if (state === 'idle' || state === 'gameover' || state === 'paused') {
      frameId = null;
      return; // Only run if not idle, gameover, or paused
    }
    frameId = requestAnimationFrame(nextTs => loop(nextTs, runId));
    const dt = Math.min(Math.max((ts - lastTime) / 1000, 0), 0.05);
    lastTime = ts;
    updateComboDash(dt);

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      shakeX = (Math.random() - 0.5) * 12;
      shakeY = (Math.random() - 0.5) * 8;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear
    ctx.clearRect(-20, -20, W+40, H+40);

    // Only update game elements if the game is running (not paused for a question)
    if (state === 'running') {
      // Draw background
      drawBackground(dt);

      // Spawn obstacles
      obstacleSpawnTimer += dt;
      if (obstacleSpawnTimer >= getObstacleSpawnInterval()) {
        obstacleSpawnTimer = 0;
        const obs = new Obstacle();
        obs.question = Questions.generate(level, levelCorrectCount);
        obstacles.push(obs);
      }

      // Update & draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const gone = obstacles[i].update(dt);
        if (gone) {
          // If obstacle passed without being answered (timed out), penalize
          if (!obstacles[i].passed && activeObstacle === obstacles[i]) {
            hideQuestion(); // This will set state back to 'running'
            takeDamage();
          }
          obstacles.splice(i, 1);
        } else {
          obstacles[i].draw();
        }
      }

      // Player
      Player.update(dt);
      Player.draw();

      // Invincibility
      if (invincible) {
        invincibleTimer -= dt;
        if (invincibleTimer <= 0) invincible = false;
      }

      // Collision
      if (comboDashActive || !invincible) checkCollisions();
    } else if (state === 'question_active') {
      // If question is active, freeze obstacles but keep the player jump visible after answering
      drawBackground(dt, true);
      obstacles.forEach(obs => obs.draw());
      if (answered) Player.update(dt);
      Player.draw();
    }

    // Question timer
    if (activeQuestion && !answered) {
      questionTimer -= dt;
      updateQuestionTimerUI(Math.max(0, questionTimer / questionTimeout));
      if (questionTimer <= 0 && state === 'question_active') { // Only trigger if question is still active
        selectAnswer(-1); // Simulate a wrong answer (index -1 won't match any correctIdx)
      }
    }

    drawComboDashOverlay(dt);

    // Particles
    drawParticles(dt);
    drawWeatherForeground(dt, state === 'question_active');

    ctx.restore();
  }

  /* --- PAUSE INPUT --- */
  function isGameScreenVisible() {
    return !!gameScreenEl && !gameScreenEl.classList.contains('hidden');
  }

  function isPauseOverlayVisible() {
    return !!pauseScreenEl && !pauseScreenEl.classList.contains('hidden');
  }

  function isStoryOverlayVisible() {
    return !!storySequenceEl && !storySequenceEl.classList.contains('hidden');
  }

  function refreshPauseButtonRect() {
    if (!pauseBtn) return null;
    const rect = pauseBtn.getBoundingClientRect();
    pauseButtonRect = rect.width > 0 && rect.height > 0 ? rect : null;
    updatePauseHitboxDebug();
    return pauseButtonRect;
  }

  function pointInPauseButton(x, y) {
    const rect = refreshPauseButtonRect();
    return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function updatePauseHitboxDebug() {
    if (!pauseHitboxDebugEl || !pauseDebugEnabled) return;
    const rect = pauseButtonRect;
    if (!rect || !isGameScreenVisible() || isPauseOverlayVisible() || isStoryOverlayVisible()) {
      pauseHitboxDebugEl.style.display = 'none';
      return;
    }
    pauseHitboxDebugEl.style.display = 'block';
    pauseHitboxDebugEl.style.left = rect.left + 'px';
    pauseHitboxDebugEl.style.top = rect.top + 'px';
    pauseHitboxDebugEl.style.width = rect.width + 'px';
    pauseHitboxDebugEl.style.height = rect.height + 'px';
  }

  function ensurePauseHitboxDebugEl() {
    pauseHitboxDebugEl = document.querySelector('.pause-hitbox-debug');
    if (!pauseHitboxDebugEl) {
      pauseHitboxDebugEl = document.createElement('div');
      pauseHitboxDebugEl.className = 'pause-hitbox-debug';
      document.body.appendChild(pauseHitboxDebugEl);
    }
  }

  function logPauseInput(e, hit) {
    if (!pauseDebugEnabled) return;
    const rect = refreshPauseButtonRect();
    console.log('[pause-input]', {
      type: e.type,
      x: Number.isFinite(e.clientX) ? Math.round(e.clientX) : null,
      y: Number.isFinite(e.clientY) ? Math.round(e.clientY) : null,
      hit,
      state,
      rect: rect ? {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      } : null
    });
  }

  function setPauseButtonVisual(nextState) {
    if (!pauseBtn) return;
    const paused = nextState === 'paused';
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  function canUsePauseButton() {
    return isGameScreenVisible() && !isPauseOverlayVisible() && !isStoryOverlayVisible() && (state === 'running' || state === 'question_active');
  }

  function handlePausePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const hit = pointInPauseButton(e.clientX, e.clientY);
    logPauseInput(e, hit);
    if (!hit || !canUsePauseButton()) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    pauseBtn.classList.add('is-pressed', 'is-hovered');
    togglePause('pointer');
  }

  function handlePausePointerMove(e) {
    if (!pauseBtn || !isGameScreenVisible() || isPauseOverlayVisible()) {
      if (pauseBtn) pauseBtn.classList.remove('is-hovered');
      return;
    }
    const hit = pointInPauseButton(e.clientX, e.clientY);
    pauseBtn.classList.toggle('is-hovered', hit);
  }

  function clearPausePressedState() {
    if (pauseBtn) pauseBtn.classList.remove('is-pressed');
  }

  function setupPauseButtonInput() {
    pauseBtn = document.getElementById('pause-btn');
    if (!pauseBtn) return;

    pauseDebugEnabled = new URLSearchParams(window.location.search).has('pauseDebug') ||
      localStorage.getItem('takbomathbo_pause_debug') === '1';

    if (pauseDebugEnabled) {
      ensurePauseHitboxDebugEl();
    }

    pauseBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      logPauseInput(e, true);
      if (canUsePauseButton()) togglePause('click');
    });
    document.addEventListener('pointerdown', handlePausePointerDown, true);
    document.addEventListener('pointermove', handlePausePointerMove, true);
    document.addEventListener('pointerup', clearPausePressedState, true);
    document.addEventListener('pointercancel', clearPausePressedState, true);
    refreshPauseButtonRect();

    window.setPauseDebug = enabled => {
      pauseDebugEnabled = enabled !== false;
      localStorage.setItem('takbomathbo_pause_debug', pauseDebugEnabled ? '1' : '0');
      if (pauseDebugEnabled) ensurePauseHitboxDebugEl();
      if (!pauseDebugEnabled && pauseHitboxDebugEl) pauseHitboxDebugEl.style.display = 'none';
      refreshPauseButtonRect();
      console.log(`[pause-input] debug ${pauseDebugEnabled ? 'enabled' : 'disabled'}`);
    };
  }

  function loadFlagImage() {
    if (flagImage) return;
    flagImageReady = false;
    flagImage = new Image();
    flagImage.onload = () => {
      flagImageReady = true;
    };
    flagImage.onerror = () => {
      flagImageReady = false;
    };
    flagImage.src = 'assets/images/phflag.png';
  }

  /* --- PUBLIC API --- */
  function init() {
    if (initialized) return;
    initialized = true;
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d', { alpha: false });
    scoreDisplayEl = document.getElementById('score-display');
    timerBarEl = document.getElementById('timer-bar');
    questionPanelEl = document.getElementById('question-panel');
    questionTextEl = document.getElementById('question-text');
    comboPopupEl = document.getElementById('combo-popup');
    levelBadgeEl = document.getElementById('level-badge');
    pauseScreenEl = document.getElementById('pause-screen');
    gameScreenEl = document.getElementById('game-screen');
    storySequenceEl = document.getElementById('story-sequence');
    answerButtons = [0, 1, 2, 3].map(i => document.getElementById(`ans${i}`));
    answerTextEls = [0, 1, 2, 3].map(i => document.getElementById(`ans-text-${i}`));
    setupPauseButtonInput();
    loadFlagImage();
    resize();
    const runResize = () => {
      resizeRaf = 0;
      const changed = resize();
      refreshPauseButtonRect();
      if (changed && (state === 'running' || state === 'paused')) {
        obstacles.length = 0;
      }
    };
    const handleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(runResize);
    };
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);

    // Keyboard input
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && state !== 'idle') {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }

      const answerKeys = ['a', 'b', 'c', 'd'];
      const answerIdx = answerKeys.indexOf(e.key.toLowerCase());
      if (answerIdx !== -1 && (state === 'running' || state === 'question_active')) {
        selectAnswer(answerIdx);
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (state === 'running' || state === 'question_active' || state === 'paused') togglePause('keyboard');
      }
    });
  }

  function start() {
    stopStoryMusic(false);
    stopGameMusic();
    stopGameOverSound();
    const startLevel = sessionConfig.level || 1;
    // Reset everything
    score = 0; lives = 3; level = startLevel; levelCorrectCount = 0; combo = 0; correctCount = 0;
    lastScoreDisplay = null;
    nextComboDashCombo = 5;
    // Never carry a selected level's previous difficulty into a fresh run.
    // Combo dashes can still temporarily increase the running pace after play begins.
    speedMultiplier = INITIAL_SPEED_MULTIPLIER;
    obstacleInterval = INITIAL_OBSTACLE_INTERVAL;
    obstacleSpawnTimer = obstacleInterval * 0.45; questionTimer = 0;
    invincible = false; invincibleTimer = 0; shakeTimer = 0;
    comboDashActive = false; comboDashTimer = 0; comboDashFxTimer = 0; dashStreakTimer = 0;
    bgX = 0; particles.length = 0; obstacles.length = 0;
    resetDayNightCycle();
    Weather.init();
    activeQuestion = null; activeObstacle = null; answered = false;
    hideQuestion(false);
    currentWorld = sessionConfig.background || getWorldForLevel(level);
    lastWorldTransitionShown = currentWorld;
    updateHUD();
    updateLivesHUD();
    const context = document.getElementById('session-context');
    if (context) context.textContent = `Level ${level} · ${locationLabel() || WORLD_DEFINITIONS[currentWorld].name}`;
    Player.init();
    initClouds();
    initParallaxWorld();
    seedTraffic();
    resetBirds();
    initStars();
    state = 'running';
    stateBeforePause = 'running';
    setPauseButtonVisual(state);
    playGameMusic();
    clearGameTimeouts();
    if (comboPopupEl) comboPopupEl.style.opacity = '0';
    if (levelBadgeEl) levelBadgeEl.style.opacity = '0';
    startLoop();
  }

  function stop() {
    stopGameMusic();
    state = 'idle';
    stateBeforePause = 'running';
    setPauseButtonVisual(state);
    stopLoop();
    clearGameTimeouts();
    obstacles.length = 0;
    hideQuestion(false);
  }

  function togglePause(source = 'api') {
    const now = performance.now();
    if (now - lastPauseToggleAt < 120) return;
    lastPauseToggleAt = now;

    if (state === 'running' || state === 'question_active') {
      stateBeforePause = state;
      state = 'paused';
      pauseGameMusic();
      if (pauseScreenEl) pauseScreenEl.classList.remove('hidden');
      setPauseButtonVisual(state);
      stopLoop();
      if (pauseDebugEnabled) console.log('[pause-input] paused from', stateBeforePause, 'via', source);
    } else if (state === 'paused') {
      state = stateBeforePause === 'question_active' && activeQuestion && !answered ? 'question_active' : 'running';
      playGameMusic();
      if (pauseScreenEl) pauseScreenEl.classList.add('hidden');
      setPauseButtonVisual(state);
      startLoop();
      if (pauseDebugEnabled) console.log('[pause-input] resumed to', state, 'via', source);
    }
  }

  function endGame() {
    stopGameMusic();
    state = 'gameover';
    stateBeforePause = 'running';
    setPauseButtonVisual(state);
    stopLoop();
    clearGameTimeouts();
    hideQuestion(false);

    const hs = getHighScore();
    const isNew = score > hs;
    if (isNew) saveHighScore(score);

    // Funny messages
    const msgs = score >= 200
      ? { e:'🤩', m:'Genius ka pala!', s:'Uliin mo nga yan, para masigurado.' }
      : score >= 100
      ? { e:'😎', m:'Napagod utak mo ah!', s:`Pero magaling ka pa rin... kaya. Score: ${score}` }
      : score >= 50
      ? { e:'😅', m:'Hindi pa masama!', s:'Konting practice lang, idol!' }
      : score >= 20
      ? { e:'😬', m:'Ganun talaga minsan...', s:'Subukang muli, malay mo lumabas yung matalino.' }
      : { e:'😵', m:'Aral pa more!', s:'Huy, wag susuko ha! Kaya mo yan!' };

    document.getElementById('go-emoji').textContent = msgs.e;
    document.getElementById('go-msg').textContent = msgs.m;
    document.getElementById('go-sub').textContent = msgs.s + (isNew ? ' 🏆 Bagong record!' : '');
    document.getElementById('go-score').textContent = score + ' pts';
    document.getElementById('go-best').textContent = Math.max(score, hs) + ' pts';
    document.getElementById('go-level').textContent = `Level ${level}`;
    document.getElementById('go-correct').textContent = correctCount;

    showScreen('gameover-screen');
    playGameOverSound();
  }

  function completeLevel() {
    if (state === 'complete' || state === 'gameover' || levelCorrectCount < LEVEL_CORRECT_TARGET) return;
    stopGameMusic();
    state = 'complete';
    stateBeforePause = 'running';
    setPauseButtonVisual(state);
    stopLoop();
    clearGameTimeouts();
    hideQuestion(false);
    obstacles.length = 0;
    Audio.levelup();
    const config = LEVEL_CONFIG[level - 1];
    document.getElementById('completion-sub').textContent = `Level ${level}: ${config?.name || ''} complete!`;
    document.getElementById('complete-location').textContent = locationLabel() || 'Hindi tinukoy';
    document.getElementById('complete-score').textContent = `${score} pts`;
    document.getElementById('complete-correct').textContent = `${correctCount} / ${LEVEL_CORRECT_TARGET}`;
    showScreen('completion-screen');
  }

  return { init, start, stop, togglePause, selectAnswer, endGame, completeLevel, getState: () => state };
})();

/* =============================================
   HIGH SCORE
============================================= */
function getHighScore() {
  return parseInt(localStorage.getItem('takbomathbo_hs') || '0');
}
function saveHighScore(s) {
  localStorage.setItem('takbomathbo_hs', s);
}
function updateHighScoreDisplay() {
  const display = document.getElementById('hs-display');
  if (display) display.innerHTML = `<span class="score-icon" aria-hidden="true">★</span> Best: ${getHighScore()} pts`;
}

/* =============================================
   GAME FLOW
============================================= */
let storyPlaying = false;
let storyTimers = [];
let storyStartedGame = false;
let storyMusicFadeTimer = null;
const STORY_BEAT_TIMINGS = {
  discovery: 3400,
  approach: 6700,
  doorOpen: 9300,
  portal: 11900,
  world: 14300,
  final: 17600,
  runner: 21400,
  startGame: 22800,
  hideStory: 23600,
  skipFade: 650
};
let landingMusicRetryBound = false;

function retryLandingMusicAfterGesture() {
  if (landingMusicRetryBound) return;
  landingMusicRetryBound = true;

  const retry = () => {
    landingMusicRetryBound = false;
    playLandingMusic();
    window.removeEventListener('pointerdown', retry);
    window.removeEventListener('keydown', retry);
  };

  window.addEventListener('pointerdown', retry);
  window.addEventListener('keydown', retry);
}

function playLandingMusic() {
  const music = document.getElementById('landing-bgm');
  if (!music || document.getElementById('landing')?.classList.contains('hidden')) return;

  stopGameOverSound();
  stopStoryMusic(false);
  stopGameMusic();
  music.volume = 0.34;

  const playPromise = music.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      retryLandingMusicAfterGesture();
    });
  }
}

function stopLandingMusic() {
  const music = document.getElementById('landing-bgm');
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  music.volume = 0.34;
}

function playStoryMusic() {
  const music = document.getElementById('story-bgm');
  if (!music) return;

  stopGameOverSound();
  stopLandingMusic();
  stopGameMusic();
  clearInterval(storyMusicFadeTimer);
  storyMusicFadeTimer = null;
  music.currentTime = 0;
  music.volume = 0.42;

  const playPromise = music.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function stopStoryMusic(fade = true) {
  const music = document.getElementById('story-bgm');
  if (!music) return;

  clearInterval(storyMusicFadeTimer);
  storyMusicFadeTimer = null;

  if (!fade) {
    music.pause();
    music.currentTime = 0;
    music.volume = 0.42;
    return;
  }

  storyMusicFadeTimer = setInterval(() => {
    music.volume = Math.max(0, music.volume - 0.07);
    if (music.volume <= 0) {
      clearInterval(storyMusicFadeTimer);
      storyMusicFadeTimer = null;
      music.pause();
      music.currentTime = 0;
      music.volume = 0.42;
    }
  }, 45);
}

function playGameMusic() {
  const music = document.getElementById('game-bgm');
  if (!music) return;

  stopGameOverSound();
  stopLandingMusic();
  music.volume = 0.35;
  const playPromise = music.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function pauseGameMusic() {
  const music = document.getElementById('game-bgm');
  if (!music) return;
  music.pause();
}

function stopGameMusic() {
  const music = document.getElementById('game-bgm');
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  music.volume = 0.35;
}

function playGameOverSound() {
  const sound = document.getElementById('gameover-sfx');
  if (!sound) return;

  sound.pause();
  sound.currentTime = 0;
  sound.volume = 0.75;

  const playPromise = sound.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function stopGameOverSound() {
  const sound = document.getElementById('gameover-sfx');
  if (!sound) return;
  sound.pause();
  sound.currentTime = 0;
  sound.volume = 0.75;
}

function clearStoryTimers() {
  storyTimers.forEach(timer => clearTimeout(timer));
  storyTimers = [];
}

function setStoryScene(story, scene) {
  story.className = scene;
}

function setStoryText(dialogue, centerText, dialogueText = '', centerTextValue = '') {
  dialogue.innerHTML = dialogueText;
  centerText.innerHTML = centerTextValue;
  dialogue.classList.toggle('visible', Boolean(dialogueText));
  centerText.classList.toggle('visible', Boolean(centerTextValue));
}

function setupStoryParticles() {
  const wrap = document.querySelector('#story-sequence .story-particles');
  if (!wrap || wrap.children.length) return;

  for (let i = 0; i < 46; i++) {
    const p = document.createElement('span');
    p.className = 'story-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.setProperty('--tx', `${(Math.random() - 0.5) * 90}px`);
    p.style.setProperty('--ty', `${-20 - Math.random() * 90}px`);
    p.style.setProperty('--dur', `${3.5 + Math.random() * 4.5}s`);
    p.style.setProperty('--delay', `${-Math.random() * 5}s`);
    wrap.appendChild(p);
  }
}

function isPointInsideSkipButton(e) {
  const skipBtn = document.getElementById('story-skip-btn');
  const story = document.getElementById('story-sequence');
  if (!skipBtn || !story || story.classList.contains('hidden')) return false;

  const rect = skipBtn.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  return (
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
}

function handleStorySkipPointer(e) {
  if (!storyPlaying || !isPointInsideSkipButton(e)) return;
  e.preventDefault();
  e.stopPropagation();
  skipStoryToGame();
}

function playStoryThenStart() {
  if (storyPlaying) return;
  storyPlaying = true;
  storyStartedGame = false;
  clearStoryTimers();

  const gameScreen = document.getElementById('game-screen');
  const story = document.getElementById('story-sequence');
  const dialogue = document.getElementById('story-dialogue');
  const centerText = document.getElementById('story-center-text');
  const skipBtn = document.getElementById('story-skip-btn');

  playStoryMusic();
  setupStoryParticles();
  gameScreen.classList.add('cinematic-active');
  gameScreen.classList.remove('story-ui-enter');
  story.classList.remove('hidden', 'story-fading');
  setStoryScene(story, 'scene-walk');
  setStoryText(dialogue, centerText, 'Female: Ang tahimik dito...<br>Male: Oo nga... parang may kakaiba.');
  skipBtn.onclick = skipStoryToGame;
  skipBtn.onpointerdown = e => {
    e.preventDefault();
    e.stopPropagation();
    skipStoryToGame();
  };

  const queue = (delay, fn) => storyTimers.push(setTimeout(fn, delay));

  queue(STORY_BEAT_TIMINGS.discovery, () => {
    setStoryScene(story, 'scene-discovery');
    setStoryText(dialogue, centerText, 'Female: May pinto...?<br>Male: Sa gitna ng gubat?');
  });

  queue(STORY_BEAT_TIMINGS.approach, () => {
    setStoryScene(story, 'scene-approach');
    setStoryText(dialogue, centerText, 'Male: Tingnan natin.');
  });

  queue(STORY_BEAT_TIMINGS.doorOpen, () => {
    setStoryScene(story, 'scene-door-open');
    setStoryText(dialogue, centerText, '', 'Some doors... are not meant to be found.');
  });

  queue(STORY_BEAT_TIMINGS.portal, () => {
    setStoryScene(story, 'scene-portal');
    setStoryText(dialogue, centerText);
  });

  queue(STORY_BEAT_TIMINGS.world, () => {
    setStoryScene(story, 'scene-world');
    setStoryText(dialogue, centerText, 'Female: Nasaan tayo...?<br>Male: Hindi to normal...');
  });

  queue(STORY_BEAT_TIMINGS.final, () => {
    setStoryScene(story, 'scene-final');
    setStoryText(dialogue, centerText, '', 'To escape this world...<br>you must solve every obstacle.');
  });

  queue(STORY_BEAT_TIMINGS.runner, () => {
    setStoryScene(story, 'scene-runner');
    setStoryText(dialogue, centerText);
    gameScreen.classList.add('story-ui-enter');
  });

  queue(STORY_BEAT_TIMINGS.startGame, () => {
    storyStartedGame = true;
    stopStoryMusic();
    Game.start();
    story.classList.add('story-fading');
  });

  queue(STORY_BEAT_TIMINGS.hideStory, () => {
    story.classList.add('hidden');
    story.classList.remove('story-fading');
    gameScreen.classList.remove('cinematic-active', 'story-ui-enter');
    storyPlaying = false;
    storyStartedGame = false;
    clearStoryTimers();
  });
}

function skipStoryToGame() {
  if (!storyPlaying) return;

  const gameScreen = document.getElementById('game-screen');
  const story = document.getElementById('story-sequence');
  const dialogue = document.getElementById('story-dialogue');
  const centerText = document.getElementById('story-center-text');

  clearStoryTimers();
  stopStoryMusic();
  setStoryText(dialogue, centerText);
  setStoryScene(story, 'scene-runner');
  gameScreen.classList.add('story-ui-enter');

  if (!storyStartedGame) {
    storyStartedGame = true;
    Game.start();
  }

  story.classList.add('story-fading');
  storyTimers.push(setTimeout(() => {
    story.classList.add('hidden');
    story.classList.remove('story-fading');
    gameScreen.classList.remove('cinematic-active', 'story-ui-enter');
    storyPlaying = false;
    storyStartedGame = false;
    clearStoryTimers();
  }, STORY_BEAT_TIMINGS.skipFade));
}

function startGame() {
  const fromLanding = !document.getElementById('landing').classList.contains('hidden');
  closeModal();
  showScreen('game-screen');
  document.getElementById('pause-screen').classList.add('hidden');
  const pauseButton = document.getElementById('pause-btn');
  if (pauseButton) {
    pauseButton.textContent = '⏸';
    pauseButton.setAttribute('aria-label', 'Pause game');
    pauseButton.setAttribute('aria-pressed', 'false');
  }
  if (fromLanding) {
    playStoryThenStart();
    return;
  }

  Game.start();
}

// Global exposure para sa onclick ng HTML
window.selectAnswer = function(idx) {
  Game.selectAnswer(idx);
};

function selectAnswer(idx) {
  Game.selectAnswer(idx);
}
function togglePause() {
  Game.togglePause();
}

/* =============================================
   INIT
============================================= */
window.addEventListener('DOMContentLoaded', () => {
  Game.init();
  moveCustomizeControls();
  drawCharacterPreviews();
  selectCharacter(selectedCharacter);
  updateWorldCards();
  renderLandingLevelCards();
  updateLandingSessionSummary();
  updateHighScoreDisplay();
  document.querySelectorAll('.setup-panel-options').forEach(options => { options.inert = true; });
  document.addEventListener('pointerdown', handleStorySkipPointer, true);
  document.addEventListener('click', handleStorySkipPointer, true);
  showScreen('landing');
});

/* Lightweight dependency-free regression checks for this static web game. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('js/script.js', 'utf8');

for (const file of [
  'css/style.css',
  'js/script.js',
  'assets/audio/bgmusic.mp3',
  'assets/audio/bgmusicone.mp3',
  'assets/audio/bgmusictwo.mp3',
  'assets/audio/bggameover.mp3',
  'assets/images/male.png',
  'assets/images/female.png',
  'assets/images/phflag.png',
  'assets/stages/stage-city.svg',
  'assets/stages/stage-barangay.svg',
  'assets/stages/stage-campus.svg'
]) {
  assert.ok(fs.existsSync(file), `missing project asset: ${file}`);
}
assert.match(html, /href="css\/style\.css"/);
assert.match(html, /src="js\/script\.js"/);

for (const id of ['landing-level-cards', 'background-status', 'completion-screen']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing ${id}`);
}
assert.match(js, /const LEVEL_CONFIG = \[/);
assert.equal((js.match(/\['(?:Addition|Subtraction|Multiplication|Division|Fill in the Blank|Integers|Algebra)'/g) || []).length, 7);
assert.match(js, /class="level-card-title">Level \$\{level\.number\}: \$\{level\.name\}/);
assert.doesNotMatch(js, /class="level-description">\$\{level\.description\}/);
assert.match(js, /function selectBackground\(background\)/);
assert.match(js, /sessionConfig\.background/);
assert.match(js, /card\.setAttribute\('aria-pressed', selected \? 'true' : 'false'\)/);
assert.match(js, /aria-pressed="\$\{sessionConfig\.level === level\.number \? 'true' : 'false'\}"/);
assert.match(js, /const missing = \[!sessionConfig\.level && 'level', !sessionConfig\.background && 'background'\]/);
assert.match(js, /currentWorld = sessionConfig\.background \|\| getWorldForLevel\(level\)/);
assert.match(js, /function completeLevel\(\)/);
assert.match(html, /CONGRATULATIONS! ISA KANG MATHALINO! GALING!/);
assert.doesNotMatch(js, /level\+\+/);
assert.match(js, /const startLevel = sessionConfig\.level \|\| 1/);
assert.match(js, /const INITIAL_PLAYER_SPEED = 0\.16;/);
assert.match(js, /const INITIAL_SPEED_MULTIPLIER = 1;/);
assert.match(js, /const INITIAL_OBSTACLE_INTERVAL = 3\.5;/);
assert.match(js, /this\.speed = W \* INITIAL_PLAYER_SPEED \* speedMultiplier;/);
assert.match(js, /const baseSpeed = W \* INITIAL_PLAYER_SPEED \* speedMultiplier/);
assert.match(js, /speedMultiplier = INITIAL_SPEED_MULTIPLIER;/);
assert.match(js, /obstacleInterval = INITIAL_OBSTACLE_INTERVAL;/);
assert.doesNotMatch(js, /speedMultiplier = 1 \+ \(level - 1\) \* 0\.12/);
assert.doesNotMatch(js, /W \* 0\.16 \+ \(level - 1\) \* W \* 0\.012/);
assert.doesNotMatch(js, /obstacleInterval = Math\.max\(1\.8, 3\.5 - \(level - 1\) \* 0\.22\)/);
assert.doesNotMatch(html, /id="location-screen"/);
assert.doesNotMatch(html, /id="level-screen"/);
assert.doesNotMatch(html, /Piliin ang Lugar/);
assert.match(html, /Be <span>MATH<\/span>alino/);
assert.match(html, /<title>Be MATHalino/);
assert.doesNotMatch(html, /Takbo Mathbo|Takas sa Problema/);
console.log('game-flow static checks passed');

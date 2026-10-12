/* Lightweight dependency-free regression checks for this static web game. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
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

// Run the standalone question factory so generator changes cannot introduce
// chained arithmetic, malformed equations, incorrect answers, or timer drift.
const generatorSource = js.slice(js.indexOf('const Questions = (() => {'), js.indexOf('const Game = (() => {'))
  .replace('const Questions = (() => {', 'globalThis.Questions = (() => {');
const questionContext = {};
vm.createContext(questionContext);
vm.runInContext(generatorSource, questionContext);
const expectedTimers = {
  1: [5, 6, 8],
  2: [5, 6, 8],
  3: [5, 7, 9],
  4: [5, 7, 9],
  5: [12, 12, 12],
  6: [15, 15, 15],
  7: [18, 18, 18]
};

function integer(value) {
  return Number(value.replace(/[()]/g, ''));
}

function borrowCount(a, b) {
  let count = 0;
  let borrow = 0;
  while (a > 0 || b > 0) {
    const topDigit = (a % 10) - borrow;
    borrow = topDigit < b % 10 ? 1 : 0;
    count += borrow;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

function expectedArithmeticTimer(level, a, b) {
  if (level === 1) return Math.max(a, b) <= 9 ? 5 : a + b < 60 ? 6 : 8;
  if (level === 2) return a <= 20 && borrowCount(a, b) === 0 ? 5 : borrowCount(a, b) >= 2 || (a >= 70 && b >= 30) ? 8 : 6;
  if (level === 3) return a * b <= 25 ? 5 : a * b <= 81 && Math.max(a, b) <= 9 ? 7 : 9;
  return a <= 30 ? 5 : a <= 100 ? 7 : 9;
}

const arithmeticTimersSeen = new Map([[1, new Set()], [2, new Set()], [3, new Set()], [4, new Set()]]);
for (let level = 1; level <= 7; level++) {
  for (const [difficultyIndex, progress] of [0, 5, 10].entries()) {
    for (let sample = 0; sample < 100; sample++) {
      const problem = questionContext.Questions.generate(level, progress);
      if (level >= 5) assert.equal(problem.timer, expectedTimers[level][difficultyIndex], `Level ${level} timer must match its configured thinking time`);

      if (level <= 4) {
        const operators = ['\\+', '-', '×', '÷'];
        const match = problem.question.match(new RegExp(`^(\\d+) ${operators[level - 1]} (\\d+) = \\?$`));
        assert.ok(match, `Level ${level} must have exactly two numeric operands: ${problem.question}`);
        const [a, b] = match.slice(1).map(Number);
        const answer = level === 1 ? a + b : level === 2 ? a - b : level === 3 ? a * b : a / b;
        assert.equal(problem.choices[problem.correctIdx], answer, `Level ${level} answer must be correct`);
        if (level === 4) assert.ok(Number.isInteger(answer), 'Division answers must be whole numbers');
        assert.equal(problem.timer, expectedArithmeticTimer(level, a, b), `Level ${level} timer must reflect question complexity`);
        arithmeticTimersSeen.get(level).add(problem.timer);
      } else if (level === 5) {
        let match = problem.question.match(/^__ \+ (\d+) = (\d+)$/) || problem.question.match(/^(\d+) \+ __ = (\d+)$/);
        if (match) {
          assert.equal(problem.choices[problem.correctIdx], Number(match[2]) - Number(match[1]));
          continue;
        }
        match = problem.question.match(/^(\d+) - __ = (\d+)$/) || problem.question.match(/^__ - (\d+) = (\d+)$/);
        assert.ok(match, `Level 5 must be a two-operand fill-in question: ${problem.question}`);
        const answer = problem.question.startsWith('__') ? Number(match[1]) + Number(match[2]) : Number(match[1]) - Number(match[2]);
        assert.equal(problem.choices[problem.correctIdx], answer);
      } else if (level === 6) {
        const match = problem.question.match(/^(\(?-?\d+\)?) ([+-]) (\(?-?\d+\)?) = \?$/);
        assert.ok(match, `Level 6 must contain exactly two integer operands: ${problem.question}`);
        const answer = match[2] === '+' ? integer(match[1]) + integer(match[3]) : integer(match[1]) - integer(match[3]);
        assert.equal(problem.choices[problem.correctIdx], answer);
      } else {
        const addSub = problem.question.match(/^x ([+-]) (\d+) = (-?\d+)$/);
        const multiplication = problem.question.match(/^(\d+)x = (\d+)$/);
        assert.ok(addSub || multiplication, `Level 7 must be a single-operation algebra equation: ${problem.question}`);
        const answer = addSub
          ? (addSub[1] === '+' ? Number(addSub[3]) - Number(addSub[2]) : Number(addSub[3]) + Number(addSub[2]))
          : Number(multiplication[2]) / Number(multiplication[1]);
        assert.equal(problem.choices[problem.correctIdx], answer);
      }
    }
  }
}

for (const level of [1, 2, 3, 4]) {
  assert.deepEqual([...arithmeticTimersSeen.get(level)].sort((a, b) => a - b), expectedTimers[level], `Level ${level} must generate easy, medium, and hard timer durations`);
}

assert.match(js, /questionTimer = questionTimeout;/, 'Timer must reset when a question is shown');
assert.match(js, /if \(questionTimer <= 0 && state === 'question_active'\)/, 'Timer must stop the active question on expiry');
assert.match(js, /hideQuestion\(false\);/, 'Question state must be cleared on game/level transitions');
console.log('game-flow static checks passed');

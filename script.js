// ---------- БАЗА ЗНАНИЙ (без API) ----------
const TACTICS = {
  "4-4-2": {
    strengths: ["Широкие фланги", "Прессинг в центре", "2 чистых форварда"],
    weaknesses: ["Разрыв между линиями", "Медленный переход"],
    tips: [
      "Подними крайних защитников на 5-8 м",
      "Опорник должен страховать фланги"
    ]
  },
  "4-3-3": {
    strengths: ["Контроль мяча", "Прессинг на чужой половине", "Треугольники"],
    weaknesses: ["Фланги без поддержки", "Один нападающий изолирован"],
    tips: [
      "Подними вингеров в полузащиту при обороне",
      "ЦАП должен опускаться за мячом"
    ]
  },
  "3-5-2": {
    strengths: ["Центральное численное преимущество", "Края для латералей"],
    weaknesses: ["Пространство за спинами латералей", "Усталость"],
    tips: [
      "Латерали не выше линии штрафной",
      "Один опорник — строго перед защитой"
    ]
  },
  "5-3-2": {
    strengths: ["5 защитников — защита флангов", "Быстрый выход в атаку"],
    weaknesses: ["Мало игроков в центре", "Вингеры загружены"],
    tips: [
      "Одному опорнику подниматься до полузащиты",
      "Не поднимай центральных защитников высоко"
    ]
  }
};

// ---------- СОСТОЯНИЕ ----------
let currentScheme = "4-4-2";
let selectedPosition = null;   // например "ST"
let fieldCells = [];           // [{row, col, position}] – расстановка

// ---------- DOM ЭЛЕМЕНТЫ ----------
const schemeSelect = document.getElementById("scheme");
const positionContainer = document.getElementById("position-buttons");
const field = document.getElementById("field");
const analyzeBtn = document.getElementById("analyze");
const resetBtn = document.getElementById("reset");
const panelContent = document.getElementById("panel-content");

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
function init() {
  // Кнопки позиций
  renderPositionButtons();
  // Поле
  renderField();
  // Обработчики
  schemeSelect.addEventListener("change", onSchemeChange);
  analyzeBtn.addEventListener("click", analyze);
  resetBtn.addEventListener("click", resetField);
}

// ---------- ПАЛИТРА ПОЗИЦИЙ ----------
function renderPositionButtons() {
  positionContainer.innerHTML = "";
  // Стандартный набор позиций для выбранной схемы
  const positions = getSchemePositions();
  positions.forEach(pos => {
    const btn = document.createElement("button");
    btn.className = "pos-btn" + (selectedPosition === pos ? " active" : "");
    btn.textContent = pos;
    btn.dataset.position = pos;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pos-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPosition = pos;
    });
    positionContainer.appendChild(btn);
  });
}

// Какие позиции показывать (можно расширить)
function getSchemePositions() {
  // Упрощённо – 11 ключевых позиций
  return ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "RM", "LW", "RW", "ST"];
}

// ---------- РИСОВКА ПОЛЯ ----------
function renderField() {
  field.innerHTML = "";
  fieldCells = [];
  for (let row = 0; row < 5; row++) {       // 5 строк (условно)
    for (let col = 0; col < 11; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", onCellClick);
      field.appendChild(cell);
      fieldCells.push({ row, col, element: cell });
    }
  }
  // Рисуем уже расставленных игроков
  fieldCells.forEach(({ row, col, element }) => {
    const placed = fieldCells.find(c => c.row === row && c.col === col)?.player; // не совсем верно, см. ниже
  });
  // Правильнее хранить отдельно массив расстановки
  drawExistingPlayers();
}

// Хранилище расстановки: массив объектов {row, col, position}
let placedPlayers = [];

function drawExistingPlayers() {
  // Убираем всех игроков с клеток
  field.querySelectorAll(".cell").forEach(c => c.classList.remove("has-player"));
  placedPlayers.forEach(p => {
    const cell = field.querySelector(`.cell[data-row="${p.row}"][data-col="${p.col}"]`);
    if (cell) {
      cell.classList.add("has-player");
      cell.innerHTML = `<span class="player-tag">${p.position}</span>`;
    }
  });
}

// Клик по клетке – ставим выбранного игрока
function onCellClick(e) {
  if (!selectedPosition) return;
  const row = Number(e.currentTarget.dataset.row);
  const col = Number(e.currentTarget.dataset.col);

  // Удаляем игрока с этой клетки, если уже есть (замена)
  placedPlayers = placedPlayers.filter(p => !(p.row === row && p.col === col));

  // Если на этой клетке уже есть игрок – заменяем, иначе добавляем
  const existing = placedPlayers.find(p => p.row === row && p.col === col);
  if (existing) {
    existing.position = selectedPosition;
  } else {
    placedPlayers.push({ row, col, position: selectedPosition });
  }

  drawExistingPlayers();
}

// ---------- СБРОС / СХЕМА ----------
function onSchemeChange() {
  currentScheme = schemeSelect.value;
  placedPlayers = [];
  drawExistingPlayers();
  renderPositionButtons();
  panelContent.innerHTML = "Новая схема → расставь игроков → нажми «Анализ»";
}

function resetField() {
  placedPlayers = [];
  drawExistingPlayers();
  panelContent.innerHTML = "Расстановка сброшена. Выбери позиции и нажми «Анализ»";
}

// ---------- АНАЛИЗ (правила) ----------
function analyze() {
  const data = TACTICS[currentScheme];
  if (!data) {
    panelContent.innerHTML = "Для этой схемы нет данных.";
    return;
  }

  // Простая логика: считаем, сколько игроков на флангах / в центре
  const flankPositions = ["LB", "RB", "LM", "RM", "LW", "RW"];
  const centerPositions = ["CM", "CAM", "CDM", "ST", "CB"];
  const flankCount = placedPlayers.filter(p => flankPositions.includes(p.position)).length;
  const centerCount = placedPlayers.filter(p => centerPositions.includes(p.position)).length;

  let extraHtml = "";
  if (flankCount > 6) extraHtml += "<p>⚠️ Слишком много игроков на флангах — ослаблен центр.</p>";
  if (centerCount < 3) extraHtml += "<p>💡 Мало центральных — фланги будут перегружены.</p>";

  let html = `<strong>🔹 ${currentScheme}</strong><br>`;
  html += `<strong>Сильные:</strong><ul>`;
  data.strengths.forEach(s => html += `<li>${s}</li>`);
  html += `</ul><strong>Слабые:</strong><ul>`;
  data.weaknesses.forEach(w => html += `<li>${w}</li>`);
  html += `</ul><strong>Советы:</strong><ul>`;
  data.tips.forEach(t => html += `<li>${t}</li>`);
  html += `</ul>${extraHtml}<p>📊 Расстановка: ${placedPlayers.length}/11</p>`;

  panelContent.innerHTML = html;
}

// ---------- СТАРТ ----------
init();
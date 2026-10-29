// ====================================================
// 1. АКТУАЛЬНЫЙ ГОД В ПОДВАЛЕ
// ====================================================
const yearEl = document.querySelector('#year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}


// ====================================================
// 2. ПЕРЕКЛЮЧЕНИЕ ТЁМНОЙ ТЕМЫ
//    JS переключает класс на <html>, а стили описаны в CSS
// ====================================================
const themeBtn = document.querySelector('#theme-toggle');

if (themeBtn) {
    // Восстанавливаем сохранённую тему (если была)
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');

        const isDark = document.documentElement.classList.contains('dark');
        themeBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}


// ====================================================
// 3. ОТПРАВКА ФОРМЫ БЕЗ ПЕРЕЗАГРУЗКИ СТРАНИЦЫ
// ====================================================
const form = document.querySelector('form');
const statusMsg = document.querySelector('#form-status');

if (form && statusMsg) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();        // отменяем перезагрузку

        const name = document.querySelector('#name').value.trim();

        statusMsg.textContent = `Спасибо, ${name}! Сообщение отправлено.`;
        statusMsg.classList.add('visible');

        form.reset();                  // очищаем поля
    });
}


// ====================================================
// 4. КНОПКА «НАВЕРХ» ПОЯВЛЯЕТСЯ ПРИ ПРОКРУТКЕ
// ====================================================
const upBtn = document.querySelector('#to-top');

if (upBtn) {
    window.addEventListener('scroll', () => {
        upBtn.classList.toggle('visible', window.scrollY > 400);
    });

    upBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ====================================================
// 5. ОЗВУЧКА ТЕКСТА (с паузой / продолжением)
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    const speakBtn = document.getElementById('read-aloud');
    if (!speakBtn) return;

    // Проверяем поддержку синтеза речи
    if (!('speechSynthesis' in window)) {
        speakBtn.style.display = 'none';
        console.warn('Ваш браузер не поддерживает синтез речи.');
        return;
    }
// ====================================================
// 6. УВЕЛИЧЕНИЕ / УМЕНЬШЕНИЕ МАСШТАБА (всей страницы)
// ====================================================
const zoomInBtn  = document.querySelector('#zoom-in');
const zoomOutBtn = document.querySelector('#zoom-out');

const ZOOM_MIN  = 50;    // минимум, %
const ZOOM_MAX  = 200;   // максимум, %
const ZOOM_STEP = 10;    // шаг, %

let zoom = parseInt(localStorage.getItem('zoom'), 10) || 100;

function applyZoom() {
    // zoom масштабирует ВСЁ: текст, картинки, отступы, границы
    document.body.style.zoom = zoom / 100;
    localStorage.setItem('zoom', zoom);
}

if (zoomInBtn && zoomOutBtn) {
    applyZoom();

    zoomInBtn.addEventListener('click', () => {
        if (zoom < ZOOM_MAX) {
            zoom += ZOOM_STEP;
            applyZoom();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoom > ZOOM_MIN) {
            zoom -= ZOOM_STEP;
            applyZoom();
        }
    });
}
    let utterance = null;   // текущий объект озвучки

    // --- Собираем текст только из main, без формы и кнопок ---
    function getPageText() {
        const main = document.querySelector('main');
        if (!main) return '';

        const clone = main.cloneNode(true);
        clone.querySelectorAll('form, button, #to-top, #form-status')
             .forEach(el => el.remove());

        return clone.innerText
            .replace(/\s+/g, ' ')
            .replace(/(\d+)\s*\./g, '$1.')
            .trim();
    }

    // --- Сброс состояния кнопки ---
    function resetButton() {
        speakBtn.textContent = '🔊';
        speakBtn.classList.remove('speaking');
        speakBtn.title = 'Прочитать страницу вслух';
        speakBtn.setAttribute('aria-pressed', 'false');
    }

    // --- Полная остановка ---
    function stopSpeaking() {
        window.speechSynthesis.cancel();
        utterance = null;
        resetButton();
    }

    // --- Старт озвучки ---
    function startSpeaking() {
        const text = getPageText();
        if (!text) return;

        utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
            speakBtn.textContent = '⏸️';
            speakBtn.classList.add('speaking');
            speakBtn.title = 'Пауза / продолжить';
            speakBtn.setAttribute('aria-pressed', 'true');
        };

        utterance.onend = () => {
            stopSpeaking();
        };

        utterance.onerror = (e) => {
            // 'interrupted' и 'canceled' — норма при ручной остановке
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.error('Ошибка озвучки:', e);
            }
            stopSpeaking();
        };

        window.speechSynthesis.speak(utterance);
    }

    // --- Обработчик клика: старт / пауза / продолжение ---
    speakBtn.addEventListener('click', () => {
        const synth = window.speechSynthesis;

        // Ничего не говорит — начинаем
        if (!synth.speaking && !synth.paused) {
            startSpeaking();
            return;
        }

        // Сейчас говорит — ставим на паузу
        if (synth.speaking && !synth.paused) {
            synth.pause();
            speakBtn.textContent = '▶️';
            speakBtn.classList.remove('speaking');
            speakBtn.title = 'Продолжить озвучку';
            return;
        }

        // На паузе — продолжаем
        if (synth.paused) {
            synth.resume();
            speakBtn.textContent = '⏸️';
            speakBtn.classList.add('speaking');
            speakBtn.title = 'Пауза / продолжить';
        }
    });

    // Двойной клик — полная остановка
    speakBtn.addEventListener('dblclick', () => {
        stopSpeaking();
    });

    // Останавливаем озвучку при уходе со страницы
    window.addEventListener('beforeunload', () => {
        window.speechSynthesis.cancel();
    });
});
// ====================================================
// 7. РЕЖИМ ВЫСОКОЙ КОНТРАСТНОСТИ
// ====================================================
const contrastBtn = document.querySelector('#contrast-toggle');

if (contrastBtn) {
    // Восстанавливаем сохранённую настройку
    if (localStorage.getItem('contrast') === 'on') {
        document.documentElement.classList.add('high-contrast');
        contrastBtn.setAttribute('aria-pressed', 'true');
        contrastBtn.title = 'Обычная контрастность';
    }

    contrastBtn.addEventListener('click', () => {
        const root = document.documentElement;
        root.classList.toggle('high-contrast');

        const isOn = root.classList.contains('high-contrast');
        contrastBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        contrastBtn.title = isOn ? 'Обычная контрастность' : 'Высокая контрастность';

        localStorage.setItem('contrast', isOn ? 'on' : 'off');
    });
}
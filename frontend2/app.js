const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
let currentStage = "start";
let currentFile = null;
let chosenFormat = null;
let chosenQuality = null;
let newName = null;

function addMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addChoices(choices, handler) {
  const container = document.createElement("div");
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = choice.label;
    btn.onclick = () => {
      handler(choice.value);
      container.remove();
    };
    container.appendChild(btn);
  });
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function init() {
  addMessage("Привет! Отправь мне JPG для конвертации.");
  setTimeout(() => fileInput.click(), 1000);
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.includes("jpeg")) {
    addMessage("Пожалуйста, загрузи JPG-файл.");
    return;
  }
  currentFile = file;
  addMessage(`Файл получен: ${file.name}`, "user");
  addMessage("Выбери формат:");
  addChoices([
    { label: "WEBP", value: "webp" },
    { label: "JPG", value: "jpeg" }
  ], (fmt) => {
    chosenFormat = fmt;
    chooseQuality();
  });
});

function chooseQuality() {
  const img = new Image();
  img.src = URL.createObjectURL(currentFile);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    addMessage("Выбери качество:");

    const qualities = [1.0, 0.8, 0.6, 0.4];
    const options = [];

    let loaded = 0;
    qualities.forEach(q => {
      canvas.toBlob((blob) => {
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        options.push({ label: `${Math.round(q*100)}% (${sizeMB} MB)`, value: { q, blob } });
        loaded++;
        if (loaded === qualities.length) {
          addChoices(options, ({ q, blob }) => {
            chosenQuality = q;
            askFileName(blob);
          });
        }
      }, `image/${chosenFormat}`, q);
    });
  };
}

function askFileName(blob) {
  addMessage("Введи новое имя файла:");
  userInput.disabled = false;
  sendBtn.disabled = false;
  sendBtn.onclick = () => {
    newName = userInput.value.trim() || "converted";
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;
    saveFile(blob);
  };
}

function saveFile(blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${newName}.${chosenFormat}`;
  link.click();

  addMessage(`Файл готов: ${newName}.${chosenFormat}`, "bot");
  addMessage("Хочешь добавить дату для скрипта?");
  addChoices([
    { label: "Да", value: true },
    { label: "Нет", value: false }
  ], (choice) => {
    if (choice) {
      askDate(blob);
    } else {
      addMessage("Сессия завершена ✅");
    }
  });
}

function askDate(blob) {
  addMessage("Введи дату (ДДММГГГГ или ДДММГГГГЧЧММ):");
  userInput.disabled = false;
  sendBtn.disabled = false;
  sendBtn.onclick = () => {
    const text = userInput.value.trim();
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;

    let dtStr = new Date().toISOString();
    try {
      if (text.length === 8) {
        const [d,m,y] = [text.slice(0,2), text.slice(2,4), text.slice(4)];
        dtStr = `${y}-${m}-${d}`;
      } else if (text.length === 12) {
        const [d,m,y,h,min] = [text.slice(0,2), text.slice(2,4), text.slice(4,8), text.slice(8,10), text.slice(10)];
        dtStr = `${y}-${m}-${d}T${h}:${min}`;
      }
    } catch {}

    const script = `,\n{ url: '${newName}.${chosenFormat}', uploadTime: new Date('${dtStr}') }`;
    addMessage(`Вот твой скрипт:\n\n${script}`);
    addMessage("Сессия завершена ✅");
  };
}

init();

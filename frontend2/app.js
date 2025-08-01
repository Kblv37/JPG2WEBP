import { ImagePool } from 'https://unpkg.com/@squoosh/lib?module';

const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30, 20];
let uploadedFile = null;
let originalInfo = {};
let variants = [];

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Выбери JPG файл!");
    return;
  }

  uploadedFile = fileInput.files[0];
  document.getElementById("qualityOptions").innerHTML = `<p>⏳ Обрабатываю файл...</p>`;

  await analyzeFile(uploadedFile);
});

async function analyzeFile(file) {
  const imagePool = new ImagePool(navigator.hardwareConcurrency);
  const arrayBuffer = await file.arrayBuffer();
  const image = imagePool.ingestImage(arrayBuffer);

  // Получаем разрешение оригинала
  const bitmap = await createImageBitmap(file);
  originalInfo = {
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + " MB",
    resolution: `${bitmap.width}x${bitmap.height}`
  };

  variants = [];

  for (let q of QUALITIES) {
    await image.encode({
      webp: { quality: q }
    });
    const encoded = await image.encodedWith.webp;
    const blob = new Blob([encoded.binary], { type: "image/webp" });

    variants.push({
      quality: q,
      blob,
      size: (blob.size / 1024 / 1024).toFixed(2),
      resolution: `${bitmap.width}x${bitmap.height}`
    });
  }

  await imagePool.close();

  renderQualityButtons();
}

function renderQualityButtons() {
  const qualityDiv = document.getElementById("qualityOptions");
  qualityDiv.innerHTML = "";

  variants.sort((a, b) => b.quality - a.quality);

  variants.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = `${v.quality}% — ${v.size} MB — ${v.resolution}`;
    btn.addEventListener("click", () => downloadVariant(v));
    qualityDiv.appendChild(btn);
  });
}

async function downloadVariant(variant) {
  const newName = prompt("Введите имя файла (без расширения)", "converted") || "converted";
  const url = URL.createObjectURL(variant.blob);

  // Кнопка скачивания
  const a = document.createElement("a");
  a.href = url;
  a.download = `${newName}.webp`;
  a.click();
  URL.revokeObjectURL(url);

  // Запрос даты
  const dateStr = prompt("Введите дату (ДДММГГГГ или ДДММГГГГЧЧММ)", "");
  let dtStr;
  try {
    if (dateStr && dateStr.length === 8) {
      const dt = new Date(
        dateStr.slice(4, 8), // год
        parseInt(dateStr.slice(2, 4)) - 1, // месяц
        dateStr.slice(0, 2) // день
      );
      dtStr = dt.toISOString().split(".")[0];
    } else if (dateStr && dateStr.length === 12) {
      const dt = new Date(
        dateStr.slice(4, 8), // год
        parseInt(dateStr.slice(2, 4)) - 1, // месяц
        dateStr.slice(0, 2), // день
        dateStr.slice(8, 10), // час
        dateStr.slice(10, 12) // минута
      );
      dtStr = dt.toISOString().split(".")[0];
    } else {
      dtStr = new Date().toISOString().split(".")[0];
    }
  } catch {
    dtStr = new Date().toISOString().split(".")[0];
  }

  // Скрипт
  const script = `,
{ url: '${newName}.webp',
  original: { name: '${originalInfo.name}', size: '${originalInfo.size}', resolution: '${originalInfo.resolution}' },
  uploadTime: new Date('${dtStr}') }`;

  const scriptBox = document.getElementById("scriptBox");
  scriptBox.textContent = script;
  scriptBox.style.display = "block";
}

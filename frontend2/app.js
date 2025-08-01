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
  const img = new Image();
  img.src = URL.createObjectURL(uploadedFile);

  const qualityDiv = document.getElementById("qualityOptions");
  qualityDiv.innerHTML = "";
  QUALITIES.forEach(() => {
    const skel = document.createElement("div");
    skel.className = "skeleton";
    qualityDiv.appendChild(skel);
  });

  img.onload = async () => {
    originalInfo = {
      name: uploadedFile.name,
      size: (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB",
      resolution: `${img.width}x${img.height}`
    };

    await analyzeFile(img);
  };
});

async function analyzeFile(img) {
  variants = [];

  for (let q of QUALITIES) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/webp", q / 100)
    );

    variants.push({
      quality: q,
      blob,
      size: (blob.size / 1024 / 1024).toFixed(2),
      resolution: `${img.width}x${img.height}`
    });
  }

  renderQualityCards();
}

function renderQualityCards() {
  const qualityDiv = document.getElementById("qualityOptions");
  qualityDiv.innerHTML = "";

  variants.sort((a, b) => b.quality - a.quality);

  variants.forEach(v => {
    const card = document.createElement("div");
    card.className = "quality-card";

    card.innerHTML = `
      <h3>${v.quality}% качество</h3>
      <p>Размер: ${v.size} MB</p>
      <p>Разрешение: ${v.resolution}</p>
    `;

    const btn = document.createElement("button");
    btn.className = "download-btn";
    btn.textContent = "⬇ Скачать";
    btn.addEventListener("click", () => downloadVariant(v));

    card.appendChild(btn);
    qualityDiv.appendChild(card);
  });
}

async function downloadVariant(variant) {
  const newName = prompt("Введите имя файла (без расширения)", "converted") || "converted";
  const url = URL.createObjectURL(variant.blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${newName}.webp`;
  a.click();
  URL.revokeObjectURL(url);

  const dateStr = prompt("Введите дату (ДДММГГГГ или ДДММГГГГЧЧММ)", "");
  let dtStr;
  try {
    if (dateStr && dateStr.length === 8) {
      const dt = new Date(
        dateStr.slice(4, 8),
        parseInt(dateStr.slice(2, 4)) - 1,
        dateStr.slice(0, 2)
      );
      dtStr = dt.toISOString().split(".")[0];
    } else if (dateStr && dateStr.length === 12) {
      const dt = new Date(
        dateStr.slice(4, 8),
        parseInt(dateStr.slice(2, 4)) - 1,
        dateStr.slice(0, 2),
        dateStr.slice(8, 10),
        dateStr.slice(10, 12)
      );
      dtStr = dt.toISOString().split(".")[0];
    } else {
      dtStr = new Date().toISOString().split(".")[0];
    }
  } catch {
    dtStr = new Date().toISOString().split(".")[0];
  }

  const script = `,
{ url: '${newName}.webp',
  original: { name: '${originalInfo.name}', size: '${originalInfo.size}', resolution: '${originalInfo.resolution}' },
  uploadTime: new Date('${dtStr}') }`;

  const scriptBox = document.getElementById("scriptBox");
  scriptBox.textContent = script;
  scriptBox.style.display = "block";
}

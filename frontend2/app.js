const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30, 20];
let uploadedFile = null;
let originalInfo = {};
let selectedVariant = null;

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

  img.onload = async () => {
    originalInfo = {
      name: uploadedFile.name,
      size: (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB",
      resolution: `${img.width}x${img.height}`
    };

    document.getElementById("fileInfo").style.display = "flex";
    document.getElementById("fileInfo").innerHTML = `
      <img src="${img.src}" alt="preview">
      <div>
        <p><b>Файл:</b> ${originalInfo.name}</p>
        <p><b>Размер:</b> ${originalInfo.size}</p>
        <p><b>Разрешение:</b> ${originalInfo.resolution}</p>
      </div>
    `;

    await analyzeFile(img);
  };
});

async function analyzeFile(img) {
  const qualityDiv = document.getElementById("qualityOptions");
  qualityDiv.innerHTML = "";

  for (let q of QUALITIES) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise((res) =>
      canvas.toBlob(res, "image/webp", q / 100)
    );

    const card = document.createElement("div");
    card.className = "quality-card";
    card.innerHTML = `
      <h3>${q}%</h3>
      <p>${(blob.size / 1024 / 1024).toFixed(2)} MB</p>
      <p>${img.width}x${img.height}</p>
    `;
    const btn = document.createElement("button");
    btn.className = "download-btn";
    btn.textContent = "Скачать";
    btn.addEventListener("click", () => downloadVariant(blob, q));
    card.appendChild(btn);

    qualityDiv.appendChild(card);
  }
}

async function downloadVariant(blob, quality) {
  selectedVariant = { blob, quality };

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `converted_${quality}.webp`;
  a.click();
  URL.revokeObjectURL(url);

  document.getElementById("detailsForm").style.display = "flex";
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const newName = document.getElementById("newName").value || "converted";
  const dateStr = document.getElementById("dateInput").value.trim();
  let dtStr;

  try {
    if (dateStr.length === 8) {
      const dt = new Date(dateStr.slice(4), dateStr.slice(2, 4)-1, dateStr.slice(0,2));
      dtStr = dt.toISOString().split(".")[0];
    } else if (dateStr.length === 12) {
      const dt = new Date(dateStr.slice(4), dateStr.slice(2,4)-1, dateStr.slice(0,2), dateStr.slice(8,10), dateStr.slice(10,12));
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

  document.getElementById("scriptBox").textContent = script;
  document.getElementById("scriptBox").style.display = "block";

  navigator.clipboard.writeText(script);
  alert("Скопировано в буфер обмена!");
});

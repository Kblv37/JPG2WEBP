const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30];
let originalInfo = null;
let selectedVariant = null;
let variants = [];

const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileName");
const fileInfo = document.getElementById("fileInfo");
const qualityOptions = document.getElementById("qualityOptions");
const skeleton = document.getElementById("skeleton");
const newNameInput = document.getElementById("newName");
const dateInput = document.getElementById("dateInput");
const downloadCopyBtn = document.getElementById("downloadCopyBtn");
const scriptBox = document.getElementById("scriptBox");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  fileNameLabel.textContent = file.name;
  skeleton.classList.remove("hidden");
  qualityOptions.innerHTML = "";
  scriptBox.classList.add("hidden");
  downloadCopyBtn.classList.add("hidden");
  document.getElementById("detailsForm").classList.add("hidden");

  const reader = new FileReader();
  reader.onload = async e => {
    const img = new Image();
    img.onload = async () => {
      const width = img.width;
      const height = img.height;
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);

      originalInfo = {
        name: file.name,
        resolution: `${width}x${height}`,
        size: `${sizeMB} MB`,
        file
      };

      fileInfo.classList.remove("hidden");
      fileInfo.textContent = `${file.name} • ${sizeMB} MB • ${width}x${height}`;

      await generateVariants(img);
      skeleton.classList.add("hidden");
      renderQualityButtons();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

async function generateVariants(img) {
  variants = [];
  for (const q of QUALITIES) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise(res =>
      canvas.toBlob(res, "image/webp", q / 100)
    );
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    variants.push({
      quality: q,
      resolution: `${img.width}x${img.height}`,
      size: `${sizeMB} MB`,
      blob,
      width: img.width,
      height: img.height
    });

  }
}

function renderQualityButtons() {
  qualityOptions.innerHTML = "";
  variants.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "quality-btn";
    btn.textContent = `${v.quality}% • ${v.size} • ${v.resolution}`;
    btn.addEventListener("click", (event) => selectQuality(v, event));
    qualityOptions.appendChild(btn);
  });
}

function selectQuality(v, event) {
  selectedVariant = v;

  // Снимаем подсветку со всех кнопок
  document.querySelectorAll(".quality-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // Подсветка нажатой кнопки
  event.target.classList.add("active");

  document.getElementById("detailsForm").classList.remove("hidden");
  downloadCopyBtn.classList.remove("hidden");
  updateScriptBox();
}


function updateScriptBox() {
  if (!selectedVariant) return;

  const newNameVal = newNameInput.value.trim();
  const dateVal = dateInput.value.trim();

  // Логика имени
  let baseName = originalInfo.name.split(".")[0];
  let finalName;
  if (!newNameVal) {
    finalName = baseName;
  } else if (newNameVal.startsWith("+")) {
    finalName = baseName + newNameVal.slice(1);
  } else if (newNameVal.endsWith("+")) {
    finalName = newNameVal.slice(0, -1) + baseName;
  } else {
    finalName = newNameVal;
  }

  const url = `${finalName}.webp`;
  const resolution = originalInfo.resolution;
  const size = originalInfo.size;
  const origName = originalInfo.name;


  // дата
  let dateStr = "";
  if (dateVal.length === 8) {
    dateStr = `${dateVal.slice(4,8)}-${dateVal.slice(2,4)}-${dateVal.slice(0,2)}`;
  } else if (dateVal.length === 12) {
    dateStr = `${dateVal.slice(4,8)}-${dateVal.slice(2,4)}-${dateVal.slice(0,2)}T${dateVal.slice(8,10)}:${dateVal.slice(10,12)}`;
  }

  const script = `,\n{ url: '${url}', original: { name: '${origName}', size: '${size}', resolution: '${resolution}' }${dateStr ? `, uploadTime: new Date('${dateStr}')` : ""} }`;

  scriptBox.textContent = script;
  scriptBox.classList.remove("hidden");
}


newNameInput.addEventListener("input", updateScriptBox);
dateInput.addEventListener("input", updateScriptBox);

downloadCopyBtn.addEventListener("click", () => {
  if (!selectedVariant) return alert("Выбери качество!");

  updateScriptBox();

  // копирование в буфер
  navigator.clipboard.writeText(scriptBox.textContent);

  // скачивание
  const a = document.createElement("a");
  const newNameVal = newNameInput.value.trim();
  let baseName = originalInfo.name.replace(/\.[^/.]+$/, "");
  let finalName;
  if (!newNameVal) {
    finalName = baseName;
  } else if (newNameVal.startsWith("+")) {
    finalName = baseName + newNameVal.slice(1);
  } else if (newNameVal.endsWith("+")) {
    finalName = newNameVal.slice(0, -1) + baseName;
  } else {
    finalName = newNameVal;
  }
  
  a.href = URL.createObjectURL(selectedVariant.blob);
  a.download = `${finalName}.webp`;
  a.click();
});


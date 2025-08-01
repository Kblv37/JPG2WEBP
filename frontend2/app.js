const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30];
let originalInfo = null;
let selectedVariant = null;

const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileName");
const qualityOptions = document.getElementById("qualityOptions");
const skeleton = document.getElementById("skeleton");
const scriptBoxWrapper = document.getElementById("scriptBoxWrapper");
const scriptBox = document.getElementById("scriptBox");
const newNameInput = document.getElementById("newName");
const dateInput = document.getElementById("dateInput");
const downloadBtn = document.getElementById("downloadBtn");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  fileNameLabel.textContent = file.name;
  skeleton.classList.remove("hidden");
  qualityOptions.innerHTML = "";
  scriptBoxWrapper.classList.add("hidden");

  const reader = new FileReader();
  reader.onload = async e => {
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);

      originalInfo = {
        name: file.name,
        resolution: `${width}x${height}`,
        size: `${sizeMB} MB`,
        file
      };

      skeleton.classList.add("hidden");
      renderQualityButtons(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

function renderQualityButtons(img) {
  qualityOptions.innerHTML = "";
  QUALITIES.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "quality-btn";
    btn.textContent = `${q}%`;
    btn.addEventListener("click", () => selectQuality(img, q));
    qualityOptions.appendChild(btn);
  });
}

async function selectQuality(img, q) {
  selectedVariant = { quality: q };
  document.getElementById("detailsForm").classList.remove("hidden");
  updateScriptBox();
}

function updateScriptBox() {
  if (!selectedVariant) return;

  let newNameVal = newNameInput.value.trim();
  const baseName = originalInfo.name.replace(/\.[^/.]+$/, "");

  if (!newNameVal) {
    newNameVal = baseName;
  } else if (newNameVal.startsWith("+")) {
    newNameVal = baseName + newNameVal.slice(1);
  } else if (newNameVal.endsWith("+")) {
    newNameVal = newNameVal.slice(0, -1) + baseName;
  }

  const dateStr = dateInput.value.trim();
  let dtStr;
  try {
    if (dateStr.length === 8) {
      const dt = new Date(dateStr.slice(4), dateStr.slice(2,4)-1, dateStr.slice(0,2));
      dtStr = dt.toISOString().split(".")[0];
    } else if (dateStr.length === 12) {
      const dt = new Date(dateStr.slice(4), dateStr.slice(2,4)-1, dateStr.slice(0,2),
                          dateStr.slice(8,10), dateStr.slice(10,12));
      dtStr = dt.toISOString().split(".")[0];
    } else {
      dtStr = new Date().toISOString().split(".")[0];
    }
  } catch {
    dtStr = new Date().toISOString().split(".")[0];
  }

  const script = `,
{ url: '${newNameVal}.webp',
  original: { name: '${originalInfo.name}', size: '${originalInfo.size}', resolution: '${originalInfo.resolution}' },
  uploadTime: new Date('${dtStr}') }`;

  scriptBox.textContent = script;
  scriptBoxWrapper.classList.remove("hidden");
}

newNameInput.addEventListener("input", updateScriptBox);
dateInput.addEventListener("input", updateScriptBox);

downloadBtn.addEventListener("click", () => {
  if (!selectedVariant) return alert("Выбери качество!");
  updateScriptBox();
  alert("Файл был бы скачан здесь (имитация).");
});

document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(scriptBox.textContent).then(() => {
    alert("Скрипт скопирован!");
  });
});

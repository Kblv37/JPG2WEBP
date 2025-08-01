const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileInfo = document.getElementById("fileInfo");
const qualitySection = document.getElementById("qualitySection");
const qualityOptions = document.getElementById("qualityOptions");
const downloadSection = document.getElementById("downloadSection");
const downloadBtn = document.getElementById("downloadBtn");
const scriptSection = document.getElementById("scriptSection");
const dateInput = document.getElementById("dateInput");
const genScriptBtn = document.getElementById("genScriptBtn");
const scriptBox = document.getElementById("scriptBox");
const copyBtn = document.getElementById("copyBtn");
const loadingSection = document.getElementById("loadingSection");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let originalFile = null;
let originalName = "";
let originalSize = 0;
let resolution = "";
let selectedFileName = "";
let selectedBlob = null;

const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30, 20];

uploadBtn.onclick = () => fileInput.click();

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.includes("jpeg")) {
    fileInfo.textContent = "Выберите JPG-файл.";
    return;
  }

  originalFile = file;
  originalName = file.name;
  originalSize = (file.size / 1024 / 1024).toFixed(2);

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    resolution = `${img.width}x${img.height}`;
    fileInfo.textContent = `Файл: ${originalName} (${originalSize} MB, ${resolution})`;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    qualityOptions.innerHTML = "";
    qualitySection.classList.add("hidden");
    downloadSection.classList.add("hidden");
    scriptSection.classList.add("hidden");
    loadingSection.classList.remove("hidden");

    const results = [];

    for (let q of QUALITIES) {
      const blob = await new Promise(resolve => canvas.toBlob(b => resolve(b), "image/webp", q/100));
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      results.push({ quality: q, blob, sizeMB });
    }

    qualityOptions.innerHTML = "";
    results.forEach(({ quality, blob, sizeMB }) => {
      const btn = document.createElement("button");
      btn.textContent = `${quality}% — ${sizeMB} MB — ${resolution}`;
      btn.onclick = () => {
        document.querySelectorAll(".quality-list button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedBlob = blob;
        selectedFileName = `${originalName.split(".")[0]}_${quality}.webp`;
        downloadSection.classList.remove("hidden");
      };
      qualityOptions.appendChild(btn);
    });

    loadingSection.classList.add("hidden");
    qualitySection.classList.remove("hidden");
  };
});

downloadBtn.onclick = () => {
  if (!selectedBlob) return;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(selectedBlob);
  link.download = selectedFileName;
  link.click();
  scriptSection.classList.remove("hidden");
};

genScriptBtn.onclick = () => {
  let dtStr = new Date().toISOString();
  const text = dateInput.value.trim();
  if (text.length === 8 || text.length === 12) {
    try {
      if (text.length === 8) {
        const [d,m,y] = [text.slice(0,2), text.slice(2,4), text.slice(4)];
        dtStr = `${y}-${m}-${d}`;
      } else if (text.length === 12) {
        const [d,m,y,h,min] = [text.slice(0,2), text.slice(2,4), text.slice(4,8), text.slice(8,10), text.slice(10)];
        dtStr = `${y}-${m}-${d}T${h}:${min}`;
      }
    } catch {}
  }

  const script = `,
{ url: '${selectedFileName}', 
  original: { name: '${originalName}', size: '${originalSize} MB', resolution: '${resolution}' }, 
  uploadTime: new Date('${dtStr}') }`;

  scriptBox.textContent = script;
  copyBtn.classList.remove("hidden");
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(scriptBox.textContent).then(() => {
    copyBtn.textContent = "✅ Скопировано!";
    setTimeout(() => copyBtn.textContent = "📋 Скопировать скрипт", 2000);
  });
};

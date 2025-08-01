const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileInfo = document.getElementById("fileInfo");
const qualitySection = document.getElementById("qualitySection");
const qualityOptions = document.getElementById("qualityOptions");
const scriptSection = document.getElementById("scriptSection");
const dateInput = document.getElementById("dateInput");
const genScriptBtn = document.getElementById("genScriptBtn");
const scriptBox = document.getElementById("scriptBox");
const copyBtn = document.getElementById("copyBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let originalFile = null;
let originalName = "";
let originalSize = 0;
let resolution = "";
let selectedFileName = "";
let selectedFormat = "webp";
let selectedQuality = 0;
let selectedBlob = null;

const QUALITIES = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];

uploadBtn.onclick = () => fileInput.click();

fileInput.addEventListener("change", (e) => {
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
  img.onload = () => {
    resolution = `${img.width}x${img.height}`;
    fileInfo.textContent = `Файл: ${originalName} (${originalSize} MB, ${resolution})`;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    qualityOptions.innerHTML = "";
    qualitySection.classList.remove("hidden");

    QUALITIES.forEach(q => {
      canvas.toBlob((blob) => {
        const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
        const btn = document.createElement("button");
        btn.textContent = `${Math.round(q*100)}% (${sizeMB} MB)`;
        btn.onclick = () => {
          selectedQuality = q;
          selectedBlob = blob;
          selectedFileName = `${originalName.split(".")[0]}_${Math.round(q*100)}.webp`;

          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = selectedFileName;
          link.click();

          scriptSection.classList.remove("hidden");
        };
        qualityOptions.appendChild(btn);
      }, "image/webp", q);
    });
  };
});

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
    copyBtn.textContent = "Скопировано!";
    setTimeout(() => copyBtn.textContent = "Скопировать скрипт", 2000);
  });
};

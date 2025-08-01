const QUALITIES = [100, 90, 80, 70, 60, 50, 40, 30, 20];
let uploadedFile = null;
let originalInfo = {};
let selectedVariant = null;

const fileLabel = document.getElementById("fileLabel");
const skeleton = document.getElementById("skeleton");
const qualityOptions = document.getElementById("qualityOptions");
const detailsForm = document.getElementById("detailsForm");
const scriptBox = document.getElementById("scriptBox");

document.getElementById("fileInput").addEventListener("change", async (e) => {
  if (!e.target.files.length) return;

  uploadedFile = e.target.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(uploadedFile);

  img.onload = async () => {
    originalInfo = {
      name: uploadedFile.name,
      size: (uploadedFile.size / 1024 / 1024).toFixed(2) + " MB",
      resolution: `${img.width}x${img.height}`
    };

    fileLabel.innerHTML = `<b>${originalInfo.name}</b><br>
      ${originalInfo.size}, ${originalInfo.resolution}`;

    skeleton.style.display = "grid";
    skeleton.innerHTML = QUALITIES.map(() => "<div></div>").join("");

    const variants = [];
    for (let q of QUALITIES) {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise((res) =>
        canvas.toBlob(res, "image/webp", q / 100)
      );

      variants.push({ quality: q, blob, size: (blob.size / 1024 / 1024).toFixed(2) });
    }

    skeleton.style.display = "none";
    qualityOptions.innerHTML = "";
    variants.forEach(v => {
      const card = document.createElement("div");
      card.className = "quality-card";
      card.innerHTML = `
        <h3>${v.quality}%</h3>
        <p>${v.size} MB</p>
        <p>${originalInfo.resolution}</p>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".quality-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedVariant = v;
        detailsForm.style.display = "flex";
      });
      qualityOptions.appendChild(card);
    });
  };
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!selectedVariant) {
    alert("Сначала выбери качество!");
    return;
  }

  const newName = document.getElementById("newName").value || "converted";
  const dateStr = document.getElementById("dateInput").value.trim();
  let dtStr;

  try {
    if (dateStr.length === 8) {
      const dt = new Date(dateStr.slice(4), dateStr.slice(2,4)-1, dateStr.slice(0,2));
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

  const url = URL.createObjectURL(selectedVariant.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${newName}.webp`;
  a.click();
  URL.revokeObjectURL(url);

  const script = `,
{ url: '${newName}.webp',
  original: { name: '${originalInfo.name}', size: '${originalInfo.size}', resolution: '${originalInfo.resolution}' },
  uploadTime: new Date('${dtStr}') }`;

  scriptBox.textContent = script;
  scriptBox.style.display = "block";
  navigator.clipboard.writeText(script);
  alert("Скрипт скопирован в буфер!");
});

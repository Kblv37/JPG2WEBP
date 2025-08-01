const backendURL = "https://jpg2webp.onrender.com";

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  const formData = new FormData();
  formData.append("file", file);

  document.getElementById("preview").innerHTML = "<p>⏳ Загружаю...</p>";

  try {
    const res = await fetch(`${backendURL}/preview`, { method: "POST", body: formData });
    const data = await res.json();

    if (data.error) {
      document.getElementById("preview").innerText = "Ошибка: " + data.error;
      return;
    }

    let html = `<p>Разрешение: ${data.width}×${data.height}</p><p>Выберите качество:</p>`;
    html += "<div>";
    data.options.forEach(opt => {
      html += `<button onclick="convert(${opt.quality})">${opt.quality}% (${opt.size} MB)</button> `;
    });
    html += "</div>";
    document.getElementById("preview").innerHTML = html;

    window._selectedFile = file;

  } catch (err) {
    document.getElementById("preview").innerText = "Ошибка сервера";
  }
});

async function convert(quality) {
  const formData = new FormData();
  formData.append("file", window._selectedFile);
  formData.append("quality", quality);

  document.getElementById("result").innerHTML = "<p>⏳ Конвертирую...</p>";

  try {
    const res = await fetch(`${backendURL}/convert`, { method: "POST", body: formData });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    document.getElementById("result").innerHTML = `
      <p>✅ Конвертация завершена!</p>
      <a href="${url}" download="converted.webp">Скачать WEBP (${quality}%)</a>
    `;
  } catch (err) {
    document.getElementById("result").innerText = "Ошибка при конвертации";
  }
}

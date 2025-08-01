const backendUrl = "https://jpg2webp.onrender.com"; // URL твоего сервера на Render

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) {
        alert("Выбери JPG файл!");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
        // Шаг 1: анализируем файл
        const analyzeRes = await fetch(`${backendUrl}/analyze`, {
            method: "POST",
            body: formData
        });

        if (!analyzeRes.ok) throw new Error("Ошибка анализа файла");

        const data = await analyzeRes.json();
        const qualityDiv = document.getElementById("qualityOptions");
        qualityDiv.innerHTML = "";

        data.qualities.forEach(q => {
            const btn = document.createElement("button");
            btn.textContent = `${q.quality}% (${q.size_mb} MB, ${q.resolution})`;
            btn.addEventListener("click", () => convertFile(file, q.quality));
            qualityDiv.appendChild(btn);
        });

    } catch (err) {
        console.error(err);
        alert("Ошибка: не удалось подключиться к серверу.");
    }
});

async function convertFile(file, quality) {
    const newName = prompt("Введите имя файла (без расширения)", "converted") || "converted";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("quality", quality);
    formData.append("new_name", newName);
    formData.append("date", prompt("Введите дату (ДДММГГГГ или ДДММГГГГЧЧММ)", ""));

    try {
        const res = await fetch(`${backendUrl}/convert`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Ошибка конвертации");

        // Получаем blob файла
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        // Создаем ссылку для скачивания
        const a = document.createElement("a");
        a.href = url;
        a.download = `${newName}.webp`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Забираем скрипт из заголовка
        const script = res.headers.get("X-Script");
        if (script) {
            const scriptBox = document.getElementById("scriptBox");
            scriptBox.textContent = script;
            scriptBox.style.display = "block";
        }

    } catch (err) {
        console.error(err);
        alert("Ошибка: не удалось выполнить конвертацию.");
    }
}

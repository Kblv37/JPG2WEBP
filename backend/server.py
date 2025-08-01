from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import io
from datetime import datetime

app = Flask(__name__)

# Разрешаем доступ с Netlify
CORS(app, resources={r"/*": {"origins": "https://photos-port-dev.netlify.app"}})

@app.route("/")
def home():
    return "Сервер JPG→WEBP работает 🚀"

@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "Файл не найден"}), 400

    img = Image.open(file.stream).convert("RGB")
    width, height = img.size
    results = []

    for q in [100, 90, 80, 70, 60, 50, 40, 30, 20]:
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=q)
        size_mb = round(len(buf.getvalue()) / 1024 / 1024, 2)
        results.append({
            "quality": q,
            "size_mb": size_mb,
            "resolution": f"{width}x{height}"
        })

    return jsonify({"qualities": results})

@app.route("/convert", methods=["POST"])
def convert():
    file = request.files.get("file")
    quality = int(request.form.get("quality", 80))
    new_name = request.form.get("new_name", "converted")
    date_str = request.form.get("date")

    if not file:
        return jsonify({"error": "Файл не найден"}), 400

    img = Image.open(file.stream).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality)
    buf.seek(0)

    width, height = img.size
    size_mb = round(len(buf.getvalue()) / 1024 / 1024, 2)

    # Дата
    try:
        if date_str and len(date_str) == 8:
            dt = datetime.strptime(date_str, "%d%m%Y")
            dt_str = dt.strftime("%Y-%m-%d")
        elif date_str and len(date_str) == 12:
            dt = datetime.strptime(date_str, "%d%m%Y%H%M")
            dt_str = dt.strftime("%Y-%m-%dT%H:%M")
        else:
            dt_str = datetime.now().strftime("%Y-%m-%dT%H:%M")
    except ValueError:
        dt_str = datetime.now().strftime("%Y-%m-%dT%H:%M")

    script = f""",\n{{ url: '{new_name}.webp', original: {{ name: '{file.filename}', size: '{size_mb} MB', resolution: '{width}x{height}' }}, uploadTime: new Date('{dt_str}') }}"""

    return send_file(
        buf,
        mimetype="image/webp",
        as_attachment=True,
        download_name=f"{new_name}.webp",
        headers={"X-Script": script}
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

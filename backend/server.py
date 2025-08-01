from flask import Flask, request, jsonify, send_file, make_response
from PIL import Image
import io
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # чтобы Netlify мог обращаться к API

@app.route("/")
def home():
    return "✅ Сервер JPG→WEBP работает!"

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

    return jsonify({
        "width": width,
        "height": height,
        "qualities": results
    })

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

    # дата для скрипта
    try:
        if date_str and len(date_str) == 8:
            dt = datetime.strptime(date_str, "%d%m%Y")
        elif date_str and len(date_str) == 12:
            dt = datetime.strptime(date_str, "%d%m%Y%H%M")
        else:
            dt = datetime.now()
        dt_str = dt.strftime("%Y-%m-%dT%H:%M")
    except ValueError:
        dt_str = datetime.now().strftime("%Y-%m-%dT%H:%M")

    script = {
        "script": f""",\n{{ url: '{new_name}.webp', original: {{ name: '{file.filename}', size: '{size_mb} MB', resolution: '{width}x{height}' }}, uploadTime: new Date('{dt_str}') }}"""
    }

    # ответ с файлом и скриптом
    response = make_response(send_file(
        buf,
        mimetype="image/webp",
        as_attachment=True,
        download_name=f"{new_name}.webp"
    ))
    response.headers["X-Script"] = script["script"]
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)



from io import BytesIO

from api.libs.image_lsb import hide_message_in_image
from flask import Flask, jsonify, request, send_file
from PIL import Image

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    text = request.form['text']
    num_lsb = request.form['lsb']
    file = request.files['file']
    try:
        image = Image.open(file)
        image = hide_message_in_image(image, text, int(num_lsb))

        img_io = BytesIO()
        image.save(img_io, image.format, quality=100)
        img_io.seek(0)

        return send_file(img_io, mimetype=file.mimetype)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except:
        return jsonify({"message": "Something went wrong"}), 400

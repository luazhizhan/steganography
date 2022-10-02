

from io import BytesIO

from flask import Flask, jsonify, make_response, request, send_file
from libs.api.jpg_lsb import encodeInJpg
from PIL import Image
import pillow_jpls

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']
    file = request.files['file']
    payload_form = request.form.get('payload')
    payload_file = request.files.get('payload')
    try:
        image = Image.open(file)
        payload = payload_file.read() if payload_form is None else str.encode(payload_form)
        image = encodeInJpg(image, payload, int(num_lsb))

        img_io = BytesIO()
        image.save(img_io, "JPEG-LS")
        img_io.seek(0)

        return send_file(img_io, mimetype=file.mimetype)
    except ValueError as e:
        return make_response(jsonify({"message": str(e)}), 400)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Something went wrong"}), 400)

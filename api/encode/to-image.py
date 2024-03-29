

from io import BytesIO

from flask import Flask, jsonify, make_response, request, send_file
from libs.api.image_lsb import hide_message_in_image
from PIL import Image

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
        image = image.convert('RGB') if image.format != 'PNG' else image
        payload = payload_file.read() if payload_form is None else payload_form
        image = hide_message_in_image(image, payload, int(num_lsb))

        img_io = BytesIO()
        image.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(img_io, mimetype=file.mimetype)
    except ValueError as e:
        return make_response(jsonify({"message": str(e)}), 400)
    except:
        return jsonify({"message": 'Unable to encode image file.'}), 400

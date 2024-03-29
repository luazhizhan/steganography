

from io import BytesIO

from flask import Flask, jsonify, request, send_file
from libs.api.image_lsb import recover_message_from_image
from PIL import Image

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    mime_type = request.form['mimeType']
    num_lsb = request.form['lsb']
    file = request.files['file']
    try:
        image = Image.open(file)
        data = recover_message_from_image(image,  int(num_lsb))
        if mime_type == '':
            return jsonify({"message": data.decode('utf-8')})
        else:
            return send_file(BytesIO(data), mimetype=mime_type)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except:
        return jsonify({"message": 'Unable to decode image file.'}), 400

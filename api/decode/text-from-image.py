

from api.libs.image_lsb import recover_message_from_image
from flask import Flask, jsonify, request
from PIL import Image

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']
    file = request.files['file']
    try:
        image = Image.open(file)
        data = recover_message_from_image(image,  int(num_lsb))
        return jsonify({"text": data.decode('utf-8')})
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except:
        return jsonify({"message": "Something went wrong"}), 400

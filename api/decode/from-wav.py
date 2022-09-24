from io import BytesIO

from flask import Flask, jsonify, request, send_file
from libs.api.wav_lsb import recover_data

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    mime_type = request.form['mimeType']
    num_lsb = request.form['lsb']
    recover_size = request.form['recoverSize']
    file = request.files['file']
    try:
        data = recover_data(file,  int(num_lsb), int(recover_size))
        if mime_type == '':
            return jsonify({"message": data.decode('utf-8')})
        else:
            return send_file(BytesIO(data), mimetype=mime_type)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        print(e)
        return jsonify({"message": "Something went wrong"}), 400

from flask import Flask, jsonify, make_response, request, send_file
from libs.api.wav_lsb import hide_data

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']
    file = request.files['file']
    payload_form = request.form.get('payload')
    payload_file = request.files.get('payload')
    try:
        payload = payload_file.read() if payload_form is None else payload_form
        wav_io = hide_data(file, payload, int(num_lsb))

        return send_file(wav_io, mimetype=file.mimetype)
    except ValueError as e:
        return make_response(jsonify({"message": str(e)}), 400)
    except:
        return make_response(jsonify({"message": "Something went wrong"}), 400)

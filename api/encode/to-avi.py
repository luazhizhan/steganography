
from io import BytesIO

from flask import Flask, jsonify, make_response, request, send_file

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']
    file = request.files['file']
    payload_form = request.form.get('payload')
    payload_file = request.files.get('payload')
    try:
        return send_file(BytesIO(file.read()), mimetype=file.mimetype)
    except ValueError as e:
        return make_response(jsonify({"message": str(e)}), 400)
    except:
        return jsonify({"message": 'Unable to encode video file.'}), 400

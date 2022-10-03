

from io import BytesIO

from flask import Flask, jsonify, request, send_file

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    mime_type = request.form['mimeType']
    num_lsb = request.form['lsb']
    file = request.files['file']
    try:
        if mime_type == '':
            return jsonify({"message": "Decoded message"})
        else:
            return send_file(BytesIO(""), mimetype=mime_type)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except:
        return jsonify({"message": 'Unable to decode avi file.'}), 400

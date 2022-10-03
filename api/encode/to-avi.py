
from io import BytesIO

from flask import Flask, jsonify, make_response, request, send_file
from libs.api.avi_lsb import encode
app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']
    file = request.files['file']
    payload_form = request.form.get('payload')
    payload_file = request.files.get('payload')
    try:
        payload = payload_file.read() if payload_form is None else str.encode(payload_form)  # reads payload
        f = open("/tmp/source.avi", "wb")
        f.write(file)
        f.close()
        # encode, return cover file.
        encode("/tmp/source.avi", payload, int(num_lsb))
        f = open("/tmp/output.avi", "rb")
        return send_file(BytesIO(f.read()), mimetype=file.mimetype)
    except ValueError as e:
        print(e)
        return make_response(jsonify({"message": str(e)}), 400)
    except:
        return jsonify({"message": 'Unable to encode avi file.'}), 400

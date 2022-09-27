from flask import Flask, jsonify, make_response, request, send_file
from libs.api.mp3_lsb import encode

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    num_lsb = request.form['lsb']  # user input n bit
    file = request.files['file']  # cover file
    payload_form = request.form.get('payload')  # get payload
    payload_file = request.files.get('payload')
    try:
        payload = payload_file.read() if payload_form is None else str.encode(
            payload_form)  # reads payload

        # encode, return cover file.
        mp3_io = encode(file.read(), payload, int(num_lsb))
        return send_file(mp3_io, mimetype='audio/mpeg')
    except ValueError as e:
        return make_response(jsonify({"message": str(e)}), 400)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Something went wrong"}), 400)

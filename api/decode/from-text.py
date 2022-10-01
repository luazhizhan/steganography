
from flask import Flask, jsonify, request, send_file
from libs.api.text_lsb import decode

app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    mime_type = request.form['mimeType']
    num_lsb = request.form['lsb']
    file = request.files['file']
    try:
        data = decode(file.read(),  num_lsb)
        if mime_type == '':
            return jsonify({"message": data.getvalue().decode('utf-8')})
        else:
            return send_file(data, mimetype=mime_type)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        print(e)
        return jsonify({"message": "Something went wrong"}), 400

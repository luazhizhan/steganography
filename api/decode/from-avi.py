

from io import BytesIO

from flask import Flask, jsonify, request, send_file
from libs.api.avi_lsb import decode
app = Flask(__name__)


@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def catch_all(path):
    mime_type = request.form['mimeType']
    num_lsb = request.form['lsb']
    file = request.files['file']
    recover_size = request.form['recoverSize']
    try:
        f = open("/tmp/input.avi", "wb")
        f.write(file)
        f.close()
        
        data = decode("/tmp/input.avi",  int(num_lsb), int(recover_size))
        if mime_type == '':
            return jsonify({"message": data.getvalue().decode('utf-8')})
        else:
            return send_file(BytesIO(""), mimetype=mime_type)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except:
        return jsonify({"message": 'Unable to decode avi file.'}), 400

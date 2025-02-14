from flask import Flask, request, jsonify
import gspread
from google.oauth2.service_account import Credentials
import os
import json

# Configurar Flask
app = Flask(__name__)

# Obtener credenciales desde la variable de entorno
credentials_info = json.loads(os.getenv("GOOGLE_CREDENTIALS"))
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
creds = Credentials.from_service_account_info(credentials_info, scopes=SCOPES)
client = gspread.authorize(creds)

# ID de tu Google Sheet (reemplaza con el tuyo)
SHEET_ID = "1jxB-pDVRadGbDRlsWn1guxsfqad3JYN7acXSr0vjdxQ"
sheet_usuarios = client.open_by_key(SHEET_ID).worksheet("USUARIOS")
sheet_vehiculos = client.open_by_key(SHEET_ID).worksheet("VEHICULOS")
sheet_registros = client.open_by_key(SHEET_ID).worksheet("REGISTROS")

@app.route("/", methods=["GET"])
def home():
    return "Middleware funcionando 🚀"

# Ruta para recibir webhooks desde AppSheet
@app.route("/webhook", methods=["POST"])
def recibir_webhook():
    try:
        data = request.json
        tabla = data.get("tabla")
        datos = data.get("datos")

        if not tabla or not datos:
            return jsonify({"error": "Datos inválidos"}), 400

        # Insertar datos en la hoja correspondiente
        if tabla == "USUARIOS":
            sheet_usuarios.append_row([datos["ID_NOMBRE"], datos["NOMBRE"], datos["DIVISION"], datos["FOTO"]])
        elif tabla == "VEHICULOS":
            sheet_vehiculos.append_row([datos["ID_VEHICULO"], datos["VEHICULO"], datos["CALLSING"], datos["DIVISION"], datos["FOTO"]])
        elif tabla == "REGISTROS":
            sheet_registros.append_row([datos["ID_USUARIO"], datos["NOMBRE"], datos["DIVISION"], datos["CALLSING"], datos["FECHA"], datos["USO DE INSUMOS"]])

        return jsonify({"mensaje": "Datos recibidos correctamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Iniciar el servidor en Railway
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

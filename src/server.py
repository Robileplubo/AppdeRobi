from flask import Flask, request, jsonify
from flask_cors import CORS
from surfScoreCalculator import calculate_surfscore
import requests

app = Flask(__name__)
CORS(app)

@app.route('/calculate-score', methods=['POST'])
def calculate_score():
    try:
        data = request.get_json()
        
        score = calculate_surfscore(
            wave_height=data['wave_height'],
            air_temp=data['air_temp'],
            water_temp=data['water_temp'],
            wind_speed=data['wind_speed'],
            precipitation=data['precipitation'],
            wave_period=data['wave_period'],
            wave_power=data['wave_power']
        )
        
        return jsonify({'score': score})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/nominatim/reverse', methods=['GET'])
def proxy_nominatim_reverse():
    """Proxy pour l'API Nominatim reverse geocoding"""
    try:
        # Récupérer les paramètres de la requête
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        zoom = request.args.get('zoom', 10)
        
        # Construire l'URL vers l'API Nominatim
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom={zoom}&addressdetails=1"
        
        # Effectuer la requête avec les en-têtes appropriés
        headers = {
            'User-Agent': 'SurfScore/1.0',
            'Accept-Language': 'fr'
        }
        response = requests.get(url, headers=headers)
        
        # Vérifier si la requête a réussi
        if response.status_code != 200:
            return jsonify({'error': 'Erreur lors de la requête vers Nominatim'}), response.status_code
        
        # Retourner les données
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/nominatim/search', methods=['GET'])
def proxy_nominatim_search():
    """Proxy pour l'API Nominatim search"""
    try:
        # Récupérer les paramètres de la requête
        q = request.args.get('q')
        viewbox = request.args.get('viewbox')
        limit = request.args.get('limit', 10)
        
        # Construire l'URL vers l'API Nominatim
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={q}&viewbox={viewbox}&limit={limit}&addressdetails=1"
        
        # Effectuer la requête avec les en-têtes appropriés
        headers = {
            'User-Agent': 'SurfScore/1.0',
            'Accept-Language': 'fr'
        }
        response = requests.get(url, headers=headers)
        
        # Vérifier si la requête a réussi
        if response.status_code != 200:
            return jsonify({'error': 'Erreur lors de la requête vers Nominatim'}), response.status_code
        
        # Retourner les données
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000) 
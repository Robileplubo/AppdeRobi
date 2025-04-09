from flask import Flask, request, jsonify
from flask_cors import CORS
from surfScoreCalculator import calculate_surfscore

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

if __name__ == '__main__':
    app.run(port=5000) 
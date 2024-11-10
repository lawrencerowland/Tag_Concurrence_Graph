from flask import Flask, render_template, jsonify, send_from_directory, request, Response
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = "tag_network_visualization_secret"

# Load network data
def load_network_data():
    with open('tag_concurrence_graph.json', 'r') as f:
        data = json.load(f)
        
        # Transform data to Cytoscape format
        elements = {
            "nodes": [
                {
                    "data": {
                        "id": node["id"],
                        "weight": node["weight"]  # Use weight directly from node data
                    }
                } for node in data["nodes"]
            ],
            "edges": [
                {
                    "data": {
                        "id": f"{edge['source']}-{edge['target']}",
                        "source": edge["source"],
                        "target": edge["target"],
                        "weight": edge.get("weight", 1)
                    }
                } for edge in data.get("edges", [])
            ]
        }
        return elements

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/network')
def get_network():
    return jsonify(load_network_data())

@app.route('/api/export', methods=['POST'])
def export_network():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Create a timestamped filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_data = {
            "nodes": data["nodes"],
            "edges": data["edges"],
            "metadata": {
                "exported_at": timestamp,
                "filter_weight": data.get("filter_weight", 0),
                "layout": data.get("layout", "fcose")
            }
        }
        
        # Return the JSON with appropriate headers for download
        return Response(
            json.dumps(export_data, indent=2),
            mimetype='application/json',
            headers={
                'Content-Disposition': f'attachment;filename=network_export_{timestamp}.json'
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

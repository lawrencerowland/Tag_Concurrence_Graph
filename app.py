from flask import Flask, render_template, jsonify, send_from_directory, request, Response
import json
import os
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "tag_network_visualization_secret"

# Load network data
def load_network_data(dataset='lawrence'):
    # Use absolute paths to ensure correct file loading
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Debug print
    print(f"Loading dataset: {dataset}")
    
    # Select correct file
    if dataset == 'lawrence':
        filename = os.path.join(base_dir, 'tag_concurrence_graph.json')
    else:
        filename = os.path.join(base_dir, 'complex_project_management_graph.json')
    
    print(f"Loading file: {filename}")  # Debug print
    
    with open(filename, 'r') as f:
        data = json.load(f)
        print(f"Loaded data with {len(data['nodes'])} nodes")  # Debug print
        
        # Transform data to Cytoscape format
        elements = {
            "nodes": [
                {
                    "data": {
                        "id": node["id"],
                        "weight": node["weight"]
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
    dataset = request.args.get('dataset', 'lawrence')
    print(f"Loading dataset: {dataset}")  # Debug log
    data = load_network_data(dataset)
    print(f"Loaded data with {len(data['nodes'])} nodes")  # Debug log
    response = jsonify(data)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if not file.filename.endswith('.json'):
        return jsonify({"error": "Only JSON files are allowed"}), 400
        
    try:
        # Read and validate JSON structure
        data = json.loads(file.read().decode('utf-8'))
        
        # Validate required structure
        if not isinstance(data, dict) or 'nodes' not in data:
            raise ValueError("Invalid JSON structure")
            
        # Validate nodes have required fields
        for node in data['nodes']:
            if not isinstance(node, dict) or 'id' not in node or 'weight' not in node:
                raise ValueError("Invalid node structure")
        
        # Save valid file with absolute path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, 'tag_concurrence_graph.json')
        file.seek(0)
        file.save(file_path)
        
        return jsonify({"message": "File uploaded successfully"}), 200
        
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON file"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Upload failed"}), 500

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

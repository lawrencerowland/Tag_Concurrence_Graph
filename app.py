from flask import Flask, render_template, jsonify, send_from_directory
import json
import os
import logging

app = Flask(__name__)
app.secret_key = "tag_network_visualization_secret"

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load network data
def load_network_data():
    try:
        with open('tag_concurrence_network (1).json', 'r') as f:
            logger.info("Loading network data from file...")
            raw_data = json.load(f)
            logger.debug(f"Raw data structure: {json.dumps(raw_data)[:200]}...")
            
            # Transform data to Cytoscape format
            elements = []
            
            # Add nodes first
            for node in raw_data.get('nodes', []):
                node_id = node.get('id')
                if node_id:
                    elements.append({
                        'group': 'nodes',
                        'data': {
                            'id': node_id,
                            'weight': 0  # Will be calculated from edges
                        }
                    })
            
            # Calculate weights and add edges
            node_weights = {}
            for edge in raw_data.get('edges', []):
                source = edge.get('source')
                target = edge.get('target')
                weight = edge.get('weight', 1)
                
                if source and target:
                    # Update node weights
                    node_weights[source] = node_weights.get(source, 0) + weight
                    node_weights[target] = node_weights.get(target, 0) + weight
                    
                    # Add edge
                    elements.append({
                        'group': 'edges',
                        'data': {
                            'id': f"{source}-{target}",
                            'source': source,
                            'target': target,
                            'weight': weight
                        }
                    })
            
            # Update node weights
            for elem in elements:
                if elem.get('group') == 'nodes':
                    node_id = elem['data']['id']
                    elem['data']['weight'] = node_weights.get(node_id, 0)
            
            logger.info(f"Successfully transformed data: {len([e for e in elements if e['group'] == 'nodes'])} nodes, {len([e for e in elements if e['group'] == 'edges'])} edges")
            return elements

    except FileNotFoundError as e:
        logger.error(f"Network data file not found: {e}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON data: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error loading network data: {str(e)}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/network')
def get_network():
    data = load_network_data()
    logger.debug(f"Returning network data: {json.dumps(data)[:200]}...")
    return jsonify(data)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                           'favicon.ico', mimetype='image/vnd.microsoft.icon')

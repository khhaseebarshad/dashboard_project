import os
import sys
from flask import Flask, request, jsonify, Response
import pandas as pd
import numpy as np

# Add current directory to path to support local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from filters import load_and_clean_data, filter_dataframe, calculate_kpis
import charts

app = Flask(__name__, static_folder='public', static_url_path='')

# Global cached dataframe for fast response
CLEANED_DF = None

def get_cached_df():
    global CLEANED_DF
    if CLEANED_DF is None:
        CLEANED_DF = load_and_clean_data()
    return CLEANED_DF

@app.route('/')
def index():
    """Serves the dashboard home page."""
    return app.send_static_file('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    """
    Returns KPIs, filtered raw records, and unique filter options in JSON format.
    """
    try:
        original_df = get_cached_df()
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
        
    # Apply filters based on request arguments
    filtered_df = filter_dataframe(original_df, request.args)
    
    # Calculate KPIs
    kpi_metrics = calculate_kpis(filtered_df, original_df)
    
    # Get unique countries and disciplines for filter lists (from original df, sorted)
    unique_countries = sorted(original_df['country'].dropna().unique().tolist())
    unique_disciplines = sorted(original_df['disciplines'].dropna().unique().tolist())
    
    # Format filtered records for data table (convert to dict list)
    # Select only the columns needed by the frontend to keep payload size small (from 13.5MB to 2.5MB)
    columns_needed = ['code', 'name', 'gender', 'age', 'height', 'weight', 'country', 'disciplines', 'events', 'birth_date', 'birth_year']
    existing_cols = [c for c in columns_needed if c in filtered_df.columns]
    
    df_subset = filtered_df[existing_cols].copy()
    # Replace nan values with None for correct JSON serialization
    for col in df_subset.columns:
        df_subset[col] = df_subset[col].astype(object).replace({np.nan: None})
        
    records = df_subset.to_dict(orient='records')
    
    return jsonify({
        'kpis': kpi_metrics,
        'records': records,
        'countries': unique_countries,
        'disciplines': unique_disciplines
    })

@app.route('/api/charts/<chart_type>', methods=['GET'])
def get_chart(chart_type):
    """
    Dynamically renders and returns a chart image (PNG) based on active filters.
    """
    try:
        original_df = get_cached_df()
    except FileNotFoundError:
        return "Dataset not found", 404
        
    filtered_df = filter_dataframe(original_df, request.args)
    
    # Chart generation routing
    chart_bytes = None
    if chart_type == 'pie':
        chart_bytes = charts.generate_pie_chart(filtered_df)
    elif chart_type == 'histogram':
        chart_bytes = charts.generate_histogram(filtered_df)
    elif chart_type == 'line':
        chart_bytes = charts.generate_line_chart(filtered_df)
    elif chart_type == 'bar':
        chart_bytes = charts.generate_bar_chart(filtered_df)
    elif chart_type == 'scatter':
        chart_bytes = charts.generate_scatter_plot(filtered_df)
    elif chart_type == 'box':
        chart_bytes = charts.generate_box_plot(filtered_df)
    elif chart_type == 'heatmap':
        chart_bytes = charts.generate_heatmap(filtered_df)
    elif chart_type == 'area':
        chart_bytes = charts.generate_area_chart(filtered_df)
    elif chart_type == 'count':
        chart_bytes = charts.generate_count_plot(filtered_df)
    elif chart_type == 'violin':
        chart_bytes = charts.generate_violin_plot(filtered_df)
    else:
        return "Invalid chart type", 400
        
    return Response(chart_bytes, mimetype='image/png')

# Pre-load/clean the dataset at startup
try:
    get_cached_df()
    print("Dataset pre-loaded and cached successfully.")
except Exception as e:
    print(f"Warning: Failed to pre-load dataset at startup: {e}")

if __name__ == '__main__':
    # Local development server execution
    app.run(debug=True, port=5000)


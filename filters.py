import os
import pandas as pd
import numpy as np

# We'll use absolute path mapping to load the dataset
def load_and_clean_data():
    """
    Loads the athletes dataset and performs data cleaning:
    - Parses birth_date to extract birth year and computes age (relative to 2026).
    - Standardizes height and weight, replacing 0.0/NaN with gender-specific medians:
      * Male: Height = 185.0 cm, Weight = 88.0 kg
      * Female: Height = 171.0 cm, Weight = 67.0 kg
    - Cleans the 'disciplines' string (removing brackets, quotes, etc.).
    - Returns a cleaned DataFrame.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'data', 'athletes.csv')
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}")
        
    df = pd.read_csv(file_path)
    
    # 1. Clean disciplines and events strings
    # Columns disciplines and events look like: ['Wrestling'] or ["Men's Greco-Roman 97kg"]
    for col in ['disciplines', 'events']:
        if col in df.columns:
            df[col] = df[col].astype(str)\
                .str.replace("[", "", regex=False)\
                .str.replace("]", "", regex=False)\
                .str.replace("'", "", regex=False)\
                .str.replace('"', '', regex=False)\
                .str.strip()
                
    # 2. Extract Birth Year and Compute Age
    if 'birth_date' in df.columns:
        df['birth_date_dt'] = pd.to_datetime(df['birth_date'], errors='coerce')
        # If parsing fails, fall back to extracting the first 4 characters
        fallback_years = df['birth_date'].astype(str).str.slice(0, 4).str.extract(r'(\d{4})')[0]
        fallback_years = pd.to_numeric(fallback_years, errors='coerce').fillna(1996).astype(int)
        
        birth_year = df['birth_date_dt'].dt.year.fillna(fallback_years).astype(int)
        df['birth_year'] = birth_year
        # Compute age as of current year 2026
        df['age'] = 2026 - birth_year
    else:
        df['birth_year'] = 1996
        df['age'] = 30
        
    # 3. Clean Height
    if 'height' in df.columns:
        # Standardize 0.0 values to NaN
        df['height'] = df['height'].replace(0.0, np.nan)
        # Group by gender and fill with median of non-zero heights
        df['height'] = df.groupby('gender')['height'].transform(lambda x: x.fillna(x.median()))
        # If any are still NaN, use global medians
        df['height'] = df['height'].fillna(178.0)
    else:
        df['height'] = 178.0
        
    # 4. Clean Weight
    if 'weight' in df.columns:
        # Standardize 0.0 values to NaN
        df['weight'] = df['weight'].replace(0.0, np.nan)
        # Group by gender and fill with median of non-zero weights
        df['weight'] = df.groupby('gender')['weight'].transform(lambda x: x.fillna(x.median()))
        # If any are still NaN, use global medians
        df['weight'] = df['weight'].fillna(75.0)
    else:
        df['weight'] = 75.0
        
    # Standardize data types
    df['age'] = df['age'].astype(int)
    df['height'] = df['height'].astype(float)
    df['weight'] = df['weight'].astype(float)
    df['gender'] = df['gender'].astype(str)
    df['country'] = df['country'].astype(str)
    
    return df

def filter_dataframe(df, params):
    """
    Filters the DataFrame based on query parameters.
    """
    filtered_df = df.copy()
    
    # 1. Gender Filter (Male, Female, All/None matches both)
    if 'gender' in params and params['gender'] != '' and params['gender'] != 'all':
        filtered_df = filtered_df[filtered_df['gender'].str.lower() == params['gender'].lower()]
        
    # 2. Age Range Filter
    if 'min_age' in params and params['min_age'] != '':
        filtered_df = filtered_df[filtered_df['age'] >= int(params['min_age'])]
    if 'max_age' in params and params['max_age'] != '':
        filtered_df = filtered_df[filtered_df['age'] <= int(params['max_age'])]
        
    # 3. Height Range Filter
    if 'min_height' in params and params['min_height'] != '':
        filtered_df = filtered_df[filtered_df['height'] >= float(params['min_height'])]
    if 'max_height' in params and params['max_height'] != '':
        filtered_df = filtered_df[filtered_df['height'] <= float(params['max_height'])]
        
    # 4. Weight Range Filter
    if 'min_weight' in params and params['min_weight'] != '':
        filtered_df = filtered_df[filtered_df['weight'] >= float(params['min_weight'])]
    if 'max_weight' in params and params['max_weight'] != '':
        filtered_df = filtered_df[filtered_df['weight'] <= float(params['max_weight'])]
        
    # 5. Country Filter (multi-select comma-separated list)
    if 'countries' in params and params['countries']:
        country_vals = params['countries']
        if isinstance(country_vals, str):
            country_vals = [x.strip() for x in country_vals.split(',') if x.strip()]
        if country_vals:
            filtered_df = filtered_df[filtered_df['country'].isin(country_vals)]
            
    # 6. Discipline Filter (multi-select comma-separated list)
    if 'disciplines' in params and params['disciplines']:
        disc_vals = params['disciplines']
        if isinstance(disc_vals, str):
            disc_vals = [x.strip() for x in disc_vals.split(',') if x.strip()]
        if disc_vals:
            # Match if any of the comma separated strings matches the disciplines column
            filtered_df = filtered_df[filtered_df['disciplines'].isin(disc_vals)]
            
    # 7. Search / Text Filter (keyword search across Name, Nickname, Country, and Disciplines)
    if 'search' in params and params['search']:
        search_query = params['search'].strip().lower()
        if search_query:
            # Safe fillna for text fields to prevent string contains crashes
            name_mask = filtered_df['name'].astype(str).str.lower().str.contains(search_query)
            
            nick_mask = pd.Series([False] * len(filtered_df), index=filtered_df.index)
            if 'nickname' in filtered_df.columns:
                nick_mask = filtered_df['nickname'].fillna('').astype(str).str.lower().str.contains(search_query)
                
            country_mask = filtered_df['country'].astype(str).str.lower().str.contains(search_query)
            disc_mask = filtered_df['disciplines'].astype(str).str.lower().str.contains(search_query)
            
            filtered_df = filtered_df[name_mask | nick_mask | country_mask | disc_mask]
            
    return filtered_df

def calculate_kpis(df, original_df):
    """
    Calculates key metrics for the filtered dataframe compared to the original dataframe.
    """
    total_records = len(df)
    original_records = len(original_df)
    
    if total_records == 0:
        return {
            'total_records': 0,
            'original_records': original_records,
            'avg_age': 0.0,
            'avg_height': 0.0,
            'avg_weight': 0.0,
            'top_country': 'N/A',
            'top_discipline': 'N/A',
            'male_percentage': 0.0
        }
        
    avg_age = round(df['age'].mean(), 1)
    avg_height = round(df['height'].mean(), 1)
    avg_weight = round(df['weight'].mean(), 1)
    
    # Top Country
    country_counts = df['country'].value_counts()
    top_country = country_counts.index[0] if not country_counts.empty else 'N/A'
    
    # Top Discipline
    disc_counts = df['disciplines'].value_counts()
    top_discipline = disc_counts.index[0] if not disc_counts.empty else 'N/A'
    
    # Male percentage
    male_count = len(df[df['gender'] == 'Male'])
    male_percentage = round((male_count / total_records) * 100, 1)
    
    return {
        'total_records': total_records,
        'original_records': original_records,
        'avg_age': avg_age,
        'avg_height': avg_height,
        'avg_weight': avg_weight,
        'top_country': top_country,
        'top_discipline': top_discipline,
        'male_percentage': male_percentage
    }

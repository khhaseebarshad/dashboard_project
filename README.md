# Global Athletes Analytics Dashboard

A premium-grade, interactive data visualization dashboard for analyzing global athlete profiles. Built with a Flask back-end (for data wrangling and Matplotlib/Seaborn visualization rendering) and a custom glassmorphic dark-themed HTML/JS/CSS frontend. The application is configured to run locally or deploy serverlessly to **Vercel**.

## Course Metadata
* **Course Name**: Exploratory Data Analysis
* **Instructor Name**: Ali Hassan Sherazi
* **Submission Date**: 05-June-2026

## Project Folder Structure

```
/dashboard_project/
  ├── data/
  │   └── athletes.csv           # Raw dataset (unmodified)
  ├── notebooks/
  │   └── analysis.ipynb         # Exploratory Data Analysis (EDA) Notebook
  ├── api/
  │   └── app.py                 # Vercel Serverless Function entry point
  ├── public/
  │   ├── index.html             # Dashboard frontend layout
  │   ├── styles.css             # Glassmorphic dark styling
  │   └── app.js                 # Frontend state and API controller
  ├── app.py                     # Main Flask server core
  ├── charts.py                  # Matplotlib / Seaborn chart generators
  ├── filters.py                 # Data cleaning and filtering functions
  ├── vercel.json                # Vercel deployment routing config
  └── requirements.txt           # Python package dependencies
```

## Setup and Installation

### 1. Prerequisites
Ensure you have **Python 3.8+** installed.

### 2. Local Installation
Clone or navigate to the project directory and install dependencies:

```bash
cd dashboard_project
pip install -r requirements.txt
```

### 3. Running Locally
Run the Flask server:

```bash
python app.py
```

The terminal will print the local server URL. Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## Data Cleaning & Preprocessing

The `athletes.csv` dataset contains various missing values (zeros) in the height and weight columns. We apply the following preprocessing rules in `filters.py`:
1. **Age Calculation**: Parses the `birth_date` column, extracts the birth year, and computes `age = 2026 - birth_year` for demographic analysis.
2. **Height Imputation**: Missing or `0.0` values are imputed with the gender-specific median calculated from non-zero heights:
   * **Male Median**: `185.0 cm`
   * **Female Median**: `171.0 cm`
3. **Weight Imputation**: Missing or `0.0` values are imputed with the gender-specific median calculated from non-zero weights:
   * **Male Median**: `88.0 kg`
   * **Female Median**: `67.0 kg`
4. **Strings Cleanup**: Strips quotes, brackets, and white spaces from the raw `disciplines` and `events` array fields for clean text filtering.

---

## Interactive Filters & KPIs

All filters are reactive and linked dynamically. Applying a filter instantly updates the KPI cards, the raw data explorer table, and all 10 charts simultaneously:
* **Search / Text Filter**: Filters athletes by name, nickname, country, or discipline.
* **Gender Filter**: Filter by Male, Female, or All.
* **Double Range Sliders**: Adjust double-handle sliders for Age, Height, and Weight ranges.
* **Dropdown Filters**: Multi-select dropdown inputs for Countries and Disciplines (populated dynamically based on dataset options).
* **Reset All Filters**: A single button to restore all sliders and inputs to defaults.
* **KPI Cards**: Displays current Matched Athlete count, Average Age, Average Height, and Average Weight.
* **Data Table & Export**: View matched rows with page pagination (10 rows per page) and export the active filtered list as a CSV file.

---

## Required Visualizations (10 Chart Types)

The dashboard renders 10 distinct, non-overlapping chart types designed with a transparent template that fits the dark background:
1. **Gender Breakdown (Pie Chart)**: Shows the proportional distribution of Male vs. Female athletes.
2. **Age Distribution (Histogram)**: Displays frequency density and trend curve of athlete ages.
3. **Height Trend (Line Chart)**: Represents the trend of average athlete height across birth years.
4. **Top 10 Countries (Bar Chart)**: Compares the number of athletes representing the top 10 countries.
5. **Height vs. Weight (Scatter Plot)**: Shows correlation and clustering colored by gender.
6. **Weight Spread (Box Plot)**: Analyzes median, quartiles, and outliers of weight per gender.
7. **Numeric Attributes Correlation (Heatmap)**: Correlation matrix between Age, Height, and Weight.
8. **Cumulative Count (Area Chart)**: Displays the cumulative sum of athletes across birth years.
9. **Top 5 Disciplines (Count Plot)**: Frequency counts of the top 5 sports segmented by gender.
10. **Height violin Distribution (Violin Plot)**: Combines box plot features with probability density per gender.

---

## Vercel Deployment

This project is fully optimized for serverless deployment on Vercel:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```
2. **Deploy**:
   Run the deployment command in the `dashboard_project` root folder:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to deploy the project. The configuration in `vercel.json` will automatically route the Flask app backend serverless calls (`/api/*`) and serve static pages (`/public`).

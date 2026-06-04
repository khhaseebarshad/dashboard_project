import sys
import os

# Add the project root directory to the python path so imports function correctly on Vercel
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Import the Flask instance as 'app' for the Vercel serverless runtime
from app import app

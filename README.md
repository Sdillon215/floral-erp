# Floral ERP

## Backend Setup

Create and activate a virtual environment, then install dependencies:

```
cd backend
python -m venv venv
# Git Bash / WSL
source venv/Scripts/activate
# PowerShell
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Run the API locally:

```
uvicorn app.main:app --reload --port 8000
```

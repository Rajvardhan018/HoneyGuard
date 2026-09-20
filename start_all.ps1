Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "HONEYGUARD CYBER INTELLIGENCE PLATFORM - LOCAL LAUNCHER" -ForegroundColor Cyan
Write-Host "Detect. Deceive. Analyze. Respond." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "backend;."

# Start Backend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PYTHONPATH='backend;.'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Start Frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "Services started! Browser opened to http://localhost:5173" -ForegroundColor Green

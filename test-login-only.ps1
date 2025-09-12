# Simple login test
Write-Host "Testing login endpoint..." -ForegroundColor Green

try {
    Write-Host "Attempting login to http://localhost:5029/api/auth/login" -ForegroundColor Yellow
    
    $body = '{"email":"test@test.com","password":"Passw0rd!"}'
    Write-Host "Request body: $body" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri "http://localhost:5029/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -Verbose
    
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Token received: $($response.accessToken.Substring(0,50))..." -ForegroundColor Green
    
} catch {
    Write-Host "Login failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get the response content if available
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}
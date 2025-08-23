# Test Azure Speech Services directly
$subscriptionKey = "FSGJjTf1CzJCu0qHtFJdpna6T6bC6MuKp1bEMVAH7NaovPToxByfJQQJ99BHAC4f1cMXJ3w3AAAYACOGZAUm"
$region = "westus"
$audioFile = "sample-audio-files\sample-scrum.mp3"

$uri = "https://$region.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed"

try {
    $audioBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $audioFile))
    Write-Host "Audio file size: $($audioBytes.Length) bytes"
    
    $headers = @{
        'Ocp-Apim-Subscription-Key' = $subscriptionKey
        'Content-Type' = 'audio/mpeg'
    }
    
    Write-Host "Sending request to: $uri"
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $audioBytes -Headers $headers -ContentType 'audio/mpeg'
    
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}

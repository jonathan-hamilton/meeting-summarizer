# Test Azure Speech Services with different settings
$subscriptionKey = "FSGJjTf1CzJCu0qHtFJdpna6T6bC6MuKp1bEMVAH7NaovPToxByfJQQJ99BHAC4f1cMXJ3w3AAAYACOGZAUm"
$region = "westus"
$audioFile = "sample-audio-files\sample-scrum.mp3"

# Test different endpoint configurations
$testConfigs = @(
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US"
        Description = "Simple format, en-US"
    },
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en&format=simple"
        Description = "Simple format, en"
    },
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1?language=en-US&format=detailed"
        Description = "Interactive mode, detailed"
    }
)

try {
    $audioBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $audioFile))
    Write-Host "Audio file size: $($audioBytes.Length) bytes"
    
    $headers = @{
        'Ocp-Apim-Subscription-Key' = $subscriptionKey
        'Content-Type' = 'audio/mpeg'
    }
    
    foreach ($config in $testConfigs) {
        Write-Host "`n--- Testing: $($config.Description) ---"
        Write-Host "URI: $($config.Uri)"
        
        try {
            $response = Invoke-RestMethod -Uri $config.Uri -Method Post -Body $audioBytes -Headers $headers -ContentType 'audio/mpeg'
            
            Write-Host "Response:"
            $response | ConvertTo-Json -Depth 5
        }
        catch {
            Write-Host "Error for $($config.Description): $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response body: $responseBody"
            }
        }
    }
}
catch {
    Write-Host "Error reading file: $($_.Exception.Message)"
}

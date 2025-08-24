# Test Azure Speech Services with different configurations
$subscriptionKey = "FSGJjTf1CzJCu0qHtFJdpna6T6bC6MuKp1bEMVAH7NaovPToxByfJQQJ99BHAC4f1cMXJ3w3AAAYACOGZAUm"
$region = "westus"
$audioFile = "sample-audio-files\sample-scrum.mp3"

# Test different endpoint configurations
$testConfigs = @(
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=simple"
        Description = "Conversation mode, simple format"
        ContentType = "audio/mpeg"
    },
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1?language=en-US&format=simple"
        Description = "Dictation mode, simple format"
        ContentType = "audio/mpeg"
    },
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/interactive/cognitiveservices/v1?language=en-US&format=simple"
        Description = "Interactive mode, simple format"
        ContentType = "audio/mpeg"
    },
    @{
        Uri = "https://$region.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed&profanity=raw"
        Description = "Conversation mode, detailed, raw profanity"
        ContentType = "audio/mpeg"
    }
)

try {
    $audioBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $audioFile))
    Write-Host "Audio file: $audioFile"
    Write-Host "File size: $($audioBytes.Length) bytes"
    Write-Host "=" * 80
    
    $headers = @{
        'Ocp-Apim-Subscription-Key' = $subscriptionKey
    }
    
    foreach ($config in $testConfigs) {
        Write-Host "`n--- Testing: $($config.Description) ---"
        Write-Host "URI: $($config.Uri)"
        Write-Host "Content-Type: $($config.ContentType)"
        
        try {
            $headers['Content-Type'] = $config.ContentType
            
            $response = Invoke-RestMethod -Uri $config.Uri -Method Post -Body $audioBytes -Headers $headers -ContentType $config.ContentType
            
            Write-Host "✅ SUCCESS"
            if ($response.DisplayText) {
                Write-Host "DisplayText: $($response.DisplayText)"
            } elseif ($response.RecognitionStatus) {
                Write-Host "Status: $($response.RecognitionStatus)"
                if ($response.Duration) {
                    Write-Host "Duration: $($response.Duration) ($(($response.Duration / 10000000).ToString('F1'))s)"
                }
                if ($response.NBest -and $response.NBest.Count -gt 0) {
                    Write-Host "Best result confidence: $($response.NBest[0].Confidence)"
                    if ($response.NBest[0].Display) {
                        Write-Host "Best result text: $($response.NBest[0].Display)"
                    }
                }
            } else {
                Write-Host "Raw response:"
                $response | ConvertTo-Json -Depth 3
            }
        }
        catch {
            Write-Host "❌ ERROR: $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode
                Write-Host "Status Code: $statusCode"
                try {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    Write-Host "Response body: $responseBody"
                }
                catch {
                    Write-Host "Could not read error response body"
                }
            }
        }
        
        Write-Host "-" * 40
        Start-Sleep -Seconds 1  # Rate limiting
    }
}
catch {
    Write-Host "Error reading file: $($_.Exception.Message)"
}

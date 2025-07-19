param([string]$AudioFile = "MeetingSummarizer.Api\test-audio.mp3")

try {
    $uri = "http://localhost:5029/api/summary/transcribe"
    $filePath = Resolve-Path $AudioFile
    
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"audioFile`"; filename=`"$(Split-Path $filePath -Leaf)`"",
        "Content-Type: audio/mpeg",
        "",
        [System.IO.File]::ReadAllText($filePath),
        "--$boundary--"
    ) -join $LF
    
    Write-Host "Testing upload of: $filePath"
    Write-Host "To endpoint: $uri"
    
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary"
    
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $response.Content
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

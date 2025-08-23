param([string]$AudioFile = "sample-audio-files\sample-scrum.mp3")

try {
    $uri = "http://localhost:5029/api/summary/transcribe"
    $filePath = Resolve-Path $AudioFile
    
    Write-Host "Testing upload of: $filePath"
    Write-Host "To endpoint: $uri"
    
    # Read the file as bytes (binary data)
    $audioBytes = [System.IO.File]::ReadAllBytes($filePath)
    Write-Host "File size: $($audioBytes.Length) bytes"
    
    # Use Add-Type to load necessary assemblies for HTTP client
    Add-Type -AssemblyName System.Net.Http
    
    $httpClient = New-Object System.Net.Http.HttpClient
    $multipartContent = New-Object System.Net.Http.MultipartFormDataContent
    
    # Create file content
    $fileContent = New-Object System.Net.Http.ByteArrayContent -ArgumentList @(,$audioBytes)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("audio/mpeg")
    
    # Add the file to the multipart content
    $multipartContent.Add($fileContent, "audioFile", (Split-Path $filePath -Leaf))
    
    # Send the request
    $response = $httpClient.PostAsync($uri, $multipartContent).Result
    $responseContent = $response.Content.ReadAsStringAsync().Result
    
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $responseContent
    
    # Clean up
    $fileContent.Dispose()
    $multipartContent.Dispose()
    $httpClient.Dispose()
    
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

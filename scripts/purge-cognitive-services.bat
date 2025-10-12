@echo off
echo Purging soft-deleted Cognitive Services accounts...

echo Purging meetingsummary-dev-speech...
az cognitiveservices account purge --name "meetingsummary-dev-speech" --location "westus" --resource-group "dummy"

echo Purging ss-meeting-summary-io...
az cognitiveservices account purge --name "ss-meeting-summary-io" --location "westus" --resource-group "dummy"

echo Purging ai-meetingsummaryio708206843444...
az cognitiveservices account purge --name "ai-meetingsummaryio708206843444" --location "westus" --resource-group "dummy"

echo Purging timestamp-based accounts...
az cognitiveservices account purge --name "meetingsummary-dev-10112202-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10112241-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10112305-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10112343-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120159-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120309-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120338-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120349-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120520-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120530-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120540-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120551-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120602-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120613-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120640-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120650-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120701-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120716-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120736-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120804-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120818-speech" --location "westus" --resource-group "dummy"
az cognitiveservices account purge --name "meetingsummary-dev-10120835-speech" --location "westus" --resource-group "dummy"

echo Cleanup complete!
pause
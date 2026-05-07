<#
PowerShell deploy helper: create GitHub repo, push, set secrets, optionally trigger Render deploy.
Requires: gh CLI (logged in) and git.
#>
param()
if(-not (Get-Command gh -ErrorAction SilentlyContinue)){
  Write-Error "gh CLI is required. Install from https://cli.github.com/"
  exit 1
}
if(-not (Get-Command git -ErrorAction SilentlyContinue)){
  Write-Error "git is required."
  exit 1
}

$GH_OWNER = Read-Host 'GitHub owner (username or org)'
$REPO_NAME = Read-Host 'Repository name (will be created)'
$privateAns = Read-Host 'Make repo private? (y/N)'
$privateFlag = '--public'
if($privateAns -match '^[Yy]'){$privateFlag='--private'}

Write-Host "Creating repository $GH_OWNER/$REPO_NAME..."
gh repo create "$GH_OWNER/$REPO_NAME" $privateFlag --source=. --remote=origin --push
Write-Host "Repository created and pushed."

Write-Host "Enter secrets (press Enter to skip)."
$smtpHost = Read-Host 'SMTP_HOST'
$smtpPort = Read-Host 'SMTP_PORT'
$smtpUser = Read-Host 'SMTP_USER'
$smtpPass = Read-Host -AsSecureString 'SMTP_PASS' | ConvertFrom-SecureString
$twSid = Read-Host 'TWILIO_ACCOUNT_SID'
$twToken = Read-Host -AsSecureString 'TWILIO_AUTH_TOKEN' | ConvertFrom-SecureString
$twFrom = Read-Host 'TWILIO_WHATSAPP_FROM'

function Set-Secret($name,$value){
  if([string]::IsNullOrWhiteSpace($value)) { return }
  Write-Host "Setting secret $name"
  gh secret set $name --repo "$GH_OWNER/$REPO_NAME" --body $value
}

Set-Secret SMTP_HOST $smtpHost
Set-Secret SMTP_PORT $smtpPort
Set-Secret SMTP_USER $smtpUser
# we stored secure strings as encrypted text; you may prefer to paste raw values
Set-Secret SMTP_PASS $smtpPass
Set-Secret TWILIO_ACCOUNT_SID $twSid
Set-Secret TWILIO_AUTH_TOKEN $twToken
Set-Secret TWILIO_WHATSAPP_FROM $twFrom

Write-Host 'Secrets set (skipped empty)'

$trigger = Read-Host 'Do you want to trigger a Render deploy now? (y/N)'
if($trigger -match '^[Yy]'){
  $renderKey = Read-Host 'RENDER_API_KEY'
  $renderId = Read-Host 'RENDER_SERVICE_ID'
  if([string]::IsNullOrWhiteSpace($renderKey) -or [string]::IsNullOrWhiteSpace($renderId)){
    Write-Host 'Missing Render API key or Service ID. Skipping trigger.'
  } else {
    Write-Host 'Triggering Render deploy...'
    Invoke-RestMethod -Method Post -Uri "https://api.render.com/v1/services/$renderId/deploys" -Headers @{Authorization = "Bearer $renderKey"} -Body '{"clearCache": true}' -ContentType 'application/json'
    Write-Host 'Render deploy triggered.'
  }
}

Write-Host "Done. Visit https://github.com/$GH_OWNER/$REPO_NAME"

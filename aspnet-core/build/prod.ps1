# COMMON PATHS

$buildFolder = (Get-Item -Path "./" -Verbose).FullName
$slnFolder = Join-Path $buildFolder "../"
$outputFolder = Join-Path $buildFolder "PMS"
$webHostFolder = Join-Path $slnFolder "src/PMS.Web.Host"
$migratorFolder = Join-Path $slnFolder "src/PMS.Migrator"
$ngFolder = Join-Path $buildFolder "../../angular"
$docsFolder = Join-Path $buildFolder "../../docs"

## CLEAR ######################################################################

Remove-Item $outputFolder -Force -Recurse -ErrorAction Ignore
New-Item -Path $outputFolder -ItemType Directory

## RESTORE NUGET PACKAGES #####################################################

Set-Location $slnFolder
dotnet restore

## PUBLISH WEB HOST PROJECT ###################################################

Set-Location $webHostFolder
dotnet publish --output (Join-Path $outputFolder "Host")


# Set-Location $webHostFolder
# dotnet publish --output (Join-Path $outputFolder "EPortal")


## REPLACE TENANTID #############################################################
# $appConfigPath = (Join-Path $outputFolder "EPortal/app.config")
# Get-Content $appConfigPath) -replace "SS.TenantId", "SSE.TenantId" | Set-Content $appConfigPath


## BUILD REPORTER #############################################################

Set-Location $msbuildFolder

## .\msbuild (Join-Path $slnFolder "PMSPlus.Report.sln") /p:DeployOnBuild=true /p:PublishProfile=FolderProfile

Set-Location $buildFolder

#$reporterConfigPath = Join-Path $outputReporterFolder "Configuration/connectionStrings.config"
#(Get-Content $reporterConfigPath) -replace "PMSDb-dev", "PMSDb" | Set-Content $reporterConfigPath

## PUBLISH ANGULAR UI PROJECT #################################################

Set-Location $ngFolder
& yarn
& yarn run publish
& Copy-Item -Path (Join-Path $ngFolder "dist\PMS\browser\*") -Destination (Join-Path $outputFolder "Host\wwwroot") -Recurse -Container
#Copy-Item (Join-Path $ngFolder "Dockerfile") (Join-Path $outputFolder "ng")

## PUBLISH MIGRATOR PROJECT ###################################################

Set-Location $migratorFolder
#dotnet publish /p:PublishProfile=FolderProfile
dotnet publish -c Release -r win-x64 --self-contained false --output (Join-Path $outputFolder "Migrator")


# Remove appconfig.production from Host wwwroot (production only)
$hostAppConfigPath = Join-Path $outputFolder "Host\wwwroot\assets\appconfig.production.json"
if (Test-Path $hostAppConfigPath) {
    Remove-Item $hostAppConfigPath -Force -ErrorAction SilentlyContinue
}

# Remove migrator appsettings.json (production only)
$migratorAppSettingsPath = Join-Path $outputFolder "Migrator\appsettings.json"
if (Test-Path $migratorAppSettingsPath) {
    Remove-Item $migratorAppSettingsPath -Force -ErrorAction SilentlyContinue
}

## PUBLISH DOCS ##############################################################
Set-Location $docsFolder
& retype build
& Copy-Item -Path (Join-Path $docsFolder ".build") -Destination (Join-Path $outputFolder "Guide") -Recurse -Container

# Change UI configuration
# $ngConfigPath = Join-Path $outputFolder "host/wwwroot/assets/appconfig.production.json"
# (Get-Content $ngConfigPath) -replace "192.168.1.5", "10.0.0.118" | Set-Content $ngConfigPath
# (Get-Content $ngConfigPath) -replace "192.168.1.5", "10.0.0.118" | Set-Content $ngConfigPath

# $portalConfigPath = Join-Path $outputFolder "eportal/wwwroot/assets/appconfig.production.json"
# (Get-Content $portalConfigPath) -replace "192.168.1.5", "10.0.0.118" | Set-Content $portalConfigPath
# (Get-Content $portalConfigPath) -replace "192.168.1.5", "10.0.0.118" | Set-Content $portalConfigPath

## FINALIZE ###################################################################

Set-Location $buildFolder





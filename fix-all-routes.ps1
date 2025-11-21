# Fix all bus routes in Rabat-Sale-Temara network with connected geometry
param(
    [Parameter(Mandatory=$false)]
    [string]$Operator = "ALSA",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:8081/api"
)

Write-Host "==================================================================="
Write-Host "       Rabat-Sale-Temara Bus Network Geometry Fixer"
Write-Host "==================================================================="
Write-Host ""

Write-Host "[1/2] Fetching all ALSA bus routes in Rabat-Sale-Temara..."
Write-Host ""

# Bounding box for Rabat-Sale-Temara region (Morocco)
$bbox = "33.85,-7.0,34.15,-6.7"
$query = '[out:json][timeout:90];relation["route"="bus"]["operator"~"' + $Operator + '",i](' + $bbox + ');out ids;'

try {
    $response = Invoke-RestMethod -Uri "https://overpass-api.de/api/interpreter" -Method Post -Body "data=$query" -ContentType "application/x-www-form-urlencoded"
    $totalRoutes = $response.elements.Count
    Write-Host "[OK] Found $totalRoutes bus routes in region"
} catch {
    Write-Host "[ERROR] Failed to fetch route list: $_"
    exit 1
}

if ($totalRoutes -eq 0) {
    Write-Host "[ERROR] No routes found"
    exit 1
}

$routeIds = $response.elements | ForEach-Object { $_.id }

Write-Host ""
Write-Host "[2/2] Fetching geometry and updating database..."
Write-Host ""

# Helper functions
function Get-Distance($point1, $point2) {
    $dx = $point1[0] - $point2[0]
    $dy = $point1[1] - $point2[1]
    return [Math]::Sqrt($dx * $dx + $dy * $dy)
}

function Get-WayCoordinates($wayMember) {
    $coords = @()
    if ($wayMember.geometry) {
        foreach ($point in $wayMember.geometry) {
            $coords += ,@($point.lon, $point.lat)
        }
    }
    return $coords
}

function Build-ConnectedPath($wayMembers) {
    if ($wayMembers.Count -eq 0) { return @() }
    
    $result = @()
    $remainingWays = New-Object System.Collections.ArrayList
    $remainingWays.AddRange($wayMembers)
    
    $currentWay = $remainingWays[0]
    $remainingWays.RemoveAt(0)
    $currentCoords = Get-WayCoordinates $currentWay
    
    foreach ($coord in $currentCoords) {
        $result += ,$coord
    }
    
    $lastPoint = $currentCoords[-1]
    $threshold = 0.001
    $maxIterations = $remainingWays.Count * 2
    $iterations = 0
    
    while ($remainingWays.Count -gt 0 -and $iterations -lt $maxIterations) {
        $iterations++
        $foundConnection = $false
        
        for ($i = 0; $i -lt $remainingWays.Count; $i++) {
            $way = $remainingWays[$i]
            $wayCoords = Get-WayCoordinates $way
            
            if ($wayCoords.Count -eq 0) {
                $remainingWays.RemoveAt($i)
                $i--
                continue
            }
            
            $wayStart = $wayCoords[0]
            $wayEnd = $wayCoords[-1]
            $distToStart = Get-Distance $lastPoint $wayStart
            $distToEnd = Get-Distance $lastPoint $wayEnd
            
            if ($distToStart -lt $threshold) {
                for ($j = 1; $j -lt $wayCoords.Count; $j++) {
                    $result += ,$wayCoords[$j]
                }
                $lastPoint = $wayEnd
                $remainingWays.RemoveAt($i)
                $foundConnection = $true
                break
            }
            elseif ($distToEnd -lt $threshold) {
                [Array]::Reverse($wayCoords)
                for ($j = 1; $j -lt $wayCoords.Count; $j++) {
                    $result += ,$wayCoords[$j]
                }
                $lastPoint = $wayStart
                $remainingWays.RemoveAt($i)
                $foundConnection = $true
                break
            }
        }
        
        if (-not $foundConnection) { break }
    }
    
    $finalCoords = @()
    $lastCoord = $null
    foreach ($coord in $result) {
        if ($lastCoord -eq $null -or 
            [Math]::Abs($lastCoord[0] - $coord[0]) -gt 0.0000001 -or 
            [Math]::Abs($lastCoord[1] - $coord[1]) -gt 0.0000001) {
            $finalCoords += ,$coord
            $lastCoord = $coord
        }
    }
    
    return $finalCoords
}

# Process routes in batches of 10
$allRoutes = @()
$processed = 0
$failed = 0
$batchSize = 10

for ($batchStart = 0; $batchStart < $routeIds.Count; $batchStart += $batchSize) {
    $batchEnd = [Math]::Min($batchStart + $batchSize, $routeIds.Count)
    $batchRoutes = @()
    
    for ($i = $batchStart; $i -lt $batchEnd; $i++) {
        $routeId = $routeIds[$i]
        $processed++
        
        try {
            Start-Sleep -Milliseconds 300
            $detailQuery = "[out:json][timeout:25];relation($routeId);out geom;"
            $detailResponse = Invoke-RestMethod -Uri "https://overpass-api.de/api/interpreter" -Method Post -Body "data=$detailQuery" -ContentType "application/x-www-form-urlencoded"
            
            $element = $detailResponse.elements[0]
            $ref = if ($element.tags.ref) { $element.tags.ref } else { "???" }
            $name = if ($element.tags.name) { $element.tags.name } else { "Route $routeId" }
            
            Write-Host "[$processed/$totalRoutes] $ref - $name"
            
            $wayMembers = @()
            foreach ($member in $element.members) {
                if ($member.type -eq 'way' -and $member.geometry -and $member.geometry.Count -gt 0) {
                    $role = if ($member.role) { $member.role.ToLower() } else { "" }
                    if ($role -notmatch 'backward|return|reverse|back') {
                        $wayMembers += $member
                    }
                }
            }
            
            if ($wayMembers.Count -eq 0) {
                Write-Host "            [SKIP] No valid ways"
                $failed++
                continue
            }
            
            $coordinates = Build-ConnectedPath $wayMembers
            
            if ($coordinates.Count -lt 2) {
                Write-Host "            [SKIP] Insufficient coordinates"
                $failed++
                continue
            }
            
            $stops = @()
            foreach ($member in $element.members) {
                if ($member.type -eq 'node' -and 
                    ($member.role -eq 'stop' -or $member.role -eq 'platform') -and
                    $member.lat -and $member.lon) {
                    
                    $stopName = if ($member.tags -and $member.tags.name) { 
                        $member.tags.name 
                    } else { 
                        "Stop $($member.ref)" 
                    }
                    
                    $stops += @{
                        nodeId = $member.ref.ToString()
                        name = $stopName
                        latitude = $member.lat
                        longitude = $member.lon
                    }
                }
            }
            
            $batchRoutes += @{
                routeId = $routeId.ToString()
                ref = $ref
                name = $name
                from = if ($element.tags.from) { $element.tags.from } else { "Origin" }
                to = if ($element.tags.'to') { $element.tags.'to' } else { "Destination" }
                operator = if ($element.tags.operator) { $element.tags.operator } else { $Operator }
                colour = if ($element.tags.colour) { $element.tags.colour } else { "#3498db" }
                geometry = @{
                    type = "LineString"
                    coordinates = $coordinates
                }
                stops = $stops
            }
            
            Write-Host "            [OK] $($coordinates.Count) points, $($stops.Count) stops"
            
        } catch {
            Write-Host "            [ERROR] $_"
            $failed++
        }
    }
    
    # Import this batch
    if ($batchRoutes.Count -gt 0) {
        try {
            $payload = @{ routes = $batchRoutes } | ConvertTo-Json -Depth 10 -Compress
            $importUrl = "$ApiBaseUrl/import/geojson-routes"
            $importResponse = Invoke-RestMethod -Uri $importUrl -Method Post -Body $payload -ContentType "application/json; charset=utf-8"
            Write-Host "            [BATCH] Imported $($batchRoutes.Count) routes"
            $allRoutes += $batchRoutes
        } catch {
            Write-Host "            [BATCH ERROR] $_"
            $failed += $batchRoutes.Count
        }
    }
}

Write-Host ""
Write-Host "==================================================================="
Write-Host "                         SUCCESS!"
Write-Host "==================================================================="
Write-Host ""
Write-Host "  Routes processed:  $($allRoutes.Count)"
Write-Host "  Routes failed:     $failed"
Write-Host ""
Write-Host "All routes updated with clean, connected geometry!"
Write-Host ""

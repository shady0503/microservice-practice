# Fix all bus routes in Rabat-Salé-Témara network
# This will fetch ALL routes from OSM and update them with proper geometry

param(
    [Parameter(Mandatory=$false)]
    [string]$Operator = "ALSA",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:8081/api",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║       Rabat-Salé-Témara Bus Network Geometry Fixer            ║"
Write-Host "║            (Intelligent Connected Path Building)               ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

if ($DryRun) {
    Write-Host "[INFO] DRY RUN MODE - No database changes will be made"
    Write-Host ""
}

# Bounding box for Rabat-Salé-Témara
$bbox = "33.85,-7.0,34.15,-6.7"

Write-Host "[1/3] Fetching all bus routes from Overpass API..."
Write-Host "      Region: Rabat-Salé-Témara"
Write-Host "      Operator: $Operator"
Write-Host ""

$query = @"
[out:json][timeout:90];
(
  area["name"="Rabat"]["admin_level"="6"]->.r;
  area["name"="Salé"]["admin_level"="6"]->.s;
  area["name"="Témara"]["admin_level"="6"]->.t;
  (
    relation["route"="bus"]["operator"~"$Operator",i](area.r);
    relation["route"="bus"]["operator"~"$Operator",i](area.s);
    relation["route"="bus"]["operator"~"$Operator",i](area.t);
  );
);
out ids;
"@

try {
    $response = Invoke-RestMethod -Uri "https://overpass-api.de/api/interpreter" -Method Post -Body "data=$query" -ContentType "application/x-www-form-urlencoded"
    $totalRoutes = $response.elements.Count
    Write-Host "[✓] Found $totalRoutes bus routes"
} catch {
    Write-Host "[✗] Failed to fetch route list: $_"
    exit 1
}

if ($totalRoutes -eq 0) {
    Write-Host "[✗] No routes found"
    exit 1
}

# Extract route IDs
$routeIds = $response.elements | ForEach-Object { $_.id }

Write-Host ""
Write-Host "[2/3] Fetching detailed geometry for each route..."
Write-Host "      This will take approximately $([Math]::Ceiling($totalRoutes * 0.5)) minutes"
Write-Host ""

# Helper functions
function Get-Distance {
    param($point1, $point2)
    $dx = $point1[0] - $point2[0]
    $dy = $point1[1] - $point2[1]
    return [Math]::Sqrt($dx * $dx + $dy * $dy)
}

function Get-WayCoordinates {
    param($wayMember)
    $coords = @()
    if ($wayMember.geometry) {
        foreach ($point in $wayMember.geometry) {
            $coords += ,@($point.lon, $point.lat)
        }
    }
    return $coords
}

function Build-ConnectedPath {
    param($wayMembers)
    
    if ($wayMembers.Count -eq 0) { return @() }
    
    $result = @()
    $remainingWays = New-Object System.Collections.ArrayList
    $remainingWays.AddRange($wayMembers)
    
    # Start with first way
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
                # Forward
                for ($j = 1; $j -lt $wayCoords.Count; $j++) {
                    $result += ,$wayCoords[$j]
                }
                $lastPoint = $wayEnd
                $remainingWays.RemoveAt($i)
                $foundConnection = $true
                break
            }
            elseif ($distToEnd -lt $threshold) {
                # Reverse
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
    
    # Deduplicate
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

# Process each route
$allRoutes = @()
$processed = 0
$failed = 0

foreach ($routeId in $routeIds) {
    $processed++
    
    try {
        # Fetch route details
        Start-Sleep -Milliseconds 300  # Rate limiting
        $detailQuery = "[out:json][timeout:25];relation($routeId);out geom;"
        $detailResponse = Invoke-RestMethod -Uri "https://overpass-api.de/api/interpreter" -Method Post -Body "data=$detailQuery" -ContentType "application/x-www-form-urlencoded"
        
        $element = $detailResponse.elements[0]
        $ref = if ($element.tags.ref) { $element.tags.ref } else { "???" }
        $name = if ($element.tags.name) { $element.tags.name } else { "Route $routeId" }
        
        Write-Host "[$processed/$totalRoutes] Processing: $ref - $name"
        
        # Filter way members
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
            Write-Host "          [!] No valid ways found - skipping"
            $failed++
            continue
        }
        
        # Build connected path
        $coordinates = Build-ConnectedPath $wayMembers
        
        if ($coordinates.Count -lt 2) {
            Write-Host "          [!] Insufficient coordinates - skipping"
            $failed++
            continue
        }
        
        # Extract stops
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
        
        # Create route object
        $allRoutes += @{
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
        
        Write-Host "          [✓] Built geometry: $($coordinates.Count) points, $($stops.Count) stops"
        
    } catch {
        Write-Host "          [✗] Failed: $_"
        $failed++
    }
}

Write-Host ""
Write-Host "[3/3] Importing to database..."
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] Would import $($allRoutes.Count) routes:"
    foreach ($route in $allRoutes) {
        Write-Host "  - $($route.ref): $($route.name)"
    }
    Write-Host ""
    Write-Host "Run without -DryRun flag to actually import"
    exit 0
}

$payload = @{
    routes = $allRoutes
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "[INFO] Payload size: $([Math]::Round($payload.Length / 1024, 2)) KB"

try {
    $importUrl = "$ApiBaseUrl/import/geojson-routes"
    $importResponse = Invoke-RestMethod -Uri $importUrl -Method Post -Body $payload -ContentType "application/json; charset=utf-8"
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗"
    Write-Host "║                         ✓ SUCCESS!                             ║"
    Write-Host "╚════════════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "  Routes processed:  $($allRoutes.Count)"
    Write-Host "  Routes failed:     $failed"
    Write-Host "  Lines imported:    $($importResponse.linesImported)"
    Write-Host "  Stops imported:    $($importResponse.stopsImported)"
    Write-Host "  Trajets imported:  $($importResponse.trajetsImported)"
    Write-Host ""
    Write-Host "All routes have been updated with clean, connected geometry! 🚀"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "[✗] Failed to import to database: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "[✗] Server response: $responseBody"
    }
    exit 1
}
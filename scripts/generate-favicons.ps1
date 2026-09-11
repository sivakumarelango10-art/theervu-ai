Add-Type -AssemblyName System.Drawing

function Resize-Png($srcPath, $dstPath, $width, $height) {
    $src = [System.Drawing.Bitmap]::new($srcPath)
    $dst = [System.Drawing.Bitmap]::new($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $width, $height)
    $g.Dispose()
    $src.Dispose()
    $dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    Write-Host "Created: $dstPath ($width x $height)"
}

$logo = "E:\theervu-ai\public\theervu-logo.png"

# Generate light and dark 32x32 icons
Resize-Png $logo "E:\theervu-ai\public\icon-light-32x32.png" 32 32
Resize-Png $logo "E:\theervu-ai\public\icon-dark-32x32.png" 32 32

# Generate Apple touch icon 180x180
Resize-Png $logo "E:\theervu-ai\public\apple-icon.png" 180 180

# Next.js App Router icons
Resize-Png $logo "E:\theervu-ai\app\icon.png" 32 32
Resize-Png $logo "E:\theervu-ai\app\apple-icon.png" 180 180

# Generate standard 48x48 and 16x16
Resize-Png $logo "E:\theervu-ai\public\icon-48x48.png" 48 48
Resize-Png $logo "E:\theervu-ai\public\icon-16x16.png" 16 16

# Convert 32x32 to favicon.ico
$icoBitmap = [System.Drawing.Bitmap]::new("E:\theervu-ai\public\icon-light-32x32.png")
$iconHandle = $icoBitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::OpenWrite("E:\theervu-ai\public\favicon.ico")
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$icoBitmap.Dispose()

# Copy favicon.ico to app/favicon.ico
Copy-Item "E:\theervu-ai\public\favicon.ico" "E:\theervu-ai\app\favicon.ico" -Force

# Generate public/icon.svg embedding theervu-logo.png
$b64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("E:\theervu-ai\public\apple-icon.png"))
$svgContent = "<svg width=""180"" height=""180"" viewBox=""0 0 180 180"" fill=""none"" xmlns=""http://www.w3.org/2000/svg"" xmlns:xlink=""http://www.w3.org/1999/xlink""><rect width=""180"" height=""180"" rx=""36"" fill=""white""/><image width=""180"" height=""180"" href=""data:image/png;base64,$b64""/></svg>"
[System.IO.File]::WriteAllText("E:\theervu-ai\public\icon.svg", $svgContent)
Write-Host "Updated public/icon.svg with TheervuAI logo"

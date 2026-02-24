Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Users\User\WEB ECOVATIO\assets\img\favicon.png"
$img = [System.Drawing.Image]::FromFile($srcPath)

$size = 512
$bmp = new-object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$brush = new-object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillEllipse($brush, 0, 0, $size, $size)

$logoSize = [math]::Round($size * 0.7)
$offset = [math]::Round(($size - $logoSize) / 2)

$destRect = new-object System.Drawing.Rectangle($offset, $offset, $logoSize, $logoSize)
$g.DrawImage($img, $destRect)

$destPath = "c:\Users\User\WEB ECOVATIO\assets\img\favicon_round.png"
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$brush.Dispose()
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "Circle favicon created successfully"

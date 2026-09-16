
Add-Type -AssemblyName System.IO.Compression.FileSystem
$docPath = 'C:\Users\C-LAB\Downloads\Software Requirements Specification.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Extract text between <w:t> tags
$pattern = '(?<=<w:t[^>]*>).*?(?=</w:t>)'
$matches = [regex]::Matches($xml, $pattern)
$output = foreach ($m in $matches) { $m.Value }
$fullText = $output -join ' '
[System.IO.File]::WriteAllText('C:\Users\C-LAB\.gemini\antigravity-ide\brain\36714c94-bbfd-4374-b215-ee8cdda1d43f\srs_text.txt', $fullText, [System.Text.Encoding]::UTF8)
Write-Host "Extracted characters: " $fullText.Length

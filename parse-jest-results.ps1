# Parse Jest JSON output and display test results in a table
param(
    [Parameter(Mandatory=$true)]
    [string]$JsonFile
)

$jestOutput = Get-Content $JsonFile | ConvertFrom-Json

$allTests = @()

foreach ($testResult in $jestOutput.testResults) {
    foreach ($assertion in $testResult.assertionResults) {
        $allTests += [PSCustomObject]@{
            Status = $assertion.status
            Title = $assertion.title
            Duration = $assertion.duration
            File = $testResult.testFilePath
        }
    }
}

$allTests | Format-Table -Property Status, Title, Duration, File -AutoSize
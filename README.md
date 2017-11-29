# JSON Filtering Tool

Filter JSON by given conditions and attributes, output in CSV format.

## Expected Input

* Row of JSON object (output of `grep` command):

    find my-logs/ -type f -exec grep -h '"eventName":"RebootDBInstance"' {} \; > RebootDBInstance.json

* `RebootDBInstance.json` will be the input file

* Example:
```
{a:1, b:2, ...}
{a:"one", b:"two", ...}
{...}
{...}
```

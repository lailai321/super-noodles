' Launches start.bat with no visible console window.
' Use this (not start.bat directly) for the auto-start shortcut.
' Waits for start.bat to finish (it never does — it loops forever) instead of
' returning immediately, so Task Scheduler keeps tracking this as one process
' tree instead of treating wscript.exe's early exit as "task done" and later
' tearing down the detached cmd.exe/node.exe children along with it.
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set shell = CreateObject("WScript.Shell")
shell.Run """" & scriptDir & "\start.bat""", 0, True

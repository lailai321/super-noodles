' Launches start.bat with no visible console window.
' Use this (not start.bat directly) for the auto-start shortcut.
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set shell = CreateObject("WScript.Shell")
shell.Run """" & scriptDir & "\start.bat""", 0, False

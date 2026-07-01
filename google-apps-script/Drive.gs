function driveRoot(){ const name='RJP_Hub_Drive'; const files=DriveApp.getFoldersByName(name); return files.hasNext()?files.next():DriveApp.createFolder(name); }

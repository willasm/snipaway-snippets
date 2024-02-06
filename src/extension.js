const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const view = require("./viewWebLink.js");
const create = require("./createSnippet.js");
const createLink = require("./createWebLink.js");
const os = require("os");

let myContext;


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function Activate ●                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function activate(context) {
  
  // Activate - Initialize Extension 
  //---------------------------------------------------------------------------------------------------------
  myContext = context;                    // Save context
  
  // Activate - Register Extension Commands 
  vscode.commands.registerCommand('snipaway-snippets.insert-snippet', insertSnippet);
  vscode.commands.registerCommand('snipaway-snippets.create-snippet', createSnippet);
  vscode.commands.registerCommand('snipaway-snippets.create-web-link', createWebLink);
  vscode.commands.registerCommand('snipaway-snippets.view-web-snippet', viewWebSnippet);
  
  // Activate - Push Subscriptions 
  context.subscriptions.push(insertSnippet);
  context.subscriptions.push(createSnippet);
  context.subscriptions.push(createWebLink);
  context.subscriptions.push(viewWebSnippet);
  
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function insertSnippet ●                          │
//  │                                                                              │
//  │                     • Insert SnipAway Snippet into VSC •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function insertSnippet() {
  // insertSnippet - Get SnipAway Snippets Folder Location From Settings 
  let settings = vscode.workspace.getConfiguration("snipaway-snippets");
  let snippetsFolder = settings.get("snippetsFolder");
  if (!snippetsFolder) {
    snippetsFolder = await getSnippetFolder();
    if (!snippetsFolder) {
      vscode.window.showWarningMessage('SnipAway Snippets Folder Has Not Been Saved to Settings');
      return;
    };
    vscode.workspace.getConfiguration("snipaway-snippets").update("snippetsFolder", snippetsFolder, true);
  };

  // insertSnippet - Get Snippets Folders 
  let snipAwayFoldersPath = snippetsFolder + path.sep + 'folders.snipaway';
  let snipAwayFoldersData = fs.readFileSync(snipAwayFoldersPath, {encoding: 'utf8'});
  let snipAwayFolders = JSON.parse(snipAwayFoldersData);
  const snipAwayFolderNames = snipAwayFolders.map(f => {
    return f.label;
  });
  const snipAwayFolderIDs = snipAwayFolders.map(f => {
    return f.folderID;
  });

  // insertSnippet - Get Snippet Files Data 
  let snipAwayIDs = [];
  let snipAwayTitles = [];
  let snipAwayAllSnippets = [];
  let snipAwayAllSnippetsPickObjects = [];
  let snipAwayFavSnippets = [];
  let snipAwayFavSnippetsPickObjects = [];
  let snipAwayFolderSnippets = [];
  let snipAwayFolderSnippetsPickObjects = [];
  await fs.readdir(snippetsFolder, 'utf8', (err, files) => {
    if (err) {
      console.log('Error Reading Files From Snippets Folder - insertSnippet');
      vscode.window.showErrorMessage('Sorry but folder does not appear to contain any SnipAway snippets');
      return;
    } else {
      files.forEach(async file => {
        if (path.extname(file) == ".snipaway" && path.basename(file) != "folders.snipaway") {
          let snipAwaySnippetPath = snippetsFolder + path.sep + path.basename(file);
          let snippetFileObject = await fs.readFileSync(snipAwaySnippetPath, {encoding: 'utf8'});
          let snippetObject = JSON.parse(snippetFileObject);
          let snippetObjectFolderID = Number(snippetObject.folderID);
          let folderIndex = snipAwayFolderIDs.indexOf(snippetObjectFolderID);
          let folderLabel;
          if (folderIndex != -1) {
            folderLabel = snipAwayFolderNames[folderIndex];
          } else {
            folderLabel = null;
          };
          if (snippetObject.webLink == "") {
            snippetObject.folderLabel = folderLabel;
            snipAwayAllSnippets.push(snippetObject);
            let snipAwayIDNum = snippetObject.id
            let snipAwayIDString = snipAwayIDNum.toString();
            snipAwayIDs.push(snipAwayIDString);
            snipAwayTitles.push(snippetObject.title);
            let objectFullDescription = snippetObject.description.split(/\r?\n/);
            let objectDescription = objectFullDescription[0] || '(Snippet has no description)';
            let objectSnippetLabel = snippetObject.title;
            snipAwayAllSnippetsPickObjects.push({"label": `${objectSnippetLabel}`,"description": `${objectDescription}`});
            if (snippetObject.favorite == '1') {
              snipAwayFavSnippets.push(snippetObject);
              snipAwayFavSnippetsPickObjects.push({"label": `${objectSnippetLabel}`,"description": `${objectDescription}`});
            };
          };
        };
      });
    };
  });
  await new Promise(r => setTimeout(r, 500));

  // insertSnippet - Prompt user for choice of view by All/Favorites/Folder 
  let options = {
    placeHolder: "List snippets by All, Favorites, or Folders",
    title: "---=== SnipAway Snippets - Select Snippets List to View ===---"
  };
  const pick = await vscode.window.showQuickPick([{
    label: 'All',
    detail: `List all SnipAway snippets`
  },
  {
    label: 'Favorites',
    detail: `List favorites SnipAway snippets`
  },
  {
    label: 'Folders',
    detail: `List SnipAway snippets by folders`
  },
  ], options);

  // insertSnippet - User Canceled 
  if (!pick) {
    return;
  };

  // insertSnippet - All selected 
  if (pick.label === 'All') {

    // insertSnippet - Prompt user for choice from All snippets 
    let options = {
      placeHolder: "Select Snippet From All Snippets",
      title: "---=== SnipAway Snippets - Select From All Snippets to Insert ===---"
    };
    const pick = await vscode.window.showQuickPick(snipAwayAllSnippetsPickObjects, options);

    // insertSnippet - User Canceled 
    if (!pick) {
      return;
    };

    // insertSnippet - Get Selected Snippet 
    let selectedSnippetLabel = pick.label;
    let selectedSnippetIndex = snipAwayTitles.indexOf(selectedSnippetLabel);
    let selectedAllSnippetPath = snippetsFolder + path.sep + snipAwayIDs[selectedSnippetIndex] + '.snipaway';
    let selectedSnippetFileObject = await fs.readFileSync(selectedAllSnippetPath, {encoding: 'utf8'});
    let selectedSnippetObject = JSON.parse(selectedSnippetFileObject);
    let selectedSnippetCode = selectedSnippetObject.code;

    // insertSnippet - Insert Selected Snippet 
    const editor = vscode.window.activeTextEditor;
    const cursorPosition = editor.selection.active;
    const range = new vscode.Range(cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
    await editor.edit(editBuilder => {
      editBuilder.replace(range, selectedSnippetCode)
    }).catch(err => console.log(err));
    return;
  };

  // insertSnippet - Favorites selected 
  if (pick.label === 'Favorites') {

    // insertSnippet - Prompt user for choice from Favorite snippets 
    let options = {
      placeHolder: "Select Snippet From Favorite Snippets",
      title: "---=== SnipAway Snippets - Select From Favorite Snippets to Insert ===---"
    };
    const pick = await vscode.window.showQuickPick(snipAwayFavSnippetsPickObjects, options);

    // insertSnippet - User Canceled 
    if (!pick) {
      return;
    };

    // insertSnippet - Get Selected Snippet 
    let selectedSnippetLabel = pick.label;
    let selectedSnippetIndex = snipAwayTitles.indexOf(selectedSnippetLabel);
    let selectedFavSnippetPath = snippetsFolder + path.sep + snipAwayIDs[selectedSnippetIndex] + '.snipaway';
    let selectedSnippetFileObject = await fs.readFileSync(selectedFavSnippetPath, {encoding: 'utf8'});
    let selectedSnippetObject = JSON.parse(selectedSnippetFileObject);
    let selectedSnippetCode = selectedSnippetObject.code;

    // insertSnippet - Insert Selected Snippet 
    const editor = vscode.window.activeTextEditor;
    const cursorPosition = editor.selection.active;
    const range = new vscode.Range(cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
    await editor.edit(editBuilder => {
      editBuilder.replace(range, selectedSnippetCode)
    }).catch(err => console.log(err));
    return;
  };


  // insertSnippet - Folders selected 
  if (pick.label === 'Folders') {

    // insertSnippet - Prompt user for choice of view by All/Favorites/Folder 
    let options = {
      placeHolder: "List Snippets by Folder",
      title: "---=== SnipAway Snippets - Select Folder Snippets List to View ===---"
    };
    const pick = await vscode.window.showQuickPick(snipAwayFolderNames, options);

    // insertSnippet - User Canceled 
    if (!pick) {
      return;
    };

    // insertSnippet - Folder has been selected 
    for (let i = 0; i < snipAwayAllSnippets.length; i++) {
      if (snipAwayAllSnippets[i].folderLabel === pick) {
        let objectFullDescription = snipAwayAllSnippets[i].description.split(/\r?\n/);
        let objectDescription = objectFullDescription[0] || '(Snippet has no description)';
        let objectSnippetLabel = snipAwayAllSnippets[i].title;
        snipAwayFolderSnippetsPickObjects.push({"label": `${objectSnippetLabel}`,"description": `${objectDescription}`});
        snipAwayFolderSnippets.push(snipAwayAllSnippets[i]);
      };
    };

    // insertSnippet - Prompt user for choice of Folder snippets 
    let optionsFolderSnippet = {
      placeHolder: "Select SnipAway Snippet to Insert",
      title: `---=== SnipAway Snippets - Select Snippet From '${pick}' Folder to Insert ===---`
    };
    let pickFolderSnippet;
    if (snipAwayFolderSnippetsPickObjects.length > 0) {
      pickFolderSnippet = await vscode.window.showQuickPick(snipAwayFolderSnippetsPickObjects, optionsFolderSnippet);
    } else {
      vscode.window.showInformationMessage(`Sorry but the folder '${pick}' does not contain any text snippets to insert`);
      return;
    }

    // insertSnippet - User Canceled 
    if (!pickFolderSnippet) {
      return;
    };

    // insertSnippet - Get Selected Snippet 
    let selectedSnippetLabel = pickFolderSnippet.label;
    let selectedSnippetIndex = snipAwayTitles.indexOf(selectedSnippetLabel);
    let selectedFolderSnippetPath = snippetsFolder + path.sep + snipAwayIDs[selectedSnippetIndex] + '.snipaway';
    let selectedSnippetFileObject = await fs.readFileSync(selectedFolderSnippetPath, {encoding: 'utf8'});
    let selectedSnippetObject = JSON.parse(selectedSnippetFileObject);
    let selectedSnippetCode = selectedSnippetObject.code;

    // insertSnippet - Insert Selected Snippet 
    const editor = vscode.window.activeTextEditor;
    const cursorPosition = editor.selection.active;
    const range = new vscode.Range(cursorPosition.line, cursorPosition.character, cursorPosition.line, cursorPosition.character);
    await editor.edit(editBuilder => {
      editBuilder.replace(range, selectedSnippetCode)
    }).catch(err => console.log(err));
    return;
  };

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function createSnippet ●                          │
//  │                                                                              │
//  │                • Create SnipAway Snippet From Selected Code •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function createSnippet() {
  // createSnippet - Get SnipAway Snippets Folder Location From Settings 
//  let languageValues = ["actionscript", "batchfile", "c_cpp", "csharp", "coffee", "css", "d", "dart", "dockerfile", "erlang", "fortran", "golang", "haskell", "html", "jade", "java", "javascript", "json", "jsx", "kotlin", "less", "livescript", "lua", "markdown", "mysql", "objectivec", "pascal", "perl", "php", "powershell", "python", "r", "ruby", "rust", "sass", "scala", "sql", "swift", "text", "typescript", "vbscript", "xml", "yaml"];
//  let languageLabels = ["ActionScript", "BatchFile", "C/C++", "C#", "Coffee Script", "CSS", "D", "Dart", "Docker", "Erlang", "Fortran", "Go", "Haskell", "HTML", "Jade", "Java", "JavaScript", "JSON", "JSX", "Kotlin", "LESS", "LiveScript", "Lua", "Markdown", "MySQL", "ObjectiveC", "Pascal", "Perl", "PHP", "Powershell", "Python", "R", "Ruby", "Rust", "SASS", "Scala", "C", "Swift", "Text", "Typescript", "VBScript", "XML", "YAML"];
  let languagesVscode         = ["bat", "c", "cpp", "csharp", "coffeescript", "css", "d", "dockerfile", "erlang", "go", "html", "jade", "pug", "java", "javascript", "json", "jsonc", "javascriptreact", "less", "lua", "markdown", "sql", "objective-c", "pascal", "perl", "perl6", "php", "powershell", "python", "r", "ruby", "rust", "sass", "scss", "scala", "sql", "swift", "plaintext", "typescript", "typescriptreact", "vb", "xml", "yaml"];
  let languagesSnipAwayValues = ["batchfile", "c_cpp", "c_cpp", "csharp", "coffee", "css", "d", "dockerfile", "erlang", "golang", "html", "jade", "jade", "java", "javascript", "json", "json", "jsx", "less", "lua", "markdown", "mysql", "objectivec", "pascal", "perl", "perl", "php", "powershell", "python", "r", "ruby", "rust", "sass", "sass", "scala", "sql", "swift", "text", "typescript", "typescript", "vbscript", "xml", "yaml"];
  let settings = vscode.workspace.getConfiguration("snipaway-snippets");
  let snippetsFolder = settings.get("snippetsFolder");
  let defaultCodeLanguage = "text";//settings.get("defaultCodeLanguage") || "Text";

  if (!snippetsFolder) {
    snippetsFolder = await getSnippetFolder();
    if (!snippetsFolder) {
      vscode.window.showWarningMessage('SnipAway Snippets Folder Has Not Been Saved to Settings');
      return;
    };
    vscode.workspace.getConfiguration("snipaway-snippets").update("snippetsFolder", snippetsFolder, true)
  };
  
  // createSnippet - Get Editors Selected Text 
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return; // No open text editor
  };
  let selection = editor.selection;
  let code = editor.document.getText(selection);
  if (code.length == 0) {
    vscode.window.showWarningMessage('Please select the desired text for the SnipAway snippet first');
    return;
  };

  // createSnippet - Get Snippets Folders 
  let snipAwayFoldersPath = snippetsFolder + path.sep + 'folders.snipaway';
  let snipAwayFoldersData = fs.readFileSync(snipAwayFoldersPath, {encoding: 'utf8'});
  let snipAwayFolders = JSON.parse(snipAwayFoldersData);
  const snipAwayFolderNames = snipAwayFolders.map(f => {
    return f.label;
  });
  const snipAwayFolderColors = snipAwayFolders.map(f => {
    return f.color;
  });
  const snipAwayFolderIDs = snipAwayFolders.map(f => {
    return f.folderID;
  });

  // createSnippet - Open the Create Snippet Webview 
  let snippetsFoldersPath = snippetsFolder + path.sep;
  let langDocument = editor.document.languageId;
  let langIDX = languagesVscode.indexOf(langDocument);
  let codeLanguage;
  if (langIDX != -1) {
    codeLanguage = languagesSnipAwayValues[langIDX];
  } else {
    codeLanguage = defaultCodeLanguage;
  };
  
  create.createSnippetWebview(myContext, code, snipAwayFolderNames, snipAwayFolderColors, snipAwayFolderIDs, snippetsFoldersPath, codeLanguage);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function createWebLink ●                          │
//  │                                                                              │
//  │                • Create SnipAway Snippet From Selected Code •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function createWebLink() {
  // createWebLink - Get SnipAway Snippets Folder Location From Settings 
  let settings = vscode.workspace.getConfiguration("snipaway-snippets");
  let snippetsFolder = settings.get("snippetsFolder");
  if (!snippetsFolder) {
    snippetsFolder = await getSnippetFolder();
    if (!snippetsFolder) {
      vscode.window.showWarningMessage('SnipAway Snippets Folder Has Not Been Saved to Settings');
      return;
    };
    vscode.workspace.getConfiguration("snipaway-snippets").update("snippetsFolder", snippetsFolder, true)
  };
  
  // createWebLink - Get Snippets Folders 
  let snipAwayFoldersPath = snippetsFolder + path.sep + 'folders.snipaway';
  let snipAwayFoldersData = fs.readFileSync(snipAwayFoldersPath, {encoding: 'utf8'});
  let snipAwayFolders = JSON.parse(snipAwayFoldersData);
  const snipAwayFolderNames = snipAwayFolders.map(f => {
    return f.label;
  });
  const snipAwayFolderColors = snipAwayFolders.map(f => {
    return f.color;
  });
  const snipAwayFolderIDs = snipAwayFolders.map(f => {
    return f.folderID;
  });

  // createWebLink - Open the Create Snippet Webview 
  let snippetsFoldersPath = snippetsFolder + path.sep;
  createLink.createWebLinkWebview(myContext, snipAwayFolderNames, snipAwayFolderColors, snipAwayFolderIDs, snippetsFoldersPath);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                         ● Function viewWebSnippet ●                          │
//  │                                                                              │
//  │                   • View SnipAway Snippet in VSC Webview •                   │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function viewWebSnippet() {
  // viewWebSnippet - Get SnipAway Snippets Folder Location From Settings 
  let settings = vscode.workspace.getConfiguration("snipaway-snippets");
  let snippetsFolder = settings.get("snippetsFolder");
  if (!snippetsFolder) {
    snippetsFolder = await getSnippetFolder();
    if (!snippetsFolder) {
      vscode.window.showWarningMessage('SnipAway Snippets Folder Has Not Been Saved to Settings');
      return;
    };
    vscode.workspace.getConfiguration("snipaway-snippets").update("snippetsFolder", snippetsFolder, true)
  };

  // viewWebSnippet - Get Snippets Path 
  let snipAwayFoldersPath = snippetsFolder + path.sep + 'folders.snipaway';
  let snipAwayFoldersData = fs.readFileSync(snipAwayFoldersPath, {encoding: 'utf8'});
  let snipAwayFolders = JSON.parse(snipAwayFoldersData);
  const snipAwayFolderNames = snipAwayFolders.map(f => {
    return f.label;
  });
  const snipAwayFolderIDs = snipAwayFolders.map(f => {
    return f.folderID;
  });

  // viewWebSnippet - Get Snippet Files Data 
  let snipAwayIDs = [];
  let snipAwayTitles = [];
  let snipAwayWebLinks = [];
  let snipAwayWebSnippets = [];
  let snipAwayWebSnippetsPickObjects = [];

  await fs.readdir(snippetsFolder, 'utf8', (err, files) => {
    if (err) {
      console.log('Error Reading Files From Snippets Folder - viewWebSnippet');
      vscode.window.showErrorMessage('Sorry but folder does not appear to contain any SnipAway snippets');
      return;
    } else {
      files.forEach(async file => {
        if (path.extname(file) == ".snipaway" && path.basename(file) != "folders.snipaway") {
          let snipAwaySnippetPath = snippetsFolder + path.sep + path.basename(file);
          let snippetFileObject = await fs.readFileSync(snipAwaySnippetPath, {encoding: 'utf8'});
          let snippetObject = JSON.parse(snippetFileObject);
          let snippetObjectFolderID = Number(snippetObject.folderID);
          let folderIndex = snipAwayFolderIDs.indexOf(snippetObjectFolderID);
          let folderLabel;
          if (folderIndex != -1) {
            folderLabel = snipAwayFolderNames[folderIndex];
          } else {
            folderLabel = null;
          };
          if (snippetObject.webLink != "") {
            snippetObject.folderLabel = folderLabel;
            snipAwayWebSnippets.push(snippetObject);
            snipAwayWebLinks.push(snippetObject.webLink);
            let snipAwayIDNum = snippetObject.id
            let snipAwayIDString = snipAwayIDNum.toString();
            snipAwayIDs.push(snipAwayIDString);
            snipAwayTitles.push(snippetObject.title);
            let objectFullDescription = snippetObject.description.split(/\r?\n/);
            let objectDescription = objectFullDescription[0] || '(Snippet has no description)';
            let objectSnippetLabel = snippetObject.title;
            snipAwayWebSnippetsPickObjects.push({"label": `${objectSnippetLabel}`,"description": `${objectDescription}`});
          };
        };
      });
    };
  });
  await new Promise(r => setTimeout(r, 500));

  // viewWebSnippet - Inform User When No Web Link Snippets Found 
  if (snipAwayWebLinks.length === 0) {
    vscode.window.showWarningMessage('Sorry, but no web link snippets were found.');
    return;
  };

  // viewWebSnippet - Prompt user for choice from Favorite snippets 
  let options = {
    placeHolder: "Select Snippet From Web Link Snippets",
    title: "---=== SnipAway Snippets - Select From Web Link Snippets to View ===---"
  };
  const pick = await vscode.window.showQuickPick(snipAwayWebSnippetsPickObjects, options);

  // viewWebSnippet - User Canceled 
  if (!pick) {
    return;
  };

  // viewWebSnippet - Get Selected Snippet 
  let selectedSnippetLabel = pick.label;
  let selectedSnippetIndex = snipAwayTitles.indexOf(selectedSnippetLabel);
  let selectedWebSnippetPath = snippetsFolder + path.sep + snipAwayIDs[selectedSnippetIndex] + '.snipaway';
  let selectedSnippetFileObject = await fs.readFileSync(selectedWebSnippetPath, {encoding: 'utf8'});
  let selectedSnippetObject = JSON.parse(selectedSnippetFileObject);
  let selectedSnippetWebLink = selectedSnippetObject.webLink;
  let selectedSnippetDescription = pick.description;

  // viewWebSnippet - View the Selected Web Link Snippet 
  view.showWebLinkWebview(myContext, selectedSnippetWebLink, selectedSnippetDescription);

  // These Do work
  // -------------
  //  view.showWebLinkWebview(myContext, 'https://microsoft.github.io/vscode-codicons/dist/codicon.html', "Test Description");
  //  view.showWebLinkWebview(myContext, 'https://www.tutorialrepublic.com, "Test Description"');
  //  view.showWebLinkWebview(myContext, 'https://snipaway.futureglobe.de/, "Test Description"');
  
  // These Do Not work
  // -----------------
  //  view.showWebLinkWebview(myContext, 'https://masm32.com/board/index.php?action=unread', "Test Description");
  //  view.showWebLinkWebview(myContext, 'https://regex101.com/', 'Regular Expressions', "Test Description");
  //  view.showWebLinkWebview(myContext, 'https://code.visualstudio.com/docs/editor/command-line', "Test Description");
  //  view.showWebLinkWebview(myContext, 'https://stackoverflow.com/questions/58676766/how-to-use-iframe-in-vscode-webview/webhp?igu=1', "Test Description");
  //  view.showWebLinkWebview(myContext, 'http://stackoverflow.com/questions/365777/starting-file-download-with-javascript', "Test Description");

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function getSnippetFolder ●                         │
//  │                                                                              │
//  │                       • Get Snippet Folder Location •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function getSnippetFolder() {

  // getBackupFolder - Get Backup Folder From User 
  const home = vscode.Uri.file(path.join(os.homedir()));
  const options = OpenDialogOptions = {
      title: "Select Folder Location of SnipAway Snippet Files",
      defaultUri: home,
      canSelectMany: false,
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: "Select Folder of SnipAway Snippet Files"
  };
  let folderRes = await vscode.window.showOpenDialog(options);
  if (!folderRes) {
    folderRes = "";
    return(folderRes);
  };
  const folderPath = folderRes[0].fsPath;
  return(folderPath);
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                           ● Function deactivate ●                            │
//  │                                                                              │
//  │                       • Deactivate Extension Cleanup •                       │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function deactivate() {}


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = {
  activate,
  deactivate,
};

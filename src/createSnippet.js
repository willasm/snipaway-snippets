const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

let extensionContext;
let panel;
let languageValues = ["actionscript", "batchfile", "c_cpp", "csharp", "coffee", "css", "d", "dart", "dockerfile", "erlang", "fortran", "golang", "haskell", "html", "jade", "java", "javascript", "json", "jsx", "kotlin", "less", "livescript", "lua", "markdown", "mysql", "objectivec", "pascal", "perl", "php", "powershell", "python", "r", "ruby", "rust", "sass", "scala", "sql", "swift", "text", "typescript", "vbscript", "xml", "yaml"];
//let languageLabels = ["ActionScript", "BatchFile", "C/C++", "C#", "Coffee Script", "CSS", "D", "Dart", "Docker", "Erlang", "Fortran", "Go", "Haskell", "HTML", "Jade", "Java", "JavaScript", "JSON", "JSX", "Kotlin", "LESS", "LiveScript", "Lua", "Markdown", "MySQL", "ObjectiveC", "Pascal", "Perl", "PHP", "Powershell", "Python", "R", "Ruby", "Rust", "SASS", "Scala", "SQL", "Swift", "Text", "Typescript", "VBScript", "XML", "YAML"];

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Function createSnippetWebview ●                       │
//  │                                                                              │
//  │                        • Show Extensions in Webview •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function createSnippetWebview(context, code, folderNames, folderColors, folderIDs, snippetsFoldersPath, defaultCodeLanguage) {

  // createSnippetWebview - Save Our Extensions Context 
  extensionContext = context;

  // createSnippetWebview - This Will Show the Webview in the Currently Active Column 
  const columnToShowIn = vscode.window.activeTextEditor
  ? vscode.window.activeTextEditor.viewColumn
  : undefined;

  // createSnippetWebview - Create Our Extensions Webview or Reveal Existing One 
  if (panel) {
    // If we already have a panel, show it in the target column
    panel.reveal(columnToShowIn);
  } else {
    // Otherwise, create a new panel
    panel = vscode.window.createWebviewPanel(
      'WebviewPanel',
      'Create SnipAway Snippet',
      vscode.ViewColumn.Two,
      { // Enable scripts in the webview
        enableScripts: true
      }
    );
  };

  // createSnippetWebview - Get Our Extensions Webviews HTML 
  panel.webview.html = getHtml();

  // createSnippetWebview - Send Our Extensions Webview Initialization Data 

  panel.webview.postMessage({ "command": 'setSnippetFolders', "folders": folderNames, "code": code, "codeLanguage": defaultCodeLanguage});

  // createSnippetWebview - Handle Messages From the Webview 
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        // createSnippetWebview - Create New Snippet 
        case 'createSnippet':

          // createSnippetWebview - New Snippet Object 
          let newSnippetObject = {
            "id": 0,
            "title": "",
            "description": "",
            "mode": 0,
            "code": "",
            "favorite": "",
            "folderColor": "",
            "folderID": "",
            "dateCreated": "",
            "dateChanged": "",
            "webLink": ""
          };

          // createSnippetWebview - Fill New Snippet Object with Data 
          const unixTimestamp = Date.now();
          //--- "ID"
          newSnippetObject.id = unixTimestamp;
          //--- "Title"
          newSnippetObject.title = message.title;
          //--- "Description"
          newSnippetObject.description = message.description.replace(/(?:\r\n|\r|\n)/g, '\r\n');
          //--- "Code Language"
          langMode = languageValues.indexOf(message.language);
          if (langMode === -1) {
            newSnippetObject.mode = 38;
          } else {
            newSnippetObject.mode = langMode;
          };
          //--- "Code"
          newSnippetObject.code = message.code.replace(/(?:\r\n|\r|\n)/g, '\r\n');
          //--- "Favorite"
          if (message.favorite === true) {
            newSnippetObject.favorite = "1"
          } else {
            newSnippetObject.favorite = "0"
          };
          //--- "Created and Changed Dates"
          let YYYY = moment().format('YYYY');
          let M = moment().format('M');
          let D = moment().format('D');
          let HH = moment().format('HH');
          let mm = moment().format('mm');
          let ss = moment().format('ss');
          let dateTime = D+'.'+M+'.'+YYYY+' '+HH+':'+mm+':'+ss;
          newSnippetObject.dateCreated = dateTime;
          newSnippetObject.dateChanged = dateTime;
          //--- "Folder"
          if (message.folder === null || message.folder === 'None') {
            newSnippetObject.folderID = null;
            newSnippetObject.folderColor = "#888888";
          } else {
            let f = message.folder;
            let i = folderNames.indexOf(message.folder);
            newSnippetObject.folderID = folderIDs[i];
            newSnippetObject.folderColor =folderColors[i];
          };

          // createSnippetWebview - Convert New Snippet Object to String and Format it for File Save 
          let objStringified = JSON.stringify(newSnippetObject);
          let r1 = objStringified.replace(/^({)(.+)(})$/g,`{\n$2\n}`);

          let r2 = r1.replace(/("id":)(\d{13},)/g,`    $1 $2\n`);
          let r3 = r2.replace(/("title":)(".*?",)/g,`    $1 $2\n`);
          let r4 = r3.replace(/("description":)(".*?",)/g,`    $1 $2\n`);
          let r5 = r4.replace(/("mode":)(\d{1,2},)/g,`    $1 $2\n`);
          let r6 = r5.replace(/("code":)/g,`    $1 `);
          let r7 = r6.replace(/("favorite":)("0",|"1",)/g,`\n    $1 $2\n`);
          let r8 = r7.replace(/("folderColor":)("#[0-9A-Fa-f]{6}",)/g,`    $1 $2\n`);
          let r9a = r8.replace(/("folderID":)(\d{13},)/g,`    $1 $2\n`);
          let r9b = r9a.replace(/("folderID":)(null,)/g,`    $1 $2\n`);
          let r10 = r9b.replace(/("dateCreated":)("\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}",)/g,`    $1 $2\n`);
          let r11 = r10.replace(/("dateChanged":)("\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}",)/g,`    $1 $2\n`);
          let objString = r11.replace(/("webLink":)(".*?")/g,`    $1 $2`);
          //console.log('Replaced:\n',objString);

          // createSnippetWebview - Create the New Snippet File 
          let snippetFilePathName = snippetsFoldersPath + unixTimestamp.toString() + '.snipaway';
          fs.writeFileSync(snippetFilePathName, objString);

          // createSnippetWebview - Close the Webview 
          panel.dispose();

          return;
      };
    },
    undefined,
    context.subscriptions
  );

  // createSnippetWebview - Perform Any Cleanup When Webview is Closed 
  panel.onDidDispose(
    () => {
      // When the panel is closed, cancel any future updates to the webview content
      panel = undefined;
    },
    null,
    context.subscriptions
  );

};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function updateWebview ●                          │
//  │                                                                              │
//  │                           • Update Webviews HTML •                           │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function updateWebview(panel, title) {
  panel.title = title;
  panel.webview.html = getHtml();
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function getHtml ●                             │
//  │                                                                              │
//  │                           • Return Webviews HTML •                           │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function getHtml() {

  // getHtml - Get All Webview Compliant File Uri's 
  const stylesSrc = getUri("style.css", "src");
  const jsSrcVscode = getUri("bundled.js", "\\node_modules\\@vscode-elements\\elements\\dist");
  const jsSrcMain = getUri("main.js", "src");
  const { cspSource } = panel.webview;
  const nonce = getNonce();
  
  // getHtml - This is the Webviews HTML 
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Create Snippet</title>
      <meta
					http-equiv="Content-Security-Policy"
					content="
						default-src 'none'; 
						img-src ${cspSource};
						script-src ${cspSource}
						nonce ${nonce}; 
						style-src 'unsafe-inline' ${cspSource};
						style-src-elem 'unsafe-inline' ${cspSource};
						font-src ${cspSource};
					"
				/>
      <link rel="stylesheet" href="${stylesSrc}"/>
    </head>
    <body>
      <form id="form1">
        <vscode-form-group variant="vertical">
          <vscode-label required for="form1-title">Title (required)</vscode-label>
          <vscode-textfield name="title" id="form1-title" type="text" placeholder="SnipAway Snippet Title" required></vscode-textfield>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label for="form1-folder">Assign to Folder</vscode-label>
          <vscode-single-select name="folder" id="form1-folder">
            <vscode-option value="none">None</vscode-option>
          </vscode-single-select>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label for="form1-description">Description</vscode-label>
          <vscode-textarea name="description" id="form1-description" rows="6" placeholder="Enter Snippet Description"></vscode-textarea>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label for="form1-language">Code Language</vscode-label>
          <vscode-single-select name="language" id="form1-language">
            <vscode-option value="actionscript">ActionScript</vscode-option>
            <vscode-option value="batchfile">BatchFile</vscode-option>
            <vscode-option value="c_cpp">C/C++</vscode-option>
            <vscode-option value="csharp">C#</vscode-option>
            <vscode-option value="coffee">Coffee Script</vscode-option>
            <vscode-option value="css">CSS</vscode-option>
            <vscode-option value="d">D</vscode-option>
            <vscode-option value="dart">Dart</vscode-option>
            <vscode-option value="dockerfile">Docker</vscode-option>
            <vscode-option value="erlang">Erlang</vscode-option>
            <vscode-option value="fortran">Fortran</vscode-option>
            <vscode-option value="golang">Go</vscode-option>
            <vscode-option value="haskell">Haskell</vscode-option>
            <vscode-option value="html">HTML</vscode-option>
            <vscode-option value="jade">Jade</vscode-option>
            <vscode-option value="java">Java</vscode-option>
            <vscode-option value="javascript">JavaScript</vscode-option>
            <vscode-option value="json">JSON</vscode-option>
            <vscode-option value="jsx">JSX</vscode-option>
            <vscode-option value="kotlin">Kotlin</vscode-option>
            <vscode-option value="less">LESS</vscode-option>
            <vscode-option value="livescript">LiveScript</vscode-option>
            <vscode-option value="lua">Lua</vscode-option>
            <vscode-option value="markdown">Markdown</vscode-option>
            <vscode-option value="mysql">MySQL</vscode-option>
            <vscode-option value="objectivec">ObjectiveC</vscode-option>
            <vscode-option value="pascal">Pascal</vscode-option>
            <vscode-option value="perl">Perl</vscode-option>
            <vscode-option value="php">PHP</vscode-option>
            <vscode-option value="powershell">Powershell</vscode-option>
            <vscode-option value="python">Python</vscode-option>
            <vscode-option value="r">R</vscode-option>
            <vscode-option value="ruby">Ruby</vscode-option>
            <vscode-option value="rust">Rust</vscode-option>
            <vscode-option value="sass">SASS</vscode-option>
            <vscode-option value="scala">Scala</vscode-option>
            <vscode-option value="sql">SQL</vscode-option>
            <vscode-option value="swift">Swift</vscode-option>
            <vscode-option value="text" selected>Text</vscode-option>
            <vscode-option value="typescript">Typescript</vscode-option>
            <vscode-option value="vbscript">VBScript</vscode-option>
            <vscode-option value="xml">XML</vscode-option>
            <vscode-option value="yaml">YAML</vscode-option>
          </vscode-single-select>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label required for="form1-code">Code (required)</vscode-label>
          <vscode-textarea name="code" id="form1-code" type="text" rows="12" value="codevalue" required></vscode-textarea>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-checkbox label="Favorite" name="favorite" id="form1-fav"></vscode-checkbox>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-button id="create-snippet" type="submit">Create Snippet</vscode-button>
        </vscode-form-group>
        <pre id="form1-output"></pre>
      </form>    
      <script src="${jsSrcVscode}" type="module"></script>
      <script src="${jsSrcMain}"></script>
    </body>
  </html>`;

  // getHtml - Insert Code and Return HTML 
//  html.replace(/value=""/g,`value="${code}"`);
//  console.log('html:', html);
//  return(html);

};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function getUri ●                              │
//  │                                                                              │
//  │            • Return a Webview Compliant URI for File Resources •             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function getUri(filename, pathname) {
  const onDiskPath = vscode.Uri.file(
    path.join(extensionContext.extensionPath, pathname, filename)
  );
  const src = panel.webview.asWebviewUri(onDiskPath);
  return src;
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function getNonce ●                             │
//  │                                                                              │
//  │                      • Return a Nonce for the Webview •                      │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = {
  createSnippetWebview
};

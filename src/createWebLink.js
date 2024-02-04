const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const moment = require("moment");

let extensionContext;
let panel;

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Function createWebLinkWebview ●                       │
//  │                                                                              │
//  │                        • Show Extensions in Webview •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function createWebLinkWebview(context, folderNames, folderColors, folderIDs, snippetsFoldersPath) {

  // createWebLinkWebview - Save Our Extensions Context 
  extensionContext = context;

  // createWebLinkWebview - This Will Show the Webview in the Currently Active Column 
  const columnToShowIn = vscode.window.activeTextEditor
  ? vscode.window.activeTextEditor.viewColumn
  : undefined;

  // createWebLinkWebview - Create Our Extensions Webview or Reveal Existing One 
  if (panel) {
    // If we already have a panel, show it in the target column
    panel.reveal(columnToShowIn);
  } else {
    // Otherwise, create a new panel
    panel = vscode.window.createWebviewPanel(
      'WebviewPanel',
      'Create SnipAway Web Link',
      vscode.ViewColumn.Two,
      { // Enable scripts in the webview
        enableScripts: true
      }
    );
  };

  // createWebLinkWebview - Get Our Extensions Webviews HTML 
  panel.webview.html = getHtml();

  // createWebLinkWebview - Send Our Extensions Webview Initialization Data 
  panel.webview.postMessage({ "command": 'setWebLinkFolders', "folders": folderNames});

  // createWebLinkWebview - Handle Messages From the Webview 
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'createWebLink':
//          console.log(message.title);
//          console.log(message.url);
//          console.log(message.folder);
//          console.log(message.description);
//          console.log(message.language);
//          console.log(message.favorite);

          // createWebLinkWebview - New Web Link Object 
          let newWebLinkObject = {
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

          // createWebLinkWebview - Fill New Snippet Object with Data 
          const unixTimestamp = Date.now();
          //--- "ID"
          newWebLinkObject.id = unixTimestamp;
          //--- "Title"
          newWebLinkObject.title = message.title;
          //--- "Description"
          newWebLinkObject.description = message.description.replace(/(?:\r\n|\r|\n)/g, '\r\n');
          //--- "Code Language"
          newWebLinkObject.mode = 38;
          //--- "Code"
          newWebLinkObject.code = "";
          //--- "Favorite"
          if (message.favorite === true) {
            newWebLinkObject.favorite = "1"
          } else {
            newWebLinkObject.favorite = "0"
          };
          //--- "Created and Changed Dates"
          let YYYY = moment().format('YYYY');
          let M = moment().format('M');
          let D = moment().format('D');
          let HH = moment().format('HH');
          let mm = moment().format('mm');
          let ss = moment().format('ss');
          let dateTime = D+'.'+M+'.'+YYYY+' '+HH+':'+mm+':'+ss;
          newWebLinkObject.dateCreated = dateTime;
          newWebLinkObject.dateChanged = dateTime;
          //--- "Folder"
          if (message.folder === null || message.folder === 'None') {
            newWebLinkObject.folderID = null;
            newWebLinkObject.folderColor = "#888888";
          } else {
            let f = message.folder;
            let i = folderNames.indexOf(message.folder);
            newWebLinkObject.folderID = folderIDs[i];
            newWebLinkObject.folderColor =folderColors[i];
          };
          //--- "Web Link"
          newWebLinkObject.webLink = message.url;
          
          // createWebLinkWebview - Convert New Snippet Object to String and Format it for File Save 
          let objStringified = JSON.stringify(newWebLinkObject);
          let r1 = objStringified.replace(/^({)(.+)(})$/g,`{\n$2\n}`);

          let r2 = r1.replace(/("id":)(\d{13},)/g,`    $1 $2\n`);
          let r3 = r2.replace(/("title":)(".*?",)/g,`    $1 $2\n`);
          let r4 = r3.replace(/("description":)(".*?",)/g,`    $1 $2\n`);
          let r5 = r4.replace(/("mode":)(\d{1,2},)/g,`    $1 $2\n`);
          let r6 = r5.replace(/("code":)(".*?",)/g,`    $1 $2\n`);
          let r7 = r6.replace(/("favorite":)("0",|"1",)/g,`    $1 $2\n`);
          let r8 = r7.replace(/("folderColor":)("#[0-9A-Fa-f]{6}",)/g,`    $1 $2\n`);
          let r9a = r8.replace(/("folderID":)(\d{13},)/g,`    $1 $2\n`);
          let r9b = r9a.replace(/("folderID":)(null,)/g,`    $1 $2\n`);
          let r10 = r9b.replace(/("dateCreated":)("\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}",)/g,`    $1 $2\n`);
          let r11 = r10.replace(/("dateChanged":)("\d{1,2}\.\d{1,2}\.\d{4} \d{2}:\d{2}:\d{2}",)/g,`    $1 $2\n`);
          let objString = r11.replace(/("webLink":)(".*?")/g,`    $1 $2`);
          //console.log('Replaced:\n',objString);

          // createWebLinkWebview - Create the New Snippet File 
          let snippetFilePathName = snippetsFoldersPath + unixTimestamp.toString() + '.snipaway';
          fs.writeFileSync(snippetFilePathName, objString);

          // createWebLinkWebview - Close the Webview 
          panel.dispose();

          return;
      };
    },
    undefined,
    context.subscriptions
  );

  // createWebLinkWebview - Perform Any Cleanup When Webview is Closed 
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
      <title>Create Web Link</title>
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
      <form id="form2">
        <vscode-form-group variant="vertical">
          <vscode-label required for="form2-title">Title (required)</vscode-label>
          <vscode-textfield name="title" id="form2-title" type="text" placeholder="SnipAway Web Link Title" required></vscode-textfield>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label required for="form2-url">URL (required)</vscode-label>
          <vscode-textfield name="url" id="form2-url" type="url" placeholder="SnipAway Web Link URL" required></vscode-textfield>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label for="form2-folder">Assign to Folder</vscode-label>
          <vscode-single-select name="folder" id="form2-folder">
            <vscode-option value="none">None</vscode-option>
          </vscode-single-select>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-label for="form2-description">Description</vscode-label>
          <vscode-textarea name="description" id="form2-description" rows="6" placeholder="Enter Snippet Description"></vscode-textarea>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-checkbox label="Favorite" name="favorite" id="form2-fav"></vscode-checkbox>
        </vscode-form-group>
        <vscode-form-group variant="vertical">
          <vscode-button id="create-snippet" type="submit">Create Web Link</vscode-button>
        </vscode-form-group>
        <pre id="form2-output"></pre>
      </form>    
      <script src="${jsSrcVscode}" type="module"></script>
      <script src="${jsSrcMain}"></script>
    </body>
  </html>`;
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
  createWebLinkWebview
};

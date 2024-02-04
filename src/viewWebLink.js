const vscode = require("vscode");
const path = require("path");

let extensionContext;
let panel;

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                       ● Function showWebLinkWebview ●                        │
//  │                                                                              │
//  │                        • Show Extensions in Webview •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function showWebLinkWebview(context, webAddress, description) {

  // showWebLinkWebview - Save Our Extensions Context 
  extensionContext = context;

  // showWebLinkWebview - This Will Show the Webview in the Currently Active Column 
  const columnToShowIn = vscode.window.activeTextEditor
  ? vscode.window.activeTextEditor.viewColumn
  : undefined;

  // showWebLinkWebview - Create Our Extensions Webview or Reveal Existing One 
  if (panel) {
    // If we already have a panel, show it in the target column
    panel.reveal(columnToShowIn);
  } else {
    // Otherwise, create a new panel
    panel = vscode.window.createWebviewPanel(
      'WebviewPanel',
      'SnipAway Web Link',
      vscode.ViewColumn.One,
      { // Enable scripts in the webview
        enableScripts: true
      }
    );
  };

  // showWebLinkWebview - Get Our Extensions Webviews HTML 
  if (description.length > 64) {
    description = description.slice(0,63);
    description += '...';
  };
  panel.webview.html = getHtml(webAddress, description);

  // showWebLinkWebview - Send Our Extensions Webview Initialization Data 
//  panel.webview.postMessage({ command: 'commandName', count: `${someData.length}`, someData: someData});

  // showWebLinkWebview - Handle Messages From the Webview 
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text);
          return;
      }
    },
    undefined,
    context.subscriptions
  );

  // showWebLinkWebview - Perform Any Cleanup When Webview is Closed 
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
  panel.webview.html = getHtml(webAddress);
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function getHtml ●                             │
//  │                                                                              │
//  │                           • Return Webviews HTML •                           │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function getHtml(site, description) {

  // getHtml - Get All Webview Compliant File Uri's 
  const stylesSrc = getUri("style.css", "src");
//  const jsSrcVscode = getUri("bundled.js", "\\node_modules\\@bendera\\vscode-webview-elements\\dist");
//  const jsSrcMain = getUri("main.js", "src");
  const { cspSource } = panel.webview;
//  const nonce = getNonce();

  // getHtml - This is the Webviews HTML 
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>View Web Link</title>
      <meta
					http-equiv="Content-Security-Policy"
					content="
            img-src ${cspSource};
            script-src ${cspSource};
            style-src 'unsafe-inline' ${cspSource};
            style-src-elem 'unsafe-inline' ${cspSource};
            font-src ${cspSource};
          "
				/>
      <link rel="stylesheet" href="${stylesSrc}"/>
      <style>body{background: #0B0639;}</style>
    </head>
    <body>
      <div class="title">
        <span class="app">SnipAway Web Link &nbsp;&nbsp;</span>
        <span class="webpage">Open in browser:&nbsp;<a id="sitebutton" href="${site}">${site}</a></span>
        <span class="description">Description: ${description}</span>
      </div>
      <div class="blah">
        <h2>This site does not support being imbedded in Visual Studio Codes Webview iFrame</h2>
        <h3>Please use the link above to open the site in the default browser...</h3>
      </div>
      <iframe id="browserFrame" src="${site}" style="position:fixed; top:20px; left:0px; bottom:0px; right:0px; width:100%; height:98%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;"> 
      </iframe>
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
  showWebLinkWebview
};

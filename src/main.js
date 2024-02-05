// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();

const formSnippet = document.getElementById("form1");
const formWebLink = document.getElementById("form2");
const foldersElement1 = document.getElementById('form1-folder');
const languageElement1 = document.getElementById('form1-language');
const codeElement1 = document.getElementById('form1-code');
const foldersElement2 = document.getElementById('form2-folder');
//--- Create Snippet
let title1 = "";
let folder1 = "";
let description1 = "";
let language1 = "";
let code1 = "";
let favorite1 = false;
//--- Create Web Link
let title2 = "";
let url2 = "";
let folder2 = "";
let description2 = "";
let language2 = "";
let code2 = "";
let favorite2 = false;

  // main.js - Handle Messages Sent From the Extension to the Webview 
  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case 'setSnippetFolders':
        codeElement1.value = message.code;
        languageElement1.value = message.codeLanguage;
        //console.log('message.codeLanguage:', message.codeLanguage);
        for (let i = 0; i < message.folders.length; i++) {
          let option = document.createElement('vscode-option');
          option.innerHTML = message.folders[i];
          foldersElement1.appendChild(option);
        };
        break;

      case 'setWebLinkFolders':
        for (let i = 0; i < message.folders.length; i++) {
          let option = document.createElement('vscode-option');
          option.innerHTML = message.folders[i];
          foldersElement2.appendChild(option);
        };
        break;
      }
    }
  );

  // main.js - Handle Create Snippet Button Pressed 
  if (formSnippet) {
    formSnippet.addEventListener("submit", (ev) => {
      ev.preventDefault();
      fd = new FormData(formSnippet);
      title1 = fd.get('title');
      folder1 = fd.get('folder');
      description1 = fd.get('description');
      language1 = fd.get('language');
      code1 = fd.get('code');
      favorite1 = false;
      if (fd.get('favorite') != null) {
        favorite1 = true;
      };
      createSnippet();
    });
  };

  // main.js - Handle Create Web Link Button Pressed 
  if (formWebLink) {
    formWebLink.addEventListener("submit", (ev) => {
      ev.preventDefault();
      fd = new FormData(formWebLink);
      title2 = fd.get('title');
      url2 = fd.get('url');
      folder2 = fd.get('folder');
      description2 = fd.get('description');
      language2 = "text"; //fd.get('language');
      code2 = ""; //fd.get('code');
      favorite2 = false;
      if (fd.get('favorite') != null) {
        favorite2 = true;
      };
      createWebLink();
    });
  };

  // main.js - Handle Create Snippet Folder List Selection Change 
  if (foldersElement1) {
    foldersElement1.addEventListener('change', (event) => {
      folder = foldersElement1.value;
      //console.log('folderSelection:', folderSelection);
      //console.log(foldersList.value);
    });
  };

  // main.js - Handle Create Web Link Folder List Selection Change 
  if (foldersElement2) {
    foldersElement2.addEventListener('change', (event) => {
      folder = foldersElement2.value;
      //console.log('folderSelection:', folderSelection);
      //console.log(foldersList.value);
    });
  };

  // main.js - Send Create Snippet Message From the Webview Back to the Extension 
  function createSnippet() {
    vscode.postMessage({
        command: "createSnippet",
        title: title1,
        folder: folder1,
        description: description1,
        language: language1,
        code: code1,
        favorite: favorite1
    });
  };

  // main.js - Send Create Web Link Message From the Webview Back to the Extension 
  function createWebLink() {
    vscode.postMessage({
        command: "createWebLink",
        title: title2,
        url: url2,
        folder: folder2,
        description: description2,
        language: language2,
        code: code2,
        favorite: favorite2
    });
  };


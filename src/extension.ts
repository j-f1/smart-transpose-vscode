"use strict";

import * as vscode from "vscode";

const ops = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "&",
  "|",
  "<<",
  ">>",
  ">>>",
  "==",
  "!=",
  "===",
  "!==",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "=",
];

const delims = [",", ";", ":"];

const separators = [...ops, ...delims];

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "extension.transpose",
    function () {
      const editor = vscode.window.activeTextEditor;

      if (!editor) return;

      const { document, selection } = editor;

      const toTranspose = document.getText(selection);

      let transposed = "";
      let confused = false;

      const queue = [...separators];
      while (queue.length > 0) {
        const sep = queue.shift()!;
        const splits = toTranspose.split(sep);
        if (splits.length === 2) {
          console.log(`hit '${sep}'`);
          if (transposed) {
            confused = true;
            break;
          }

          const [a, b] = splits;
          transposed = `${b}${sep}${a}`;
          if (
            delims.includes(sep) &&
            toTranspose.split(sep + " ").length === 2
          ) {
            console.log(`adding space to ${sep}`);
            transposed = "";

            queue.unshift(sep + " ");
          } else if (
            ops.includes(sep) &&
            toTranspose.split(` ${sep} `).length === 2
          ) {
            console.log(`adding spaces around ${sep}`);
            transposed = "";

            queue.unshift(` ${sep} `);
          }
        }
      }

      if (!transposed) {
        const splits = toTranspose.split(" ");
        if (splits.length === 2) {
          const [a, b] = splits;
          transposed = `${b} ${a}`;
        }
      }

      if (transposed) {
        if (confused) {
          vscode.window.showErrorMessage("Cannot transpose this selection");
        } else {
          editor.edit((editBuilder) => {
            editBuilder.replace(selection, transposed);
          });
        }
      } else {
        vscode.window.showErrorMessage("Cannot transpose this selection");
      }
    }
  );

  context.subscriptions.push(disposable);
}

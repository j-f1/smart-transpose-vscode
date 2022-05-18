"use strict";

import * as vscode from "vscode";

const separators = [",", ";", ":"];

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "transpose.smart",
    function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const results = editor.selections.map((selection) =>
        transpose(selection, editor.document)
      );
      editor.edit((editBuilder) => {
        results.forEach((result) => {
          result.edit?.(editBuilder);
        });
      });

      editor.selections = results.map((result) => result.selection);
    }
  );

  context.subscriptions.push(disposable);
}

function transpose(
  range: vscode.Range | vscode.Selection,
  document: vscode.TextDocument
): { edit?: (_: vscode.TextEditorEdit) => void; selection: vscode.Selection } {
  if (range.isEmpty) {
    const cursor = range.start;
    console.log(cursor, document.validatePosition(cursor.translate(0, 1)));
    let expandedRange: vscode.Range;
    if (document.validatePosition(cursor.translate(0, 1)).isEqual(cursor)) {
      expandedRange = new vscode.Range(cursor.translate(0, -2), cursor);
    } else {
      expandedRange = new vscode.Range(
        cursor.translate(0, -1),
        cursor.translate(0, 1)
      );
    }
    const text = document.getText(expandedRange);

    return {
      edit: (editBuilder) => {
        editBuilder.replace(expandedRange, text.split("").reverse().join(""));
      },
      selection: new vscode.Selection(expandedRange.end, expandedRange.end),
    };
  }

  const { transposed, confused } = transposePhrase(document.getText(range));

  if (transposed) {
    if (confused) {
      vscode.window.showErrorMessage("Cannot transpose this selection");
    } else {
      return {
        edit: (editBuilder) => {
          editBuilder.replace(range, transposed);
        },
        selection: new vscode.Selection(range.end, range.end),
      };
    }
  } else {
    vscode.window.showErrorMessage("Cannot transpose this selection");
  }

  return {
    selection: new vscode.Selection(range.start, range.end),
  };
}

function transposePhrase(toTranspose: string) {
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
      if (toTranspose.split(sep + " ").length === 2) {
        console.log(`adding space to ${sep}`);
        transposed = "";

        queue.unshift(sep + " ");
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

  return { transposed, confused };
}

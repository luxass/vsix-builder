import { parse } from "@babel/core";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "bundled-extension" is now active!');

	const disposable = vscode.commands.registerCommand("bundled-extension.helloWorld", () => {
		const code = "const a = 1; const b = 2; console.log(a + b);";

		const result = parse(code, {
			sourceType: "script",
			plugins: ["jsx"],
		});

		console.log(result);

		vscode.window.showInformationMessage("Hello World from Bundled Extension!");
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

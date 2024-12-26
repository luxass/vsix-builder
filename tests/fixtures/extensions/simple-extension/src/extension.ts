import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "simple-extension" is now active!');

	const disposable = vscode.commands.registerCommand("simple-extension.helloWorld", () => {
		vscode.window.showInformationMessage("Hello World from Simple Extension!");
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

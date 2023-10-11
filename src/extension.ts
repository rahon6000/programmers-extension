// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import * as lang from './langSetup';

let title: string;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "programmers-extension" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableExport = vscode.commands.registerCommand('programmers-extension.export', () => {
		try {
			let editorTexts = "hello";
			let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
			if (editor === undefined) { throw Error("No active text editor"); }
			let doc: vscode.TextDocument = editor.document;
			let userLang = doc.languageId;
			vscode.env.clipboard.writeText(codeToClipboard(doc.getText(), userLang));
			printIt("📎클립보드📎에 복사 완료~ ☘");

		} catch (error) {
			printIt("cannot copy solution");
		}

	});
	context.subscriptions.push(disposableExport);



	let disposableImport = vscode.commands.registerCommand('programmers-extension.import', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const urlQuery = await vscode.window.showInputBox({
			placeHolder: "URL of problem...",
			prompt: "URL 입력 ex) https://school.programmers.co.kr/learn/courses/30/lessons/68645",
			value: ""
		});
		if (urlQuery === undefined) { return; }
		if (urlQuery.search("https://school.programmers.co.kr/learn") !== 0 ) {
			printIt("url 을 확인해 주세요.");
			return;
		}

		let htmlContext = "";
		const ax = axios;
		ax.get(urlQuery,
			{
				headers: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.55 VScodeProgrammersExtension/0.0.0"
				}
			})
			.then(function (response) {
				try {
					// success
					htmlContext = response.data;
					let mainSection = [getMainSection(htmlContext)];
					let problem: Problem = extractTC(mainSection);

					// 에디터가 undefined 일 때의 예외 처리 해 줘야 한다.
					let editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
					if (editor === undefined) { throw Error("No active text editor"); }
					let doc: vscode.TextDocument = editor.document;

					// check language.
					let userLang = doc.languageId;

					// insert context!
					editor.edit(editBuilder => {
						editBuilder.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(doc.lineCount, 0)));
						let generatedCode = buildCode(problem, userLang);
						// editBuilder.insert( doc.positionAt(0), generatedCode);
						editBuilder.insert(doc.positionAt(0), generatedCode);
					});

					printIt("프로그래머스 문제 **" + problem.title + "** 로딩 완료~🤟");
					return;
				} catch (error) {
					printIt("파싱 실패");
					return;
				}
			})
			.catch(function (error) {
				// fail
				printIt("통신 실패");
				return;
			})
			.finally(function () {
				// typical finally
			});
	});

	context.subscriptions.push(disposableImport);
}
// This method is called when your extension is deactivated
export function deactivate() { }

function getMainSection(html: string): string {
	let titleSearchStart = html.search("algorithm-title\">");
	html = html.substring(titleSearchStart + 17);
	title = html.substring(0, html.search("</li>"));
	let headSearch = "<div class=\"markdown solarized-dark\">";
	let guideSectionStart = html.search(headSearch);
	let guideSectionEnd = html.search("<div class=\"run-section\">");

	return html.substring(guideSectionStart + headSearch.length, guideSectionEnd);
}

function extractTC(mainSection: String[]): Problem {
	// 일관성 없게 title 은 전역변수로 선언해버리기~
	let desc = "";
	let limit = "";
	let tcHeader: string[] = [];
	let tcCase: string[] = [];
	// first get problem description.
	while (checkFirstTag(mainSection) === "p") {
		desc += getInnerText(mainSection, "p");
	}
	trimUntil(mainSection, "li");
	while (checkFirstTag(mainSection) === "li") {
		limit += getInnerText(mainSection, "li");
	}
	trimUntil(mainSection, "th");
	while (checkFirstTag(mainSection) === "th") {
		tcHeader.push(getInnerText(mainSection, "th"));
	}
	trimUntil(mainSection, "td");
	let checkTableTag = checkFirstTag(mainSection);
	while (checkTableTag === "td" || checkTableTag === "/tr") {
		let tcInnerText = removeTag(getInnerText(mainSection, "td"));
		if (tcInnerText === "!%%EOC%%") { break; }
		tcCase.push(tcInnerText);
		checkTableTag = checkFirstTag(mainSection);

	}
	let problem = new Problem(title, desc, limit, tcHeader, tcCase);

	return problem;
}

function getInnerText(mainSection: String[], tag: string): string {
	// let mainSection = "<h5>입출력 예</h5>";
	let locS = mainSection[0].search("<" + tag + ">");
	if (locS === -1) { return "!%%EOC%%"; }
	let locE = mainSection[0].search("</" + tag + ">");
	let result = mainSection[0].substring(locS + tag.length + 2, locE);
	mainSection[0] = mainSection[0].slice(locE + tag.length + 3);

	return result;
}

function printIt(result: string) {
	vscode.window.showInformationMessage(result);
}

function checkFirstTag(mainSection: String[]): string {
	let searchS = mainSection[0].search("<");
	let searchE = mainSection[0].search(">");
	return mainSection[0].substring(searchS + 1, searchE);
}
function trimUntil(mainSection: String[], tag: string) {
	let locS = mainSection[0].search("<" + tag + ">");
	let locE = mainSection[0].search("</" + tag + ">");
	mainSection[0] = mainSection[0].slice(locS);
}

function buildCode(problem: Problem, language: string): string {
	let codeResult = "";
	switch (language) {
		case "java":
			codeResult = lang.javaCodeBuilder(problem);
			return codeResult;
		case "python":
			codeResult = lang.pythonCodeBuilder(problem);
			return codeResult;
		case "javascript":
			codeResult = lang.javascriptCodeBuilder(problem);
			return codeResult;
		case "customLang":
			//customLang
			return codeResult;
		default:
			codeResult = "langage not supported.";
			return codeResult;
	}
}

function codeToClipboard(str: string, language: string) {
	let codeResult = "";
	switch (language) {
		case "java":
			codeResult = lang.javaCodeExporter(str);
			return codeResult;
		case "python":
			codeResult = lang.pythonCodeExporter(str);
			return codeResult;
		case "javascript":
			codeResult = lang.javascriptCodeExporter(str);
			return codeResult;
		case "customLang":
			//customLang
			return codeResult;
		default:
			codeResult = vscode.window.activeTextEditor?.document.getText() as string;
			return codeResult;
	}
}

function removeTag(str: string): string {
	let locS = str.search(">");
	if (locS === -1) { return str; }
	str = str.substring(locS + 1);
	let locE = str.search("</");
	str = str.substring(0, locE);
	return str;
}

export class Problem {
	title!: string;
	desc!: string;
	limit!: string;
	tcHeader: string[] = [];
	tcCase: string[] = [];

	constructor(title: string, limit: string, desc: string, tcHeader: string[], tcCase: string[]) {
		this.title = title;
		this.desc = desc;
		this.tcHeader = tcHeader;
		this.tcCase = tcCase;
	}
}
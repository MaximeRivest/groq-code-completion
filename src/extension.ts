import * as vscode from 'vscode';
import Groq from 'groq-sdk';

// Completion markers that trigger AI assistance
const COMPLETION_MARKERS = [
    '// TODO:',
    '// COMPLETE:',
    '// AI:',
    '// IMPLEMENT:',
    '// FIXME:',
    '# TODO:',
    '# COMPLETE:',
    '# AI:',
    '# IMPLEMENT:',
    '# FIXME:'
];

interface CompletionContext {
    type: 'marker' | 'empty_function' | 'empty_block' | 'cursor_position';
    insertPosition: vscode.Position;
    replaceRange?: vscode.Range;
    marker?: string;
    indentLevel: number;
}

interface CompletionResult {
    file?: string;
    line?: number;
    character?: number;
    code?: string;
    reason?: string;
    error?: string;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Groq Code Completion extension activated');

    let disposable = vscode.commands.registerCommand('groqCodeCompletion.complete', async () => {
        try {
            await runGroqCompletion();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Groq Code Completion Error: ${error.message}`);
            console.error('Groq completion error:', error);
        }
    });

    context.subscriptions.push(disposable);
}

async function runGroqCompletion() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('groqCodeCompletion');
    let apiKey = config.get<string>('apiKey');
    
    // Fall back to environment variable if not set in config
    if (!apiKey || apiKey.trim() === '') {
        apiKey = process.env.GROQ_API_KEY;
    }
    
    if (!apiKey) {
        const action = await vscode.window.showErrorMessage(
            'Groq API key not found. Please set it in settings or as GROQ_API_KEY environment variable.',
            'Open Settings'
        );
        if (action === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'groqCodeCompletion.apiKey');
        }
        return;
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Get current document info
    const currentDocument = editor.document;
    const currentContent = currentDocument.getText();
    const currentPosition = editor.selection.active;
    const currentOffset = currentDocument.offsetAt(currentPosition);
    const fileName = vscode.workspace.asRelativePath(currentDocument.fileName);
    const language = currentDocument.languageId;
    
    // Get cursor context
    const lineNumber = currentPosition.line;
    const lineText = currentDocument.lineAt(lineNumber).text;
    const charPosition = currentPosition.character;
    
    // Analyze context to find completion point
    const completionContext = analyzeCompletionContext(
        currentContent,
        currentOffset,
        lineNumber,
        lineText
    );

    // Get all open tabs content (limited by config)
    const allTabs = await getAllOpenTabsContent(
        config.get<number>('contextFileLimit', 5),
        currentDocument.uri
    );
    
    // Prepare the prompt
    const prompt = preparePrompt(
        currentContent,
        currentOffset,
        allTabs,
        fileName,
        language,
        lineNumber,
        charPosition,
        completionContext
    );

    // Show progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Groq AI is generating code...",
        cancellable: true
    }, async (progress, token) => {
        // Get configuration values
        const model = config.get<string>('model', 'mixtral-8x7b-32768');
        const maxTokens = config.get<number>('maxTokens', 2048);
        const temperature = config.get<number>('temperature', 0.3);
        const streaming = config.get<boolean>('streaming', true);

        try {
            if (streaming) {
                // Streaming response
                const stream = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert code completion assistant. Analyze the context and return ONLY valid JSON describing where and what code to insert. No markdown, no explanations outside the JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    model: model,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    stream: true
                });

                let fullResponse = '';
                for await (const chunk of stream) {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    const content = chunk.choices[0]?.delta?.content || '';
                    fullResponse += content;
                    
                    // Update progress
                    progress.report({ message: `Received ${fullResponse.length} characters...` });
                }

                // Parse and handle the response
                await handleCompletionResponse(fullResponse, editor, completionContext);
                
            } else {
                // Non-streaming response
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert code completion assistant. Analyze the context and return ONLY valid JSON describing where and what code to insert. No markdown, no explanations outside the JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    model: model,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    stream: false
                });

                const response = completion.choices[0]?.message?.content || '';
                await handleCompletionResponse(response, editor, completionContext);
            }
            
        } catch (error: any) {
            throw error;
        }
    });
}

async function handleCompletionResponse(
    response: string, 
    editor: vscode.TextEditor, 
    context: CompletionContext
) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }
        
        const result: CompletionResult = JSON.parse(jsonMatch[0]);
        
        if (result.error) {
            vscode.window.showInformationMessage(`Groq: ${result.error}`);
            return;
        }
        
        if (!result.code) {
            vscode.window.showWarningMessage('No code was generated');
            return;
        }
        
        // Determine the target position and file
        let targetEditor = editor;
        let targetPosition = context.insertPosition;
        
        // If the AI specified a different file, open it
        if (result.file && result.line !== undefined) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, result.file);
                const targetDoc = await vscode.workspace.openTextDocument(targetUri);
                targetEditor = await vscode.window.showTextDocument(targetDoc);
                targetPosition = new vscode.Position(
                    result.line, 
                    result.character || 0
                );
            }
        }
        
        // Insert the completion
        await insertCompletion(targetEditor, result.code, context, targetPosition);
        
        const message = result.reason 
            ? `Code inserted: ${result.reason}` 
            : 'Code inserted successfully';
        vscode.window.showInformationMessage(message);
        
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to parse AI response: ${error.message}`);
        console.error('Response parsing error:', error);
        console.error('Raw response:', response);
    }
}

async function getAllOpenTabsContent(
    limit: number,
    currentUri: vscode.Uri
): Promise<Map<string, string>> {
    const tabs = new Map<string, string>();
    let count = 0;
    
    // Get all text documents from all tab groups
    const tabGroups = vscode.window.tabGroups.all;
    
    for (const group of tabGroups) {
        for (const tab of group.tabs) {
            if (count >= limit) break;
            
            if (tab.input instanceof vscode.TabInputText) {
                // Skip the current file
                if (tab.input.uri.toString() === currentUri.toString()) {
                    continue;
                }
                
                try {
                    const doc = await vscode.workspace.openTextDocument(tab.input.uri);
                    const relativePath = vscode.workspace.asRelativePath(tab.input.uri);
                    
                    // Truncate very long files
                    const content = doc.getText();
                    const maxLength = 3000;
                    const truncated = content.length > maxLength 
                        ? content.substring(0, maxLength) + '\n... (truncated)'
                        : content;
                    
                    tabs.set(relativePath, truncated);
                    count++;
                } catch (error) {
                    console.error(`Could not read tab: ${tab.input.uri}`, error);
                }
            }
        }
    }
    
    return tabs;
}

function analyzeCompletionContext(
    content: string,
    cursorOffset: number,
    lineNumber: number,
    currentLine: string
): CompletionContext {
    const lines = content.split('\n');
    
    // Check for completion markers
    for (const marker of COMPLETION_MARKERS) {
        const markerIndex = currentLine.indexOf(marker);
        if (markerIndex !== -1) {
            return {
                type: 'marker',
                insertPosition: new vscode.Position(lineNumber, markerIndex),
                replaceRange: new vscode.Range(
                    new vscode.Position(lineNumber, markerIndex),
                    new vscode.Position(lineNumber, currentLine.length)
                ),
                marker: marker,
                indentLevel: markerIndex
            };
        }
    }
    
    // Check for empty function body
    if (lineNumber > 0) {
        const prevLine = lines[lineNumber - 1];
        const prevLineTrimmed = prevLine.trim();
        
        // Check various function patterns
        const functionPatterns = [
            /\{$/, // General block opening
            /:$/, // Python function/class
            /\bdef\b.*:$/, // Python def
            /\bclass\b.*:$/, // Python class
            /function.*\{$/, // JavaScript function
            /\=\>.*\{$/, // Arrow function
            /\bif\b.*\{$/, // if statement
            /\bfor\b.*\{$/, // for loop
            /\bwhile\b.*\{$/, // while loop
        ];
        
        const isEmptyBlock = functionPatterns.some(pattern => pattern.test(prevLineTrimmed)) &&
                           currentLine.trim() === '' &&
                           lineNumber < lines.length - 1 &&
                           (lines[lineNumber + 1].trim().startsWith('}') || lines[lineNumber + 1].trim() === '');
        
        if (isEmptyBlock) {
            const indent = currentLine.match(/^(\s*)/)?.[1]?.length || 0;
            const baseIndent = prevLine.match(/^(\s*)/)?.[1]?.length || 0;
            const newIndent = prevLineTrimmed.endsWith(':') ? baseIndent + 4 : indent || baseIndent + 4;
            
            return {
                type: 'empty_function',
                insertPosition: new vscode.Position(lineNumber, newIndent),
                indentLevel: newIndent
            };
        }
    }
    
    // Check for empty block (cursor after opening brace)
    if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith(':')) {
        const indent = currentLine.match(/^(\s*)/)?.[1]?.length || 0;
        const additionalIndent = currentLine.trim().endsWith(':') ? 4 : 4;
        return {
            type: 'empty_block',
            insertPosition: new vscode.Position(lineNumber + 1, indent + additionalIndent),
            indentLevel: indent + additionalIndent
        };
    }
    
    // Default: use cursor position
    const indent = currentLine.match(/^(\s*)/)?.[1]?.length || 0;
    return {
        type: 'cursor_position',
        insertPosition: new vscode.Position(lineNumber, currentLine.length),
        indentLevel: indent
    };
}

function preparePrompt(
    currentContent: string,
    cursorOffset: number,
    allTabs: Map<string, string>,
    fileName: string,
    language: string,
    lineNumber: number,
    charPosition: number,
    context: CompletionContext
): string {
    // Split current content into before and after cursor
    const beforeCursor = currentContent.substring(0, cursorOffset);
    const afterCursor = currentContent.substring(cursorOffset);
    
    // Format other files content
    let otherFilesContent = '';
    for (const [filePath, content] of allTabs) {
        otherFilesContent += `\n\nFile: ${filePath}\n\`\`\`${language}\n${content}\n\`\`\``;
    }

    let contextDescription = '';
    switch (context.type) {
        case 'marker':
            contextDescription = `There is a completion marker "${context.marker}" on line ${lineNumber + 1} that should be replaced with appropriate code.`;
            break;
        case 'empty_function':
            contextDescription = `The cursor is inside an empty function/method body on line ${lineNumber + 1} that needs implementation.`;
            break;
        case 'empty_block':
            contextDescription = `The cursor is after an opening brace/colon of a code block on line ${lineNumber + 1} that needs content.`;
            break;
        case 'cursor_position':
            contextDescription = `Complete the code at the current cursor position (line ${lineNumber + 1}, character ${charPosition + 1}).`;
            break;
    }

    return `You are completing code in a ${language} file.

CURRENT FILE: ${fileName}
CONTEXT: ${contextDescription}

CODE BEFORE CURSOR:
\`\`\`${language}
${beforeCursor}
\`\`\`

CODE AFTER CURSOR:
\`\`\`${language}
${afterCursor}
\`\`\`

OTHER OPEN FILES FOR CONTEXT:${otherFilesContent}

INSTRUCTIONS:
1. Analyze the code context and determine what needs to be completed
2. Look for patterns, naming conventions, and coding style in the existing code
3. Generate code that matches the project's style and patterns
4. For markers like TODO or COMPLETE, implement what the marker describes
5. For empty functions/blocks, provide a complete, logical implementation
6. Consider imports, error handling, and edge cases

Return ONLY a JSON object with ONE of these two formats:

SUCCESS FORMAT:
{
  "code": "the code to insert",
  "reason": "brief explanation of what was added"
}

OR if you cannot confidently complete the code:

ERROR FORMAT:
{
  "error": "explanation of why completion is not possible"
}

The code should be properly indented with ${context.indentLevel} spaces base indentation.
Do not include the JSON in markdown code blocks. Return only the raw JSON object.`;
}

async function insertCompletion(
    editor: vscode.TextEditor,
    code: string,
    context: CompletionContext,
    position?: vscode.Position
): Promise<void> {
    const targetPosition = position || context.insertPosition;
    
    await editor.edit(editBuilder => {
        // Clean up the code - remove any potential JSON escaping
        let cleanedCode = code;
        
        // Handle escaped newlines and quotes
        cleanedCode = cleanedCode.replace(/\\n/g, '\n');
        cleanedCode = cleanedCode.replace(/\\"/g, '"');
        cleanedCode = cleanedCode.replace(/\\\\/g, '\\');
        
        // Ensure proper indentation
        if (context.indentLevel > 0) {
            const indent = ' '.repeat(context.indentLevel);
            const lines = cleanedCode.split('\n');
            cleanedCode = lines
                .map((line, index) => {
                    // Don't indent empty lines
                    if (line.trim() === '') return line;
                    // First line might already be indented if replacing a marker
                    if (index === 0 && context.type === 'marker') return line;
                    return indent + line;
                })
                .join('\n');
        }
        
        if (context.replaceRange && context.type === 'marker') {
            // Replace the marker and everything after it on the same line
            editBuilder.replace(context.replaceRange, cleanedCode);
        } else if (context.type === 'empty_function' || context.type === 'empty_block') {
            // For empty blocks, we might need to add a newline before
            const needsNewlineBefore = context.type === 'empty_block';
            const codeToInsert = needsNewlineBefore ? '\n' + cleanedCode : cleanedCode;
            editBuilder.insert(targetPosition, codeToInsert);
        } else {
            // Insert at position with a newline if needed
            const needsNewline = targetPosition.character > 0;
            const codeToInsert = needsNewline ? '\n' + cleanedCode : cleanedCode;
            editBuilder.insert(targetPosition, codeToInsert);
        }
    });
    
    // Move cursor to a sensible position after insertion
    const insertedLines = code.split('\n');
    const lastLineLength = insertedLines[insertedLines.length - 1].length;
    let newLine = targetPosition.line + insertedLines.length - 1;
    let newChar = lastLineLength;
    
    if (insertedLines.length === 1) {
        newChar = targetPosition.character + lastLineLength;
    }
    
    const newPosition = new vscode.Position(newLine, newChar);
    editor.selection = new vscode.Selection(newPosition, newPosition);
    editor.revealRange(new vscode.Range(newPosition, newPosition));
}

export function deactivate() {
    console.log('Groq Code Completion extension deactivated');
}
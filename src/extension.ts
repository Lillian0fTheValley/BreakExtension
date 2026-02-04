// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
let reminderTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

function clearAllReminders() {
    for (const t of reminderTimers.values()) {
        clearInterval(t);
    }
    reminderTimers.clear();
}

function scheduleReminder(id: string, intervalMinutes: number, message: string) {
    if (intervalMinutes <= 0) {
        return;
    }
    // clear existing
    const existing = reminderTimers.get(id);
    if (existing) {
        clearInterval(existing);
    }
    const ms = intervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
        const show = vscode.workspace.getConfiguration('break').get<boolean>('reminders.showNotification', true);
        if (show) {
            vscode.window.showInformationMessage(message);
        } else {
            console.log(`Reminder (${id}): ${message}`);
        }
    }, ms);
    reminderTimers.set(id, timer);
}

function configureReminders() {
    clearAllReminders();
    const config = vscode.workspace.getConfiguration('break');
    const enabled = config.get<boolean>('reminders.enable', true);
    if (!enabled) return;

    const waterEnabled = config.get<boolean>('reminders.water.enabled', true);
    if (waterEnabled) {
        const interval = config.get<number>('reminders.water.intervalMinutes', 60) || 60;
        const message = config.get<string>('reminders.water.message', 'Time for a water break!');
        scheduleReminder('water', interval, message);
    }

    const eyeEnabled = config.get<boolean>('reminders.eye.enabled', true);
    if (eyeEnabled) {
        const interval = config.get<number>('reminders.eye.intervalMinutes', 20) || 20;
        const message = config.get<string>('reminders.eye.message', 'Time for an eye break! Look away for 20 seconds.');
        scheduleReminder('eye', interval, message);
    }
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "break" is now active!');

	// Command to launch the Python GUI with current settings
	const launchPythonCommand = vscode.commands.registerCommand('break.launchPythonGUI', () => {
		const config = vscode.workspace.getConfiguration('break');
		
		// Prepare configuration for Python script
		const configData = {
			interval: config.get<number>('reminders.water.intervalMinutes', 60),
			break_duration: 5,
			break_types: {
				water: config.get<boolean>('reminders.water.enabled', true),
				eye_strain: config.get<boolean>('reminders.eye.enabled', true),
				stretch: true,
				walk: false
			},
			notifications_enabled: config.get<boolean>('reminders.showNotification', true)
		};

		const configJson = JSON.stringify(configData);
		const pythonScriptPath = path.join(context.extensionPath, 'Hackathon project.py');
		
		// Spawn Python process with configuration
		const pythonProcess: ChildProcessWithoutNullStreams = spawn('python', [
			pythonScriptPath,
			'--config', configJson
		]);

		pythonProcess.stdout.on('data', (data) => {
			console.log(`[Python] ${data}`);
		});

		pythonProcess.stderr.on('data', (data) => {
			console.error(`[Python Error] ${data}`);
		});

		pythonProcess.on('close', (code) => {
			console.log(`Python process exited with code ${code}`);
		});
	});
	context.subscriptions.push(launchPythonCommand);

	// existing listeners
	const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
		const uri = e.document.uri;
		console.log(`Text document changed: ${uri.toString()} (version ${e.document.version})`);
	});
	context.subscriptions.push(textChangeDisposable);

	const workspaceFoldersDisposable = vscode.workspace.onDidChangeWorkspaceFolders((e) => {
		const added = e.added.map((f) => f.name).join(', ') || 'none';
		const removed = e.removed.map((f) => f.name).join(', ') || 'none';
		console.log(`Workspace folders changed. Added: ${added}. Removed: ${removed}`);
	});
	context.subscriptions.push(workspaceFoldersDisposable);

	const watcher = vscode.workspace.createFileSystemWatcher('**/*');
	watcher.onDidCreate((uri) => console.log(`File created: ${uri.fsPath}`));
	watcher.onDidChange((uri) => console.log(`File changed: ${uri.fsPath}`));
	watcher.onDidDelete((uri) => console.log(`File deleted: ${uri.fsPath}`));
	context.subscriptions.push(watcher);

	// Configure reminders initially
	configureReminders();

	// Reconfigure when settings change
	const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration('break.reminders') || e.affectsConfiguration('break')) {
			configureReminders();
		}
	});
	context.subscriptions.push(configDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	clearAllReminders();
}

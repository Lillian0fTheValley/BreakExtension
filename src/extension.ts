import * as vscode from 'vscode';

interface ReminderTimer {
    type: 'water' | 'eye';
    timer: NodeJS.Timeout;
}

let activeTimers: ReminderTimer[] = [];
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Break reminder extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'break.takeABreak';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register the take a break command
    let takeBreakCommand = vscode.commands.registerCommand('break.takeABreak', () => {
        triggerBreak('manual');
    });

    context.subscriptions.push(takeBreakCommand);

    // Start the reminder timers
    startReminders();

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('break.reminders')) {
                restartReminders();
            }
        })
    );

    updateStatusBar();
}

function startReminders() {
    const config = vscode.workspace.getConfiguration('break.reminders');
    const globalEnabled = config.get<boolean>('enable', true);
    const showNotification = config.get<boolean>('showNotification', true);

    if (!globalEnabled || !showNotification) {
        updateStatusBar('Reminders disabled');
        return;
    }

    // Water break reminder
    const waterEnabled = config.get<boolean>('water.enabled', true);
    const waterInterval = config.get<number>('water.intervalMinutes', 60);
    const waterMessage = config.get<string>('water.message', 'Time for a water break!');

    if (waterEnabled) {
        const waterTimer = setInterval(() => {
            triggerBreak('water', waterMessage);
        }, waterInterval * 60 * 1000);

        activeTimers.push({ type: 'water', timer: waterTimer as unknown as NodeJS.Timeout });
    }

    // Eye break reminder
    const eyeEnabled = config.get<boolean>('eye.enabled', true);
    const eyeInterval = config.get<number>('eye.intervalMinutes', 20);
    const eyeMessage = config.get<string>('eye.message', 'Time for an eye break! Look away for 20 seconds.');

    if (eyeEnabled) {
        const eyeTimer = setInterval(() => {
            triggerBreak('eye', eyeMessage);
        }, eyeInterval * 60 * 1000);

        activeTimers.push({ type: 'eye', timer: eyeTimer as unknown as NodeJS.Timeout });
    }

    updateStatusBar('Reminders active');
}

function stopReminders() {
    activeTimers.forEach(timer => {
        clearInterval(timer.timer);
    });
    activeTimers = [];
}

function restartReminders() {
    stopReminders();
    startReminders();
}

function triggerBreak(type: 'water' | 'eye' | 'manual', message?: string) {
    const messages = {
        water: message || 'Time for a water break! Stay hydrated.',
        eye: message || 'Time for an eye break! Look away for 20 seconds.',
        manual: 'Take a break! You deserve it.'
    };

    const breakMessage = messages[type];

    vscode.window.showInformationMessage(
        breakMessage,
        'Take Break',
        'Snooze 5 min',
        'Dismiss'
    ).then(selection => {
        if (selection === 'Take Break') {
            startBreakTimer(type);
        } else if (selection === 'Snooze 5 min') {
            snoozeReminder(type, 5);
        }
    });
}

function startBreakTimer(type: 'water' | 'eye' | 'manual') {
    const config = vscode.workspace.getConfiguration('break.reminders');
    
    // Default break duration based on type
    const breakDuration = type === 'eye' ? 20 : 5; // 20 seconds for eye, 5 minutes for water
    const breakDurationMs = type === 'eye' ? breakDuration * 1000 : breakDuration * 60 * 1000;

    vscode.window.showInformationMessage(
        `Break started! ${breakDuration} ${type === 'eye' ? 'seconds' : 'minutes'} timer running...`
    );

    updateStatusBar(`Break in progress (${breakDuration}${type === 'eye' ? 's' : 'm'})`);

    setTimeout(() => {
        vscode.window.showInformationMessage('Break complete! Ready to get back to work?');
        updateStatusBar('Reminders active');
    }, breakDurationMs);
}

function snoozeReminder(type: 'water' | 'eye' | 'manual', minutes: number) {
    vscode.window.showInformationMessage(`Reminder snoozed for ${minutes} minutes`);
    
    updateStatusBar(`Snoozed (${minutes}m)`);

    setTimeout(() => {
        const config = vscode.workspace.getConfiguration('break.reminders');
        const message = type === 'water' 
            ? config.get<string>('water.message', 'Time for a water break!')
            : config.get<string>('eye.message', 'Time for an eye break!');
        
        triggerBreak(type, message);
        updateStatusBar('Reminders active');
    }, minutes * 60 * 1000);
}

function updateStatusBar(status?: string) {
    const config = vscode.workspace.getConfiguration('break.reminders');
    const enabled = config.get<boolean>('enable', true);
    
    if (status) {
        statusBarItem.text = `$(watch) ${status}`;
    } else if (enabled) {
        statusBarItem.text = '$(watch) Break Reminders';
    } else {
        statusBarItem.text = '$(watch) Reminders Off';
    }
    
    statusBarItem.tooltip = 'Click to take a break';
}

export function deactivate() {
    stopReminders();
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

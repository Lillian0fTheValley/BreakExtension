"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
let activeTimers = [];
let statusBarItem;
function activate(context) {
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
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('break.reminders')) {
            restartReminders();
        }
    }));
    updateStatusBar();
}
function startReminders() {
    const config = vscode.workspace.getConfiguration('break.reminders');
    const globalEnabled = config.get('enable', true);
    const showNotification = config.get('showNotification', true);
    if (!globalEnabled || !showNotification) {
        updateStatusBar('Reminders disabled');
        return;
    }
    // Water break reminder
    const waterEnabled = config.get('water.enabled', true);
    const waterInterval = config.get('water.intervalMinutes', 60);
    const waterMessage = config.get('water.message', 'Time for a water break!');
    if (waterEnabled) {
        const waterTimer = setInterval(() => {
            triggerBreak('water', waterMessage);
        }, waterInterval * 60 * 1000);
        activeTimers.push({ type: 'water', timer: waterTimer });
    }
    // Eye break reminder
    const eyeEnabled = config.get('eye.enabled', true);
    const eyeInterval = config.get('eye.intervalMinutes', 20);
    const eyeMessage = config.get('eye.message', 'Time for an eye break! Look away for 20 seconds.');
    if (eyeEnabled) {
        const eyeTimer = setInterval(() => {
            triggerBreak('eye', eyeMessage);
        }, eyeInterval * 60 * 1000);
        activeTimers.push({ type: 'eye', timer: eyeTimer });
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
function triggerBreak(type, message) {
    const messages = {
        water: message || 'Time for a water break! Stay hydrated.',
        eye: message || 'Time for an eye break! Look away for 20 seconds.',
        manual: 'Take a break! You deserve it.'
    };
    const breakMessage = messages[type];
    vscode.window.showInformationMessage(breakMessage, 'Take Break', 'Snooze 5 min', 'Dismiss').then(selection => {
        if (selection === 'Take Break') {
            startBreakTimer(type);
        }
        else if (selection === 'Snooze 5 min') {
            snoozeReminder(type, 5);
        }
    });
}
function startBreakTimer(type) {
    const config = vscode.workspace.getConfiguration('break.reminders');
    // Default break duration based on type
    const breakDuration = type === 'eye' ? 20 : 5; // 20 seconds for eye, 5 minutes for water
    const breakDurationMs = type === 'eye' ? breakDuration * 1000 : breakDuration * 60 * 1000;
    vscode.window.showInformationMessage(`Break started! ${breakDuration} ${type === 'eye' ? 'seconds' : 'minutes'} timer running...`);
    updateStatusBar(`Break in progress (${breakDuration}${type === 'eye' ? 's' : 'm'})`);
    setTimeout(() => {
        vscode.window.showInformationMessage('Break complete! Ready to get back to work?');
        updateStatusBar('Reminders active');
    }, breakDurationMs);
}
function snoozeReminder(type, minutes) {
    vscode.window.showInformationMessage(`Reminder snoozed for ${minutes} minutes`);
    updateStatusBar(`Snoozed (${minutes}m)`);
    setTimeout(() => {
        const config = vscode.workspace.getConfiguration('break.reminders');
        const message = type === 'water'
            ? config.get('water.message', 'Time for a water break!')
            : config.get('eye.message', 'Time for an eye break!');
        triggerBreak(type, message);
        updateStatusBar('Reminders active');
    }, minutes * 60 * 1000);
}
function updateStatusBar(status) {
    const config = vscode.workspace.getConfiguration('break.reminders');
    const enabled = config.get('enable', true);
    if (status) {
        statusBarItem.text = `$(watch) ${status}`;
    }
    else if (enabled) {
        statusBarItem.text = '$(watch) Break Reminders';
    }
    else {
        statusBarItem.text = '$(watch) Reminders Off';
    }
    statusBarItem.tooltip = 'Click to take a break';
}
function deactivate() {
    stopReminders();
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
//# sourceMappingURL=extension.js.map
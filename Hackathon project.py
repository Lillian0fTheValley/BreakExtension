"""
Break Reminder - Proof of Concept
A simple demonstration of the break reminder system
"""

import tkinter as tk
from tkinter import messagebox
import time
import threading
import json
import sys
import argparse

class BreakReminderConfig:
    """Configuration window for break reminder settings"""
    
    def __init__(self, root, config_data=None):
        self.root = root
        self.root.title("Break Reminder Configuration")
        self.root.geometry("450x500")
        self.root.configure(bg='#f0f0f0')
        
        # Use provided config or defaults
        if config_data is None:
            config_data = {}
        
        # Default configuration
        self.interval = tk.IntVar(value=config_data.get('interval', 30))
        self.break_duration = tk.IntVar(value=config_data.get('break_duration', 5))
        
        # Load break types from config or defaults
        break_types_config = config_data.get('break_types', {})
        self.break_types = {
            'eye_strain': tk.BooleanVar(value=break_types_config.get('eye_strain', False)),
            'water': tk.BooleanVar(value=break_types_config.get('water', True)),
            'stretch': tk.BooleanVar(value=break_types_config.get('stretch', True)),
            'walk': tk.BooleanVar(value=break_types_config.get('walk', False))
        }
        self.notifications_enabled = tk.BooleanVar(value=config_data.get('notifications_enabled', True))
        
        self.is_running = False
        self.reminder_thread = None
        
        self.create_ui()
    
    def create_ui(self):
        """Create the configuration interface"""
        
        # Header
        header = tk.Label(
            self.root,
            text="Break Reminder Configuration",
            font=('Arial', 16, 'bold'),
            bg='#f0f0f0'
        )
        header.pack(pady=15)
        
        # Main frame
        main_frame = tk.Frame(self.root, bg='#f0f0f0')
        main_frame.pack(fill='both', expand=True, padx=20)
        
        # Timing Settings
        timing_frame = tk.LabelFrame(
            main_frame,
            text="Timing Settings",
            font=('Arial', 11, 'bold'),
            bg='#f0f0f0',
            padx=15,
            pady=10
        )
        timing_frame.pack(fill='x', pady=10)
        
        tk.Label(
            timing_frame,
            text="Reminder Interval (minutes):",
            bg='#f0f0f0',
            font=('Arial', 10)
        ).grid(row=0, column=0, sticky='w', pady=5)
        
        tk.Spinbox(
            timing_frame,
            from_=1,
            to=120,
            textvariable=self.interval,
            width=10,
            font=('Arial', 10)
        ).grid(row=0, column=1, sticky='w', pady=5)
        
        tk.Label(
            timing_frame,
            text="Break Duration (minutes):",
            bg='#f0f0f0',
            font=('Arial', 10)
        ).grid(row=1, column=0, sticky='w', pady=5)
        
        tk.Spinbox(
            timing_frame,
            from_=1,
            to=30,
            textvariable=self.break_duration,
            width=10,
            font=('Arial', 10)
        ).grid(row=1, column=1, sticky='w', pady=5)
        
        # Break Types
        types_frame = tk.LabelFrame(
            main_frame,
            text="Break Types",
            font=('Arial', 11, 'bold'),
            bg='#f0f0f0',
            padx=15,
            pady=10
        )
        types_frame.pack(fill='x', pady=10)
        
        break_options = [
            ('eye_strain', 'Eye Strain Relief'),
            ('water', 'Water Break'),
            ('stretch', 'Stretching'),
            ('walk', 'Short Walk')
        ]
        
        for i, (key, label) in enumerate(break_options):
            tk.Checkbutton(
                types_frame,
                text=label,
                variable=self.break_types[key],
                bg='#f0f0f0',
                font=('Arial', 10)
            ).grid(row=i, column=0, sticky='w', pady=2)
        
        # Notification Settings
        notif_frame = tk.LabelFrame(
            main_frame,
            text="Notification Settings",
            font=('Arial', 11, 'bold'),
            bg='#f0f0f0',
            padx=15,
            pady=10
        )
        notif_frame.pack(fill='x', pady=10)
        
        tk.Checkbutton(
            notif_frame,
            text="Enable Notifications",
            variable=self.notifications_enabled,
            bg='#f0f0f0',
            font=('Arial', 10)
        ).pack(anchor='w', pady=2)
        
        # Control Buttons
        button_frame = tk.Frame(main_frame, bg='#f0f0f0')
        button_frame.pack(fill='x', pady=8)
        
        self.start_button = tk.Button(
            button_frame,
            text="Start Monitoring",
            command=self.start_reminder,
            bg='#4CAF50',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=15,
            pady=8
        )
        self.start_button.pack(side='left', padx=5)
        
        self.stop_button = tk.Button(
            button_frame,
            text="Stop",
            command=self.stop_reminder,
            bg='#f44336',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=15,
            pady=8,
            state='disabled'
        )
        self.stop_button.pack(side='left', padx=5)
        
        tk.Button(
            button_frame,
            text="Test Notification",
            command=self.test_notification,
            bg='#2196F3',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=15,
            pady=8
        ).pack(side='left', padx=5)
        
        # Status
        self.status_label = tk.Label(
            main_frame,
            text="Status: Idle",
            bg='#f0f0f0',
            font=('Arial', 10)
        )
        self.status_label.pack(pady=10)
    
    def get_enabled_breaks(self):
        """Get list of enabled break types"""
        enabled = []
        for key, var in self.break_types.items():
            if var.get():
                enabled.append(key)
        return enabled
    
    def test_notification(self):
        """Show a test notification"""
        if not self.notifications_enabled.get():
            messagebox.showinfo("Notifications Disabled", 
                              "Please enable notifications in settings first!")
            return
        
        enabled_breaks = self.get_enabled_breaks()
        if not enabled_breaks:
            messagebox.showwarning("No Break Types", 
                                 "Please enable at least one break type!")
            return
        
        # Show a sample notification
        import random
        break_type = random.choice(enabled_breaks)
        self.show_break_notification(break_type)
    
    def show_break_notification(self, break_type):
        """Display a break notification window"""
        notif_window = tk.Toplevel(self.root)
        notif_window.title("Break Time")
        notif_window.geometry("350x200")
        notif_window.configure(bg='white')
        
        # Make it stay on top
        notif_window.attributes('-topmost', True)
        
        messages = {
            'eye_strain': {
                'title': 'Eye Strain Relief',
                'message': 'Look away from your screen and focus on something 20 feet away for 20 seconds.'
            },
            'water': {
                'title': 'Hydration Break',
                'message': 'Time to drink some water. Staying hydrated improves concentration.'
            },
            'stretch': {
                'title': 'Stretching Break',
                'message': 'Stand up and stretch your arms and shoulders to prevent stiffness.'
            },
            'walk': {
                'title': 'Walking Break',
                'message': 'Take a short walk to refresh your mind and improve circulation.'
            }
        }
        
        msg = messages.get(break_type, messages['stretch'])
        
        # Title
        title_label = tk.Label(
            notif_window,
            text=msg['title'],
            font=('Arial', 14, 'bold'),
            bg='white'
        )
        title_label.pack(pady=15)
        
        # Message
        message_label = tk.Label(
            notif_window,
            text=msg['message'],
            font=('Arial', 10),
            bg='white',
            wraplength=300
        )
        message_label.pack(pady=10)
        
        # Timer display
        timer_var = tk.StringVar(value=f"Suggested break: {self.break_duration.get()} minutes")
        timer_label = tk.Label(
            notif_window,
            textvariable=timer_var,
            font=('Arial', 10),
            bg='white'
        )
        timer_label.pack(pady=10)
        
        # Buttons
        button_frame = tk.Frame(notif_window, bg='white')
        button_frame.pack(pady=10)
        
        tk.Button(
            button_frame,
            text="Start Timer",
            command=lambda: self.start_break_timer(notif_window, timer_var),
            bg='#4CAF50',
            fg='white',
            font=('Arial', 10),
            padx=10,
            pady=5
        ).pack(side='left', padx=5)
        
        tk.Button(
            button_frame,
            text="Dismiss",
            command=notif_window.destroy,
            bg='#757575',
            fg='white',
            font=('Arial', 10),
            padx=10,
            pady=5
        ).pack(side='left', padx=5)
    
    def start_break_timer(self, window, timer_var):
        """Start a countdown timer for the break"""
        duration = self.break_duration.get() * 60  # Convert to seconds
        
        def countdown():
            remaining = duration
            while remaining > 0 and window.winfo_exists():
                mins, secs = divmod(remaining, 60)
                timer_var.set(f"Time remaining: {mins:02d}:{secs:02d}")
                time.sleep(1)
                remaining -= 1
            
            if window.winfo_exists():
                timer_var.set("Break complete")
                messagebox.showinfo("Break Complete", 
                                  "Break finished. Ready to get back to work?",
                                  parent=window)
                window.destroy()
        
        thread = threading.Thread(target=countdown, daemon=True)
        thread.start()
    
    def start_reminder(self):
        """Start the reminder monitoring"""
        enabled_breaks = self.get_enabled_breaks()
        if not enabled_breaks:
            messagebox.showwarning("No Break Types", 
                                 "Please enable at least one break type!")
            return
        
        self.is_running = True
        self.start_button.config(state='disabled')
        self.stop_button.config(state='normal')
        self.status_label.config(text=f"Status: Monitoring (Next reminder in {self.interval.get()} min)")
        
        def monitor():
            import random
            while self.is_running:
                # Wait for the interval (in seconds for demo - in real app this would be minutes)
                # Using seconds for demo purposes so you don't have to wait 30 minutes
                wait_time = self.interval.get() * 6  # 6 seconds per "minute" for demo
                
                for i in range(wait_time):
                    if not self.is_running:
                        return
                    time.sleep(1)
                    remaining = (wait_time - i) // 6
                    self.status_label.config(
                        text=f"Status: Monitoring (Next reminder in {remaining} min)")
                
                if self.is_running and self.notifications_enabled.get():
                    enabled = self.get_enabled_breaks()
                    if enabled:
                        break_type = random.choice(enabled)
                        self.root.after(0, lambda: self.show_break_notification(break_type))
        
        self.reminder_thread = threading.Thread(target=monitor, daemon=True)
        self.reminder_thread.start()
    
    def stop_reminder(self):
        """Stop the reminder monitoring"""
        self.is_running = False
        self.start_button.config(state='normal')
        self.stop_button.config(state='disabled')
        self.status_label.config(text="Status: Stopped")

def parse_config_from_args():
    """Parse configuration from command-line arguments"""
    parser = argparse.ArgumentParser(description='Break Reminder Application')
    parser.add_argument('--config', type=str, help='JSON configuration string or file path')
    parser.add_argument('--interval', type=int, help='Reminder interval in minutes')
    parser.add_argument('--break-duration', type=int, help='Break duration in minutes')
    parser.add_argument('--enable-notifications', type=bool, help='Enable notifications')
    
    args = parser.parse_args()
    
    config_data = {}
    
    # Load from JSON config if provided
    if args.config:
        try:
            # Try to parse as JSON string first
            config_data = json.loads(args.config)
        except json.JSONDecodeError:
            # Try to read as file
            try:
                with open(args.config, 'r') as f:
                    config_data = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load config from {args.config}: {e}")
    
    # Override with command-line arguments if provided
    if args.interval:
        config_data['interval'] = args.interval
    if args.break_duration:
        config_data['break_duration'] = args.break_duration
    if args.enable_notifications is not None:
        config_data['notifications_enabled'] = args.enable_notifications
    
    return config_data

def main():
    config = parse_config_from_args()
    root = tk.Tk()
    app = BreakReminderConfig(root, config)
    root.mainloop()

if __name__ == "__main__":
    main()

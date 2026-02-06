"""
Job Order Migration Tool with Column Mapping
Professional UI for database migration with visual column mapping
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import mysql.connector
from mysql.connector import Error
import threading
from datetime import datetime
import queue


class DatabaseConnection:
    def __init__(self, host, port, user, password, database):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
    
    def connect(self):
        try:
            print(f"\n[Attempting Connection]")
            print(f"Host: {self.host}")
            print(f"Port: {self.port}")
            print(f"User: {self.user}")
            print(f"Database: {self.database}")
            
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
            print(f"[SUCCESS] Connected to {self.database}\n")
            return True, "Connected successfully"
        except Error as e:
            error_msg = f"Connection failed: {str(e)}"
            print(f"\n[CONNECTION ERROR]")
            print(f"Host: {self.host}")
            print(f"Database: {self.database}")
            print(f"Error Type: {type(e).__name__}")
            print(f"Error Message: {str(e)}")
            print(f"Error Code: {e.errno if hasattr(e, 'errno') else 'N/A'}")
            print(f"SQL State: {e.sqlstate if hasattr(e, 'sqlstate') else 'N/A'}\n")
            return False, error_msg
    
    def disconnect(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    def get_table_columns(self, table_name):
        if not self.connection or not self.connection.is_connected():
            return []
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
            columns = [row[0] for row in cursor.fetchall()]
            cursor.close()
            return columns
        except Error:
            return []
    
    def get_row_count(self, table_name):
        if not self.connection or not self.connection.is_connected():
            return 0
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Error:
            return 0


class ColumnMappingDialog:
    def __init__(self, parent, db1_columns, db2_columns, default_mapping=None):
        self.parent = parent
        self.db1_columns = db1_columns
        self.db2_columns = db2_columns
        self.mapping = default_mapping or {}
        self.result = None
        
        self.window = tk.Toplevel(parent)
        self.window.title("Column Mapping")
        self.window.geometry("900x600")
        self.window.transient(parent)
        self.window.grab_set()
        self.window.resizable(True, True)
        
        parent.update_idletasks()
        x = parent.winfo_rootx() + (parent.winfo_width() - 900) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - 600) // 2
        self.window.geometry(f"+{x}+{y}")
        
        self._build_ui()
    
    def _build_ui(self):
        header = tk.Frame(self.window, bg="#1a1a2e", height=60)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        
        tk.Label(
            header, text="🔗 Column Mapping",
            font=("Arial", 14, "bold"), bg="#1a1a2e", fg="white"
        ).pack(side=tk.LEFT, padx=20, pady=15)
        
        info_frame = tk.Frame(self.window, bg="#f0f0f0", pady=10)
        info_frame.pack(fill=tk.X)
        
        tk.Label(
            info_frame, 
            text="Map columns from Database 1 (Job Order) to Database 2 (job_orders table)",
            font=("Arial", 9), bg="#f0f0f0", fg="#444444"
        ).pack()
        
        mapping_container = tk.Frame(self.window, bg="white")
        mapping_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        header_frame = tk.Frame(mapping_container, bg="white")
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(
            header_frame, text="Database 1 (Source)",
            font=("Arial", 10, "bold"), bg="white", fg="#1a1a2e", anchor=tk.W
        ).pack(side=tk.LEFT, padx=(0, 10), fill=tk.X, expand=True)
        
        tk.Label(
            header_frame, text="→",
            font=("Arial", 12, "bold"), bg="white", fg="#666666"
        ).pack(side=tk.LEFT, padx=10)
        
        tk.Label(
            header_frame, text="Database 2 (Destination)",
            font=("Arial", 10, "bold"), bg="white", fg="#1a1a2e", anchor=tk.W
        ).pack(side=tk.LEFT, padx=(10, 0), fill=tk.X, expand=True)
        
        canvas_frame = tk.Frame(mapping_container, bg="white")
        canvas_frame.pack(fill=tk.BOTH, expand=True)
        
        canvas = tk.Canvas(canvas_frame, bg="white", highlightthickness=0)
        scrollbar = ttk.Scrollbar(canvas_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg="white")
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.mapping_widgets = {}
        
        for db1_col in self.db1_columns:
            row_frame = tk.Frame(scrollable_frame, bg="white", pady=5)
            row_frame.pack(fill=tk.X, padx=10)
            
            tk.Label(
                row_frame, text=db1_col,
                font=("Arial", 9), bg="white", fg="#333333", anchor=tk.W
            ).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
            
            tk.Label(
                row_frame, text="→",
                font=("Arial", 10), bg="white", fg="#999999"
            ).pack(side=tk.LEFT, padx=5)
            
            var = tk.StringVar(value=self.mapping.get(db1_col, ""))
            combo = ttk.Combobox(
                row_frame, textvariable=var,
                values=[""] + self.db2_columns,
                state="readonly", width=30
            )
            combo.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
            
            self.mapping_widgets[db1_col] = var
        
        bottom_frame = tk.Frame(self.window, bg="#f0f0f0", pady=15)
        bottom_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        button_container = tk.Frame(bottom_frame, bg="#f0f0f0")
        button_container.pack()
        
        tk.Button(
            button_container, text="Auto-Map (Same Names)",
            font=("Arial", 9, "bold"),
            bg="#2196f3", fg="white",
            activebackground="#1976d2", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=8, cursor="hand2",
            command=self._auto_map
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            button_container, text="Clear All",
            font=("Arial", 9),
            bg="#9e9e9e", fg="white",
            activebackground="#757575", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=8, cursor="hand2",
            command=self._clear_all
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            button_container, text="Cancel",
            font=("Arial", 9),
            bg="#f44336", fg="white",
            activebackground="#d32f2f", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=8, cursor="hand2",
            command=self.window.destroy
        ).pack(side=tk.LEFT, padx=5)
        
        tk.Button(
            button_container, text="Apply Mapping",
            font=("Arial", 9, "bold"),
            bg="#4caf50", fg="white",
            activebackground="#388e3c", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=8, cursor="hand2",
            command=self._apply
        ).pack(side=tk.LEFT, padx=5)
    
    def _auto_map(self):
        db2_set = set(self.db2_columns)
        for db1_col in self.db1_columns:
            if db1_col in db2_set:
                self.mapping_widgets[db1_col].set(db1_col)
        messagebox.showinfo("Auto-Map", "Columns with matching names have been mapped")
    
    def _clear_all(self):
        for var in self.mapping_widgets.values():
            var.set("")
    
    def _apply(self):
        self.result = {}
        for db1_col, var in self.mapping_widgets.items():
            db2_col = var.get()
            if db2_col:
                self.result[db1_col] = db2_col
        
        if not self.result:
            messagebox.showwarning("Warning", "No columns have been mapped")
            return
        
        self.window.destroy()


class TransferModal:
    def __init__(self, parent):
        self.parent = parent
        self.state = "LOADING"
        self.message_queue = queue.Queue()
        
        self.window = tk.Toplevel(parent)
        self.window.title("Data Transfer")
        self.window.geometry("700x550")
        self.window.transient(parent)
        self.window.grab_set()
        self.window.resizable(False, False)
        self.window.protocol("WM_DELETE_WINDOW", lambda: None)
        
        parent.update_idletasks()
        x = parent.winfo_rootx() + (parent.winfo_width() - 700) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - 550) // 2
        self.window.geometry(f"+{x}+{y}")
        
        self._build_ui()
        self._poll()
    
    def _build_ui(self):
        self._header_frame = tk.Frame(self.window, bg="#1a1a2e", height=72)
        self._header_frame.pack(fill=tk.X)
        self._header_frame.pack_propagate(False)
        
        self._icon_label = tk.Label(
            self._header_frame, text="⏳",
            font=("Arial", 26), bg="#1a1a2e", fg="white"
        )
        self._icon_label.pack(side=tk.LEFT, padx=(20, 10), pady=10)
        
        text_frame = tk.Frame(self._header_frame, bg="#1a1a2e")
        text_frame.pack(side=tk.LEFT, pady=8)
        
        self._title_label = tk.Label(
            text_frame, text="Migrating Job Orders...",
            font=("Arial", 14, "bold"), bg="#1a1a2e", fg="white"
        )
        self._title_label.pack(anchor=tk.W)
        
        self._subtitle_label = tk.Label(
            text_frame, text="Matching job orders by Applicant Email Address",
            font=("Arial", 9), bg="#1a1a2e", fg="#aaaaaa"
        )
        self._subtitle_label.pack(anchor=tk.W, pady=(2, 0))
        
        progress_wrapper = tk.Frame(self.window, bg="#f0f0f0", pady=14)
        progress_wrapper.pack(fill=tk.X)
        
        self._progress = ttk.Progressbar(progress_wrapper, mode="indeterminate", length=660)
        self._progress.pack()
        self._progress.start(15)
        
        log_container = tk.Frame(self.window, bg="#f0f0f0")
        log_container.pack(fill=tk.BOTH, expand=True, padx=18, pady=(5, 0))
        
        tk.Label(
            log_container, text="Migration Log:",
            font=("Arial", 9, "bold"), bg="#f0f0f0", fg="#444444", anchor=tk.W
        ).pack(fill=tk.X, pady=(0, 4))
        
        text_wrapper = tk.Frame(log_container)
        text_wrapper.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(text_wrapper)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self._log_text = tk.Text(
            text_wrapper, font=("Consolas", 9),
            bg="#1e1e1e", fg="#d4d4d4",
            yscrollcommand=scrollbar.set, state=tk.DISABLED,
            wrap=tk.WORD, padx=12, pady=10,
            relief=tk.FLAT, highlightthickness=0
        )
        self._log_text.pack(fill=tk.BOTH, expand=True)
        scrollbar.config(command=self._log_text.yview)
        
        self._log_text.tag_configure("INFO", foreground="#cccccc")
        self._log_text.tag_configure("SUCCESS", foreground="#66bb6a")
        self._log_text.tag_configure("ERROR", foreground="#ef5350")
        self._log_text.tag_configure("WARNING", foreground="#ffa726")
        self._log_text.tag_configure("SEP", foreground="#555555")
        
        self._bottom_frame = tk.Frame(self.window, bg="#f0f0f0", pady=12)
        self._bottom_frame.pack(fill=tk.X, side=tk.BOTTOM)
    
    def enqueue(self, message, level="INFO"):
        self.message_queue.put((message, level))
    
    def _append_log(self, message, level):
        tag = level if level in ("INFO", "SUCCESS", "ERROR", "WARNING") else "INFO"
        if isinstance(message, str) and "===" in message:
            tag = "SEP"
        
        self._log_text.config(state=tk.NORMAL)
        self._log_text.insert(tk.END, f"{message}\n", tag)
        self._log_text.see(tk.END)
        self._log_text.config(state=tk.DISABLED)
    
    def _poll(self):
        while not self.message_queue.empty():
            message, payload = self.message_queue.get()
            
            if message == "__SUCCESS__":
                self._transition_success(payload)
                return
            elif message == "__FAILED__":
                self._transition_failed(payload)
                return
            else:
                self._append_log(message, payload)
        
        if self.state == "LOADING":
            self.window.after(80, self._poll)
    
    def _update_header(self, icon, title, subtitle, bg_color):
        self._header_frame.config(bg=bg_color)
        self._icon_label.config(bg=bg_color, text=icon)
        self._title_label.config(bg=bg_color, text=title)
        self._subtitle_label.config(bg=bg_color, text=subtitle)
    
    def _transition_success(self, stats):
        self.state = "SUCCESS"
        self._progress.stop()
        self._progress.config(mode="determinate", value=100)
        
        self._update_header(
            icon="✅",
            title="Migration Complete",
            subtitle=f"{stats['created']} job orders created successfully",
            bg_color="#1b5e20"
        )
        
        self._append_log("", "INFO")
        self._append_log("=" * 50, "SEP")
        self._append_log(f"  Total Processed      : {stats['total']:,}", "SUCCESS")
        self._append_log(f"  Unique Matches       : {stats['matched']:,}", "SUCCESS")
        self._append_log(f"  Job Orders Created   : {stats['created']:,}", "SUCCESS")
        self._append_log(f"  Multiple Matches     : {stats['multiple']:,}", "WARNING")
        self._append_log(f"  No Match (Skipped)   : {stats['skipped']:,}", "WARNING")
        self._append_log(f"  Already Exists       : {stats['exists']:,}", "WARNING")
        self._append_log("=" * 50, "SEP")
        
        self._set_action_button("Close", "#4caf50", self.window.destroy)
    
    def _transition_failed(self, error_message):
        self.state = "FAILED"
        self._progress.stop()
        self._progress.config(mode="determinate", value=0)
        
        self._update_header(
            icon="❌",
            title="Migration Failed",
            subtitle="An error occurred during migration",
            bg_color="#b71c1c"
        )
        
        self._append_log("", "INFO")
        self._append_log("=" * 50, "SEP")
        self._append_log(f"  ERROR: {error_message}", "ERROR")
        self._append_log("=" * 50, "SEP")
        
        self._set_action_button("Close", "#e53935", self.window.destroy)
    
    def _set_action_button(self, text, bg_color, command):
        for widget in self._bottom_frame.winfo_children():
            widget.destroy()
        
        tk.Button(
            self._bottom_frame, text=text,
            font=("Arial", 10, "bold"),
            bg=bg_color, fg="white",
            activebackground=bg_color, activeforeground="white",
            relief=tk.FLAT, bd=0,
            padx=32, pady=6, cursor="hand2",
            command=command
        ).pack(side=tk.RIGHT, padx=25)


class MigrationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Job Order Migration Tool")
        self.root.geometry("1000x700")
        
        self.db1 = DatabaseConnection("localhost", 3306, "root", "", "atsscbms_db1")
        self.db2 = DatabaseConnection("15.235.167.58", 3306, "atsscbms_AmpereSync", "N3wP@ssword00", "atsscbms_sync")
        
        self.column_mapping = {}
        self.multiple_matches = []
        self.no_matches = []
        self.already_exists = []
        
        self._build_ui()
        self._apply_default_mapping()
    
    def _apply_default_mapping(self):
        self.column_mapping = {
            'Applicant Email Address': 'applicant_email',
            'Timestamp': 'timestamp',
            'Date Installed': 'date_installed',
            'Installation Fee': 'installation_fee',
            'Billing Day': 'billing_day',
            'Status': 'joborder_status',
            'Modem/Router SN': 'modem_router_sn',
            'Router Model': 'router_model',
            'Provider': 'group_name',
            'LCPNAP': 'lcpnap',
            'PORT': 'port',
            'VLAN': 'vlan',
            'Username': 'username',
            'IP': 'ip_address',
            'Connection Type': 'connection_type',
            'Usage Type': 'usage_type',
            'Username Status': 'username_status',
            'Visit By': 'visit_by',
            'Visit With': 'visit_with',
            'Visit With(Other)': 'visit_with_other',
            'Onsite Status': 'onsite_status',
            'Onsite Remarks': 'onsite_remarks',
            'JO Remarks': 'status_remarks',
            'Address Coordinates': 'address_coordinates',
            'Contract Link': 'contract_link',
            'Client Signature': 'client_signature_url',
            'Setup Image': 'setup_image_url',
            'Speedtest Image': 'speedtest_image_url',
            'Signed Contract Image': 'signed_contract_image_url',
            'Box Reading Image': 'box_reading_image_url',
            'Router Reading Image': 'router_reading_image_url',
            'Modified By': 'created_by_user_email',
            'Assigned Email': 'assigned_email',
            'Remarks :': 'installation_landmark'
        }
    
    def _build_ui(self):
        header = tk.Frame(self.root, bg="#1a1a2e", height=80)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        
        tk.Label(
            header, text="📊 Job Order Migration",
            font=("Arial", 16, "bold"), bg="#1a1a2e", fg="white"
        ).pack(side=tk.LEFT, padx=25, pady=20)
        
        tk.Label(
            header, text="DB1 → DB2 with Email Matching",
            font=("Arial", 10), bg="#1a1a2e", fg="#aaaaaa"
        ).pack(side=tk.LEFT, pady=20)
        
        main = tk.Frame(self.root, bg="#f5f5f5")
        main.pack(fill=tk.BOTH, expand=True)
        
        conn_panel = tk.LabelFrame(main, text="  Database Connections  ", font=("Arial", 10, "bold"), bg="white", pady=15)
        conn_panel.pack(fill=tk.X, padx=20, pady=(20, 10))
        
        conn_row = tk.Frame(conn_panel, bg="white")
        conn_row.pack(fill=tk.X, padx=15)
        
        self.db1_status = tk.Label(conn_row, text="● DB1: Not Connected", font=("Arial", 9), bg="white", fg="#ef5350")
        self.db1_status.pack(side=tk.LEFT, padx=10)
        
        self.db2_status = tk.Label(conn_row, text="● DB2: Not Connected", font=("Arial", 9), bg="white", fg="#ef5350")
        self.db2_status.pack(side=tk.LEFT, padx=10)
        
        tk.Button(
            conn_row, text="Connect",
            font=("Arial", 9, "bold"),
            bg="#2196f3", fg="white",
            activebackground="#1976d2", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=6, cursor="hand2",
            command=self._connect_databases
        ).pack(side=tk.RIGHT, padx=10)
        
        config_panel = tk.LabelFrame(main, text="  Configuration  ", font=("Arial", 10, "bold"), bg="white", pady=15)
        config_panel.pack(fill=tk.X, padx=20, pady=10)
        
        match_frame = tk.Frame(config_panel, bg="white")
        match_frame.pack(fill=tk.X, padx=15, pady=5)
        
        tk.Label(
            match_frame, 
            text="Matching Strategy: Applicant Email Address (Job Order ↔ job_orders)",
            font=("Arial", 9, "bold"), bg="white", fg="#1976d2"
        ).pack(side=tk.LEFT, padx=(0, 10))
        
        map_frame = tk.Frame(config_panel, bg="white")
        map_frame.pack(fill=tk.X, padx=15, pady=(10, 5))
        
        self.mapping_label = tk.Label(
            map_frame, text=f"Column Mapping: {len(self.column_mapping)} columns mapped",
            font=("Arial", 9), bg="white", fg="#666666"
        )
        self.mapping_label.pack(side=tk.LEFT)
        
        tk.Button(
            map_frame, text="Configure Mapping",
            font=("Arial", 9, "bold"),
            bg="#9c27b0", fg="white",
            activebackground="#7b1fa2", activeforeground="white",
            relief=tk.FLAT, padx=15, pady=5, cursor="hand2",
            command=self._configure_mapping
        ).pack(side=tk.RIGHT)
        
        stats_panel = tk.LabelFrame(main, text="  Statistics  ", font=("Arial", 10, "bold"), bg="white", pady=15)
        stats_panel.pack(fill=tk.X, padx=20, pady=10)
        
        stats_row = tk.Frame(stats_panel, bg="white")
        stats_row.pack(fill=tk.X, padx=15)
        
        self.db1_count = tk.Label(stats_row, text="DB1 Job Orders: 0", font=("Arial", 9), bg="white")
        self.db1_count.pack(side=tk.LEFT, padx=10)
        
        self.db2_jos = tk.Label(stats_row, text="DB2 Job Orders: 0", font=("Arial", 9), bg="white")
        self.db2_jos.pack(side=tk.LEFT, padx=10)
        
        tk.Button(
            stats_row, text="Refresh",
            font=("Arial", 9),
            bg="#607d8b", fg="white",
            activebackground="#455a64", activeforeground="white",
            relief=tk.FLAT, padx=15, pady=5, cursor="hand2",
            command=self._load_statistics
        ).pack(side=tk.RIGHT, padx=10)
        
        action_panel = tk.Frame(main, bg="#f5f5f5", pady=20)
        action_panel.pack(fill=tk.X, padx=20)
        
        button_container = tk.Frame(action_panel, bg="#f5f5f5")
        button_container.pack()
        
        self.migrate_button = tk.Button(
            button_container, text="Start Migration (Batch: 500)",
            font=("Arial", 11, "bold"),
            bg="#4caf50", fg="white",
            activebackground="#388e3c", activeforeground="white",
            relief=tk.FLAT, padx=30, pady=10, cursor="hand2",
            command=self._start_migration,
            state=tk.DISABLED
        )
        self.migrate_button.pack(side=tk.LEFT, padx=5)
        
        self.export_multiples_btn = tk.Button(
            button_container, text="Export Multiple Matches",
            font=("Arial", 10),
            bg="#ff9800", fg="white",
            activebackground="#f57c00", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=10, cursor="hand2",
            command=self._export_multiples,
            state=tk.DISABLED
        )
        self.export_multiples_btn.pack(side=tk.LEFT, padx=5)
        
        self.export_nomatch_btn = tk.Button(
            button_container, text="Export No Match",
            font=("Arial", 10),
            bg="#ff5722", fg="white",
            activebackground="#e64a19", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=10, cursor="hand2",
            command=self._export_no_match,
            state=tk.DISABLED
        )
        self.export_nomatch_btn.pack(side=tk.LEFT, padx=5)
        
        self.export_exists_btn = tk.Button(
            button_container, text="Export Already Exists",
            font=("Arial", 10),
            bg="#9c27b0", fg="white",
            activebackground="#7b1fa2", activeforeground="white",
            relief=tk.FLAT, padx=20, pady=10, cursor="hand2",
            command=self._export_already_exists,
            state=tk.DISABLED
        )
        self.export_exists_btn.pack(side=tk.LEFT, padx=5)
    
    def _connect_databases(self):
        print("\n" + "=" * 80)
        print("Connecting to databases...")
        print("=" * 80)
        
        success1, msg1 = self.db1.connect()
        if success1:
            self.db1_status.config(text="● DB1: Connected", fg="#66bb6a")
        else:
            self.db1_status.config(text="● DB1: Failed", fg="#ef5350")
            messagebox.showerror("DB1 Error", msg1)
        
        success2, msg2 = self.db2.connect()
        if success2:
            self.db2_status.config(text="● DB2: Connected", fg="#66bb6a")
        else:
            self.db2_status.config(text="● DB2: Failed", fg="#ef5350")
            messagebox.showerror("DB2 Error", msg2)
        
        if success1 and success2:
            self._load_statistics()
            self.migrate_button.config(state=tk.NORMAL)
    
    def _load_statistics(self):
        if not self.db1.connection or not self.db2.connection:
            return
        
        db1_count = self.db1.get_row_count("Job Order")
        db2_jos_count = self.db2.get_row_count("job_orders")
        
        self.db1_count.config(text=f"DB1 Job Orders: {db1_count:,}")
        self.db2_jos.config(text=f"DB2 Job Orders: {db2_jos_count:,}")
    
    def _configure_mapping(self):
        if not self.db1.connection or not self.db2.connection:
            messagebox.showwarning("Warning", "Connect to databases first")
            return
        
        db1_columns = self.db1.get_table_columns("Job Order")
        db2_columns = self.db2.get_table_columns("job_orders")
        
        if not db1_columns or not db2_columns:
            messagebox.showerror("Error", "Failed to load table columns")
            return
        
        dialog = ColumnMappingDialog(self.root, db1_columns, db2_columns, self.column_mapping)
        self.root.wait_window(dialog.window)
        
        if dialog.result:
            self.column_mapping = dialog.result
            self.mapping_label.config(text=f"Column Mapping: {len(self.column_mapping)} columns mapped")
            messagebox.showinfo("Success", f"Mapping updated: {len(self.column_mapping)} columns")
    
    def _start_migration(self):
        if not self.column_mapping:
            messagebox.showwarning("Warning", "Configure column mapping first")
            return
        
        response = messagebox.askyesno(
            "Confirm Migration",
            f"Start migration?\n\n"
            f"Match strategy: Applicant Email Address (Job Order ↔ job_orders)\n"
            f"Mapped columns: {len(self.column_mapping)}\n"
            f"Batch size: 500"
        )
        
        if not response:
            return
        
        modal = TransferModal(self.root)
        
        thread = threading.Thread(target=self._perform_migration, args=(modal,))
        thread.daemon = True
        thread.start()
    
    def _normalize_string(self, value):
        if value is None:
            return None
        return str(value).strip().lower()
    
    def _perform_migration(self, modal):
        try:
            self.multiple_matches = []
            self.no_matches = []
            self.already_exists = []
            
            total = self.db1.get_row_count("Job Order")
            batch_size = 500
            batches = (total + batch_size - 1) // batch_size
            
            modal.enqueue(f"Starting migration: {total:,} records in {batches} batches", "INFO")
            modal.enqueue("Match: Applicant Email Address (Job Order ↔ job_orders)", "INFO")
            modal.enqueue("=" * 50, "INFO")
            
            source_cursor = self.db1.connection.cursor(dictionary=True)
            target_cursor = self.db2.connection.cursor(dictionary=True)
            
            processed = 0
            matched = 0
            multiple = 0
            skipped = 0
            created = 0
            exists = 0
            
            for batch_num in range(batches):
                offset = batch_num * batch_size
                source_cursor.execute(f"SELECT * FROM `Job Order` LIMIT {batch_size} OFFSET {offset}")
                rows = source_cursor.fetchall()
                
                for row in rows:
                    email = row.get('Applicant Email Address')
                    
                    jo_id, status, duplicates = self._find_job_order(target_cursor, email)
                    
                    if status == 'not_found':
                        skipped += 1
                        self.no_matches.append({
                            'first_name': row.get('First Name'),
                            'middle_initial': row.get('Middle Initial'),
                            'last_name': row.get('Last Name'),
                            'email': email,
                            'modem_sn': row.get('Modem/Router SN'),
                            'username': row.get('Username'),
                            'phone': row.get('Contact Number')
                        })
                    elif status == 'multiple':
                        multiple += 1
                        self.multiple_matches.append({
                            'db1_data': {
                                'first_name': row.get('First Name'),
                                'middle_initial': row.get('Middle Initial'),
                                'last_name': row.get('Last Name'),
                                'email': email,
                                'modem_sn': row.get('Modem/Router SN'),
                                'phone': row.get('Contact Number')
                            },
                            'matches': duplicates
                        })
                    elif status == 'exists':
                        exists += 1
                        self.already_exists.append({
                            'first_name': row.get('First Name'),
                            'middle_initial': row.get('Middle Initial'),
                            'last_name': row.get('Last Name'),
                            'email': email,
                            'modem_sn': row.get('Modem/Router SN'),
                            'existing_id': jo_id
                        })
                    else:  # status == 'found' - create new record
                        jo_data = {}
                        
                        for db1_col, db2_col in self.column_mapping.items():
                            if not db2_col:
                                continue
                            
                            value = row.get(db1_col)
                            if value is not None and value != '':
                                jo_data[db2_col] = value
                        
                        columns = list(jo_data.keys())
                        values = list(jo_data.values())
                        placeholders = ', '.join(['%s'] * len(values))
                        
                        insert_query = f"INSERT INTO job_orders ({', '.join(columns)}) VALUES ({placeholders})"
                        target_cursor.execute(insert_query, values)
                        self.db2.connection.commit()
                        
                        created += 1
                        matched += 1
                    
                    processed += 1
                
                modal.enqueue(
                    f"Batch {batch_num + 1}/{batches} | Created: {created} | Multiple: {multiple} | Exists: {exists} | Skipped: {skipped}",
                    "INFO"
                )
            
            source_cursor.close()
            target_cursor.close()
            
            modal.enqueue("__SUCCESS__", {
                'total': processed,
                'matched': matched,
                'created': created,
                'multiple': multiple,
                'skipped': skipped,
                'exists': exists
            })
            
            if multiple > 0:
                self.root.after(0, lambda: self.export_multiples_btn.config(state=tk.NORMAL))
            if skipped > 0:
                self.root.after(0, lambda: self.export_nomatch_btn.config(state=tk.NORMAL))
            if exists > 0:
                self.root.after(0, lambda: self.export_exists_btn.config(state=tk.NORMAL))
            
        except Exception as e:
            modal.enqueue("__FAILED__", str(e))
    
    def _find_job_order(self, cursor, email):
        """
        Find job order in DB2 by email address
        Returns: (job_order_id or None, status, duplicates_list)
        Status: 'found', 'not_found', 'multiple', 'exists'
        """
        if not email or str(email).strip() == '':
            return None, 'not_found', []
        
        email_norm = self._normalize_string(email)
        
        # Check if email column exists in job_orders table
        # Using applicant_email as per the mapping
        query = """
            SELECT * FROM job_orders 
            WHERE LOWER(TRIM(applicant_email)) = %s
        """
        cursor.execute(query, (email_norm,))
        
        results = cursor.fetchall()
        
        if len(results) == 0:
            return None, 'not_found', []
        elif len(results) == 1:
            # Found one match - this means it already exists
            return results[0]['id'], 'exists', []
        else:
            # Multiple matches found
            return -1, 'multiple', results
    
    def _export_multiples(self):
        if not self.multiple_matches:
            messagebox.showinfo("Info", "No multiple matches to export")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"multiple_matches_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write("=" * 100 + "\n")
            f.write("MULTIPLE MATCHING JOB ORDERS (SAME EMAIL)\n")
            f.write(f"Generated: {datetime.now()}\n")
            f.write(f"Total: {len(self.multiple_matches)}\n")
            f.write("=" * 100 + "\n\n")
            
            for idx, item in enumerate(self.multiple_matches, 1):
                f.write(f"Record #{idx}\n")
                f.write("-" * 100 + "\n")
                db1 = item['db1_data']
                f.write(f"  First Name       : {db1['first_name']}\n")
                f.write(f"  Middle Initial   : {db1['middle_initial']}\n")
                f.write(f"  Last Name        : {db1['last_name']}\n")
                f.write(f"  Email            : {db1['email']}\n")
                f.write(f"  Phone            : {db1['phone']}\n")
                f.write(f"  Modem SN         : {db1['modem_sn']}\n\n")
                f.write(f"Found {len(item['matches'])} matches in job_orders table:\n")
                for m in item['matches']:
                    f.write(f"  - ID: {m['id']} | Email: {m.get('applicant_email', 'N/A')}\n")
                f.write("\n")
        
        messagebox.showinfo("Success", f"Exported to {filename}")
    
    def _export_no_match(self):
        if not self.no_matches:
            messagebox.showinfo("Info", "No unmatched records to export")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"no_match_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write("=" * 100 + "\n")
            f.write("NO MATCHING JOB ORDERS (EMAIL NOT FOUND)\n")
            f.write(f"Generated: {datetime.now()}\n")
            f.write(f"Total: {len(self.no_matches)}\n")
            f.write("=" * 100 + "\n\n")
            
            for idx, item in enumerate(self.no_matches, 1):
                f.write(f"Record #{idx}\n")
                f.write("-" * 100 + "\n")
                f.write(f"  First Name       : {item['first_name']}\n")
                f.write(f"  Middle Initial   : {item['middle_initial']}\n")
                f.write(f"  Last Name        : {item['last_name']}\n")
                f.write(f"  Email            : {item['email']}\n")
                f.write(f"  Phone            : {item['phone']}\n")
                f.write(f"  Modem SN         : {item['modem_sn']}\n")
                f.write(f"  Username         : {item['username']}\n\n")
        
        messagebox.showinfo("Success", f"Exported to {filename}")
    
    def _export_already_exists(self):
        if not self.already_exists:
            messagebox.showinfo("Info", "No existing records to export")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"already_exists_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write("=" * 100 + "\n")
            f.write("JOB ORDERS THAT ALREADY EXIST (SKIPPED)\n")
            f.write(f"Generated: {datetime.now()}\n")
            f.write(f"Total: {len(self.already_exists)}\n")
            f.write("=" * 100 + "\n\n")
            
            for idx, item in enumerate(self.already_exists, 1):
                f.write(f"Record #{idx}\n")
                f.write("-" * 100 + "\n")
                f.write(f"  First Name       : {item['first_name']}\n")
                f.write(f"  Middle Initial   : {item['middle_initial']}\n")
                f.write(f"  Last Name        : {item['last_name']}\n")
                f.write(f"  Email            : {item['email']}\n")
                f.write(f"  Modem SN         : {item['modem_sn']}\n")
                f.write(f"  Existing ID      : {item['existing_id']}\n\n")
        
        messagebox.showinfo("Success", f"Exported to {filename}")


if __name__ == "__main__":
    print("=" * 80)
    print("JOB ORDER MIGRATION TOOL - PROFESSIONAL EDITION")
    print("=" * 80)
    print("Starting application...")
    print("=" * 80 + "\n")
    
    root = tk.Tk()
    app = MigrationApp(root)
    root.mainloop()

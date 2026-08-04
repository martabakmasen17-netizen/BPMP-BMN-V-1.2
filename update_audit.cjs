const fs = require('fs');
let code = fs.readFileSync('src/components/AuditLogView.tsx', 'utf8');

// 1. Add currentUser to props
code = code.replace(
  "import { AuditLog } from '../types';",
  "import { AuditLog, UserAccount } from '../types';"
);

code = code.replace(
  "interface AuditLogViewProps {\n  logs: AuditLog[];\n  onClearLogs: () => void;\n}",
  "interface AuditLogViewProps {\n  logs: AuditLog[];\n  onClearLogs: () => void;\n  currentUser: UserAccount;\n}"
);

code = code.replace(
  "export default function AuditLogView({ logs, onClearLogs }: AuditLogViewProps) {",
  "export default function AuditLogView({ logs, onClearLogs, currentUser }: AuditLogViewProps) {"
);

// 2. Wrap button with role check
const btnCode = `<button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin mengarsipkan / mengosongkan seluruh log audit aktivitas lokal?')) {
              onClearLogs();
            }
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Kosongkan Log
        </button>`;

const newBtnCode = `{currentUser.role === 'Administrator' && (
        <button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin mengarsipkan / mengosongkan seluruh log audit aktivitas lokal?')) {
              onClearLogs();
            }
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Kosongkan Log
        </button>
        )}`;

code = code.replace(btnCode, newBtnCode);

fs.writeFileSync('src/components/AuditLogView.tsx', code);
console.log("AuditLogView.tsx updated");

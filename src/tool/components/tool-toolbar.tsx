'use client';

import Link from 'next/link';

export function ToolToolbar() {
  return (
    <div className="arc-toolbar flex items-center gap-3">
      <Link href="/help" className="toolbar-btn toolbar-help-link" aria-label="Open help page">
        Help
      </Link>
    </div>
  );
}

export default ToolToolbar;

'use client';

import { useState } from 'react';

export function UserEditor(props: { userId: string; initialRole: string; initialStatus: string }) {
  const [role, setRole] = useState(props.initialRole);
  const [status, setStatus] = useState(props.initialStatus);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm text-zinc-700">角色</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="traveler">traveler</option>
            <option value="operator">operator</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-700">状态</span>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="disabled">disabled</option>
            <option value="pending">pending</option>
          </select>
        </label>
      </div>

      <button
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
        type="button"
        onClick={() => {
          // TODO：后续对接 AdminUsers 更新接口
          setSavedHint(`已记录（占位）：role=${role}, status=${status}`);
          // eslint-disable-next-line no-console
          console.log('placeholder save user', { userId: props.userId, role, status });
        }}
      >
        保存修改（占位）
      </button>

      {savedHint ? <div className="text-sm text-zinc-600">{savedHint}</div> : null}
    </div>
  );
}

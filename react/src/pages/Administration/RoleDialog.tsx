import { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { FlatPermissionDto } from '@services/role.service';

type RoleFormState = {
  name: string;
  displayName: string;
  description: string;
  grantedPermissions: string[];
};

type PermissionNode = {
  name: string;
  displayName: string;
  description?: string;
  children: PermissionNode[];
};

type RoleDialogProps = {
  isOpen: boolean;
  isEdit: boolean;
  form: RoleFormState;
  permissions: FlatPermissionDto[];
  permissionsLoading?: boolean;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: RoleFormState) => RoleFormState) => void;
  onSave: () => void;
};

const HIDDEN_PERMISSION_NAMES = new Set([
  'Pages.HangfireDasboard',
  'Pages.HangfireDashboard',
]);

function shouldHidePermission(permission: FlatPermissionDto): boolean {
  if (HIDDEN_PERMISSION_NAMES.has(permission.name)) {
    return true;
  }

  const label = (permission.displayName ?? '').toLowerCase();
  return label.includes('background jobs') || label.includes('hangfire');
}

function buildTree(flat: FlatPermissionDto[]): PermissionNode[] {
  const visibleFlat = flat.filter((permission) => !shouldHidePermission(permission));
  if (!visibleFlat.length) return [];

  const nameSet = new Set(visibleFlat.map((p) => p.name));
  const byParent = new Map<string | null, FlatPermissionDto[]>();

  for (const p of visibleFlat) {
    const parent = p.parentName ?? null;
    const isRoot =
      !parent ||
      parent === '' ||
      !nameSet.has(parent);
    const key = isRoot ? null : parent;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(p);
  }

  function build(parentKey: string | null): PermissionNode[] {
    const list = byParent.get(parentKey) ?? [];
    return list
      .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
      .map((p) => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        children: build(p.name),
      }));
  }

  return build(null);
}

/** Build a map of each node name -> set of self + all descendant names (for cascade). */
function buildDescendantMap(nodes: PermissionNode[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  function visit(node: PermissionNode): Set<string> {
    const set = new Set<string>([node.name]);
    for (const child of node.children) {
      visit(child).forEach((n) => set.add(n));
    }
    map.set(node.name, set);
    return set;
  }
  for (const node of nodes) visit(node);
  return map;
}

function collectParentNodeNames(nodes: PermissionNode[]): string[] {
  const names: string[] = [];
  function walk(list: PermissionNode[]) {
    for (const node of list) {
      if (node.children.length > 0) {
        names.push(node.name);
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return names;
}

function PermissionTree({
  nodes,
  level,
  grantedSet,
  descendantMap,
  onToggleCascade,
  expandedSet,
  onToggleExpand,
}: {
  nodes: PermissionNode[];
  level: number;
  grantedSet: Set<string>;
  descendantMap: Map<string, Set<string>>;
  onToggleCascade: (names: Set<string>, checked: boolean) => void;
  expandedSet: Set<string>;
  onToggleExpand: (nodeName: string) => void;
}) {
  return (
    <ul className={level > 0 ? 'ml-4 border-l border-gray-200 pl-2 dark:border-gray-600' : ''}>
      {nodes.map((node) => {
        const selfAndDescendants = descendantMap.get(node.name) ?? new Set([node.name]);
        const grantedCount = [...selfAndDescendants].filter((n) => grantedSet.has(n)).length;
        const totalCount = selfAndDescendants.size;
        const checked = totalCount > 0 && grantedCount === totalCount;
        const indeterminate = grantedCount > 0 && grantedCount < totalCount;
        const hasChildren = node.children.length > 0;
        const isExpanded = hasChildren ? expandedSet.has(node.name) : false;

        return (
          <li key={node.name} className="py-0.5">
            <div className="flex items-start gap-2 text-sm">
              {hasChildren ? (
                <button
                  type="button"
                  aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                  className="mt-0.5 rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  onClick={() => onToggleExpand(node.name)}
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <span className="mt-0.5 inline-block h-4 w-4" />
              )}

              <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                ref={(el) => {
                  if (el) el.indeterminate = indeterminate;
                }}
                checked={checked}
                onChange={(e) => onToggleCascade(selfAndDescendants, e.target.checked)}
                className="mt-1"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {node.displayName || node.name}
              </span>
              </label>
            </div>
            {hasChildren && isExpanded ? (
              <PermissionTree
                nodes={node.children}
                level={level + 1}
                grantedSet={grantedSet}
                descendantMap={descendantMap}
                onToggleCascade={onToggleCascade}
                expandedSet={expandedSet}
                onToggleExpand={onToggleExpand}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export const RoleDialog = ({
  isOpen,
  isEdit,
  form,
  permissions,
  permissionsLoading = false,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: RoleDialogProps) => {
  const tree = useMemo(() => buildTree(permissions), [permissions]);
  const descendantMap = useMemo(() => buildDescendantMap(tree), [tree]);
  const parentNodeNames = useMemo(() => collectParentNodeNames(tree), [tree]);
  const grantedSet = useMemo(
    () => new Set(form.grantedPermissions ?? []),
    [form.grantedPermissions]
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedNodes(new Set(parentNodeNames));
  }, [parentNodeNames, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onToggleCascade = (names: Set<string>, checked: boolean) => {
    const current = new Set(form.grantedPermissions ?? []);
    if (checked) {
      names.forEach((n) => current.add(n));
    } else {
      names.forEach((n) => current.delete(n));
    }
    onFormChange((s) => ({ ...s, grantedPermissions: [...current] }));
  };

  const onToggleExpand = (nodeName: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeName)) {
        next.delete(nodeName);
      } else {
        next.add(nodeName);
      }
      return next;
    });
  };

  const canSave = isEdit ? canEdit : canCreate;
  const valid = form.name?.trim() && form.displayName?.trim();

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="flex-shrink-0 p-5 pb-0">
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle
                as="h3"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {isEdit ? 'Edit Role' : 'New Role'}
              </DialogTitle>
              <button
                type="button"
                className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.name ?? ''}
                  disabled={isEdit}
                  onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))}
                />
                {isEdit ? (
                  <p className="mt-0.5 text-xs text-gray-500">Name cannot be changed.</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display name
                </label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.displayName ?? ''}
                  onChange={(e) =>
                    onFormChange((s) => ({ ...s, displayName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <input
                className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.description ?? ''}
                onChange={(e) =>
                  onFormChange((s) => ({ ...s, description: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Permissions
            </label>
            <div className="max-h-64 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600">
              {permissionsLoading ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Loading permissions...
                </p>
              ) : tree.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No permissions available.
                </p>
              ) : (
                <PermissionTree
                  nodes={tree}
                  level={0}
                  grantedSet={grantedSet}
                  descendantMap={descendantMap}
                  onToggleCascade={onToggleCascade}
                  expandedSet={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 border-t border-gray-200 p-5 dark:border-gray-700">
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 text-sm dark:bg-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !canSave || !valid}
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

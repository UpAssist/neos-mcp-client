export interface PageNode {
  identifier: string;
  contextPath: string;
  path: string;
  nodeType: string;
  name: string;
  title: string;
  hidden: boolean;
  depth: number;
}

export interface ContentNode {
  identifier: string;
  contextPath: string;
  path: string;
  nodeType: string;
  name: string;
  properties: Record<string, unknown>;
}

export interface NodeTypeProperty {
  type: string;
  defaultValue: unknown;
  label: string;
}

export interface NodeTypeSchema {
  name: string;
  isContent: boolean;
  isDocument: boolean;
  properties: Record<string, NodeTypeProperty>;
}

export interface PendingChange {
  identifier: string;
  contextPath: string;
  path: string;
  nodeType: string;
  changeType: 'added' | 'modified' | 'removed';
}

export interface BridgeErrorResponse {
  error: string;
}

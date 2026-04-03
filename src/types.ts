export interface PageNode {
  // v2 (Neos 9) primary identifier
  nodeAggregateId?: string;
  // v1 (Neos 8) identifiers
  identifier?: string;
  contextPath?: string;
  // Common fields
  path?: string;
  nodeType: string;
  name: string;
  title: string;
  hidden: boolean;
  depth: number;
  properties?: Record<string, unknown>;
}

export interface ContentNode {
  nodeAggregateId?: string;
  identifier?: string;
  contextPath?: string;
  path?: string;
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
  // v2
  nodeAggregateId?: string;
  // v1
  identifier?: string;
  contextPath?: string;
  path?: string;
  nodeType: string;
  changeType: 'added' | 'modified' | 'removed' | 'moved';
}

export interface BridgeErrorResponse {
  error: string;
}

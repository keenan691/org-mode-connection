export = org_mode_connection;
export as namespace org_mode_connection;

declare namespace org_mode_connection {
  export type ExternalFileChange = { id: string; mtime: string };
  export type InsertPosition = {
    fileId: string;
    nodeId?: string;
    headline?: string;
  };
  export type PlainOrgNodesDict = { [nodeId: string]: PlainOrgNode };
  export type PlainOrgTag = { name: string };
  export type PlainOrgTimestampShort = { type: TimestampType; nodeId: string };
  export type RealmResults = {};
  export type TimeRange = { start: string; end: string };
  export type TimestampType =
    | 'active'
    | 'inActive'
    | 'scheduled'
    | 'deadline'
    | 'closed';

  export type PlainOrgNode = {
    id: string;
    fileId: string;
    category: string;
    content: string;
    drawers: string;
    hasChildren: boolean;
    headline: string;
    level: number;
    position: number;
    priority: string;
    tags: PlainOrgTag[];
    timestamps: PlainOrgTimestamp[];
    todo: string;
  };

  export type PlainOrgTimestamp = {
    type: TimestampType;
    warningPeriod: string;
    dateRangeWithTime: boolean;
    dateWithTime: boolean;
    repeater: string;
    date: string;
    dateRangeEnd: string;
  };

  export type PlainOrgFile = {
    id: string;
    type: string;
    name: string;
    size: string;
    ctime: string;
    mtime: string;
    path: string;
    title: string;
    description: string;
    metadata: string;
    category: string;
    lastSync: string;
    isChanged: boolean;
    isConflicted: boolean;
  };

  export type PlainOrgAgenda = {
    nodes: PlainOrgNodesDict;
    agendaItems: PlainOrgTimestampShort[];
    dayAgendaItems: PlainOrgTimestampShort[];
  };

  export type SearchQuery = {
    searchTerm: string;
    todos: any[];
    tags: any[];
    priorioty: string;
    isScheduled: boolean;
    hasDeadline: boolean;
  };

  export type Tocs = {
    ids: { [fileId: string]: string[] };
    data: PlainOrgNodesDict;
  };

  export interface ParsedInlineObject {
    type:
      | 'codeText'
      | 'strikeThroughText'
      | 'underlineText'
      | 'verbatimText'
      | 'boldText'
      | 'italicText'
      | 'regularText'
      | 'webLink'
      | 'plain';
    url: string;
    content: string;
    indexStart: number;
    indexEnd: number;
    title: string;
  }

  interface ParsedLine {
    type: 'regularLine' | 'listLine' | 'numericListLine' | 'checkboxLine';
    content: ParsedInlineObject[];
  }
}

// TODO move types to different file and generate it with org file
// Most recent types are in experiments.org

type SearchResult = {};

interface FsInterface {}

interface RealmOrgNode {
  name: string;
}

declare const org_mode_connection: {
  NodeContentParser(text: string): org_mode_connection.ParsedLine[];
  parse(
    lines: string[],
  ): {
    nodes: {
      todo: string | null;
      priority: string | null;
      drawers: string;
      tags: string[];
      timestamps: string[];
      headline: string;
      level: number;
      position: number;
      content: string;
    }[];
    file: {
      metadata: string;
      description: string;
    };
  };
  OrgApi: {
    addFile(title: string): Promise<void>;
    addNodes(
      nodes: org_mode_connection.PlainOrgNode[],
      insertPosition: InsertPosition,
      externalChange: boolean,
      returnAddedNodes: boolean,
    ): Promise<org_mode_connection.PlainOrgNode[]>;
    clearDb(): Promise<void>;
    configureDb(realm: Realm): void;
    configureFileAccess(fsIterface: FsInterface): void;
    connectDb(): Promise<void>;
    createFileFromString(string: string, type: 'manual'): Promise<void>;
    deleteFileById(fileId: string): Promise<void>;
    deleteNodeById(nodeId: string): Promise<void>;
    getAgendaAsPlainObject(
      timeRange: org_mode_connection.TimeRange,
      defaultWarningPeriod: number,
    ): Promise<org_mode_connection.PlainOrgAgenda>;
    getAllFilesAsPlainObject(): org_mode_connection.PlainOrgFile[];
    getAncestorsAsPlainObject(
      nodeId: string,
    ): Promise<org_mode_connection.PlainOrgNode[]>;
    getExternallyChangedFiles(): Promise<
      org_mode_connection.ExternalFileChange[]
    >;
    getFileAsPlainObject(id: string): Promise<org_mode_connection.PlainOrgFile>;
    getObjects(
      model: 'OrgNode' | 'OrgFile' | 'OrgTimestamp' | 'OrgTag',
      filter: string,
    ): Promise<org_mode_connection.RealmResults>;
    getOrCreateNodeByHeadline(targedNode: {
      fileId?: string;
      headline?: string;
    }): Promise<org_mode_connection.PlainOrgNode>;
    getRelatedNodes(
      nodeId: string,
    ): Promise<org_mode_connection.PlainOrgNode[]>;
    getTagsAsPlainObject(): Promise<string[]>;
    getTocs(): Promise<org_mode_connection.Tocs>;
    importFile(filepath: string): Promise<void>;
    search(searchQuery: org_mode_connection.SearchQuery): Promise<any>;
    syncDb(): Promise<any>;
    syncFile(id): Promise<any>;
    updateFile(id: string, changes: Object): Promise<any>;
    updateNodeById(id: string, changes: Object): Promise<any>;
  };
};

export = org_mode_connection;
export as namespace org_mode_connection;

// * Shape

declare namespace org_mode_connection {
  // Helper types
  export type ExternalFileChange = { id: string; mtime: string; };
  export type InsertPosition = { fileId: string; nodeId?: string; headline?: string; };
  export type PlainOrgNodesDict = { [nodeId: string]: PlainOrgNode };
  export type PlainOrgTag = { name: string; }
  export type PlainOrgTimestampShort = { type: TimestampType, nodeId: string }
  export type RealmResults = {};
  export type TimeRange = { start: string; end: string; };
  export type TimestampType = "active" | "inActive" | "scheduled" | "deadline" | "closed";

  // Main types

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
    timestamps: PlainOrgTimestamp[]
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

  // Contents parser types
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
    title: string
  }

  interface ParsedLine {
    type: 'regularLine' | 'listLine' | 'numericListLine' | 'checkboxLine';
    content: ParsedInlineObject[];
  }
}

// TODO move types to different file and generate it with org file
// Most recent types are in experiments.org

// * Types

type SearchResult = {};


// * Interfaces

// ** External interfaces

interface FsInterface { }

interface RealmOrgNode {
  name: string;
}

// ** Content parser output

// * Api

declare const org_mode_connection: {
  /**
   * Parses node text objects
   * @param text
   */

  NodeContentParser(text: string): org_mode_connection.ParsedLine[];
  OrgApi: {
    /**
     * Creates empty file in database.
     * @param title - New file title
     */
    addFile(title: string): Promise<void>;

    /**
     * Add nodes to the tree of nodes
     * @param nodes
     * @param insertPosition
     * @param externalChange
     * @param returnAddedNodes
     */
    addNodes(
      nodes: org_mode_connection.PlainOrgNode[],
      insertPosition: InsertPosition,
      externalChange: boolean,
      returnAddedNodes: boolean,
    ): Promise<org_mode_connection.PlainOrgNode[]>;

    /** Clears Database.*/
    clearDb(): Promise<void>;

    /**
     * Configure database.
     * @param realm - Realm object
     */
    configureDb(realm: Realm): void;

    /**
     * Configure file access.
     * @param fsIterface - Promisified file access interface
     */
    configureFileAccess(fsIterface: FsInterface): void;

    /** Connect database. */
    connectDb(): Promise<void>;

    /**
     * Create file from array of strings.
     * @param name - The name of new file
     * @param lines - List of string raw lines
     */
    createFileFromString(name: string, lines: string[]): Promise<void>;

    /**
     * Delete file from database.
     * @param fileId - File id
     */
    deleteFileById(fileId: string): Promise<void>;

    /**
     * Deletes node.
     * @param nodeId
     */
    deleteNodeById(nodeId: string): Promise<void>;

    /**
     * Returns agenda as plain object.
     * @param timeRange
     * @param defaultWarningPeriod
     */
    getAgendaAsPlainObject(
      timeRange: org_mode_connection.TimeRange,
      defaultWarningPeriod: number,
    ): Promise<org_mode_connection.PlainOrgAgenda>;

    /** Returns all OrgFiles as plain objects.*/
    getAllFilesAsPlainObject(): org_mode_connection.PlainOrgFile[];

    /**
     * Returns all ancestors of node.
     * @param nodeId
     */
    getAncestorsAsPlainObject(nodeId: string): Promise<org_mode_connection.PlainOrgNode[]>;

    /** Returns ids of externally changed files*/
    getExternallyChangedFiles(): Promise<org_mode_connection.ExternalFileChange[]>;

    /**
     * Returns file and its nodes data as plain object.
     * @param id - File id
     */
    getFileAsPlainObject(id: string): Promise<org_mode_connection.PlainOrgFile>;

    /**
     * Return raw RealmResults object.
     * @param model - Realm model
     * @param filter - Realm filter string
     */
    getObjects(
      model: 'OrgNode' | 'OrgFile' | 'OrgTimestamp' | 'OrgTag',
      filter: string,
    ): Promise<org_mode_connection.RealmResults>;

    /**
     * Gets node by headline. If node doasnt exists it is created.
     * @param targedNode
     */
    getOrCreateNodeByHeadline(targedNode: {
      fileId?: string;
      headline?: string;
    }): Promise<org_mode_connection.PlainOrgNode>;

    /**
     * Returns ancestors and descendants.
     * @param nodeId
     */
    getRelatedNodes(nodeId: string): Promise<org_mode_connection.PlainOrgNode[]>;

    /** Returns list of all tags.*/
    getTagsAsPlainObject(): Promise<string[]>;

    /** Returns all files with their child nodes.*/
    getTocs(): Promise<org_mode_connection.Tocs>;

    /**
     * Imports external file.
     * @param filepath
     */
    importFile(filepath: string): Promise<void>;

    /**
     * Search.
     * @param searchQuery
     */
    search(searchQuery: org_mode_connection.SearchQuery): Promise<any>;

    /** Sync all files. */
    syncDb(): Promise<any>;

    /**
     * Syncs file.
     * @param id - file id
     */

    syncFile(id): Promise<any>;

    /**
     * Merges prop to file object
     * @param id - File id
     * @param changes - New file props to merge
     */
    updateFile(id: string, changes: Object): Promise<any>;

    /**
     * Merges props to node object.
     * @param id - Node id
     * @param changes - New node props to merge
     */
    updateNodeById(id: string, changes: Object): Promise<any>;
  };
};

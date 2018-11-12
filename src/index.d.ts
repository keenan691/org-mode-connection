export = org_mode_connection

// * Types

type SearchResult = {};

type SearchQuery = {
  searchTerm: string;
  todos: any[];
  tags: any[];
  priorioty: string;
  isScheduled: boolean;
  hasDeadline: boolean;
};

type Tocs = {
  ids: { [fileId: string]: string[] };
  data: PlainOrgNodesDict;
};

type ExternalFileChange = {
  id: string;
  mtime: string;
};

type RealmResults = {};

type PlainOrgNode = {};

type PlainOrgNodesDict = { [nodeId: string]: PlainOrgNode };

type PlainOrgTimestamp = {};

type PlainOrgFile = {
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

type PlainAgenda = {
  nodes: PlainOrgNodesDict;
  agendaItems: PlainOrgTimestamp[];
  dayAgendaItems: PlainOrgTimestamp[];
};

type TimeRange = {
  start: string;
  end: string;
};

// * Interfaces

interface FsInterface { }

interface OrgNode {
  name: string;
}

interface RealmOrgNode {
  name: string;
}

interface InsertPosition {
  fileId: string;
  nodeId?: string;
  headline?: string;
}

// * Api

declare const org_mode_connection: {
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
      nodes: PlainOrgNode[],
      insertPosition: InsertPosition,
      externalChange: boolean,
      returnAddedNodes: boolean,
    ): Promise<PlainOrgNode[]>;

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
      timeRange: TimeRange,
      defaultWarningPeriod: number,
    ): Promise<PlainAgenda>;

    /** Returns all OrgFiles as plain objects.*/
    getAllFilesAsPlainObject(): PlainOrgFile[];

    /**
     * Returns all ancestors of node.
     * @param nodeId
     */
    getAncestorsAsPlainObject(nodeId: string): Promise<PlainOrgNode[]>;

    /** Returns ids of externally changed files*/
    getExternallyChangedFiles(): Promise<ExternalFileChange[]>;

    /**
     * Returns file and its nodes data as plain object.
     * @param id - File id
     */
    getFileAsPlainObject(id: string): Promise<PlainOrgFile>;

    /**
     * Return raw RealmResults object.
     * @param model - Realm model
     * @param filter - Realm filter string
     */
    getObjects(
      model: 'OrgNode' | 'OrgFile' | 'OrgTimestamp' | 'OrgTag',
      filter: string,
    ): Promise<RealmResults>;

    /**
     * Gets node by headline. If node doasnt exists it is created.
     * @param targedNode
     */
    getOrCreateNodeByHeadline(targedNode: {
      fileId?: string;
      headline?: string;
    }): Promise<PlainOrgNode>;

    /**
     * Returns ancestors and descendants.
     * @param nodeId
     */
    getRelatedNodes(nodeId: string): Promise<PlainOrgNode[]>;

    /** Returns list of all tags.*/
    getTagsAsPlainObject(): Promise<string[]>;

    /** Returns all files with their child nodes.*/
    getTocs(): Promise<Tocs>;

    /**
     * Imports external file.
     * @param filepath
     */
    importFile(filepath: string): Promise<void>;

    /**
     * Search.
     * @param searchQuery
     */
    search(searchQuery: SearchQuery): Promise<any>;

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

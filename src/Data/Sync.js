import { extractNodesFromFile } from '../OrgFormat/NodesExtractor';
import { headlineT } from '../OrgFormat/Transformations';
import { nullWhenEmpty } from '../Helpers/Functions';
import FileAccess from '../Helpers/FileAccess';

// * Sync
// ** How we know that changes occured?
// *** Remote
// Compare file mod time with one saved in db.

// *** Local
// File node has flag isChanged - we don't want to waste time for query every time cron schedule sync.

// ** What happens after sync method is run
// *** No changes
// pass

// *** TODO [3/4] Only local changes occured
// 1. [X] Get all file db nodes
// 2. [X] Divide original file using nodes line ranges eg.
//    [begginning, node1, text, node2, end]
//    begginning and end can be empty
// 3. [X] map nodes to org repr
//    1. [X] if node is changed or added coumpute its org repr
//    2. [X] if node is not changed get org repr from file using old position
// 4. [ ] overwrite file

// *** TODO [0/6] Only remote changes occured
// *Directions* :
// - [ ] when it's possible keep ids.
// - [ ] crc is computed ignoring position
// - [ ] id is made from concated crc, indent and position
// - [ ] thing more abouth cases of headlines with same crc but different positions. No matter with one is whith becouse it have the same identity. One important thing is to always taka first when processing to, due to not forget about other. *Do tests for this case*

// *Process* :
// 1. [ ] Phase one - exclude not changed
//    - Extract remote nodes with position and compute theirs crc's
//    - Get local nodes
//    - Exclude from both groups nodes with same crcc and update theirs positions and indent if needed

// 2. [ ] Phase two - try to recognize common changes to avoid loss of id
//    - parse rest of nodes
//    - exclude group with new headlines - if there is new headline it means that this node is new
//    - pair nodes with same headlines and seek for common changes
//      - todo state has changed (content will be changed also becouse of todo state history - do something with this: either parse state changes as metadata or remove them before compare) and content can changed rest is the same
//      - only tags has changed
//      - only scheduled or deadline has changed
//      - only priority has changed
//      - only drawers has changed
//    - update those nodes
//    - delete rest of nodes from db
//    - add remaining nodes from file as new

// *** TODO [1/3] Both local and remote changes occured
// Try to merge.

// 1. [X] Do the same like in remote changes point.
// 2. [ ] If changed nodes is not deleted then update it like in local changes point.
// 3. [ ] If it's not possible return error message with this node id headline and position and mark this file as conflicted.

// Conflited file will not be synced util conflict is resolved. Future possible action will be:
//    - delete those nodes and sync file
//    - force version from db
//    - merge nodes to manual resolve with tag resolve


// * Code
/**
 * Check if file was changed using mtime.
 * @param {Type of file} file - Parameter description.
 * @returns {Return Type} mtime if file was changed, otherwise false.
 */
export const isChangedRemotly = (file) => FileAccess.stat(file.path).then(
  stat => stat.mtime > file.lastSync ? stat.mtime : false);

export const getChanges = (file) => {
  const local = nullWhenEmpty(file.getLocallyChangedNodes())
  const remote = null;
  const newRemoteMtime = isChangedRemotly(file); // Check if file changed using modify time
  // If no changes - Exit
  if (!newRemoteMtime && !local) return null

  // Extract nodes from org file
  const extractedNodes = extractNodesFromFile(file);

  // Get remote changes
  if (newRemoteMtime) {
    const allNodes = R.concat(extractedNodes, file.nodes)

    const groupSimiliarNodes = R.groupWith((n1, n2) =>
                                           n1.rawHeadline === n2.rawHeadline &&
                                           n1.rawContent === n2.rawContent)

    const partitionByIdPossesion = R.partition(n => n.id === undefined);
    const checkIfGroupAreSymetric = x => x.length === 2 && x[0].length === x[1].length // Sprawdza czy jest tyle samo objektów posiadających id co nieposiadających
    // listing trzeba podizelić na symetryczne grópy i resztę
    // symetryczne grupy zcalić poprzez skopiowanie pozycji, poziomu numerów linii
    // niesymetryczne przekazać dalej do obróbki choć na razie w uproszczonej wersji nie przejmować się zmianami todo itd.
    // po prostu usunąć posiadające id i dodać nie posiadające
    // no końcu odświerzyć rodzićów - tej funkji też użyć przy dodawaniu plików - to już zrobić w metodzie syncu
    remote = {
      toAdd
      toDelete
      sameOrModified // pary [[wersja z bazy danych, wersja zparsowana], ..] - czyli grupy symetryczne
      // Może ich być więcej ale to pownie będzie rzadkość
      // Na ten moment mogą się różnić jedynie pozycją i levelem
      // W przyszłości mogą się różnić todo, priorytetem itd

    }
  }

  return {
    remote,
    local,
  }
};

const changes = getChanges(file); if (!changes) return null
const onlyLocalChanges = changes.local && !changes.remote;
const onlyRemoteChanges = !changes.local && changes.remote;
const bothLocalAndRemoteChanges = changes.local && changes.remote;
const writeToFile = file => content => FileAccess.write(file.path, content);

const applyLocalChanges = file => R.pipe(
  R.path('nodes'),
  R.map(node => node.toOrgRepr()),
  writeToFile(file));

const sync = file => R.pipe(
  getChanges
  R.unless(R.isNil,
           R.pipe(
             R.cond([
               [onlyLocalChanges, applyLocalChanges(file)]
               [onlyRemoteChanges, applyRemoteChanges]]))))(file)

export default sync

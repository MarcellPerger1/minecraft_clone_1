import { Blocks } from "../world/block_type.js";
export class BlockToPlace {
  player;
  selectElem;
  constructor(player) {
    this.player = player;
    this.selectElem = document.getElementById("select-block-to-place");
  }
  loadBlocks() {
    const placeholder = document.getElementById("loading-block-to-place");
    placeholder.remove();
    for (const blockType of Object.values(Blocks)) {
      this.selectElem.appendChild(this.makeOptionForBlock(blockType));
    }
    return this;
  }
  makeOptionForBlock(block) {
    const elem = document.createElement("option");
    elem.value = block.name;
    elem.append(this._getDisplayName(block));
    return elem;
  }
  _getDisplayName(block) {
    return block.name; // later: convert snake_case to normal name
  }
}
//# sourceMappingURL=block_to_place.js.map

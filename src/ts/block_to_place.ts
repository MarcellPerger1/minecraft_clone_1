import type { Player } from "../player.js";
import { type BlockType, Blocks } from "../world/block_type.js";

export class BlockToPlace {
  player: Player;
  selectElem: HTMLSelectElement;

  constructor(player: Player) {
    this.player = player;
    this.selectElem = document.getElementById('select-block-to-place') as HTMLSelectElement;
  }

  loadBlocks() : this {
    const placeholder = document.getElementById("loading-block-to-place") as HTMLOptionElement;
    placeholder.remove();

    for(const blockType of Object.values(Blocks)) {
      this.selectElem.appendChild(this.makeOptionForBlock(blockType));
    }
    return this;
  }

  makeOptionForBlock(block: BlockType) : HTMLOptionElement {
    const elem = document.createElement("option");
    elem.value = block.name;
    elem.append(this._getDisplayName(block));
    return elem;
  }

  _getDisplayName(block: BlockType) : string {
    return block.name;  // later: convert snake_case to normal name
  }
}

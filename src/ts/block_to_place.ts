import { isObject } from "../utils/type_check.js";

import type { Player } from "../player.js";
import { type BlockType, Blocks } from "../world/block_type.js";

export class BlockToPlace {
  player: Player;
  selectElem: HTMLSelectElement;

  constructor(player: Player) {
    this.player = player;
    this.selectElem = document.getElementById(
      "select-block-to-place"
    ) as HTMLSelectElement;
  }

  loadBlocks(): this {
    const placeholder = document.getElementById(
      "loading-block-to-place"
    ) as HTMLOptionElement;
    placeholder.remove();

    let addedIds = new Set<string>();
    for (const blockType of Object.values(Blocks)) {
      if (!isObject(blockType) || addedIds.has(blockType.name)) continue;
      this.selectElem.appendChild(this.makeOptionForBlock(blockType));
      addedIds.add(blockType.name);
    }
    this.selectElem.namedItem("oak_log")!.selected = true;
    this._addOnchangeListener();
    return this;
  }

  makeOptionForBlock(block: BlockType): HTMLOptionElement {
    const elem = document.createElement("option");
    elem.value = block.name;
    elem.setAttribute("name", block.name);
    elem.append(this._getDisplayName(block));
    return elem;
  }

  _addOnchangeListener() {
    this.selectElem.addEventListener("change", () => {
      const value = this.selectElem.value;
      this.player.blockInHand = Blocks[value];
    });
  }

  _getDisplayName(block: BlockType): string {
    return block.name; // later: convert snake_case to normal name
  }
}

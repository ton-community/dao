import { beginCell, Cell } from "ton";

export function createProposal(seq: number, proposal: Cell) {
    return beginCell()
        .storeUint(seq, 32)
        .storeRef(proposal)
        .endCell();
}
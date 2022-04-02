import BN from "bn.js";
import { Address, beginCell, beginDict, Cell } from "ton";

// ctx_version = ds~load_uint(16);
//     ctx_total_shares = ds~load_uint(32);
//     ctx_allocated_shares = ds~load_uint(32);
//     ctx_seq_proposal = ds~load_uint(64);
//     ctx_total_members = ds~load_uint(32);
//     ctx_members = ds~load_ref();
//     ctx_proposals = ds~load_ref();

export function createData(totalShares: number, members: { address: Address, shares: number }[]) {
    let allocatedShares = 0;
    for (let m of members) {
        allocatedShares += m.shares;
    }

    let membersCell = beginDict(256);
    for (let m of members) {
        membersCell.storeRef(m.address.hash,
            beginCell()
                .storeCoins(m.shares)
                .endCell());
    }

    return beginCell()
        .storeUint(1, 16)
        .storeRef(beginCell()
            .storeUint(totalShares, 32)
            .storeUint(allocatedShares, 32)
            .storeUint(members.length, 32)
            .storeRef(membersCell.endCell())
            .endCell())
        .storeRef(beginCell()
            .storeUint(0, 32)
            .storeDict(null)
            .storeDict(null)
            .endCell())
        .endCell();
}
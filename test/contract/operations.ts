import BN from "bn.js";
import { beginCell, Cell } from "ton";
import { SmartContract } from "ton-contract-executor";
import { bnToAddress } from "./bnToAddress";

export function createProposal(seq: number,
    proposal: Cell,
    metadata: Cell
) {
    return beginCell()
        .storeUint(3241702467, 32)
        .storeUint(0, 64)
        .storeUint(seq, 32)
        .storeRef(proposal)
        .storeRef(metadata)
        .endCell();
}

export function executeProposal(id: number) {
    return beginCell()
        .storeUint(2483002579, 32)
        .storeUint(0, 64)
        .storeUint(id, 32)
        .endCell();
}

export function abortProposal(id: number) {
    return beginCell()
        .storeUint(1558599333, 32)
        .storeUint(0, 64)
        .storeUint(id, 32)
        .endCell();
}

export function createVote(id: number, type: 'yes' | 'no' | 'abstain') {
    let t = 3;
    if (type === 'yes') {
        t = 1;
    }
    if (type === 'no') {
        t = 0;
    }
    if (type === 'abstain') {
        t = 2;
    }
    return beginCell()
        .storeUint(3047515073, 32)
        .storeUint(0, 64)
        .storeUint(id, 32)
        .storeUint(t, 2)
        .endCell();
}

export function createMetadata() {
    return beginCell().endCell();
}

export async function getLatestProposalId(contract: SmartContract) {
    let latestProposalId = (await contract.invokeGetMethod('get_last_proposal_id', [])).result;
    if (latestProposalId.length !== 1) {
        throw Error('Invalid response');
    }
    if (!BN.isBN(latestProposalId[0])) {
        throw Error('Invalid response');
    }
    return latestProposalId[0].toNumber();
}

export async function getProposal(contract: SmartContract, id: number) {
    let proposal = (await contract.invokeGetMethod('get_proposal', [{ type: 'int', value: id.toString() }])).result;

    // Version is always zero
    if (!(proposal[0] as BN).eq(new BN(0))) {
        throw Error('Invalid response');
    }

    let rawState = (proposal[1] as BN).toNumber();
    let state: 'pending' | 'success' | 'failure' | 'executed' | 'aborted' | 'cancelled' = 'pending';
    if (rawState === 0) {
        state = 'pending';
    } else if (rawState === 1) {
        state = 'success';
    } else if (rawState === 2) {
        state = 'failure';
    } else if (rawState === 3) {
        state = 'executed';
    } else if (rawState === 4) {
        state = 'aborted';
    } else if (rawState === 5) {
        state = 'cancelled';
    } else {
        throw Error('Unknown state: ' + rawState);
    }

    let votedYes = (proposal[2] as BN).toNumber();
    let votedNo = (proposal[3] as BN).toNumber();
    let votedAbstain = (proposal[4] as BN).toNumber();
    let body = proposal[5] as Cell;
    let author = bnToAddress((proposal[6] as BN));
    let createdAt = (proposal[7] as BN).toNumber();
    let successTreshold = (proposal[8] as BN).toNumber();
    let failureTreshold = (proposal[9] as BN).toNumber();
    let metadata = proposal[10] as Cell;

    return {
        state,
        votedYes,
        votedNo,
        votedAbstain,
        author: author.toFriendly({ testOnly: true }),
        body,
        createdAt,
        successTreshold,
        failureTreshold,
        metadata
    }
}
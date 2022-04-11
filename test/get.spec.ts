import { beginCell, toNano } from "ton";
import { SmartContract } from "ton-contract-executor";
import { createCode } from "./contract/createCode";
import { createData } from "./contract/createData";
import { createMetadata, createProposal, createVote, executeProposal, getProposal } from "./contract/operations";
import { sendMessage } from "./contract/sendMessage";
import { randomAddress } from "./utils/randomAddress";

const member1 = randomAddress(0, "initial-1");
const member2 = randomAddress(0, "initial-2");
const member3 = randomAddress(0, "initial-3");
const member4 = randomAddress(0, "initial-4");
const outsider = randomAddress(0, "outsider-1");

describe("get", () => {
    it("should execute get_membership", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 1000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [{ address: member1, shares: 1000 }]
            })
        );

        let res = await executor.invokeGetMethod('get_membership', [{ type: 'cell_slice', value: beginCell().storeAddress(member2).endCell().toBoc({ idx: false }).toString('base64') }])
        console.warn(res);
    });
});
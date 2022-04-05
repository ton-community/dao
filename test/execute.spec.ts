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

describe("execute", () => {
    it("should execute transfer proposal", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(1000, [
                { address: member1, shares: 1000 }
            ])
        );

        // Create proposal
        await sendMessage(
            executor,
            toNano(1),
            member1,
            createProposal(
                0,
                beginCell()
                    .storeUint(1225918510, 32) // Transaction proposal
                    .storeBit(false) // No extras
                    .storeAddress(outsider) // Target
                    .storeCoins(toNano(10)) // Value
                    .storeBit(false) // No state init
                    .storeBit(false) // No payload
                    .endCell(),
                createMetadata()
            )
        );

        // Create proposal
        let res = await sendMessage(
            executor,
            toNano(1),
            member1,
            executeProposal(0)
        );
        expect(res).toMatchObject([
            {
                mode: 64,
                to: member1.toFriendly({ testOnly: true }),
                value: '0'
            },
            {
                mode: 2,
                to: outsider.toFriendly({ testOnly: true }),
                value: toNano(10).toString(10)
            }
        ]);
    });
});
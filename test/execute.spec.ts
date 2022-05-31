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
            createData({
                totalShares: 1000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [{ address: member1, shares: 1000 }]
            })
        );

        // Create proposal
        await sendMessage(
            executor,
            toNano(10),
            member1,
            createProposal(
                0,
                beginCell()
                    .storeUint(1225918510, 32) // Transaction proposal
                    .storeAddress(outsider) // Target
                    .storeCoins(toNano(10)) // Value
                    .storeBit(false) // No state init
                    .storeBit(false) // No payload
                    .endCell(),
                createMetadata()
            )
        );

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        );


        // Execute proposal
        let res = await sendMessage(
            executor,
            toNano(1),
            member1,
            executeProposal(0)
        );
        expect(res).toMatchObject([
            {
                mode: 64 + 2,
                to: member1.toFriendly({ testOnly: true }),
                value: '0'
            },
            {
                mode: 3,
                to: outsider.toFriendly({ testOnly: true }),
                value: toNano(10).toString(10)
            }
        ]);

        // Check state
        expect(await getProposal(executor, 0)).toMatchObject({
            state: 'executed',
            votedYes: 1000,
            votedNo: 0,
            votedAbstain: 0,
            author: 'kQBStTCAtTy3Q2iGrVompkIhu23dPgBYEvle14f8XVhZTkkC',
            successTreshold: 750,
            failureTreshold: 250
        })
    });

    it("should execute resolution proposal", async () => {

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

        // Create proposal
        await sendMessage(
            executor,
            toNano(10),
            member1,
            createProposal(
                0,
                beginCell()
                    .storeUint(3070113962, 32) // resolution proposal
                    .endCell(),
                createMetadata()
            )
        );

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        );

        // Execute proposal
        let res = await sendMessage(
            executor,
            toNano(1),
            member1,
            executeProposal(0)
        );
        expect(res).toMatchObject([
            {
                mode: 64 + 2,
                to: member1.toFriendly({ testOnly: true }),
                value: '0'
            }
        ]);

        // Check state
        expect(await getProposal(executor, 0)).toMatchObject({
            state: 'executed',
            votedYes: 1000,
            votedNo: 0,
            votedAbstain: 0,
            author: 'kQBStTCAtTy3Q2iGrVompkIhu23dPgBYEvle14f8XVhZTkkC',
            successTreshold: 750,
            failureTreshold: 250
        })
    });

    it("should execute params proposal", async () => {

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

        // Create proposal
        await sendMessage(
            executor,
            toNano(10),
            member1,
            createProposal(
                0,
                beginCell()
                    .storeUint(1658590374, 32) // params proposal
                    .storeUint(1, 16)
                    .storeRef(beginCell()
                        .storeUint(0, 1)
                        .storeCoins(1000)
                        .storeCoins(750)
                        .storeCoins(250)
                        .storeCoins(250)
                        .storeCoins(toNano(10))
                        .storeBit(true)
                        .storeRef(beginCell()
                            .endCell())
                        .endCell())
                    .endCell(),
                createMetadata()
            )
        );

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
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
                mode: 64 + 2,
                to: member1.toFriendly({ testOnly: true }),
                value: '0'
            }
        ]);

        // Check state
        expect(await getProposal(executor, 0)).toMatchObject({
            state: 'executed',
            votedYes: 1000,
            votedNo: 0,
            votedAbstain: 0,
            author: 'kQBStTCAtTy3Q2iGrVompkIhu23dPgBYEvle14f8XVhZTkkC',
            successTreshold: 750,
            failureTreshold: 250
        });
    });
});
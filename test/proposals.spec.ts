import { beginCell, toNano } from "ton";
import { SmartContract } from "ton-contract-executor";
import { createCode } from "./contract/createCode";
import { createData } from "./contract/createData";
import { createMetadata, createProposal, getLatestProposalId, getProposal } from "./contract/operations";
import { sendMessage } from "./contract/sendMessage";
import { randomAddress } from "./utils/randomAddress";

const member1 = randomAddress(0, "initial-1");
const member2 = randomAddress(0, "initial-2");
const outsider = randomAddress(0, "outsider-1");

describe("proposals", () => {
    it("should create proposals", async () => {
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
            ])
        );

        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 64,
            to: 'kQBStTCAtTy3Q2iGrVompkIhu23dPgBYEvle14f8XVhZTkkC',
            value: '0'
        }]);

        // Loading all proposals
        let latestProposalId = await getLatestProposalId(executor);
        expect(latestProposalId).toBe(0);

        // Proposal
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'pending',
            votedYes: 1000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 1020, // 51%
            failureTreshold: 500 // 25%
        });
    });

    it("should auto accept proposal if have enought voting power", async () => {
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 5000 },
                { address: member2, shares: 1000 },
            ])
        );

        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 64,
            to: 'kQBStTCAtTy3Q2iGrVompkIhu23dPgBYEvle14f8XVhZTkkC',
            value: '0'
        }]);

        // Loading all proposals
        let latestProposalId = await getLatestProposalId(executor);
        expect(latestProposalId).toBe(0);

        // Proposal
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'success',
            votedYes: 5000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3060, // 51%
            failureTreshold: 1500 // 25%
        });
    });

    it("should not create proposal if not member", async () => {
        const exectutor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
            ])
        );

        await expect(
            sendMessage(
                exectutor,
                toNano(1),
                outsider,
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
            )
        ).rejects.toThrowError("Error 77");
    });

    it("should bounce on invalid seq", async () => {
        const exectutor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
            ])
        );

        await expect(
            sendMessage(
                exectutor,
                toNano(1),
                member1,
                createProposal(
                    100,
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
            )
        ).rejects.toThrowError("Error 72");
    });
});

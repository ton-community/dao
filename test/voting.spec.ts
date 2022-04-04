import { beginCell, toNano } from "ton";
import { SmartContract } from "ton-contract-executor";
import { createCode } from "./contract/createCode";
import { createData } from "./contract/createData";
import { createMetadata, createProposal, createVote, getProposal } from "./contract/operations";
import { sendMessage } from "./contract/sendMessage";
import { randomAddress } from "./utils/randomAddress";

const member1 = randomAddress(0, "initial-1");
const member2 = randomAddress(0, "initial-2");
const member3 = randomAddress(0, "initial-3");
const member4 = randomAddress(0, "initial-4");
const outsider = randomAddress(0, "outsider-1");

describe("voting", () => {
    it("should be able to vote yes for proposals and eventually succeed proposal", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
                { address: member3, shares: 1000 },
                { address: member4, shares: 1000 },
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

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member2,
            createVote(0, 'yes')
        );

        // Check state
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'pending',
            votedYes: 2000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 2040, // 51%
            failureTreshold: 1000 // 25%
        });

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member3,
            createVote(0, 'yes')
        );

        // Check state
        proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'success',
            votedYes: 3000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 2040, // 51%
            failureTreshold: 1000 // 25%
        });

        // Last vote rejects since it is already successful
        await expect(sendMessage(
            executor,
            toNano(1),
            member4,
            createVote(0, 'yes')
        )).rejects.toThrowError('Error 72');
    });

    it("should throw on author vote", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
                { address: member3, shares: 1000 },
                { address: member4, shares: 1000 },
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

        // Vote
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        )).rejects.toThrowError('Error 72');
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'no')
        )).rejects.toThrowError('Error 72');
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'abstain')
        )).rejects.toThrowError('Error 72');
    });

    it("should throw on double vote", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData(5000, [
                { address: member1, shares: 1000 },
                { address: member2, shares: 1000 },
                { address: member3, shares: 1000 },
                { address: member4, shares: 1000 },
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

        // Vote
        await sendMessage(
            executor,
            toNano(1),
            member2,
            createVote(0, 'abstain')
        );

        // Double Vote
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        )).rejects.toThrowError('Error 72');
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'no')
        )).rejects.toThrowError('Error 72');
        expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'abstain')
        )).rejects.toThrowError('Error 72');
    });
});
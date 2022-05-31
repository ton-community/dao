import BN from "bn.js";
import { beginCell, Cell, toNano } from "ton";
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
            createData({
                totalShares: 5000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [
                    { address: member1, shares: 1000 },
                    { address: member2, shares: 1000 },
                    { address: member3, shares: 1000 },
                    { address: member4, shares: 1000 },
                ]
            })
        );

        // Create proposal
        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 128 + 2,
            to: member1.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Vote
        res = await sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member1.toFriendly({ testOnly: true }),
            value: '0'
        }]);
        res = await sendMessage(
            executor,
            toNano(1),
            member2,
            createVote(0, 'yes')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member2.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Check state
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'pending',
            votedYes: 2000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3000,
            failureTreshold: 1000
        });

        // Vote
        res = await sendMessage(
            executor,
            toNano(1),
            member3,
            createVote(0, 'yes')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member3.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Check state
        proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'success',
            votedYes: 3000,
            votedNo: 0,
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3000,
            failureTreshold: 1000
        });

        // Last vote rejects since it is already successful
        await expect(sendMessage(
            executor,
            toNano(1),
            member4,
            createVote(0, 'yes')
        )).rejects.toThrowError('Error 72');
    });

    it("should be able to vote no for proposals and eventually fail proposal", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 5000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [
                    { address: member1, shares: 1000 },
                    { address: member2, shares: 1000 },
                    { address: member3, shares: 1000 },
                    { address: member4, shares: 1000 },
                ]
            })
        );

        // Create proposal
        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 128 + 2,
            to: member1.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Vote
        res = await sendMessage(
            executor,
            toNano(1),
            member2,
            createVote(0, 'no')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member2.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Check state
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'failure',
            votedYes: 0,
            votedNo: 1000, // Reached treshold
            votedAbstain: 0,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3000,
            failureTreshold: 1000
        });

        // Last vote rejects since it is already successful
        await expect(sendMessage(
            executor,
            toNano(1),
            member4,
            createVote(0, 'no')
        )).rejects.toThrowError('Error 72');
    });

    it("should be able to vote abstain for proposals and eventually fail proposal", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 5000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [
                    { address: member1, shares: 1000 },
                    { address: member2, shares: 1000 },
                    { address: member3, shares: 1000 },
                    { address: member4, shares: 1000 },
                ]
            })
        );

        // Create proposal
        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 128 + 2,
            to: member1.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Vote
        res = await sendMessage(
            executor,
            toNano(1),
            member2,
            createVote(0, 'abstain')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member2.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Check state
        let proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'pending',
            votedYes: 0,
            votedNo: 0,
            votedAbstain: 1000,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3000,
            failureTreshold: 1000
        });

        // Vote
        res = await sendMessage(
            executor,
            toNano(1),
            member3,
            createVote(0, 'abstain')
        );
        expect(res).toMatchObject([{
            mode: 64 + 2,
            to: member3.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Check state
        proposal = await getProposal(executor, 0);
        expect(proposal).toMatchObject({
            state: 'failure',
            votedYes: 0,
            votedNo: 0,
            votedAbstain: 2000,
            author: member1.toFriendly({ testOnly: true }),
            successTreshold: 3000,
            failureTreshold: 1000
        });

        // Last vote rejects since it is already successful
        await expect(sendMessage(
            executor,
            toNano(1),
            member4,
            createVote(0, 'abstain')
        )).rejects.toThrowError('Error 72');
    });

    it("should throw on double vote", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 5000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [
                    { address: member1, shares: 1000 },
                    { address: member2, shares: 1000 },
                    { address: member3, shares: 1000 },
                    { address: member4, shares: 1000 },
                ]
            })
        );

        // Create proposal
        let res = await sendMessage(
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
        expect(res).toMatchObject([{
            mode: 128 + 2,
            to: member1.toFriendly({ testOnly: true }),
            value: '0'
        }]);

        // Create initial vote
        await sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        );

        // Vote
        await expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'yes')
        )).rejects.toThrowError('Error 72');
        await expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'no')
        )).rejects.toThrowError('Error 72');
        await expect(sendMessage(
            executor,
            toNano(1),
            member1,
            createVote(0, 'abstain')
        )).rejects.toThrowError('Error 72');
    });

    it("should return correct member vote info", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 5000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [
                    { address: member1, shares: 1000 },
                    { address: member2, shares: 1000 },
                    { address: member3, shares: 1000 },
                    { address: member4, shares: 1000 },
                ]
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

        // Get proposal state
        let vote = await executor.invokeGetMethod('get_proposal_vote', [{
            type: 'int',
            value: '0'
        }, {
            type: 'cell_slice',
            value: beginCell().storeAddress(member1).endCell().toBoc({ idx: false }).toString('base64')
        }]);


        // Version
        expect((vote.result[0] as BN).toString(10)).toBe('0');
        // Vote YES
        expect((vote.result[1] as BN).toString(10)).toBe('1');
        // Voting power
        expect((vote.result[2] as BN).toString(10)).toBe('1000');
        // Shares allocated
        expect((vote.result[3] as BN).toString(10)).toBe('4000');
        // Members total
        expect((vote.result[4] as BN).toString(10)).toBe('4');
    });
});
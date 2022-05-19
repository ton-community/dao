import BN from "bn.js";
import { Address, beginCell, Slice } from "ton";
import { SmartContract } from "ton-contract-executor";
import { createCode } from "./contract/createCode";
import { createData } from "./contract/createData";
import { randomAddress } from "./utils/randomAddress";

const member1 = randomAddress(0, "initial-1");
const member2 = randomAddress(0, "initial-2");
const member3 = randomAddress(0, "initial-3");
const member4 = randomAddress(0, "initial-4");
const outsider = randomAddress(0, "outsider-1");

describe("get", () => {
    it("should execute get_member", async () => {

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

        // Non-member
        let res = await executor.invokeGetMethod('get_member', [{ type: 'cell_slice', value: beginCell().storeAddress(member2).endCell().toBoc({ idx: false }).toString('base64') }])
        expect(res.result.length).toBe(2);
        expect((res.result[0] as BN).toString(10)).toEqual('0');
        expect((res.result[1] as BN).toString(10)).toEqual('0');;

        // Member
        res = await executor.invokeGetMethod('get_member', [{ type: 'cell_slice', value: beginCell().storeAddress(member1).endCell().toBoc({ idx: false }).toString('base64') }])
        expect(res.result.length).toBe(2);
        expect((res.result[0] as BN).toString(10)).toEqual('1');
        expect((res.result[1] as BN).toString(10)).toEqual('1000');;
    });

    it("should execute get_members with paging", async () => {

        // Create contract
        const executor = await SmartContract.fromCell(
            createCode(),
            createData({
                totalShares: 4000,
                baseTreshold: 100,
                failureTreshold: 25,
                successTreshold: 75,
                members: [{
                    address: member1,
                    shares: 1000
                }, {
                    address: member2,
                    shares: 1000
                }, {
                    address: member3,
                    shares: 1000
                }, {
                    address: member4,
                    shares: 1000
                }]
            })
        );

        let zero = new Address(0, Buffer.alloc(32, 0));
        let cases: { from: Address, limit: number, result: { address: Address, shares: number }[] }[] = [];
        cases.push({
            from: zero, limit: 10,
            result: [{
                address: member1,
                shares: 1000
            }, {
                address: member2,
                shares: 1000
            }, {
                address: member3,
                shares: 1000
            }, {
                address: member4,
                shares: 1000
            }]
        });
        cases.push({
            from: member1, limit: 10,
            result: [{
                address: member2,
                shares: 1000
            }, {
                address: member3,
                shares: 1000
            }, {
                address: member4,
                shares: 1000
            }]
        });
        cases.push({
            from: member1, limit: 1,
            result: [{
                address: member2,
                shares: 1000
            }]
        });

        for (let c of cases) {
            let res = await executor.invokeGetMethod('get_members', [{ type: 'cell_slice', value: beginCell().storeAddress(c.from).endCell().toBoc({ idx: false }).toString('base64') }, { type: 'int', value: c.limit.toString() }]);
            let tail = res.result[0] as any;
            let normalized: { address: Address, shares: number }[] = [];
            while (tail) {
                normalized.push({ address: (tail[0][0] as Slice).readAddress()!, shares: (tail[0][1] as BN).toNumber() });
                tail = tail[1] as any;
            }
            normalized.reverse();
            expect(normalized.length).toBe(c.result.length);
            for (let i = 0; i < normalized.length; i++) {
                let ex = c.result[i];
                expect(normalized[i].address.toFriendly({ testOnly: true })).toMatch(ex.address.toFriendly({ testOnly: true }));
                expect(normalized[i].shares).toBe(ex!.shares);
            }
        }
    });
});
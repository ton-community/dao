import { Address, beginCell, CellMessage, CommonMessageInfo, InternalMessage, toNano } from "ton";
import { SmartContract } from "ton-contract-executor";
import { createCode } from "./contract/createCode";
import { createData } from "./contract/createData";
import { randomAddress } from "./utils/randomAddress";

const zero = new Address(0, Buffer.alloc(32, 0));
const member1 = randomAddress(0, 'initial-1');
const member2 = randomAddress(0, 'initial-2');
const outsider = randomAddress(0, 'outsider-1');

describe("proposals", () => {
    it("should create proposals", async () => {
        const exectutor = await SmartContract.fromCell(createCode(), createData(5000, [{ address: member1, shares: 1000 }, { address: member2, shares: 1000 }]));
        let res = await exectutor.sendInternalMessage(new InternalMessage({
            from: member1,
            to: zero,
            value: toNano(1),
            bounce: true,
            body: new CommonMessageInfo({
                body: new CellMessage(beginCell()
                    .storeUint(3241702467, 32)
                    .storeUint(0, 32)
                    .storeRef(beginCell()
                        .storeUint(1225918510, 32) // Transaction proposal
                        .storeBit(false) // No extras
                        .storeAddress(outsider) // Target
                        .storeCoins(toNano(10)) // Value
                        .storeBit(false) // No state init
                        .storeBit(false) // No payload
                        .endCell())
                    .endCell())
            })
        }));
        expect(res.exit_code).toBe(0);

        // Loading all proposals
        let proposals = await exectutor.invokeGetMethod('get_last_proposal_id', []);
        console.warn(proposals);
    });
});
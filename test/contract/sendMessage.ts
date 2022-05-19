import BN from "bn.js";
import { Address, Cell, CellMessage, CommonMessageInfo, InternalMessage, RawMessage } from "ton";
import { SmartContract } from "ton-contract-executor";
import { parseActionsList } from "../utils/parseActionsList";

const zero = new Address(0, Buffer.alloc(32, 0));

export async function sendMessage(contract: SmartContract, value: BN, from: Address, content: Cell) {
    let res = await contract.sendInternalMessage(new InternalMessage({
        from: from,
        to: zero,
        value: value,
        bounce: true,
        body: new CommonMessageInfo({
            body: new CellMessage(content)
        })
    }));
    if (res.exit_code !== 0) {
        // console.warn(res.logs);
        throw Error('Error ' + res.exit_code);
    }
    if (res.type === 'success') {
        let actions = parseActionsList(res.action_list_cell!);
        actions.reverse();

        let d: {
            mode: number,
            to: string,
            value: string,
        }[] = [];
        for (let a of actions) {
            if (a.type === 'send_msg') {
                if (a.message.info.type !== 'internal') {
                    throw Error('Non-internal message produced');
                }
                d.push({
                    mode: a.mode,
                    to: a.message.info.dest!.toFriendly({ testOnly: true }),
                    value: a.message.info.value.coins.toString(10)
                });
            }
        }
        return d;
    } else {
        throw Error('Failed');
    }
}
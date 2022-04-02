import { Cell } from "ton";
import fs from 'fs';

export function createCode() {
    return Cell.fromBoc(
        fs.readFileSync(__dirname + "/../../output/dao.cell")
    )[0];
}
import { getViemClient } from "./wallet";
import abi from "../contracts/poap.json";
import { fetchEventsViem, getEvent } from "./wallet";

const client = getViemClient();
const stealthTransactionHelperAddress = "0x054Aa0E0b4C92142a583fDfa9369FF3558F8dea4"

function getAnnouncements() {
    const events = fetchEventsViem({
        client,
        address: stealthTransactionHelperAddress,
        event: getEvent(abi, "AnnouncementCreated"),
    });
    return events;
}
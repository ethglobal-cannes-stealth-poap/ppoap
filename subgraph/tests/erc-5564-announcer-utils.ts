import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { Announcement } from "../generated/ERC5564Announcer/ERC5564Announcer"

export function createAnnouncementEvent(
  schemeId: BigInt,
  stealthAddress: Address,
  caller: Address,
  ephemeralPubKey: Bytes,
  metadata: Bytes
): Announcement {
  let announcementEvent = changetype<Announcement>(newMockEvent())

  announcementEvent.parameters = new Array()

  announcementEvent.parameters.push(
    new ethereum.EventParam(
      "schemeId",
      ethereum.Value.fromUnsignedBigInt(schemeId)
    )
  )
  announcementEvent.parameters.push(
    new ethereum.EventParam(
      "stealthAddress",
      ethereum.Value.fromAddress(stealthAddress)
    )
  )
  announcementEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  announcementEvent.parameters.push(
    new ethereum.EventParam(
      "ephemeralPubKey",
      ethereum.Value.fromBytes(ephemeralPubKey)
    )
  )
  announcementEvent.parameters.push(
    new ethereum.EventParam("metadata", ethereum.Value.fromBytes(metadata))
  )

  return announcementEvent
}

import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { Announcement } from "../generated/schema"
import { Announcement as AnnouncementEvent } from "../generated/ERC5564Announcer/ERC5564Announcer"
import { handleAnnouncement } from "../src/erc-5564-announcer"
import { createAnnouncementEvent } from "./erc-5564-announcer-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let schemeId = BigInt.fromI32(234)
    let stealthAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let caller = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let ephemeralPubKey = Bytes.fromI32(1234567890)
    let metadata = Bytes.fromI32(1234567890)
    let newAnnouncementEvent = createAnnouncementEvent(
      schemeId,
      stealthAddress,
      caller,
      ephemeralPubKey,
      metadata
    )
    handleAnnouncement(newAnnouncementEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("Announcement created and stored", () => {
    assert.entityCount("Announcement", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Announcement",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "schemeId",
      "234"
    )
    assert.fieldEquals(
      "Announcement",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "stealthAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Announcement",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "caller",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Announcement",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "ephemeralPubKey",
      "1234567890"
    )
    assert.fieldEquals(
      "Announcement",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metadata",
      "1234567890"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})

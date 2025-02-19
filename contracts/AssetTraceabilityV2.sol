// SPDX-License-Identifier: TECNALIA
//
// AssetTraceability.sol
// COPYRIGHT: FUNDACIÓN TECNALIA RESEARCH & INNOVATION, 2024.
// By virtue of the outsourcing agreement of the project ZL-2021/00717, with acronym N0WASTE, this file becomes property of IZERTIS S.A. (VAT A-33845009).
// Licensed to TECNALIA under the following conditions: non-exclusive, irrevocable, transferable, sublicensable, and royalty free.
// This license is effective without end date.

pragma solidity ^0.8.0;

import "./AssetTraceability.sol";

contract AssetTraceabilityV2 is AssetTraceability {
    function getBaseURI()
        public
        pure
        override(AssetTraceability)
        returns (string memory)
    {
        return "v2";
    }
}
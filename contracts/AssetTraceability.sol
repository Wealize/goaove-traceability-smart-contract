// SPDX-License-Identifier: TECNALIA
//
// AssetTraceability.sol
// COPYRIGHT: FUNDACIÓN TECNALIA RESEARCH & INNOVATION, 2024.
// By virtue of the outsourcing agreement of the project ZL-2021/00717, with acronym N0WASTE, this file becomes property of IZERTIS S.A. (VAT A-33845009).
// Licensed to TECNALIA under the following conditions: non-exclusive, irrevocable, transferable, sublicensable, and royalty free.
// This license is effective without end date.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

error AlreadyMintedToken(uint256 id);
error TokenAlreadyUsed(uint256 id);
error TokenAlreadyTransformed(uint256 id);
error TokenGroupMismatch(uint256 id, uint256 toMergeId);
error InvalidCaller(uint256 id);
error NotMatchingAmount(uint256 expectedAmount, uint256 gotAmount);
error NotMatchingArrays(uint256 length1, uint256 length2);

contract AssetTraceability is
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable
{
    using Counters for Counters.Counter;

    string private baseUri;
    Counters.Counter private _tokenIdCounter;

    mapping(uint => uint256[]) private assetTypes;
    mapping(uint => uint256[]) private assetGroups;
    mapping(uint256 => Asset) private assets;

    enum OperationType {
        Registration, // default value
        Addition,
        Split,
        Union,
        Transformation,
        Transfer
    }

    struct LogItem {
        address author;
        OperationType reason;
        uint256 timestamp;
    }

    struct Asset {
        bool unusable;
        uint256 amount;
        uint256 _type;
        uint256 groupId;
        uint256[] parents;
        uint256[] children;
        LogItem[] changes;
    }

    struct AssetResult {
        uint256 amount;
        uint256 _type;
        uint256 groupId;
        uint256 tokenId;
        address owner;
        uint256[] parents;
        uint256[] children;
        LogItem[] changes;
        string uri;
    }

    function initialize() public initializer {
        __ERC721_init("AssetTraceability", "AT");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init();
        baseUri = "";
    }

    function _requireUsableBySender(uint256 id) private view {
        /*if (assets[id].reason == TokenStatus.Unminted) {
            revert TokenMustExist(id);
        }*/
        _requireMinted(id);

        if (!_isApprovedOrOwner(_msgSender(), id)) {
            revert InvalidCaller(id);
        }

        if (assets[id].unusable) {
            revert TokenAlreadyUsed(id);
        }
    }

    modifier tokenExistsAndCanBeUsed(uint256 id) {
        _requireUsableBySender(id);
        _;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory _baseuri) public onlyOwner {
        baseUri = _baseuri;
    }

    function getBaseURI() public view virtual returns (string memory) {
        return baseUri;
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _getAsset(
        uint256 tokenId
    ) private view returns (AssetResult memory) {
        Asset memory asset = assets[tokenId];
        if (asset.amount > 0) {
            return
                AssetResult({
                    amount: asset.amount,
                    _type: asset._type,
                    groupId: asset.groupId,
                    tokenId: tokenId,
                    parents: asset.parents,
                    children: asset.children,
                    changes: asset.changes,
                    uri: super.tokenURI(tokenId),
                    owner: super.ownerOf(tokenId)
                });
        }
        return
            AssetResult({
                amount: 0,
                _type: 0,
                groupId: 0,
                children: asset.children,
                parents: asset.parents,
                tokenId: 0,
                uri: "",
                owner: address(0),
                changes: new LogItem[](0)
            });
    }

    function getAsset(
        uint256 tokenId
    ) external view returns (AssetResult memory) {
        return _getAsset(tokenId);
    }

    function getGroup(
        uint _groupId
    ) external view returns (AssetResult[] memory) {
        uint256[] memory group = assetGroups[_groupId];
        if (group.length > 0) {
            AssetResult[] memory result = new AssetResult[](group.length);
            for (uint i = 0; i < group.length; i++) {
                result[i] = _getAsset(group[i]);
            }
            return result;
        }
        return new AssetResult[](0);
    }

    function _logChange(uint256 tokenId, OperationType reason) private {
        assets[tokenId].changes.push(
            LogItem({
                timestamp: block.timestamp,
                author: _msgSender(),
                reason: reason
            })
        );
    }

    function _mint(
        address _to,
        string memory _uri,
        uint _amount,
        uint _type,
        uint _groupId,
        OperationType mintReason
    ) private returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _uri);

        assets[tokenId].unusable = false;
        assets[tokenId].amount = _amount;
        assets[tokenId]._type = _type;
        assets[tokenId].groupId = _groupId;
        _logChange(tokenId, mintReason);

        if (_type > 0) {
            assetTypes[_type].push(tokenId);
        }
        if (_groupId > 0) {
            assetGroups[_groupId].push(tokenId);
        }
        return tokenId;
    }

    function register(
        address _to,
        string memory _uri,
        uint _amount,
        uint _type,
        uint _groupId
    ) public {
        _mint(_to, _uri, _amount, _type, _groupId, OperationType.Registration);
    }

    function editMetadata(
        uint256 id,
        string calldata _uri
    ) public tokenExistsAndCanBeUsed(id) {
        _setTokenURI(id, _uri);
    }

    function transform(
        uint256 id,
        uint256 _amount,
        uint256 _type,
        uint256 _groupId,
        string calldata _uri
    ) public tokenExistsAndCanBeUsed(id) {
        // From now on, the token cannot be used again
        assets[id].unusable = true;

        uint256 newId = _mint(
            ownerOf(id),
            _uri,
            _amount,
            _type,
            _groupId,
            OperationType.Transformation
        );
        assets[newId].parents.push(id);
        assets[id].children.push(newId);
    }

    function union(
        address _to,
        uint256 _type,
        uint256 _groupId,
        uint256[] calldata merged,
        string calldata _uri
    ) public {
        uint256 amount = 0;
        for (uint256 i = 0; i < merged.length; i++) {
            _requireUsableBySender(merged[i]);

            // From now on, the token cannot be used again
            assets[merged[i]].unusable = true;

            amount += assets[merged[i]].amount;
        }

        uint256 newId = _mint(
            _to,
            _uri,
            amount,
            _type,
            _groupId,
            OperationType.Union
        );
        assets[newId].parents = merged;

        for (uint256 i = 0; i < merged.length; i++) {
            assets[merged[i]].children.push(newId);
        }
    }

    function add(
        uint256 id,
        uint256[] calldata toMerge
    ) public tokenExistsAndCanBeUsed(id) {
        uint256 amount = assets[id].amount;
        for (uint256 i = 0; i < toMerge.length; i++) {
            _requireUsableBySender(toMerge[i]);

            // From now on, the token cannot be used again
            assets[toMerge[i]].unusable = true;

            amount += assets[toMerge[i]].amount;

            assets[toMerge[i]].children.push(id);
            assets[id].parents.push(toMerge[i]);
        }
        assets[id].amount = amount;
        _logChange(id, OperationType.Addition);
    }

    function splitDifferent(
        uint256 id,
        uint256 _type,
        uint256 _groupId,
        uint256[] calldata amounts,
        string[] calldata uris
    ) public tokenExistsAndCanBeUsed(id) {
        if (amounts.length != uris.length) {
            revert NotMatchingArrays(amounts.length, uris.length);
        }

        address originalOwner = ownerOf(id);
        uint256 addedAmounts = 0;

        for (uint256 i = 0; i < amounts.length; i++) {
            addedAmounts += amounts[i];
            uint256 newId = _mint(
                originalOwner,
                uris[i],
                amounts[i],
                _type,
                _groupId,
                OperationType.Split
            );
            assets[id].children.push(newId);
            assets[newId].parents.push(id);
        }

        if (addedAmounts != assets[id].amount) {
            revert NotMatchingAmount(assets[id].amount, addedAmounts);
        }

        assets[id].unusable = true;
    }

    function splitSame(
        uint256 id,
        uint256 _type,
        uint256 _groupId,
        uint256 amount,
        string calldata uri
    ) public tokenExistsAndCanBeUsed(id) {
        address originalOwner = ownerOf(id);
        uint256 remainingAmount = assets[id].amount;

        if (remainingAmount < amount) {
            revert NotMatchingAmount(amount, remainingAmount);
        }

        while (remainingAmount > 0) {
            uint256 newId = _mint(
                originalOwner,
                uri,
                amount,
                _type,
                _groupId,
                OperationType.Split
            );
            assets[id].children.push(newId);
            assets[newId].parents.push(id);

            if (remainingAmount >= amount) {
                remainingAmount -= amount;
            } else {
                revert NotMatchingAmount(
                    assets[id].amount,
                    assets[id].amount - remainingAmount
                );
            }
        }

        assets[id].unusable = true;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            ERC721URIStorageUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Redefining access control for ERC721, ERC721Enumerable, ERC721URIStorage & ERC721Burnable functions

    /**
     * @dev See {ERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        tokenExistsAndCanBeUsed(tokenId)
    {
        _logChange(tokenId, OperationType.Transfer);
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {ERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    )
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        tokenExistsAndCanBeUsed(tokenId)
    {
        _logChange(tokenId, OperationType.Transfer);
        super.safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {ERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    )
        public
        override(ERC721Upgradeable, IERC721Upgradeable)
        tokenExistsAndCanBeUsed(tokenId)
    {
        _logChange(tokenId, OperationType.Transfer);
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @dev See {ERC721-_burn}.
     */
    function burn(
        uint256 tokenId
    ) public override tokenExistsAndCanBeUsed(tokenId) {
        super.burn(tokenId);
    }
}
